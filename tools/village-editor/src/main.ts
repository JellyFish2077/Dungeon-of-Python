import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Не найден контейнер #app");

app.innerHTML = `
  <main class="shell">
    <p class="eyebrow">PyDungeon · инструменты</p>
    <h1>Редактор деревни</h1>
    <p class="lead">
      Каркас Vite + TypeScript готов. Здесь появится визуальный редактор:
      карта 30×18, дома, двери, декор, таблички и экспорт готового
      фрагмента для <code>static/village-content.js</code>.
    </p>
    <div class="note">
      Пока это только заготовка. Игровая сборка и проверки работают
      отдельно: <code>python tools/build_web.py</code> и
      <code>python run_all_checks.py</code>.
    </div>
  </main>
`;
