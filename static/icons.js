// SVG-спрайты подземелья: герой, монстры, объекты и иконки предметов.
// Монстры — мрачный стиль: тёмные тона, угловатые формы, узкие глаза.
// Сейчас это запасные значки: карта и бой рисуют пиксельные спрайты
// (sprites.js) и тайлы (terrain.js), а mapIcon() берёт SVG отсюда, только
// если для ключа нет ни спрайта, ни тайла — так всегда рисуется прицел
// (sniper). itemIcon() — для вещи без картинки в ITEM_SPRITES.
const OL = "#05070d";
const ICONS = {
  player: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1l2 2v9H6V3z" fill="#ef4444"/>
      <path d="M4 4c0-2 1.8-3 4-3s4 1 4 3v5c0 3-1.8 5-4 5s-4-2-4-5z" fill="#cbd5e1" stroke="${OL}" stroke-width="0.8"/>
      <path d="M4.8 4.5C5.4 3 6.6 2.2 8 2.2s2.6.8 3.2 2.3z" fill="#f1f5f9"/>
      <rect x="6" y="7" width="4" height="1.6" rx="0.8" fill="#0b1120"/>
      <circle cx="6.8" cy="6" r="0.5" fill="#0b1120"/><circle cx="9.2" cy="6" r="0.5" fill="#0b1120"/>
      <path d="M3 11l2-1 1 2 2-1 2 1 1-2 2 1-1 4H4z" fill="#3b82f6" stroke="${OL}" stroke-width="0.7"/>
    </svg>`,
  slime: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 3l2.5 1L13 6.5 14 10v1.6c0 1.3-.9 2.4-2.4 2.4H4.4C3 14 2 12.9 2 11.6V10l1.2-3L5.5 4.5z" fill="#14532d" stroke="${OL}" stroke-width="0.8"/>
      <path d="M4.5 6.5 3.6 9l-.4 2.4c-.4-2 .2-4.6 1.8-6.4.7-.8 1.6-1.3 2.6-1.5C6 4 5 5 4.5 6.5z" fill="#1d7a44" opacity="0.9"/>
      <path d="M5 8.2h6" stroke="#facc15" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M3 12.6c2 .8 4 .8 5 0M8.5 12.6c1.2.5 2.4.4 3.4-.2" stroke="#0a2e18" stroke-width="0.7" fill="none"/>
      <path d="M12.5 11.5l.8 1.5M3.4 5.6L2.6 4" stroke="#14532d" stroke-width="0.9" stroke-linecap="round"/>
    </svg>`,
  rat: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 9.5c2.4.3 3 2.6 1.2 3.4-.4-1.5-1-2.2-2.2-2.4z" fill="#4a3a28" stroke="${OL}" stroke-width="0.6"/>
      <path d="M3 11l4.5-2.5c2-.8 4.5-.5 5.5.8.7.9.5 2-.4 2.6L8 13.4c-2 .5-4-.3-5-1.4z" fill="#5b4a33" stroke="${OL}" stroke-width="0.8"/>
      <path d="M3.4 5.4 2.6 3l1.8.5z" fill="#3a2d1e" stroke="${OL}" stroke-width="0.6"/>
      <path d="M3.2 6.2l.7-.3" stroke="#7a6238" stroke-width="0.6"/>
      <circle cx="3.4" cy="6.6" r="0.7" fill="#dc2626"/>
      <path d="M1.8 8.4l1.2.2-1 1z" fill="#7f1d1d"/>
      <path d="M4.6 10.2l1.2 1.2M6 9.4l1.4 1" stroke="#2e2314" stroke-width="0.6"/>
    </svg>`,
  bat: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 5.4 6 3.6 3.4 3l.8 1.4L2.6 4l-.4 1.4 1.6.4-.3 1.4 1.7.2.3 1.5 1.2-.6.8 1.2 1-1 1 1 .8-1.2 1.2.6.3-1.5 1.7-.2-.3-1.4 1.6-.4L13.8 4l-1.6.4.8-1.4z" fill="#2e1065" stroke="${OL}" stroke-width="0.7"/>
      <path d="M5.5 4.2 3.6 3.8M10.5 4.2l1.9-.4" stroke="#4c1d95" stroke-width="0.6"/>
      <ellipse cx="8" cy="7.6" rx="1.7" ry="2.3" fill="#3b1470" stroke="${OL}" stroke-width="0.7"/>
      <path d="M6.9 5.4l-.4-1.2.8.5zM9.1 5.4l.4-1.2-.8.5z" fill="#3b1470" stroke="${OL}" stroke-width="0.5"/>
      <circle cx="7.4" cy="7" r="0.5" fill="#f87171"/><circle cx="8.6" cy="7" r="0.5" fill="#f87171"/>
      <path d="M7.3 8.6l.3 1 .4-1 .4 1 .3-1" stroke="#e9d5ff" stroke-width="0.5" fill="none"/>
    </svg>`,
  skeleton: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1.8c2.8 0 4.8 2 4.8 4.8 0 1.9-.9 2.9-1.6 3.4v3.6H4.8V10c-.7-.5-1.6-1.5-1.6-3.4 0-2.8 2-4.8 4.8-4.8z" fill="#cfc8b8" stroke="${OL}" stroke-width="0.8"/>
      <path d="M5 4.6c.7-1.2 1.8-1.8 3-1.8s2.3.6 3 1.8z" fill="#e8e2d2"/>
      <path d="M4.4 6.6 6 5.4M11.6 6.6 10 5.4" stroke="#8f8875" stroke-width="0.7"/>
      <path d="M5.2 6.4h2.6v2.4H6.2zM8.2 6.4h2.6v2.4H8.6z" fill="#0b1120"/>
      <path d="M8 9.6l-.9 1.8h1.8z" fill="#0b1120"/>
      <path d="M5.4 12h5.2M6.2 12v1.8M8 12v1.8M9.8 12v1.8" stroke="#0b1120" stroke-width="0.6"/>
    </svg>`,
  goblin: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.6 5.6 1 2.8l3.4.8zM12.4 5.6 15 2.8l-3.4.8z" fill="#365314" stroke="${OL}" stroke-width="0.6"/>
      <path d="M8 4.4c2.6 0 4.6 1.8 4.6 4.2 0 2.6-2 4.4-4.6 4.4S3.4 11.2 3.4 8.6c0-2.4 2-4.2 4.6-4.2z" fill="#3f6212" stroke="${OL}" stroke-width="0.8"/>
      <path d="M4.6 5.4c.8-.7 2-1 3.4-1s2.6.3 3.4 1z" fill="#4d7c0f" opacity="0.7"/>
      <path d="M5 7h2M9 7h2" stroke="#fde047" stroke-width="1" stroke-linecap="round"/>
      <path d="M4.6 5.8l2.2.4M11.4 5.8l-2.2.4" stroke="#1a2e05" stroke-width="0.7"/>
      <path d="M8 8.4l-1 1.6h2z" fill="#1a2e05"/>
      <path d="M5.4 10.6c1.6.8 3.6.8 5.2 0" stroke="#1a2e05" stroke-width="0.8" fill="none"/>
      <path d="M6.2 10.8l-.4 1.2M9.8 10.8l.4 1.2" stroke="#e7e5e4" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M10.5 4.6l1.5-.4M10.8 5.6l1.2.2" stroke="#7f1d1d" stroke-width="0.6"/>
    </svg>`,
  spider: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#1c1917" stroke-width="1" fill="none" stroke-linecap="round">
        <path d="M6.8 6.6 2.6 3.6M6.6 8H.8M6.8 9.4 2.6 12.4M9.2 6.6l4.2-3M9.4 8h5.8M9.2 9.4l4.2 3"/>
      </g>
      <ellipse cx="8" cy="9.8" rx="2.6" ry="3" fill="#1c1917" stroke="${OL}" stroke-width="0.7"/>
      <path d="M6.4 7.6c.4-.8 1.1-1.2 1.6-1.2s1.2.4 1.6 1.2z" fill="#292524"/>
      <circle cx="8" cy="6.2" r="1.5" fill="#292524" stroke="${OL}" stroke-width="0.6"/>
      <circle cx="7.3" cy="5.9" r="0.55" fill="#dc2626"/><circle cx="8.7" cy="5.9" r="0.55" fill="#dc2626"/>
      <circle cx="6.7" cy="7" r="0.4" fill="#991b1b"/><circle cx="9.3" cy="7" r="0.4" fill="#991b1b"/>
      <path d="M7.2 8.6l-.5 1.2M8.8 8.6l.5 1.2" stroke="#d6d3d1" stroke-width="0.6" stroke-linecap="round"/>
    </svg>`,
  orc: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.6 5.6C3.6 4.4 3.8 2.8 5 2.4c.3.9.8 1.4 1.4 1.6zM11.4 5.6c1-1.2.8-2.8-.4-3.2-.3.9-.8 1.4-1.4 1.6z" fill="#27350b" stroke="${OL}" stroke-width="0.6"/>
      <path d="M8 4c2.7 0 4.8 1.9 4.8 4.4 0 2.7-2.1 4.6-4.8 4.6S3.2 11.1 3.2 8.4C3.2 5.9 5.3 4 8 4z" fill="#33410d" stroke="${OL}" stroke-width="0.8"/>
      <path d="M4.4 5.2c.8-.6 2.2-.9 3.6-.9s2.8.3 3.6.9z" fill="#42520f" opacity="0.8"/>
      <path d="M4.8 6.4l2.4.5M11.2 6.4l-2.4.5" stroke="#fde047" stroke-width="1" stroke-linecap="round"/>
      <path d="M8 7.4l-1 1.8h2z" fill="#1c2406"/>
      <path d="M5.2 10.4c1.8 1 3.8 1 5.6 0" stroke="#1c2406" stroke-width="0.9" fill="none"/>
      <path d="M5.9 10.5l-.5 1.7M10.1 10.5l.5 1.7" stroke="#d6d3d1" stroke-width="0.85" stroke-linecap="round"/>
    </svg>`,
  troll: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.2 3.6 2.6.8l2.6 1zM11.8 3.6l1.6-2.8-2.6 1z" fill="#57534e" stroke="${OL}" stroke-width="0.6"/>
      <path d="M8 3.4c2.9 0 5.2 2 5.2 4.8 0 3-2.3 5-5.2 5s-5.2-2-5.2-5c0-2.8 2.3-4.8 5.2-4.8z" fill="#0f3d22" stroke="${OL}" stroke-width="0.8"/>
      <path d="M3.6 5.2c.9-1.1 2.5-1.7 4.4-1.7s3.5.6 4.4 1.7z" fill="#166534" opacity="0.8"/>
      <path d="M4.6 6.8l2.6.6M11.4 6.8l-2.6.6" stroke="#fde047" stroke-width="1" stroke-linecap="round"/>
      <path d="M4.8 10.6c2 1.4 4.4 1.4 6.4 0" stroke="#04180c" stroke-width="1" fill="none"/>
      <path d="M5.8 10.7l-.5 1.6M10.2 10.7l.5 1.6" stroke="#d6d3d1" stroke-width="0.85" stroke-linecap="round"/>
      <path d="M3.2 8.4l1.2.4M12.8 8.4l-1.2.4" stroke="#052e16" stroke-width="0.7"/>
    </svg>`,
  ghost: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1.6c2.6 0 4.4 2 4.4 4.6v5.4l-1.5-1-1.5 1-1.4-1-1.4 1-1.5-1-1.5 1V6.2C3.6 3.6 5.4 1.6 8 1.6z" fill="#5b6b82" stroke="${OL}" stroke-width="0.7"/>
      <path d="M5 4.6c.6-1.2 1.7-1.8 3-1.8s2.4.6 3 1.8z" fill="#7d8ea8" opacity="0.8"/>
      <path d="M5.4 6.2h1.8v1.6H5.8zM8.8 6.2h1.8v1.6H9.2z" fill="#020617"/>
      <path d="M7.4 9.4h1.2v1.6H7.6z" fill="#020617" opacity="0.8"/>
      <path d="M4 11.8l1-1M12 11.8l-1-1" stroke="#2b3648" stroke-width="0.6"/>
    </svg>`,
  dragon: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.4 4.6C1.4 2.8 1.6 1.2 2.8.4c.4 1.2 1.2 1.9 2.4 2zM13.6 4.6c1-1.8.8-3.4-.4-4.2-.4 1.2-1.2 1.9-2.4 2z" fill="#450a0a" stroke="${OL}" stroke-width="0.6"/>
      <path d="M8 2.6c3.3 0 5.6 2.4 5.6 5.2 0 1.5-1 2.6-2.5 2.6h-.9L9.4 13H6.6l-.8-2.6H4.9C3.4 10.4 2.4 9.3 2.4 7.8 2.4 5 4.7 2.6 8 2.6z" fill="#7f1d1d" stroke="${OL}" stroke-width="0.8"/>
      <path d="M8 2.6c3.3 0 5.6 2.4 5.6 5.2 0 .6-.1 1-.4 1.5C12.4 6 10.4 4.4 8 4.4S3.6 6 2.8 9.3c-.3-.5-.4-.9-.4-1.5C2.4 5 4.7 2.6 8 2.6z" fill="#991b1b"/>
      <circle cx="5.4" cy="7.2" r="1" fill="#fbbf24"/>
      <circle cx="10.6" cy="7.2" r="1" fill="#fbbf24"/>
      <circle cx="5.4" cy="7.2" r="0.45" fill="#0b1120"/><circle cx="10.6" cy="7.2" r="0.45" fill="#0b1120"/>
      <path d="M5.6 9.8l2.4 1.2 2.4-1.2" stroke="#450a0a" stroke-width="0.9" fill="none"/>
      <path d="M6.8 10.6l-.5 1.4M9.2 10.6l.5 1.4" stroke="#e7e5e4" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M8 4.2l-.7 1.3h1.4z" fill="#fbbf24"/>
    </svg>`,
  wolf: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.4 1.6 4 5.6l1.8-1.2zM13.6 1.6 12 5.6l-1.8-1.2z" fill="#3f4753" stroke="${OL}" stroke-width="0.6"/>
      <path d="M8 3.6c2.8 0 4.7 2 4.7 4.4 0 2.3-1.9 4-4.7 4s-4.7-1.7-4.7-4C3.3 5.6 5.2 3.6 8 3.6z" fill="#525b68" stroke="${OL}" stroke-width="0.8"/>
      <path d="M8 7.2 6.4 9.2h3.2z" fill="#242a33"/>
      <path d="M5 6.6l1.8.5M11 6.6l-1.8.5" stroke="#fde047" stroke-width="0.9" stroke-linecap="round"/>
      <circle cx="8" cy="7.9" r="0.55" fill="#0b1120"/>
      <path d="M4 5l1 .8M12 5l-1 .8" stroke="#2b323c" stroke-width="0.6"/>
    </svg>`,
  zombie: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2.6c2.9 0 5.2 2 5.2 4.8 0 3-2.3 5-5.2 5s-5.2-2-5.2-5c0-2.8 2.3-4.8 5.2-4.8z" fill="#3d5223" stroke="${OL}" stroke-width="0.8"/>
      <path d="M3.6 5c.8-.8 2.4-1.2 4.4-1.2s3.6.4 4.4 1.2z" fill="#4d6329" opacity="0.8"/>
      <path d="M3.4 5.6h4.4M8.2 5.6h4.4" stroke="#242e12" stroke-width="0.6"/>
      <path d="M3.8 6.8 4.6 8M12.2 6.8 11.4 8" stroke="#7f1d1d" stroke-width="0.6"/>
      <circle cx="5.9" cy="7.4" r="0.9" fill="#d9c98a" stroke="${OL}" stroke-width="0.4"/>
      <path d="M10.1 7.4h1.8v1.4h-1.4z" fill="#0b1120"/>
      <path d="M5.4 10.4c1.6.6 3.6.6 5.2 0" stroke="#242e12" stroke-width="0.8" fill="none"/>
      <circle cx="11.6" cy="4.8" r="0.7" fill="#242e12"/>
    </svg>`,
  golem: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6.6 1.6 5.2M13 6.6l1.4-1.4" stroke="#292524" stroke-width="1.1" stroke-linecap="round"/>
      <rect x="3" y="5.2" width="10" height="8" rx="1.2" fill="#3f3a35" stroke="${OL}" stroke-width="0.8"/>
      <path d="M4.5 3.2h7l.8 3h-8.6z" fill="#575046" stroke="${OL}" stroke-width="0.7"/>
      <rect x="4.7" y="6.2" width="6.6" height="2.8" rx="0.8" fill="#1c1917"/>
      <circle cx="6.3" cy="7.6" r="0.7" fill="#22d3ee"/>
      <circle cx="9.7" cy="7.6" r="0.7" fill="#22d3ee"/>
      <path d="M5 9.6h6M6.5 9.6v3M9.5 9.6v3" stroke="#141210" stroke-width="0.6"/>
      <path d="M4 6.2l1 2M12 6.2l-1 2" stroke="#292524" stroke-width="0.5" opacity="0.6"/>
    </svg>`,
  demon: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.8 3.6C1.8 2 2 0.8 3.3.4c.3 1 .9 1.5 1.9 1.5zM13.2 3.6c1-1.6.8-2.8-.5-3.2-.3 1-.9 1.5-1.9 1.5z" fill="#450a0a" stroke="${OL}" stroke-width="0.6"/>
      <circle cx="8" cy="8" r="5.4" fill="#7f1d1d" stroke="${OL}" stroke-width="0.8"/>
      <path d="M4 5.2c.9-.7 2.4-1 4-1s3.1.3 4 1z" fill="#991b1b" opacity="0.9"/>
      <path d="M4.4 6.4l2.6 1-1.6 1.2zM11.6 6.4L9 7.4l1.6 1.2z" fill="#1c0505"/>
      <circle cx="6" cy="8" r="0.9" fill="#fbbf24"/>
      <circle cx="10" cy="8" r="0.9" fill="#fbbf24"/>
      <circle cx="6" cy="8" r="0.4" fill="#0b1120"/><circle cx="10" cy="8" r="0.4" fill="#0b1120"/>
      <path d="M5.4 10.8c1.6.9 3.6.9 5.2 0" stroke="#450a0a" stroke-width="0.9" fill="none"/>
    </svg>`,
  minotaur: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.8 4.6C1.4 3.2.9 1.6 1.9.8c.5 1 1 1.4 2 1.4zM13.2 4.6c1.4-1.4 1.9-3 .9-3.8-.5 1-1 1.4-2 1.4z" fill="#a8a29e" stroke="${OL}" stroke-width="0.6"/>
      <circle cx="8" cy="8" r="5.4" fill="#422006" stroke="${OL}" stroke-width="0.8"/>
      <path d="M4 5c.9-.7 2.4-1 4-1s3.1.3 4 1z" fill="#57330c" opacity="0.9"/>
      <ellipse cx="8" cy="10" rx="2.6" ry="2" fill="#1c0f02" stroke="${OL}" stroke-width="0.6"/>
      <path d="M4.6 6.8l1.8.6M11.4 6.8l-1.8.6" stroke="#dc2626" stroke-width="0.9" stroke-linecap="round"/>
      <circle cx="7.2" cy="10" r="0.5" fill="#422006"/><circle cx="8.8" cy="10" r="0.5" fill="#422006"/>
      <path d="M6.2 11.4h3.6" stroke="#d6d3d1" stroke-width="0.6"/>
    </svg>`,
  vampire: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5 14l1.4-3 1.9 1.4L8 10l3.2 2.4 1.9-1.4L14.5 14z" fill="#111827" stroke="${OL}" stroke-width="0.6"/>
      <path d="M8 2.4c2.9 0 4.8 2.2 4.8 5 0 1.7-.9 2.7-1.7 3.2v2.2H4.9v-2.2C4.1 10.1 3.2 9.1 3.2 7.4 3.2 4.6 5.1 2.4 8 2.4z" fill="#b8b3ab" stroke="${OL}" stroke-width="0.7"/>
      <path d="M3.2 5.8c.6-2.3 2.3-3.6 4.8-3.6s4.2 1.3 4.8 3.6c-1-.9-1.9-1.2-3.1-1.2-.4.6-.9.9-1.7.9s-1.3-.3-1.7-.9c-1.2 0-2.1.3-3.1 1.2z" fill="#020617"/>
      <path d="M5.6 7.4h1.7M8.7 7.4h1.7" stroke="#b91c1c" stroke-width="0.9" stroke-linecap="round"/>
      <path d="M6.4 10.2l-.4 1.4M9.6 10.2l.4 1.4" stroke="#e7e5e4" stroke-width="0.7" stroke-linecap="round"/>
    </svg>`,
  lich: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.4 6.2 4.4 2h7.2l1 4.2-1.6-1.9-1.2 1.7-1-.1.8-1.2-2.6-.4-.9 1.4-1.1.1.6-1.1z" fill="#3b1d6e" stroke="${OL}" stroke-width="0.6"/>
      <circle cx="8" cy="8.8" r="4.8" fill="#b9b3a8" stroke="${OL}" stroke-width="0.8"/>
      <path d="M8 6.4 6.2 8.2 8 9.4 9.8 8.2z" fill="#7c3aed"/>
      <circle cx="8" cy="8" r="0.5" fill="#e9d5ff"/>
      <path d="M8 10l-.9 1.8h1.8z" fill="#0b1120"/>
      <path d="M5.5 12.8h5M6.3 12.8v1.8M8 12.8v1.8M9.7 12.8v1.8" stroke="#0b1120" stroke-width="0.6"/>
      <path d="M4.6 7 5.4 5.6M11.4 7l-.8-1.4" stroke="#7d7466" stroke-width="0.6"/>
    </svg>`,
  // Двор деревни: дерево, забор, колодец и костёр. Черновые иконки, чтобы
  // уровень читался ещё до появления настоящих тайлов (см. фазу графики).
  tree: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <rect x="7.2" y="9" width="1.6" height="5" fill="#7c4a12" stroke="${OL}" stroke-width="0.5"/>
      <circle cx="8" cy="6.2" r="4.4" fill="#166534" stroke="${OL}" stroke-width="0.6"/>
      <circle cx="5.6" cy="7.4" r="2.6" fill="#15803d" stroke="${OL}" stroke-width="0.4"/>
      <circle cx="10.4" cy="7.2" r="2.4" fill="#15803d" stroke="${OL}" stroke-width="0.4"/>
      <circle cx="8" cy="4.6" r="2.2" fill="#22c55e" opacity="0.9"/>
    </svg>`,
  fence: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="1.6" height="10" rx="0.4" fill="#8b5a1e" stroke="${OL}" stroke-width="0.5"/>
      <rect x="11.4" y="3" width="1.6" height="10" rx="0.4" fill="#8b5a1e" stroke="${OL}" stroke-width="0.5"/>
      <rect x="2" y="5.4" width="12" height="1.5" rx="0.4" fill="#a16207" stroke="${OL}" stroke-width="0.4"/>
      <rect x="2" y="9.2" width="12" height="1.5" rx="0.4" fill="#a16207" stroke="${OL}" stroke-width="0.4"/>
    </svg>`,
  well: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.6 4.4 8 2.2l5.4 2.2-1 1.6H3.6z" fill="#7c4a12" stroke="${OL}" stroke-width="0.6"/>
      <rect x="3.2" y="6.4" width="9.6" height="6.2" rx="1.2" fill="#64748b" stroke="${OL}" stroke-width="0.7"/>
      <ellipse cx="8" cy="6.6" rx="4.6" ry="1.5" fill="#0b1220" stroke="${OL}" stroke-width="0.6"/>
      <ellipse cx="8" cy="6.6" rx="2.8" ry="0.9" fill="#1d4ed8" opacity="0.8"/>
    </svg>`,
  campfire: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 12.6 13 12.6 11.4 14H4.6z" fill="#4b3418" stroke="${OL}" stroke-width="0.5"/>
      <path d="M8 2.6c2.4 2.6 3.6 4.3 3.6 6.1a3.6 3.6 0 0 1-7.2 0c0-1.2.6-2.2 1.4-3 .1 1 .6 1.7 1.2 2.1.4-2 .6-3.4 1-5.2z" fill="#f97316" stroke="${OL}" stroke-width="0.6"/>
      <path d="M8 6.4c1.2 1.4 1.8 2.4 1.8 3.4a1.8 1.8 0 0 1-3.6 0c0-.9.6-1.7 1.8-3.4z" fill="#fde047"/>
    </svg>`,
  // Дверь дома в деревне: заметная створка со ручкой, чтобы вход в дом
  // читался на траве (сама клетка — обычный пол).
  door: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="2" width="10" height="12" rx="1" fill="#7c4a12" stroke="${OL}" stroke-width="0.8"/>
      <rect x="4.3" y="3.3" width="7.4" height="10.4" rx="0.6" fill="#8b5a1e" stroke="${OL}" stroke-width="0.4"/>
      <path d="M4.3 3.3h7.4v10.4H4.3z" fill="none" stroke="#b07a2c" stroke-width="0.4"/>
      <path d="M6 5.4h4M6 7.2h4M6 9h4" stroke="#6b3b0c" stroke-width="0.5"/>
      <circle cx="11" cy="8.6" r="0.7" fill="#facc15" stroke="${OL}" stroke-width="0.4"/>
    </svg>`,
  // Запертая дверь: та же створка, но с замком и без ручки.
  doorLocked: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="2" width="10" height="12" rx="1" fill="#4b3418" stroke="${OL}" stroke-width="0.8"/>
      <rect x="4.3" y="3.3" width="7.4" height="10.4" rx="0.6" fill="#5b4020" stroke="${OL}" stroke-width="0.4"/>
      <rect x="6.2" y="7" width="3.6" height="3.4" rx="0.5" fill="#94a3b8" stroke="${OL}" stroke-width="0.5"/>
      <path d="M7 7v-1.2a1 1 0 0 1 2 0V7" fill="none" stroke="#94a3b8" stroke-width="0.7"/>
    </svg>`,
  treasure: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5" y="6" width="11" height="7" rx="1" fill="#92400e" stroke="${OL}" stroke-width="0.7"/>
      <path d="M2.5 7.5C2.5 4.4 5 2.8 8 2.8s5.5 1.6 5.5 4.7z" fill="#b45309" stroke="${OL}" stroke-width="0.7"/>
      <path d="M2.5 6.2h11v1.6h-11z" fill="#facc15"/>
      <rect x="7" y="8.4" width="2" height="3" rx="0.5" fill="#facc15" stroke="${OL}" stroke-width="0.5"/>
      <circle cx="8" cy="10" r="0.45" fill="#7c4a12"/>
      <path d="M3.4 4.6l1-1.4M12.6 4.6l-1-1.4" stroke="#fde68a" stroke-width="0.7" stroke-linecap="round"/>
      <path d="M5.5 11.5h5" stroke="#6b3308" stroke-width="0.5"/>
    </svg>`,
  lootBag: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.1 5.1c0-1.5.9-2.4 2.9-2.4s2.9.9 2.9 2.4" fill="none" stroke="${OL}" stroke-width="0.9"/>
      <path d="M5.2 5.4h5.6l1.4 6.1c.2.9-.4 1.5-1.3 1.5H5.1c-.9 0-1.5-.6-1.3-1.5z" fill="#8a5a2b" stroke="${OL}" stroke-width="0.7"/>
      <path d="M5.4 6.2h5.2l.5 2.2H4.9z" fill="#a8733c"/>
      <circle cx="8" cy="10.4" r="1.35" fill="#f2c14e" stroke="${OL}" stroke-width="0.45"/>
      <path d="M7.3 10.4h1.4M8 9.7v1.4" stroke="#7c4a12" stroke-width="0.45" stroke-linecap="round"/>
    </svg>`,
  stairs: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 13h3v-3h3V7h3V4h3v9z" fill="#0c4a6e" stroke="${OL}" stroke-width="0.6"/>
      <path d="M2 13h3v-3h3V7h3V4h3" fill="none" stroke="#38bdf8" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M8 10l1.5 1.5L8 13" fill="none" stroke="#7dd3fc" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  stairsUp: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 13h3v-3h3V7h3V4h3V2H2z" fill="#064e3b" stroke="${OL}" stroke-width="0.6"/>
      <path d="M2 13h3v-3h3V7h3V4h3" fill="none" stroke="#34d399" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M6 8.5L8 6.5l2 2" fill="none" stroke="#6ee7b7" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  portal: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="8" cy="8.6" rx="5.6" ry="6.4" fill="#0b1220" stroke="#7c3aed" stroke-width="1.1"/>
      <ellipse cx="8" cy="8.6" rx="3.7" ry="4.5" fill="#1e1b4b" stroke="#38bdf8" stroke-width="0.9"/>
      <path d="M6.1 11.5c-.6-1.6-.4-3.4.6-4.9M9.9 5.5c.7 1.6.5 3.4-.6 4.9" fill="none" stroke="#a5f3fc" stroke-width="0.8" stroke-linecap="round"/>
      <circle cx="8" cy="8.6" r="1" fill="#67e8f9"/>
      <path d="M3 3.2l.5 1.3M13 3.2l-.5 1.3M3.4 12.8l1.1-.8M12.6 12.8l-1.1-.8" stroke="#c4b5fd" stroke-width="0.6" stroke-linecap="round"/>
    </svg>`,
  trader: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1.6c2.7 0 4.5 1.9 4.5 4.3l.7 7.1H2.8l.7-7.1C3.5 3.5 5.3 1.6 8 1.6z" fill="#6d5a3a" stroke="${OL}" stroke-width="0.7"/>
      <path d="M8 1.6c2.7 0 4.5 1.9 4.5 4.3l.2 2.1h-3.2l-.5-2h-2l-.5 2H3.3l.2-2.1C3.5 3.5 5.3 1.6 8 1.6z" fill="#7d6845" opacity="0.9"/>
      <ellipse cx="8" cy="6.6" rx="2.4" ry="2.8" fill="#14100b"/>
      <circle cx="7" cy="6.2" r="0.55" fill="#fbbf24"/><circle cx="9" cy="6.2" r="0.55" fill="#fbbf24"/>
      <rect x="5" y="10" width="6" height="1.2" fill="#3f3220"/>
      <circle cx="12.4" cy="11.4" r="2.1" fill="#c9a227" stroke="${OL}" stroke-width="0.6"/>
      <path d="M12.4 9.6v-1M11.2 10.4l1.2 1 1.2-1" stroke="#7c5a10" stroke-width="0.6" fill="none"/>
      <path d="M11.7 11.4h1.4M12.4 10.7v1.4" stroke="#7c5a10" stroke-width="0.5"/>
    </svg>`,
  // ---------- Ловушки ----------
  spikes: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 13h11" stroke="#334155" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M4 13l1.2-6 1.2 6z" fill="#94a3b8" stroke="${OL}" stroke-width="0.5"/>
      <path d="M7.4 13L8.6 5 9.8 13z" fill="#cbd5e1" stroke="${OL}" stroke-width="0.5"/>
      <path d="M10.8 13L12 6.6 13.2 13z" fill="#94a3b8" stroke="${OL}" stroke-width="0.5"/>
    </svg>`,
  pit: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="8" cy="9.5" rx="5.6" ry="4.2" fill="#020617" stroke="${OL}" stroke-width="0.7"/>
      <ellipse cx="8" cy="9" rx="4.2" ry="2.9" fill="#0f172a"/>
      <path d="M4.4 11.8C3.6 13.6 4.6 15 6 15.4M11.6 11.8c.8 1.8-.2 3.2-1.6 3.6"
            stroke="#1e293b" stroke-width="0.8" fill="none" stroke-linecap="round"/>
      <path d="M5.6 8.2c1-1.2 3.8-1.2 4.8 0" stroke="#475569" stroke-width="0.5" fill="none" opacity="0.6"/>
    </svg>`,
  mushroom_spore: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.2 8.6A3.9 3.3 0 0 1 11.8 8.6Z" fill="#a855f7" stroke="${OL}" stroke-width="0.6"/>
      <circle cx="6.4" cy="7.2" r="0.7" fill="#f3e8ff"/><circle cx="9.6" cy="7.6" r="0.5" fill="#f3e8ff"/>
      <rect x="7.2" y="8.4" width="1.4" height="4" rx="0.4" fill="#e7e5e4" stroke="${OL}" stroke-width="0.5"/>
      <circle cx="4.6" cy="5.2" r="0.8" fill="#c084fc" opacity="0.55"/>
      <circle cx="11.8" cy="4.4" r="0.6" fill="#c084fc" opacity="0.55"/>
      <circle cx="8.4" cy="3.2" r="0.5" fill="#c084fc" opacity="0.45"/>
    </svg>`,
  crystal_shard: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 1.6L9.4 7 7.6 12 5 7z" fill="#38bdf8" stroke="${OL}" stroke-width="0.6"/>
      <path d="M7 1.6L7 12" stroke="#bae6fd" stroke-width="0.5" opacity="0.8"/>
      <path d="M11.6 7.2L13.4 11.2 11 12 10 8.6z" fill="#0ea5e9" stroke="${OL}" stroke-width="0.5"/>
      <path d="M3.4 8.6L5 12.4 2.8 13 2.2 10z" fill="#7dd3fc" stroke="${OL}" stroke-width="0.5"/>
    </svg>`,
  chain_snare: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="#94a3b8" stroke-width="1.1">
        <ellipse cx="5.4" cy="5.4" rx="2.4" ry="1.5" transform="rotate(45 5.4 5.4)"/>
        <ellipse cx="8" cy="8" rx="2.4" ry="1.5" transform="rotate(45 8 8)"/>
        <ellipse cx="10.6" cy="10.6" rx="2.4" ry="1.5" transform="rotate(45 10.6 10.6)"/>
      </g>
      <circle cx="8" cy="8" r="0.6" fill="#475569"/>
    </svg>`,
  curse_tile: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.4" y="2.4" width="11.2" height="11.2" rx="1.4" fill="#1c1917" stroke="${OL}" stroke-width="0.7"/>
      <path d="M8 4.6l4.2 3.4L8 14.2 3.8 8z" fill="none" stroke="#ef4444" stroke-width="0.9"/>
      <path d="M8 6.6l2.4 2L8 12.4 5.6 8.6z" fill="#7f1d1d" opacity="0.8"/>
      <circle cx="8" cy="8.6" r="0.8" fill="#fca5a5"/>
    </svg>`,
  // Новые виды: щитоносец при крышке, жрица в светлом одеянии, некромант
  // в тёмном капюшоне. Те же угловатые силуэты, что у остальных монстров.
  shieldman: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1.6l1.6 1.4v8.4L8 14.2 6.4 11.4V3z" fill="#9aa7b5" stroke="${OL}" stroke-width="0.8"/>
      <path d="M4.2 5.4c0-1.6 1.7-2.8 3.8-2.8s3.8 1.2 3.8 2.8v2.8c0 1.6-1.7 2.8-3.8 2.8S4.2 9.8 4.2 8.2z" fill="#7c8794" stroke="${OL}" stroke-width="0.8"/>
      <circle cx="6.6" cy="6.4" r="0.5" fill="#0b1120"/><circle cx="9.4" cy="6.4" r="0.5" fill="#0b1120"/>
      <path d="M2.6 7.4h2.6M10.8 7.4h2.6" stroke="#cbd5e1" stroke-width="1.1" stroke-linecap="round"/>
    </svg>`,
  priest: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1.4l1.8 1.6v9.4H6.2V3z" fill="#e7d7a8" stroke="${OL}" stroke-width="0.8"/>
      <circle cx="8" cy="5.4" r="2.6" fill="#f6e7bd" stroke="${OL}" stroke-width="0.8"/>
      <path d="M6.2 4.8c.4-1 1.1-1.6 1.8-1.6s1.4.6 1.8 1.6z" fill="#fffbe8"/>
      <circle cx="7.1" cy="5.6" r="0.45" fill="#0b1120"/><circle cx="8.9" cy="5.6" r="0.45" fill="#0b1120"/>
      <path d="M4.4 12.6h7.2l-.8 2.2H5.2z" fill="#cbd5e1" stroke="${OL}" stroke-width="0.7"/>
      <circle cx="8" cy="10.6" r="0.7" fill="#f6c453" stroke="${OL}" stroke-width="0.5"/>
    </svg>`,
  necromancer: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1.2l2.4 2.4v9h-4.8v-9z" fill="#4c1d95" stroke="${OL}" stroke-width="0.8"/>
      <path d="M4.6 6.2c0-1.8 1.5-3 3.4-3s3.4 1.2 3.4 3v1.6H4.6z" fill="#2e1065" stroke="${OL}" stroke-width="0.8"/>
      <circle cx="6.8" cy="6.6" r="0.55" fill="#a78bfa"/>
      <circle cx="9.2" cy="6.6" r="0.55" fill="#a78bfa"/>
      <path d="M6 12.6h4l-.6 2.2H6.6z" fill="#1c1917" stroke="${OL}" stroke-width="0.7"/>
      <circle cx="12.6" cy="4" r="1.1" fill="#8b5cf6" opacity="0.85"/>
    </svg>`,
  // Интерактив этажа: жила руды, завал, рычаг и табличка. Пиксельного набора
  // для них нет, поэтому они рисуются значками — так же, как прицел sniper.
  ore: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 3l3 1 2 3-1 4-3 2-3-2-1-4z" fill="#64748b" stroke="${OL}" stroke-width="0.8"/>
      <path d="M6.4 5l2 1 .6 2.4-1.6 1.6-2-1L5 6.6z" fill="#cbd5e1"/>
      <path d="M9.6 4.4l2-.6 1.6 1.6-.8 2-2 .4-1.2-1.4z" fill="#f6c453" stroke="${OL}" stroke-width="0.7"/>
    </svg>`,
  rubble: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 13l2-5 3-2 3 2 4 5z" fill="#57534e" stroke="${OL}" stroke-width="0.8"/>
      <path d="M5.4 7.6l1.6-2 2 1.6-1.2 2.2z" fill="#a8a29e"/>
      <path d="M10.6 9l1.4-1.4 1.6 1.4-1.2 1.6z" fill="#78716c"/>
    </svg>`,
  lever: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <rect x="6.6" y="9" width="2.8" height="4.6" rx="0.6" fill="#44403c" stroke="${OL}" stroke-width="0.7"/>
      <path d="M8 9.6L12.4 3.4" stroke="#a16207" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="12.6" cy="3" r="1.6" fill="#f6c453" stroke="${OL}" stroke-width="0.7"/>
    </svg>`,
  sign: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <rect x="7.2" y="7" width="1.6" height="7" rx="0.5" fill="#78350f" stroke="${OL}" stroke-width="0.6"/>
      <rect x="2.4" y="2.6" width="11.2" height="5" rx="0.8" fill="#b45309" stroke="${OL}" stroke-width="0.8"/>
      <path d="M4.2 4.4h7.6M4.2 6.2h5.4" stroke="#fde68a" stroke-width="0.8" stroke-linecap="round"/>
    </svg>`,
  sniper: `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="4.6" fill="none" stroke="#f472b6" stroke-width="0.9" opacity="0.85"/>
      <path d="M8 1.4v3.2M8 11.4v3.2M1.4 8h3.2M11.4 8h3.2" stroke="#f472b6" stroke-width="0.9" stroke-linecap="round"/>
      <circle cx="8" cy="8" r="1.3" fill="#f472b6"/>
    </svg>`
};

// Значок стража лестницы: щит с замочной скважиной в углу клетки врага.
// Пока страж жив, лестница вниз закрыта; по одному свечению его не отличить
// от обычного врага того же вида.
ICONS.guard = `
    <svg class="ent-svg" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1.4l5.2 2v4.3c0 3.3-2.3 5.5-5.2 6.9-2.9-1.4-5.2-3.6-5.2-6.9V3.4z" fill="#0c4a6e" stroke="#7dd3fc" stroke-width="1.2"/>
      <circle cx="8" cy="6.5" r="1.6" fill="#e0f2fe"/>
      <path d="M7.1 7.5h1.8l.6 3.4H6.5z" fill="#e0f2fe"/>
    </svg>`;

function iconSvg(key) {
  return ICONS[key] || ICONS.slime;
}

function itemIcon(slot, color) {
  const c = color || "#94a3b8";
  let inner = "";
  if (slot === "weapon") {
    inner = "<path d='M8 1.5 9.2 4v6.4H6.8V4z' fill='" + c + "' stroke='" + OL + "' stroke-width='0.6'/>" +
      "<rect x='4.6' y='10.4' width='6.8' height='1.4' rx='0.7' fill='#92400e' stroke='" + OL + "' stroke-width='0.5'/>" +
      "<rect x='7.4' y='11.8' width='1.2' height='2.4' fill='#451a03'/><circle cx='8' cy='14.4' r='0.8' fill='#facc15' stroke='" + OL + "' stroke-width='0.5'/>";
  } else if (slot === "armor") {
    inner = "<path d='M8 2l4.5 1.8v3.4c0 3-2 4.6-4.5 5.8-2.5-1.2-4.5-2.8-4.5-5.8V3.8z' fill='" + c + "' stroke='" + OL + "' stroke-width='0.7'/>" +
      "<path d='M8 4l2.6 1v2c0 1.8-1.2 2.8-2.6 3.5-1.4-.7-2.6-1.7-2.6-3.5v-2z' fill='none' stroke='#f8fafc' stroke-width='0.7' opacity='0.85'/>";
  } else if (slot === "accessory") {
    inner = "<circle cx='8' cy='9' r='4.4' fill='none' stroke='#facc15' stroke-width='1.6'/>" +
      "<circle cx='8' cy='3.4' r='2' fill='" + c + "' stroke='" + OL + "' stroke-width='0.7'/>" +
      "<circle cx='7.4' cy='2.9' r='0.6' fill='#fff' opacity='0.9'/>";
  } else {
    inner = "<path d='M6 3h4v2c1.4.7 2.2 1.9 2.2 3.4 0 2.6-1.8 4.6-4.2 4.6S3.8 11 3.8 8.4C3.8 6.9 4.6 5.7 6 5z' fill='#e0f2fe' stroke='" + OL + "' stroke-width='0.7'/>" +
      "<path d='M4.6 9.4c.6 1.6 1.8 2.6 3.4 2.6s2.8-1 3.4-2.6z' fill='" + c + "'/>" +
      "<rect x='6.8' y='1.4' width='2.4' height='1.8' rx='0.6' fill='#92400e' stroke='" + OL + "' stroke-width='0.5'/>";
  }
  return "<svg class='ent-svg' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'>" + inner + "</svg>";
}
