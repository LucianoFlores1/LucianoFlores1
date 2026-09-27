// Genera assets/generated/stats.svg y assets/generated/languages.svg desde la API GraphQL de GitHub.
// Uso: GITHUB_TOKEN=xxx GH_USER=LucianoFlores1 node scripts/build-stats.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "assets", "generated");
mkdirSync(outDir, { recursive: true });

const USER = process.env.GH_USER || "LucianoFlores1";
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) throw new Error("Falta GITHUB_TOKEN");

async function gql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

const data = await gql(
  `query($login: String!) {
    user(login: $login) {
      createdAt
      followers { totalCount }
      repositories(ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, first: 100) {
        totalCount
        nodes {
          stargazerCount
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name } } }
        }
      }
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        restrictedContributionsCount
        contributionCalendar { totalContributions weeks { contributionDays { contributionCount date } } }
      }
    }
  }`,
  { login: USER }
);

const u = data.user;
const cc = u.contributionsCollection;
const repos = u.repositories.nodes;
const stars = repos.reduce((s, r) => s + r.stargazerCount, 0);
const days = cc.contributionCalendar.weeks.flatMap((w) => w.contributionDays);
const yearTotal = cc.contributionCalendar.totalContributions;

// Rachas (el día de hoy sin contribuciones no corta la racha actual)
let longest = 0, run = 0;
for (const d of days) { run = d.contributionCount > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
let current = 0;
for (let i = days.length - 1; i >= 0; i--) {
  if (days[i].contributionCount > 0) current++;
  else if (i === days.length - 1) continue;
  else break;
}

// Semanas recientes para el gráfico de barras
const weeks = cc.contributionCalendar.weeks.slice(-26).map((w) => w.contributionDays.reduce((s, d) => s + d.contributionCount, 0));

// Lenguajes por bytes (excluye ruido de scripts de shell/infra)
const IGNORE = new Set(["PowerShell", "Batchfile", "Shell", "Dockerfile", "Makefile"]);
const langBytes = {};
for (const r of repos) for (const e of r.languages.edges) {
  if (IGNORE.has(e.node.name)) continue;
  langBytes[e.node.name] = (langBytes[e.node.name] || 0) + e.size;
}
const totalBytes = Object.values(langBytes).reduce((a, b) => a + b, 0) || 1;
const langs = Object.entries(langBytes).sort((a, b) => b[1] - a[1]).slice(0, 6)
  .map(([name, b]) => ({ name, pct: (b / totalBytes) * 100 }));

// ---------- render ----------
const MONO = "'JetBrains Mono','Fira Code','SF Mono',Consolas,'Liberation Mono',monospace";
const SANS = "'Segoe UI','Inter',-apple-system,'Helvetica Neue',Arial,sans-serif";
const W = 600, H = 250;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fmt = (n) => n.toLocaleString("es-AR");
const updated = new Date().toISOString().slice(0, 10);

function frame(accent, label, body, extraStyle = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0E1120"/><stop offset="1" stop-color="#07080F"/></linearGradient>
    <radialGradient id="halo" cx="0" cy="0" r="1"><stop offset="0" stop-color="${accent}" stop-opacity=".18"/><stop offset=".6" stop-color="${accent}" stop-opacity="0"/></radialGradient>
    <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#fff" opacity=".05"/></pattern>
    <style>
      .rise { animation: rise .9s cubic-bezier(.2,.8,.2,1) both; transform-box: fill-box; transform-origin: bottom; }
      @keyframes rise { from { transform: scaleY(0); } to { transform: scaleY(1); } }
      .grow { animation: grow 1.1s cubic-bezier(.2,.8,.2,1) both; transform-box: fill-box; transform-origin: left; }
      @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      .fade { animation: fade .8s ease-out both; }
      @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
      ${extraStyle}
    </style>
  </defs>
  <rect width="${W}" height="${H}" rx="16" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" rx="16" fill="url(#dots)"/>
  <rect width="${W}" height="${H}" rx="16" fill="url(#halo)"/>
  <rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="15.5" fill="none" stroke="${accent}" stroke-opacity=".35" stroke-width="1.5"/>
  <g stroke="${accent}" stroke-width="2.5" fill="none"><path d="M14 30 V14 H30"/><path d="M${W - 30} ${H - 14} H${W - 14} V${H - 30}"/></g>
  ${body}
</svg>
`;
}

// Stats: 4 tiles + barras semanales (una sola serie, un solo tono)
const A = "#22D3EE";
const tiles = [
  ["CONTRIBUCIONES", fmt(yearTotal), "último año"],
  current > 0 ? ["RACHA ACTUAL", `${current}d`, `récord ${longest}d`] : ["MEJOR RACHA", `${longest}d`, "días seguidos"],
  ["REPOS PÚBLICOS", fmt(u.repositories.totalCount), `★ ${fmt(stars)} estrellas`],
  ["COMMITS", fmt(cc.totalCommitContributions), `${fmt(cc.totalPullRequestContributions)} PRs`],
];
const tileW = 128;
const tilesSvg = tiles.map(([k, v, sub], i) => {
  const x = 32 + i * (tileW + 10);
  return `<g class="fade" style="animation-delay:${i * 0.12}s" transform="translate(${x} 60)">
    <text font-family="${MONO}" font-size="10.5" letter-spacing="1.5" fill="#94A3B8">${esc(k)}</text>
    <text y="36" font-family="${SANS}" font-size="30" font-weight="700" fill="#F8FAFC">${esc(v)}</text>
    <text y="56" font-family="${MONO}" font-size="11" fill="#64748B">${esc(sub)}</text>
  </g>`;
}).join("");

const chartX = 32, chartY = 150, chartW = W - 64, chartH = 60;
const maxW = Math.max(1, ...weeks);
const gap = 2, barW = (chartW - gap * (weeks.length - 1)) / weeks.length;
const bars = weeks.map((v, i) => {
  const h = v === 0 ? 2 : Math.max(4, (v / maxW) * chartH);
  const x = chartX + i * (barW + gap);
  return `<rect class="rise" style="animation-delay:${0.3 + i * 0.025}s" x="${x.toFixed(1)}" y="${(chartY + chartH - h).toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(4, barW / 2).toFixed(1)}" fill="${A}" fill-opacity="${v === 0 ? 0.18 : 0.85}"><title>${v} contribuciones</title></rect>`;
}).join("");

const statsBody = `
  <text x="32" y="40" font-family="${MONO}" font-size="12.5" letter-spacing="3" fill="${A}">HI-SCORE · @${esc(USER)}</text>
  <text x="${W - 32}" y="40" text-anchor="end" font-family="${MONO}" font-size="11" fill="#64748B">act. ${updated}</text>
  ${tilesSvg}
  <line x1="${chartX}" y1="${chartY + chartH + 0.5}" x2="${chartX + chartW}" y2="${chartY + chartH + 0.5}" stroke="#334155"/>
  ${bars}
  <text x="${chartX}" y="${chartY + chartH + 20}" font-family="${MONO}" font-size="11" fill="#64748B">contribuciones por semana · últimas 26 semanas</text>
  <text x="${chartX + chartW}" y="${chartY + chartH + 20}" text-anchor="end" font-family="${MONO}" font-size="11" fill="#94A3B8">máx ${maxW}/sem</text>`;

writeFileSync(join(outDir, "stats.svg"), frame(A, `Estadísticas de GitHub de ${USER}: ${yearTotal} contribuciones en el último año`, statsBody));

// Lenguajes: barras horizontales ordenadas (magnitud → un solo tono)
const L = "#F472B6";
const rowH = 26, labelW = 120, barMax = W - 64 - labelW - 70;
const maxPct = Math.max(...langs.map((l) => l.pct), 1);
const rows = langs.map((l, i) => {
  const y = 64 + i * rowH;
  const w = Math.max(4, (l.pct / maxPct) * barMax);
  return `<g transform="translate(32 ${y})">
    <text y="13" font-family="${MONO}" font-size="12.5" fill="#E2E8F0">${esc(l.name)}</text>
    <rect x="${labelW}" y="3" width="${barMax}" height="12" rx="4" fill="#fff" fill-opacity=".04"/>
    <rect class="grow" style="animation-delay:${0.15 + i * 0.1}s" x="${labelW}" y="3" width="${w.toFixed(1)}" height="12" rx="4" fill="${L}" fill-opacity="${(0.95 - i * 0.1).toFixed(2)}"/>
    <text x="${labelW + barMax + 58}" y="13" text-anchor="end" font-family="${MONO}" font-size="12" fill="#94A3B8">${l.pct.toFixed(1)}%</text>
  </g>`;
}).join("");

const langBody = `
  <text x="32" y="40" font-family="${MONO}" font-size="12.5" letter-spacing="3" fill="${L}">INVENTARIO · LENGUAJES</text>
  <text x="${W - 32}" y="40" text-anchor="end" font-family="${MONO}" font-size="11" fill="#64748B">% del código en repos públicos</text>
  ${rows}`;

writeFileSync(join(outDir, "languages.svg"), frame(L, `Lenguajes más usados: ${langs.map((l) => `${l.name} ${l.pct.toFixed(0)}%`).join(", ")}`, langBody));

console.log({ yearTotal, current, longest, repos: u.repositories.totalCount, stars, langs: langs.map((l) => `${l.name} ${l.pct.toFixed(1)}%`) });
