"""Собирает самодостаточную HTML-колоду PyDungeon из шаблона.

Шрифты и снимок вшиваются base64: файл открывается офлайн, без сервера.
Запуск:  python demo/deck/build_html.py
"""

import base64
import json
from pathlib import Path

from PIL import Image

from notes import NOTES

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
FONTS = ROOT / "static" / "landing" / "fonts"
OUT = HERE / "pydungeon-deck.html"
BATTLE = HERE / "assets" / "battle.png"
NOTES_JSON = json.dumps(NOTES, ensure_ascii=False)


def b64(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode()


def font_face(family: str, weight: int, path: Path) -> str:
    return (
        "@font-face{font-family:'%s';font-weight:%d;font-style:normal;font-display:block;"
        "src:url(data:font/ttf;base64,%s) format('truetype')}" % (family, weight, b64(path))
    )


FACES = "\n".join(
    [
        font_face("Literata", 400, FONTS / "Literata-Regular.ttf"),
        font_face("Literata", 700, FONTS / "Literata-Bold.ttf"),
        font_face("IBM Plex Mono", 400, FONTS / "IBMPlexMono-Regular.ttf"),
        font_face("IBM Plex Mono", 500, FONTS / "IBMPlexMono-Medium.ttf"),
    ]
)

BATTLE_URI = f"data:image/png;base64,{b64(BATTLE)}"
with Image.open(BATTLE) as im:
    IW, IH = im.size

PW, PX, PY = 518, 675, 125
PH = round(PW * IH / IW)
NOTE_TOP = PY + PH + 27

BIOMES = ["ПЕЩЕРЫ", "КАТАКОМБЫ", "ЛЁД", "ДЕМОНЫ", "ДРАКОН"]

ticks = "".join(
    f'<i class="tick{" boss" if i % 2 else ""}" style="left:{i * 100 / 9:.4f}%"></i>'
    for i in range(10)
)
labels = "".join(
    f'<span style="left:{(i * 2 + 1) * 100 / 9:.4f}%">{name}</span>' for i, name in enumerate(BIOMES)
)

STEPS = [
    ("01", "Вопрос", "Строки, списки, словари, функции."),
    ("02", "Задача", "Сразу после ответа — код на ту же тему."),
    ("03", "Урон", "Ошибка снимает здоровье герою, верный ответ — монстру."),
]
steps_html = "".join(
    f'<div class="step{" last" if n == len(STEPS) - 1 else ""}" style="top:{274 + n * 132}px">'
    f'<span class="n">{num}</span><h3>{title}</h3><p>{desc}</p></div>'
    for n, (num, title, desc) in enumerate(STEPS)
)

ROWS = [
    ("ЭТАЖЕЙ", "10", False),
    ("БИОМОВ", "5", False),
    ("БОССОВ", "5", False),
    ("МИНУТ НА ПОХОД", "20–40", False),
    ("СЕРВЕР", "не нужен", True),
]
rows_html = "".join(
    f'<div class="row"><span class="k">{name}</span>'
    f'<span class="v{" txt" if txt else ""}">{value}</span></div>'
    for name, value, txt in ROWS
)

HTML = """<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PyDungeon — полевой журнал (демо-колода)</title>
<style>
__FACES__

:root{
  --night:#090b0a; --night-2:#0f1411;
  --paper:#d9cbb0; --paper-2:#c8b79a; --paper-3:#e6dcc6;
  --ink:#1c1a16; --ink-soft:#48443a;
  --rust:#8a4a32; --rust-ink:#713823; --rust-light:#d39a74;
  --oxide:#4f6f62; --oxide-ink:#395247;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{
  background:#050706; color:var(--paper);
  font-family:'Literata',Georgia,serif;
  display:grid; place-items:center; overflow:hidden;
}
#stage{position:relative; width:1280px; height:720px; flex:none;
  transform:scale(var(--s,1)); transform-origin:center center;
  box-shadow:0 24px 60px rgba(0,0,0,.55);}
.slide{position:absolute; inset:0; width:1280px; height:720px; overflow:hidden;
  display:none; background:var(--paper); color:var(--ink);}
.slide.on{display:block}
.dark{background:var(--night); color:var(--paper)}

/* служебные надписи: их немного */
.hdr{position:absolute; left:86px; right:86px; top:50px;
  font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.24em; color:#c8b79a}
.rule{position:absolute; left:86px; right:86px; height:1px; background:#322f28; top:86px}
.foot{position:absolute; left:86px; bottom:34px; font-family:'IBM Plex Mono',monospace;
  font-size:9.4px; letter-spacing:.2em; color:var(--ink-soft)}
.dark .foot{color:#6f695c}
.pgn{position:absolute; right:86px; bottom:34px; font-family:'IBM Plex Mono',monospace;
  font-size:9.4px; letter-spacing:.2em; color:var(--ink-soft)}
.dark .pgn{color:#6f695c}

/* 01 обложка */
.title{position:absolute; left:78px; top:158px; font-size:115px; font-weight:700;
  line-height:.95; letter-spacing:-.015em}
.title .py{color:var(--paper)} .title .dn{color:var(--rust-light)}
.kicker{position:absolute; left:86px; top:322px; font-family:'IBM Plex Mono',monospace;
  font-size:16px; letter-spacing:.42em; color:#9db3a8}
.desc{position:absolute; left:86px; top:378px; width:710px; font-size:24px; line-height:1.3; color:var(--paper)}
.tags{position:absolute; left:86px; top:482px; display:flex; gap:17px}
.tag{border:1px solid #5a5142; height:41px; padding:0 22px; display:flex; align-items:center;
  font-family:'IBM Plex Mono',monospace; font-size:11.4px; letter-spacing:.2em; color:var(--paper-2)}
.stamp{position:absolute; right:118px; top:149px; width:144px; height:144px;
  border:1px solid #a3705a; border-radius:50%; transform:rotate(7deg);
  display:flex; align-items:center; justify-content:center; color:#a3705a}
.stamp::after{content:""; position:absolute; inset:8px; border:.6px solid #a3705a; border-radius:50%}
.stamp .in{text-align:center; line-height:1; font-family:'IBM Plex Mono',monospace; font-size:8px; letter-spacing:.2em}
.stamp .py{display:block; font-family:'Literata',serif; font-size:28px; font-weight:700;
  letter-spacing:0; margin:4px 0 4px}
.scheme{position:absolute; left:110px; right:188px; top:614px}
.scheme .rail{position:relative; height:1px; background:#4a453a}
.tick{position:absolute; top:50%; width:6px; height:6px; margin:-3px 0 0 -3px; border-radius:50%; background:var(--paper-2)}
.tick.boss{width:14px; height:14px; margin:-7px 0 0 -7px; border-radius:0;
  background:var(--rust-light); transform:rotate(45deg)}
.scheme .names{position:relative; height:16px}
.scheme .names span{position:absolute; transform:translateX(-50%); top:15px;
  font-family:'IBM Plex Mono',monospace; font-size:8.6px; letter-spacing:.14em; color:#8f887a; white-space:nowrap}

/* 02 механика */
.h1{position:absolute; left:86px; top:96px; width:620px; font-size:44px; font-weight:700; line-height:1.14}
.step{position:absolute; left:86px; width:602px; height:132px; border-bottom:1px solid var(--paper-2)}
.step.last{border-bottom:0}
.step .n{position:absolute; left:0; top:4px; font-family:'IBM Plex Mono',monospace; font-size:11.3px;
  letter-spacing:.24em; color:var(--rust-ink)}
.step h3{font-size:20px; font-weight:700; margin:0 0 10px 53px}
.step p{margin-left:53px; font-size:14px; line-height:1.45; color:var(--ink-soft); width:540px}
.shot{position:absolute; left:__PX__px; top:__PY__px; width:__PW__px}
.shot .frame{position:absolute; inset:-9px; background:var(--night-2)}
.shot img{position:relative; display:block; width:100%; height:auto}
.shot .tape{position:absolute; left:18px; top:-25px; width:100px; height:23px;
  background:var(--paper-3); transform:rotate(-3.5deg); z-index:3; opacity:.92}
.shotnote{position:absolute; left:__PX__px; top:__NOTE__px; width:__PW__px; font-size:15.3px; color:var(--ink-soft)}

/* 03 опись */
.h1.wide{width:1140px; font-size:40px}
.sub{position:absolute; left:86px; top:167px; font-size:16.6px; color:var(--ink-soft)}
.ledger{position:absolute; left:86px; top:245px; width:1107px}
.row{height:67px; display:flex; align-items:center; justify-content:space-between;
  border-bottom:1px solid var(--paper-2)}
.row .k{font-family:'IBM Plex Mono',monospace; font-size:12px; letter-spacing:.22em; color:var(--ink-soft)}
.row .v{font-family:'IBM Plex Mono',monospace; font-size:35px; letter-spacing:.03em}
.row .v.txt{font-size:23px; letter-spacing:0}
.made-line{position:absolute; left:86px; top:603px; width:1110px; font-size:15.3px; color:var(--ink-soft)}

/* заметки докладчика */
#notes{position:fixed; top:0; right:0; width:380px; height:100%; padding:30px 26px 44px;
  background:#0f1411; color:var(--paper); border-left:1px solid #322f28; overflow:auto;
  transform:translateX(102%); transition:transform .18s ease; z-index:20;
  font-size:14.5px; line-height:1.55}
body.notes-open #notes{transform:none}
body.notes-open #stage{transform:translateX(-190px) scale(var(--s,1))}
#notes .nt{font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:.2em;
  color:var(--rust-light); margin-bottom:18px}
#notes .blk{white-space:pre-wrap; margin-bottom:14px}
#notes .time{font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:.18em;
  color:var(--rust-light); margin:2px 0 12px}
#notes .qh{white-space:pre-wrap; margin-top:24px; color:var(--rust-light);
  font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:.2em}

/* навигация */
#nav{position:fixed; right:22px; bottom:18px; display:flex; gap:8px; z-index:9}
#nav button{width:9px; height:9px; border-radius:50%; border:1px solid #6f695c; background:transparent; padding:0; cursor:pointer}
#nav button.on{background:var(--rust-light); border-color:var(--rust-light)}
#hint{position:fixed; left:22px; bottom:16px; font-family:'IBM Plex Mono',monospace; font-size:11px;
  letter-spacing:.14em; color:#5c564a}
body.render #nav, body.render #hint{display:none}
body.render #notes{display:none}
html.render, body.render{width:1280px; height:720px; overflow:hidden; background:var(--paper)}
body.render{display:block}
body.render #stage{position:absolute; inset:0; box-shadow:none; transform:none}
body.render .slide{display:none}
body.render .slide.on{display:block}

@media print{
  @page{size:1280px 720px; margin:0}
  body{display:block; background:#fff; overflow:visible}
  #nav,#hint{display:none}
  #notes{display:none}
  body.notes-open #stage{margin-right:0}
  #stage{transform:none; box-shadow:none; width:1280px; height:auto}
  .slide{display:block !important; position:relative; page-break-after:always; break-after:page}
}
</style>
</head>
<body>
<div id="stage">

  <section class="slide dark on" data-i="0">
    <div class="hdr">ПОЛЕВОЙ ЖУРНАЛ</div>
    <div class="rule"></div>
    <h1 class="title"><span class="py">Py</span><span class="dn">Dungeon</span></h1>
    <div class="kicker">ПЕЧАТИ ГЛУБИНЫ</div>
    <p class="desc">Спуск в подземелье, где каждый бой — вопрос по
      Python. Десять этажей, пять боссов, один дракон.</p>
    <div class="tags"><span class="tag">10 ЭТАЖЕЙ</span><span class="tag">5 БОССОВ</span><span class="tag">20–40 МИНУТ</span></div>
    <div class="stamp"><div class="in">ПЕЧАТЬ<span class="py">Py</span>2026</div></div>
    <div class="scheme">
      <div class="rail">__TICKS__</div>
      <div class="names">__LABELS__</div>
    </div>
    <div class="foot">PYTHON · БРАУЗЕР · БЕЗ СЕРВЕРА</div>
    <div class="pgn">01</div>
  </section>

  <section class="slide" data-i="1">
    <h2 class="h1">Вопрос — это удар.<br>Ошибка — ответный.</h2>
    __STEPS__
    <div class="shot">
      <div class="frame"></div><div class="tape"></div>
      <img src="__BATTLE__" alt="Бой с скелетом: вопрос по Python вместо броска кубика">
    </div>
    <div class="shotnote">Проверка кода идёт в браузере.</div>
    <div class="pgn">02</div>
  </section>

  <section class="slide" data-i="2">
    <h2 class="h1 wide">Десять этажей. Пять боссов. Один дракон.</h2>
    <p class="sub">Кампания «Печати глубины»: пять глав, деревня, журнал и финал.</p>
    <div class="ledger">__ROWS__</div>
    <div class="made-line">Python через Pyodide, пиксель-арт 32×32 (Aseprite, открытые тайлы DCSS), сохранения — в localStorage.</div>
    <div class="pgn">03</div>
  </section>

</div>

<div id="nav"></div>
<div id="hint">← → ЛИСТАТЬ · N — ЗАМЕТКИ · P — ПЕЧАТЬ</div>
<aside id="notes" aria-hidden="true"></aside>

<script>
const stage = document.getElementById('stage');
const slides = [...document.querySelectorAll('.slide')];
const nav = document.getElementById('nav');
const notesEl = document.getElementById('notes');
const NOTES = __NOTES__;
const render = new URLSearchParams(location.search).has('render');
if (render) {
  document.body.classList.add('render');
  document.documentElement.classList.add('render');
  Object.assign(document.documentElement.style, {width: '1280px', height: '720px', overflow: 'hidden', margin: '0'});
  Object.assign(document.body.style, {display: 'block', margin: '0', width: '1280px', height: '720px',
    overflow: 'hidden', background: 'var(--paper)'});
  Object.assign(stage.style, {position: 'static', inset: 'auto', transform: 'none', boxShadow: 'none',
    width: '1280px', height: '720px'});
}

let i = 0;
const wanted = Number(new URLSearchParams(location.search).get('slide'));
if (wanted >= 1 && wanted <= slides.length) i = wanted - 1;

slides.forEach((s, k) => {
  const b = document.createElement('button');
  b.title = 'Лист ' + (k + 1);
  b.onclick = () => show(k);
  nav.appendChild(b);
});

function showNotes() {
  const raw = NOTES[String(i + 1)] || '';
  notesEl.textContent = '';
  const head = document.createElement('div');
  head.className = 'nt';
  head.textContent = 'ЗАМЕТКИ · ЛИСТ ' + String(i + 1).padStart(2, '0') + ' · N — ЗАКРЫТЬ';
  notesEl.appendChild(head);

  raw.split('\\n\\n').forEach(block => {
    if (block.startsWith('ЕСЛИ ')) {
      const lines = block.split('\\n');
      const h = document.createElement('div');
      h.className = 'qh';
      h.textContent = lines[0];
      notesEl.appendChild(h);
      const rest = document.createElement('div');
      rest.className = 'blk';
      rest.textContent = lines.slice(1).join('\\n').trim();
      notesEl.appendChild(rest);
      return;
    }
    const d = document.createElement('div');
    d.className = block.startsWith('~') ? 'time' : 'blk';
    d.textContent = block;
    notesEl.appendChild(d);
  });
}

function show(k) {
  i = Math.max(0, Math.min(slides.length - 1, k));
  slides.forEach((s, n) => s.classList.toggle('on', n === i));
  [...nav.children].forEach((b, n) => b.classList.toggle('on', n === i));
  history.replaceState(null, '', '?slide=' + (i + 1));
  showNotes();
}

function fit() {
  if (render) { stage.style.setProperty('--s', 1); return; }
  const shift = document.body.classList.contains('notes-open') ? 380 : 0;
  const s = Math.min((innerWidth - shift) / 1280, innerHeight / 720) * 0.94;
  stage.style.setProperty('--s', s.toFixed(4));
}

addEventListener('resize', fit);
addEventListener('keydown', e => {
  if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); show(i + 1); }
  if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); show(i - 1); }
  if (e.key === 'Home') show(0);
  if (e.key === 'End') show(slides.length - 1);
  if (e.code === 'KeyN') {
    document.body.classList.toggle('notes-open');
    notesEl.setAttribute('aria-hidden', String(!document.body.classList.contains('notes-open')));
    fit();
  }
  if (e.key.toLowerCase() === 'p') print();
});
stage.addEventListener('click', e => {
  if (e.clientX < innerWidth / 2) show(i - 1); else show(i + 1);
});

show(i);
fit();
</script>
</body>
</html>
"""

html = (
    HTML.replace("__FACES__", FACES)
    .replace("__TICKS__", ticks)
    .replace("__LABELS__", labels)
    .replace("__STEPS__", steps_html)
    .replace("__ROWS__", rows_html)
    .replace("__BATTLE__", BATTLE_URI)
    .replace("__NOTES__", NOTES_JSON)
    .replace("__PX__", str(PX))
    .replace("__PY__", str(PY))
    .replace("__PW__", str(PW))
    .replace("__NOTE__", str(NOTE_TOP))
)
OUT.write_text(html, encoding="utf-8")
print(f"saved: {OUT}  ({OUT.stat().st_size / 1024:.0f} KB)")
