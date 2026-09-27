// Genera las tarjetas SVG de proyectos destacados en assets/cards/.
// Uso: node scripts/build-cards.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "assets", "cards");
mkdirSync(outDir, { recursive: true });

export const projects = [
  {
    slug: "empleos-salta",
    title: "Empleos Salta",
    desc: "Compilador de ofertas laborales de Salta: junta vacantes de distintos portales en un solo buscador rápido.",
    tech: ["React", "TypeScript", "Vite", "Express", "Tailwind"],
    status: "live",
    accent: "#22D3EE",
    glyph: "⌕",
  },
  {
    slug: "easytube",
    title: "EasyTube",
    desc: "Micronavegador y descargador de videos y música de YouTube para Android. Una alternativa a SnapTube sin anuncios.",
    tech: ["Flutter", "Dart", "Kotlin", "Android"],
    status: "code",
    accent: "#A78BFA",
    glyph: "↓",
  },
  {
    slug: "control-remoto-pc",
    title: "Control Remoto PC",
    desc: "Tu celular Android como mouse y teclado inalámbrico de Windows por WiFi: touchpad, tipeo, Alt+Tab y conexión por QR.",
    tech: ["Python", "JavaScript", "WiFi", "QR"],
    status: "code",
    accent: "#34D399",
    glyph: "◎",
  },
  {
    slug: "fago-simulacion",
    title: "Fago Simulación",
    desc: "Juego/simulador de navegador del ciclo de vida de un bacteriófago: infección, replicación y lisis de la célula.",
    tech: ["HTML", "JavaScript", "Juego web", "Biología"],
    status: "live",
    accent: "#F472B6",
    glyph: "⬡",
  },
];

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function wrap(text, max) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if ((line + " " + word).trim().length > max) {
      lines.push(line.trim());
      line = word;
    } else line += " " + word;
  }
  if (line.trim()) lines.push(line.trim());
  return lines.slice(0, 3);
}

const W = 600, H = 250;
const MONO = "'JetBrains Mono','Fira Code','SF Mono',Consolas,'Liberation Mono',monospace";
const SANS = "'Segoe UI','Inter',-apple-system,'Helvetica Neue',Arial,sans-serif";

function card(p, i) {
  const a = p.accent;
  const stage = `STAGE ${String(i + 1).padStart(2, "0")}`;
  const live = p.status === "live";
  const statusLabel = live ? "LIVE DEMO" : "SOURCE";
  const statusColor = live ? "#4ADE80" : "#94A3B8";

  const desc = wrap(p.desc, 58)
    .map((l, k) => `<tspan x="32" dy="${k === 0 ? 0 : 21}">${esc(l)}</tspan>`)
    .join("");

  let cx = 32;
  const chips = p.tech
    .map((t) => {
      const w = Math.round(t.length * 7.7 + 22);
      const g = `<g transform="translate(${cx} 196)"><rect width="${w}" height="26" rx="6" fill="${a}" fill-opacity=".08" stroke="${a}" stroke-opacity=".45"/><text x="${w / 2}" y="17.5" text-anchor="middle" font-size="12.5" fill="#E2E8F0">${esc(t)}</text></g>`;
      cx += w + 8;
      return g;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(p.title)} — ${esc(p.desc)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0E1120"/><stop offset="1" stop-color="#07080F"/>
    </linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${a}" stop-opacity="0"/><stop offset=".5" stop-color="${a}"/><stop offset="1" stop-color="${a}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="halo" cx="1" cy="0" r="1">
      <stop offset="0" stop-color="${a}" stop-opacity=".22"/><stop offset=".6" stop-color="${a}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#fff" opacity=".05"/></pattern>
    <clipPath id="c"><rect width="${W}" height="${H}" rx="16"/></clipPath>
    <style>
      .beam { animation: beam 4s ease-in-out infinite; }
      @keyframes beam { 0% { transform: translateX(-260px); } 100% { transform: translateX(${W}px); } }
      .pulse { animation: pulse 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
      @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.7); } }
    </style>
  </defs>
  <g clip-path="url(#c)">
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#dots)"/>
    <rect width="${W}" height="${H}" fill="url(#halo)"/>
    <text x="${W - 36}" y="150" text-anchor="end" font-family="${MONO}" font-size="120" font-weight="700" fill="${a}" opacity=".07">${esc(p.glyph)}</text>
    <rect class="beam" x="0" y="0" width="260" height="2" fill="url(#beam)" style="animation-delay:${-i * 0.7}s"/>
  </g>
  <rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="15.5" fill="none" stroke="${a}" stroke-opacity=".35" stroke-width="1.5"/>
  <g stroke="${a}" stroke-width="2.5" fill="none" stroke-linecap="square">
    <path d="M14 30 V14 H30"/><path d="M${W - 30} ${H - 14} H${W - 14} V${H - 30}"/>
  </g>
  <g font-family="${MONO}">
    <text x="32" y="44" font-size="12.5" letter-spacing="3" fill="${a}">${stage}</text>
    <circle class="pulse" cx="${W - 32 - statusLabel.length * 9.2 - 12}" cy="40" r="4.5" fill="${statusColor}"/>
    <text x="${W - 32}" y="44" text-anchor="end" font-size="12" letter-spacing="2" fill="${statusColor}">${statusLabel}</text>
    ${chips}
  </g>
  <text x="32" y="86" font-family="${SANS}" font-size="28" font-weight="700" fill="#F8FAFC">${esc(p.title)}</text>
  <text x="32" y="122" font-family="${SANS}" font-size="15" fill="#A5B4C8">${desc}</text>
</svg>
`;
}

projects.forEach((p, i) => {
  writeFileSync(join(outDir, `${p.slug}.svg`), card(p, i));
  console.log(`✓ assets/cards/${p.slug}.svg`);
});
