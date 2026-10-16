(function () {
  "use strict";

  const LETTERS = ["A", "B", "C", "D"];

  // Тема и уровень заданий «повтори код» / «напиши код» лежат не в банке,
  // а в общей таблице task-meta.js — ею же пользуется самоподготовка.
  const META = window.TASK_META || {};
  const COPY_TOPICS = META.COPY_TOPICS || {};
  const CODE_TOPICS = META.CODE_TOPICS || {};
  const copyLevel = META.copyLevel || (() => 2);

  const kindTitle = { mc: "Вопрос", fill: "Вставь пропущенное", error: "Найди ошибку", copy: "Повтори код", code: "Напиши код" };

  const state = {
    name: "",
    mode: "practice",
    source: "bank",
    length: 15,
    topic: "",
    order: [],
    index: 0,
    answers: [],
    locked: false,
    startedAt: 0,
    result: null,
    // Серия верных ответов подряд — мотивация внутри прогона.
    streak: 0,
    bestStreak: 0
  };

  const el = (id) => document.getElementById(id);

  const parseHash = () => {
    const m = window.location.hash.slice(1).split("&").reduce((acc, part) => {
      const [k, v] = part.split("=");
      if (k) acc[k] = decodeURIComponent(v || "");
      return acc;
    }, {});
    return m;
  };

  const prefillName = () => {
    const m = parseHash();
    const params = new URLSearchParams(window.location.search);
    const session = typeof currentUser === "function" ? currentUser() : null;
    const saved = typeof getLastName === "function" ? getLastName() : "";
    const guess = (session && session.name) || saved || m.name || params.get("name") || "";
    if (guess) el("name").value = guess;
    // Кто уже вошёл в аккаунт — говорим прямо: имя подставлено, менять не нужно.
    // Учитель видит, прислан ли результат из аккаунта, — об этом тоже говорим.
    const line = el("account-line");
    if (line && session && session.name) {
      line.innerHTML = "";
      const b = document.createElement("b");
      b.textContent = session.name;
      line.append("Ты в аккаунте ", b, " — имя подставлено. Учитель увидит отметку, " +
        "что результат твой; если сменишь имя, отметки не будет.");
      line.classList.remove("hidden");
    } else if (line) {
      line.textContent = "Ты не вошёл в аккаунт: результат дойдёт до учителя без отметки, " +
        "что он твой. Войти можно на главной странице.";
      line.classList.remove("hidden");
    }
  };

  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Весь банк страницы: вопросы (в том числе сгенерированные варианты) и задания.
  const bankPool = () => {
    const pool = [];
    QUESTIONS.forEach((q) => pool.push({ kind: "mc", level: q.level, ref: q }));
    FILL_TASKS.forEach((t) => pool.push({ kind: "fill", level: t.level, ref: t }));
    ERROR_TASKS.forEach((t) => pool.push({ kind: "error", level: t.level, ref: t }));
    COPY_TASKS.forEach((t, i) => pool.push({ kind: "copy", level: copyLevel(i), ref: t }));
    CODE_TASKS.forEach((t) => pool.push({ kind: "code", level: 3, ref: t }));
    return pool;
  };

  // Задания из пула ошибок профиля. Вместе с ошибкой лежит снимок задания,
  // поэтому повтор работает и для сгенерированных вариантов: их id меняется
  // при каждой загрузке страницы, и по одному id вопрос уже не найти.
  const wrongItems = (name) => {
    const prof = name ? getProfile(name) : null;
    if (!prof || !prof.wrongPool) return [];
    const banks = { mc: QUESTIONS, fill: FILL_TASKS, error: ERROR_TASKS, copy: COPY_TASKS, code: CODE_TASKS };
    const out = [];
    prof.wrongPool.forEach((w) => {
      const snap = w.snapshot;
      const bank = banks[w.kind] || QUESTIONS;
      const live = bank.find((x) => x.id === w.id);
      const ref = live || (snap ? Object.assign({ id: w.id }, snap) : null);
      if (!ref) return;
      out.push({
        kind: w.kind,
        level: ref.level || (snap && snap.level) || 2,
        ref: ref,
        fromPool: !live
      });
    });
    return out;
  };

  const buildOrder = (opts) => {
    const o = opts || {};
    let pool = o.source === "wrong" ? wrongItems(o.name) : bankPool();
    if (o.source !== "wrong" && o.topic) {
      pool = pool.filter((item) => itemTopic(item) === o.topic);
    }
    pool = shuffle(pool.slice());
    if (!pool.length) return [];
    const limit = o.length || 0;
    const levelOf = (item) => item.level || 2;
    if (!limit || limit >= pool.length) {
      // Полный прогон: подъём по уровням, внутри уровня — вперемешку.
      const byLevel = {};
      pool.forEach((item) => {
        (byLevel[levelOf(item)] = byLevel[levelOf(item)] || []).push(item);
      });
      const order = [];
      Object.keys(byLevel)
        .map(Number)
        .sort((a, b) => a - b)
        .forEach((lvl) => order.push(...shuffle(byLevel[lvl].slice())));
      return order;
    }
    // Короткий прогон: настоящая смесь уровней — берём задания по кругу из каждого
    // уровня (★, ★★, ★★★, ★★★★), иначе короткая выборка почти всегда выходит
    // из одних заданий ★☆☆☆ и разбор по уровням ничего не показывает.
    const buckets = {};
    pool.forEach((item) => {
      const lvl = levelOf(item);
      (buckets[lvl] = buckets[lvl] || []).push(item);
    });
    const levels = Object.keys(buckets)
      .map(Number)
      .sort((a, b) => a - b);
    levels.forEach((lvl) => {
      buckets[lvl] = shuffle(buckets[lvl]);
    });
    const picked = [];
    for (let round = 0; picked.length < limit; round++) {
      let added = false;
      for (const lvl of levels) {
        if (round < buckets[lvl].length) {
          picked.push(buckets[lvl][round]);
          added = true;
          if (picked.length >= limit) break;
        }
      }
      if (!added) break;
    }
    return picked;
  };

  const itemTopic = (item) => {
    if (item.kind === "copy") return COPY_TOPICS[item.ref.id] || "syntax";
    if (item.kind === "code") return CODE_TOPICS[item.ref.id] || "functions";
    return item.ref.topic;
  };

  const itemText = (item) =>
    item.kind === "mc" ? item.ref.text : item.ref.title;

  const itemCode = (item) => item.ref.code || "";

  // Компактный снимок задания для пула ошибок: его хватает, чтобы показать
  // задание заново, не отыскивая его в банке.
  const snapshotOf = (item) => {
    if (!item || !item.ref) return null;
    const r = item.ref;
    const snap = {
      level: item.level,
      topic: itemTopic(item),
      code: r.code || "",
      explanation: r.explanation || ""
    };
    if (item.kind === "mc") snap.text = r.text;
    else snap.title = r.title;
    if (r.options) {
      snap.options = r.options.slice();
      snap.answer = r.answer;
    }
    if (r.task) snap.task = r.task;
    if (r.starter) snap.starter = r.starter;
    if (r.tests) snap.tests = r.tests.map((t) => ({ call: t.call, expected: t.expected }));
    return snap;
  };

  const findItem = (a) => {
    const inRun = state.order.find((it) => it.kind === a.kind && it.ref.id === a.id);
    if (inRun) return inRun;
    // findRef ниже ищет по банкам; снимок нужен, когда задания в банке уже нет.
    const ref = findRef(a);
    return ref ? { kind: a.kind, ref: ref, level: a.level } : null;
  };

  // Настройки прогона, выбранные на стартовом экране.
  function readSetup() {
    const src = document.querySelector("#source-chips .chip.active");
    const len = document.querySelector("#length-chips .chip.active");
    state.source = src ? src.dataset.source : "bank";
    state.length = len ? Number(len.dataset.length) : 15;
    const sel = el("topic-select");
    state.topic = sel && !sel.disabled ? sel.value : "";
  }

  const stars = (level) => "★".repeat(level) + "☆".repeat(4 - level);

  function show(screen) {
    ["start", "quiz", "result"].forEach((s) => {
      el("screen-" + s).classList.toggle("hidden", s !== screen);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function start() {
    const name = el("name").value.trim();
    if (!name) {
      toast("Пожалуйста, введи своё имя");
      el("name").focus();
      return;
    }
    state.name = name;
    setLastName(name);
    readSetup();
    state.order = buildOrder({
      source: state.source,
      topic: state.topic,
      length: state.length,
      name: state.name
    });
    if (!state.order.length) {
      toast(
        state.source === "wrong"
          ? "В пуле ошибок пока пусто — сначала пройди тест"
          : "По этой теме заданий нет"
      );
      return;
    }
    state.index = 0;
    state.answers = [];
    state.streak = 0;
    state.bestStreak = 0;
    updateStreak();
    state.startedAt = Date.now();
    show("quiz");
    renderQuestion();
  }

  function normalizeExact(s) {
    return String(s || "")
      .replace(/\r/g, "")
      .split("\n")
      .map((l) => l.replace(/[ \t]+$/, ""))
      .join("\n")
      .replace(/^\n+/, "")
      .replace(/\n+$/, "");
  }

  function normalizeLoose(s) {
    return String(s || "").replace(/\s+/g, "");
  }

  function renderQuestion() {
    const item = state.order[state.index];
    const ref = item.ref;
    state.locked = false;

    el("progress-text").textContent =
      "Вопрос " + (state.index + 1) + " из " + state.order.length;
    el("topic-badge").textContent =
      (kindTitle[item.kind] || "") + " · " + (TOPICS[itemTopic(item)] || "");
    el("progress-bar").style.width =
      (state.index / state.order.length) * 100 + "%";
    el("difficulty").textContent = stars(item.level);
    el("question-text").textContent = itemText(item);
    // Подсказка про клавиши нужна там, где ответ выбирают из вариантов.
    const keysHint = el("keys-hint");
    if (keysHint) {
      keysHint.classList.toggle(
        "hidden",
        item.kind === "copy" || item.kind === "code"
      );
    }

    const codeEl = el("question-code");
    const code = itemCode(item);
    if (code) {
      codeEl.textContent = code;
      codeEl.classList.remove("hidden");
    } else {
      codeEl.classList.add("hidden");
    }

    const fb = el("feedback");
    fb.className = "feedback hidden";
    fb.innerHTML = "";

    const nextBtn = el("next-btn");
    nextBtn.classList.add("hidden");
    nextBtn.textContent =
      state.index === state.order.length - 1 ? "Завершить" : "Далее";

    const box = el("options");
    box.innerHTML = "";
    if (item.kind === "copy") {
      const ta = document.createElement("textarea");
      ta.className = "code-editor";
      ta.id = "quiz-copy";
      ta.spellcheck = false;
      ta.placeholder = "Перепиши код сюда...";
      box.appendChild(ta);
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.type = "button";
      btn.textContent = "Проверить";
      btn.style.marginTop = "12px";
      btn.addEventListener("click", checkQuizCopy);
      box.appendChild(btn);
      ta.focus();
    } else if (item.kind === "code") {
      const p = document.createElement("p");
      p.className = "lead";
      p.style.margin = "0 0 10px";
      p.textContent = item.ref.task;
      box.appendChild(p);
      const ta = document.createElement("textarea");
      ta.className = "code-editor";
      ta.id = "quiz-code";
      ta.spellcheck = false;
      ta.value = item.ref.starter;
      ta.style.cssText = "width:100%;min-height:130px";
      box.appendChild(ta);
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.type = "button";
      btn.textContent = "Проверить и запустить";
      btn.style.marginTop = "12px";
      btn.addEventListener("click", checkQuizCode);
      box.appendChild(btn);
      const res = document.createElement("div");
      res.id = "quiz-code-results";
      res.style.cssText = "margin-top:10px;font-family:monospace;font-size:13px";
      box.appendChild(res);
      ta.focus();
    } else {
      if (!item.view) item.view = shuffleChoices(ref.options, ref.answer);
      item.view.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.className = "option";
        btn.type = "button";
        btn.innerHTML =
          '<span class="key">' + LETTERS[i] + "</span><span></span>";
        btn.lastChild.textContent = opt;
        btn.addEventListener("click", () => choose(i));
        box.appendChild(btn);
      });
    }
  }

  function recordAnswer(item, chosen, correct, shown) {
    state.locked = true;
    state.answers.push({
      kind: item.kind,
      id: item.ref.id,
      topic: itemTopic(item),
      level: item.level,
      chosen,
      correct,
      // Что именно видел ученик: варианты на экране перемешаны, поэтому буквы и
      // тексты надо запомнить здесь — иначе в разборе ошибок будут не те.
      chosenLetter: shown ? shown.chosenLetter : "",
      answerLetter: shown ? shown.answerLetter : "",
      chosenText: shown ? shown.chosenText : "",
      answerText: shown ? shown.answerText : ""
    });
    if (correct) {
      state.streak += 1;
      if (state.streak > state.bestStreak) state.bestStreak = state.streak;
    } else {
      state.streak = 0;
    }
    updateStreak();
  }

  // Живая серия в шапке прогона: «🔥 4 подряд».
  function updateStreak() {
    const box = el("quiz-streak");
    if (!box) return;
    if (state.streak < 2) {
      box.textContent = "";
      box.classList.remove("pop");
      return;
    }
    box.textContent = "🔥 " + state.streak + " подряд";
    box.classList.remove("pop");
    void box.offsetWidth; // без перезапуска анимация не сработает второй раз
    box.classList.add("pop");
    if (state.streak === 5 || state.streak % 10 === 0) {
      toast("Серия " + state.streak + " верных подряд!");
    }
  }

  function showAnswerFeedback(item, correct, correctText, explanation) {
    const showFeedback = state.mode === "practice";
    const fb = el("feedback");
    if (showFeedback) {
      fb.className = "feedback " + (correct ? "ok" : "no");
      fb.innerHTML =
        "<b>" + (correct ? "Верно!" : "Неверно. " + correctText) + "</b><br>" + explanation;
    } else {
      fb.className = "feedback hidden";
    }
    const nextBtn = el("next-btn");
    nextBtn.classList.remove("hidden");
    nextBtn.focus();
  }

  function choose(chosen) {
    if (state.locked) return;
    const item = state.order[state.index];
    const ref = item.ref;
    const view = item.view || { answer: ref.answer, order: ref.options.map((_, i) => i) };
    const options = view.options || ref.options;
    const originalChosen = view.order[chosen];
    const correct = originalChosen === ref.answer;
    recordAnswer(item, originalChosen, correct, {
      chosenLetter: LETTERS[chosen],
      answerLetter: LETTERS[view.answer],
      chosenText: options[chosen],
      answerText: options[view.answer]
    });

    const buttons = Array.from(el("options").children);
    buttons.forEach((b, i) => {
      b.disabled = true;
      if (i === view.answer) b.classList.add("correct");
      if (i === chosen && !correct) b.classList.add("wrong");
    });

    showAnswerFeedback(
      item,
      correct,
      "Правильный ответ: " + LETTERS[view.answer] + ") " + options[view.answer],
      ref.explanation
    );
  }

  function checkQuizCode() {
    if (state.locked) return;
    const item = state.order[state.index];
    const ta = document.getElementById("quiz-code");
    const code = ta ? ta.value : "";
    if (!code.trim()) {
      toast("Сначала напиши код");
      return;
    }
    state.locked = true;
    const btn = el("options").querySelector(".btn");
    if (btn) { btn.disabled = true; btn.textContent = "Запускаем..."; }
    const res = document.getElementById("quiz-code-results");
    if (res) res.textContent = "Проверяем на сервере...";

    fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code, tests: item.ref.tests })
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.unavailable) {
          serverDidNotCheck(data, btn, res);
          return;
        }
        const correct = data.ok && data.passed === data.total;
        if (res) {
          // Текст ошибки и значения пришли из программы ученика — экранируем.
          if (!data.ok) {
            res.innerHTML = "<div style='color:#f87171'>" + escHtml(data.error || "Ошибка") + "</div>";
          } else {
            res.innerHTML = (data.results || []).map((t, i) =>
              "<div style='color:" + (t.ok ? "#16a34a" : "#dc2626") + "'>#" + (i + 1) + " " +
              (t.ok ? "пройден" : "провален") + " · ожидалось " + escHtml(t.expected) +
              ", получено " + escHtml(t.actual) + "</div>"
            ).join("");
          }
        }
        recordAnswer(item, code, correct);
        showAnswerFeedback(item, correct, correct ? "" : "Не все тесты пройдены. ", item.ref.explanation);
      })
      .catch(() => {
        state.locked = false;
        if (btn) { btn.disabled = false; btn.textContent = "Проверить и запустить"; }
        toast("Сервер проверки недоступен");
      });
  }

  function escHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Сервер не проверил код: выключен (--no-code) или занят. Ученик не ошибся,
  // поэтому ответ не засчитываем. Раньше такой ответ шёл в тест как неверный
  // и снижал процент, который видит учитель.
  function serverDidNotCheck(data, btn, res) {
    state.locked = false;
    if (data.disabled) {
      // Проверки не будет до конца теста: убираем эту и следующие задачи на код.
      state.order = state.order.filter((it, i) => i < state.index || it.kind !== "code");
      toast("Проверка кода на сервере выключена — задачи на код убраны из теста");
      if (state.index < state.order.length) {
        renderQuestion();
      } else if (state.answers.length) {
        finish();
      } else {
        reset(false);
      }
      return;
    }
    if (btn) { btn.disabled = false; btn.textContent = "Проверить и запустить"; }
    if (res) res.textContent = (data.error || "Сервер проверки недоступен") + ". Ответ не засчитан — попробуй ещё раз.";
  }

  function checkQuizCopy() {
    if (state.locked) return;
    const item = state.order[state.index];
    const target = item.ref.code;
    const typed = (document.getElementById("quiz-copy") || {}).value || "";
    if (!typed.trim()) {
      toast("Сначала напиши код");
      return;
    }
    const exact = normalizeExact(typed) === normalizeExact(target);
    const loose = normalizeLoose(typed) === normalizeLoose(target);
    const correct = exact || loose;
    recordAnswer(item, typed, correct);

    const ta = document.getElementById("quiz-copy");
    if (ta) ta.disabled = true;
    const btn = el("options").querySelector(".btn");
    if (btn) btn.disabled = true;

    showAnswerFeedback(
      item,
      correct,
      exact ? "" : "Сравни свой код с образцом выше.",
      item.ref.explanation
    );
  }

  function next() {
    if (!state.locked) return;
    if (state.index === state.order.length - 1) {
      finish();
      return;
    }
    state.index += 1;
    renderQuestion();
  }

  function levelInfo(percent) {
    if (percent < 35) {
      return {
        key: "novice",
        title: "Новичок",
        badge: "Уровень: старт",
        color: "#dc2626",
        desc:
          "Ты только начинаешь знакомство с Python. Это отличная точка! " +
          "Начнём с основ: вывод на экран, переменные, типы данных и простые операции."
      };
    }
    if (percent < 60) {
      return {
        key: "basic",
        title: "Базовый уровень",
        badge: "Уровень: база",
        color: "#f59e0b",
        desc:
          "Основы синтаксиса уже знакомы. Стоит закрепить работу со строками, " +
          "списками и условиями, а затем перейти к циклам и функциям."
      };
    }
    if (percent < 85) {
      return {
        key: "confident",
        title: "Уверенный уровень",
        badge: "Уровень: уверенный",
        color: "#2563eb",
        desc:
          "Ты хорошо владеешь базой. Можно переходить к функциям, словарям, " +
          "обработке исключений и работе с модулями."
      };
    }
    return {
      key: "advanced",
      title: "Продвинутый уровень",
      badge: "Уровень: продвинутый",
      color: "#16a34a",
      desc:
        "Отличный результат! База уверенная. Тебе будут интересны comprehensions, " +
        "ООП, декораторы, работа с файлами и внешними библиотеками."
    };
  }

  function buildRecommendations(levelPct, topicStats, levelStats) {
    const tips = [];

    Object.keys(topicStats).forEach((topic) => {
      const t = topicStats[topic];
      if (t.total > 0 && t.correct / t.total < 0.6) {
        tips.push("Повторить тему «" + (TOPICS[topic] || topic) + "»");
      }
    });

    if (levelStats[4] && levelStats[4].correct < levelStats[4].total) {
      tips.push("Разобрать задания повышенной сложности (уровень ★★★★)");
    }
    if (levelStats[1] && levelStats[1].correct < levelStats[1].total) {
      tips.unshift("Начать с самых основ синтаксиса");
    }

    if (tips.length === 0) {
      return "Пробелов почти нет — можно двигаться к более сложным темам и практике на реальных задачах.";
    }
    return "Рекомендации: " + tips.join("; ") + ".";
  }

  function computeResult() {
    let weighted = 0;
    let maxWeighted = 0;
    const topicStats = {};
    const levelStats = {};

    state.answers.forEach((a) => {
      maxWeighted += a.level;
      if (a.correct) weighted += a.level;

      if (!topicStats[a.topic]) topicStats[a.topic] = { correct: 0, total: 0 };
      topicStats[a.topic].total += 1;
      if (a.correct) topicStats[a.topic].correct += 1;

      if (!levelStats[a.level]) levelStats[a.level] = { correct: 0, total: 0 };
      levelStats[a.level].total += 1;
      if (a.correct) levelStats[a.level].correct += 1;
    });

    const percent = maxWeighted ? Math.round((weighted / maxWeighted) * 100) : 0;
    const correctCount = state.answers.filter((a) => a.correct).length;
    const seconds = Math.round((Date.now() - state.startedAt) / 1000);

    return {
      name: state.name,
      mode: state.mode,
      date: new Date().toISOString(),
      correctCount,
      total: state.answers.length,
      percent,
      weighted,
      maxWeighted,
      seconds,
      level: levelInfo(percent),
      topicStats,
      levelStats,
      wrong: state.answers.filter((a) => !a.correct)
    };
  }

  function finish() {
    el("progress-bar").style.width = "100%";
    state.result = computeResult();
    setLastName(state.name);
    const prof = getProfile(state.name);
    // Прошлый прогон того же режима и личный рекорд ДО этого прогона —
    // чтобы итог мог сказать «стало лучше» и «новый рекорд».
    const sameMode = prof ? prof.quizRuns.filter((r) => r.mode === state.mode) : [];
    const prevRun = sameMode.length ? sameMode[sameMode.length - 1] : null;
    state.result.prevPercent = prevRun ? prevRun.percent : null;
    state.result.bestBefore = prof
      ? prof.quizRuns.reduce((m, r) => Math.max(m, r.percent || 0), 0)
      : 0;
    state.result.bestStreak = state.bestStreak;
    const rw = rewardForRun(state.result.percent, state.mode, state.bestStreak);
    state.result.reward = rw;
    let earned = [];
    if (prof) {
      prof.quizRuns.push({
        date: state.result.date,
        mode: state.mode,
        percent: state.result.percent,
        level: state.result.level.title,
        correct: state.result.correctCount,
        total: state.result.total,
        // Нужно стартовому экрану: прогресс по темам из истории.
        topicStats: state.result.topicStats,
        bestStreak: state.bestStreak
      });
      prof.wallet.gold += rw.gold;
      prof.wallet.small_potion += rw.small_potion;
      prof.wallet.big_potion += rw.big_potion;

      const today = new Date().toISOString().slice(0, 10);
      if (prof.stats.days.indexOf(today) < 0) prof.stats.days.push(today);
      prof.stats.runs += 1;
      prof.stats.correct += state.result.correctCount;
      if (state.bestStreak > (prof.stats.bestStreak || 0)) {
        prof.stats.bestStreak = state.bestStreak;
      }

      state.answers.forEach((a) => {
        const idx = prof.wrongPool.findIndex((w) => w.kind === a.kind && w.id === a.id);
        if (!a.correct) {
          const entry = {
            kind: a.kind,
            id: a.id,
            topic: a.topic,
            level: a.level,
            // Снимок задания: сгенерированные варианты получают новые id при
            // каждой загрузке, поэтому повтор ошибок по одному id невозможен.
            snapshot: snapshotOf(findItem(a))
          };
          if (idx < 0) prof.wrongPool.push(entry);
          else prof.wrongPool[idx] = entry;
        } else if (idx >= 0) {
          prof.wrongPool.splice(idx, 1);
          if (a.kind === "code") prof.stats.codeSolved += 1;
        }
      });
      if (prof.wrongPool.length > 150) {
        prof.wrongPool.splice(0, prof.wrongPool.length - 150);
      }
      earned = earnBadges(prof);
      putProfile(state.name, prof);
      syncProfile(state.name);
    }
    renderResult(state.result, rw, earned);
    show("result");
    submit(state.result);
  }

  function findRef(a) {
    if (a.kind === "fill") return FILL_TASKS.find((t) => t.id === a.id);
    if (a.kind === "error") return ERROR_TASKS.find((t) => t.id === a.id);
    if (a.kind === "copy") return COPY_TASKS.find((t) => t.id === a.id);
    if (a.kind === "code") return CODE_TASKS.find((t) => t.id === a.id);
    return QUESTIONS.find((q) => q.id === a.id);
  }

  function renderResult(r, rw, earned) {
    el("level-badge").textContent = r.level.badge;
    el("level-title").textContent = r.level.title;
    el("level-title").style.color = r.level.color;
    el("score-circle").innerHTML =
      r.percent + "%<small style='font-size:16px;color:#64748b'> правильно</small>";
    el("level-desc").textContent = r.level.desc;

    // Рост относительно прошлого прогона того же режима + рекорд + серия.
    const deltaEl = el("delta-line");
    if (deltaEl) {
      const parts = [];
      if (typeof r.prevPercent === "number") {
        const d = r.percent - r.prevPercent;
        const cls = d > 0 ? "up" : d < 0 ? "down" : "same";
        const word =
          d > 0 ? "лучше прошлого раза" : d < 0 ? "хуже прошлого раза" : "как в прошлый раз";
        parts.push(
          "<span class='" + cls + "'>" + (d > 0 ? "+" : d < 0 ? "−" : "") + Math.abs(d) +
          " %</span> " + word + " (" + r.prevPercent + " %)"
        );
      } else {
        parts.push("<span class='same'>Первый прогон в этом режиме</span>");
      }
      if (r.percent > (r.bestBefore || 0)) {
        parts.push("<span class='record'>🏆 новый личный рекорд</span>");
      } else if (r.bestBefore) {
        parts.push("личный рекорд: " + r.bestBefore + " %");
      }
      if (r.bestStreak >= 3) parts.push("серия: " + r.bestStreak + " подряд");
      deltaEl.innerHTML = parts.join(" · ");
    }

    const rewardEl = el("reward-line");
    if (rw) {
      const prof = getProfile(r.name);
      rewardEl.classList.remove("hidden");
      rewardEl.innerHTML =
        "<b>Награда в подземелье:</b> +" +
        rw.gold +
        " золота" +
        (rw.streak_bonus ? " (в том числе +" + rw.streak_bonus + " за серию)" : "") +
        (rw.small_potion ? ", малое зелье" : "") +
        (rw.big_potion ? ", большое зелье" : "") +
        (prof ? "<br>В кошельке: " + walletText(prof.wallet) : "");
    } else {
      rewardEl.classList.add("hidden");
    }

    const prof2 = getProfile(r.name);
    if (prof2) {
      let badgesEl = el("badges-line");
      if (!badgesEl) {
        badgesEl = document.createElement("div");
        badgesEl.id = "badges-line";
        badgesEl.style.marginTop = "10px";
        rewardEl.parentNode.insertBefore(badgesEl, rewardEl.nextSibling);
      }
      badgesEl.innerHTML = badgesHtml(prof2);
      if (earned && earned.length) {
        toast("Новое достижение: " + earned.map((b) => b.title).join(", "));
      }
    }

    const table = el("breakdown");
    table.innerHTML = "";
    Object.keys(r.topicStats)
      .sort()
      .forEach((topic) => {
        const t = r.topicStats[topic];
        const pct = Math.round((t.correct / t.total) * 100);
        const color =
          pct >= 70 ? "#16a34a" : pct >= 40 ? "#f59e0b" : "#dc2626";
        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" +
          (TOPICS[topic] || topic) +
          "<button type='button' class='topic-practice' data-topic='" +
          topic +
          "'>потренировать тему</button>" +
          "<div class='bar'><i style='width:" +
          pct +
          "%;background:" +
          color +
          "'></i></div></td>" +
          "<td>" +
          t.correct +
          "/" +
          t.total +
          "</td>";
        table.appendChild(tr);
      });
    // Разбивка по уровням сложности: видно, какой «этаж» банка проседает.
    const levelLine = el("level-line");
    if (levelLine) {
      const parts = [1, 2, 3, 4]
        .filter((lv) => r.levelStats && r.levelStats[lv])
        .map((lv) => {
          const s = r.levelStats[lv];
          const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
          return stars(lv) + " " + s.correct + "/" + s.total + " (" + pct + "%)";
        });
      levelLine.innerHTML = parts.length
        ? "<b>По уровням сложности:</b> " + parts.join(" · ")
        : "";
    }

    // Слабая тема в разбивке — сразу кнопка: короткий прогон по этой теме.
    table.onclick = (e) => {
      const btn = e.target.closest(".topic-practice");
      if (!btn) return;
      window.location.href =
        "/quiz?topic=" + encodeURIComponent(btn.dataset.topic) + "&len=15";
    };

    const oldPractice = el("practice-row");
    if (oldPractice) oldPractice.remove();
    const prof3 = getProfile(r.name);
    const wrongCount = prof3 && prof3.wrongPool ? prof3.wrongPool.length : 0;
    const weak = Object.keys(r.topicStats)
      .filter((t) => r.topicStats[t].correct / r.topicStats[t].total < 0.6)
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 3);
    if (weak.length || wrongCount) {
      const practice = document.createElement("div");
      practice.id = "practice-row";
      practice.className = "practice-row";
      const label = document.createElement("span");
      label.className = "setup-label";
      label.textContent = "Разминка:";
      practice.appendChild(label);
      weak.forEach((topic) => {
        const a = document.createElement("a");
        a.className = "btn ghost";
        a.style.textDecoration = "none";
        a.style.display = "inline-block";
        a.href = "/quiz?topic=" + encodeURIComponent(topic) + "&len=15";
        a.textContent = TOPICS[topic] || topic;
        practice.appendChild(a);
      });
      if (wrongCount) {
        const a = document.createElement("a");
        a.className = "btn ghost";
        a.style.textDecoration = "none";
        a.style.display = "inline-block";
        a.href = "/quiz?wrong=1";
        a.textContent = "Повторить мои ошибки (" + wrongCount + ")";
        practice.appendChild(a);
      }
      table.parentNode.insertBefore(practice, el("review"));
    }

    const oldRec = el("summary-line");
    if (oldRec) oldRec.remove();
    const rec = document.createElement("p");
    rec.id = "summary-line";
    rec.className = "lead";
    rec.style.marginTop = "14px";
    rec.textContent =
      buildRecommendations(r.percent, r.topicStats, r.levelStats) +
      " Время: " + Math.floor(r.seconds / 60) + " мин " + (r.seconds % 60) + " сек.";
    table.parentNode.insertBefore(rec, el("review"));

    const review = el("review");
    const list = el("review-list");
    list.innerHTML = "";
    if (r.wrong.length === 0) {
      review.classList.add("hidden");
    } else {
      review.classList.remove("hidden");
      r.wrong.forEach((a) => {
        // findItem ищет и в текущем прогоне: сгенерированные варианты в банке
        // уже не найти, их id меняется при каждой загрузке страницы.
        const item0 = findItem(a);
        const ref = item0 && item0.ref;
        if (!ref) return;
        const item = document.createElement("div");
        item.className = "review-item";
        const title = a.kind === "mc" ? ref.text : ref.title;
        let yours, right;
        if (a.kind === "copy" || a.kind === "code") {
          yours = "Твой код (начало): " + String(a.chosen).split("\n")[0];
          right = "Смотри пояснение по задаче ниже";
        } else {
          // Буквы и тексты берём те, что ученик видел на экране: варианты
          // перемешиваются, поэтому порядок банка здесь не подходит.
          const yourLetter = a.chosenLetter || LETTERS[a.chosen];
          const rightLetter = a.answerLetter || LETTERS[ref.answer];
          const yourText = a.chosenText || (ref.options || [])[a.chosen];
          const rightText = a.answerText || (ref.options || [])[ref.answer];
          yours = yourLetter + ") " + yourText;
          right = rightLetter + ") " + rightText;
        }
        item.innerHTML =
          "<div class='q'>" + title + "</div>" +
          "<div class='a'>Твой ответ: " + yours + "</div>" +
          "<div class='r'>Правильно: " + right + "</div>" +
          "<div class='exp'>" + ref.explanation + "</div>";
        list.appendChild(item);
      });
    }
  }

  function submit(result) {
    if (!/^https?:$/.test(window.location.protocol)) return;
    // Токен сессии подписывает результат: учитель видит, что он прислан из
    // аккаунта. Гость отправляет результат как раньше, без отметки.
    const session = typeof currentUser === "function" ? currentUser() : null;
    const body = session && session.token ? Object.assign({ token: session.token }, result) : result;
    fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
      .then((res) => {
        if (res.ok) toast("Результат сохранён у преподавателя");
      })
      .catch(() => {});
  }

  function download() {
    const r = state.result;
    const lines = [];
    lines.push("Результат теста по Python");
    lines.push("Имя: " + r.name);
    lines.push("Дата: " + new Date(r.date).toLocaleString("ru-RU"));
    lines.push("Режим: " + (r.mode === "practice" ? "Тренажёр" : "Тест"));
    lines.push(
      "Результат: " + r.percent + "% (" + r.correctCount + " из " + r.total + ")"
    );
    lines.push("Уровень: " + r.level.title);
    lines.push("Время: " + r.seconds + " сек.");
    lines.push("");
    lines.push("По темам:");
    Object.keys(r.topicStats).forEach((topic) => {
      const t = r.topicStats[topic];
      lines.push("  - " + (TOPICS[topic] || topic) + ": " + t.correct + "/" + t.total);
    });
    lines.push("");
    lines.push("Итог: " + r.level.desc);

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      "python-result-" +
      r.name.replace(/\s+/g, "_").toLowerCase() +
      ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Темы для селектора: подписи берём из TOPICS, пустой ключ — все темы.
  function fillTopics() {
    const sel = el("topic-select");
    if (!sel) return;
    sel.innerHTML = "";
    const all = document.createElement("option");
    all.value = "";
    all.textContent = "Все темы";
    sel.appendChild(all);
    Object.keys(TOPICS).forEach((key) => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = TOPICS[key];
      sel.appendChild(opt);
    });
  }

  // Короткая справка под настройками: сколько заданий и сколько это примерно.
  function updateRunHint() {
    const hint = el("run-hint");
    if (!hint) return;
    const name = (el("name").value || "").trim();
    if (state.source === "wrong") {
      const n = wrongItems(name).length;
      hint.textContent = n
        ? "Повтор ошибок: " + n + " заданий. Тема и длина не применяются."
        : "Пул ошибок пуст — сначала пройди тест или тренажёр.";
      return;
    }
    const all = bankPool();
    const filtered = state.topic ? all.filter((i) => itemTopic(i) === state.topic) : all;
    const n = state.length ? Math.min(state.length, filtered.length) : filtered.length;
    hint.textContent =
      n + " заданий из " + all.length + " · " +
      (state.topic ? TOPICS[state.topic] || state.topic : "все темы") +
      (state.length ? " · примерно " + Math.max(2, Math.round(n * 0.5)) + " мин" : " · полный банк");
  }

  // Пул ошибок берётся из профиля по имени, поэтому подпись обновляется вместе с ним.
  function refreshWrongChip() {
    const chip = el("chip-wrong");
    if (!chip) return;
    const name = (el("name").value || "").trim();
    const n = name ? wrongItems(name).length : 0;
    chip.textContent = n ? "Мои ошибки (" + n + ")" : "Мои ошибки";
    chip.disabled = n === 0;
    if (n === 0 && state.source === "wrong") {
      state.source = "bank";
      const box = el("source-chips");
      box.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      const bank = box.querySelector('[data-source="bank"]');
      if (bank) bank.classList.add("active");
      const sel = el("topic-select");
      if (sel) sel.disabled = false;
      el("length-chips").querySelectorAll(".chip").forEach((c) => { c.disabled = false; });
    }
  }

  // Параметры в адресе: ?topic=strings&len=15, ?wrong=1, ?mode=test.
  function applyParams() {
    const p = new URLSearchParams(window.location.search);
    const topic = p.get("topic");
    if (topic && TOPICS[topic]) {
      const sel = el("topic-select");
      if (sel) sel.value = topic;
      state.topic = topic;
    }
    const len = Number(p.get("len"));
    if (len) {
      const box = el("length-chips");
      const chip = box && box.querySelector('[data-length="' + len + '"]');
      if (chip) {
        box.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
      }
    }
    const mode = p.get("mode");
    if (mode === "practice" || mode === "test") {
      document.querySelectorAll(".mode").forEach((m) => {
        m.classList.toggle("active", m.dataset.mode === mode);
      });
      state.mode = mode;
    }
    if (p.get("wrong") === "1") {
      const wrong = el("chip-wrong");
      if (wrong && !wrong.disabled) {
        const box = el("source-chips");
        box.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
        wrong.classList.add("active");
        const sel = el("topic-select");
        if (sel) sel.disabled = true;
        el("length-chips").querySelectorAll(".chip").forEach((c) => { c.disabled = true; });
        state.source = "wrong";
      }
    }
  }

  let toastTimer = null;
  function toast(msg) {
    const t = el("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function updateProfileLine() {
    const line = el("profile-line");
    const name = el("name").value.trim();
    renderTopicProgress();
    updateNextBadge();
    if (!name) {
      line.classList.add("hidden");
      refreshWrongChip();
      updateRunHint();
      return;
    }
    const prof = getProfile(name);
    const total = ACHIEVEMENTS.length;
    const got = prof
      ? ACHIEVEMENTS.filter((a) => prof.badges && prof.badges[a.id]).length
      : 0;
    if (!prof || prof.quizRuns.length === 0) {
      line.classList.remove("hidden");
      line.textContent =
        "Новая учётная запись: " + name +
        ". Достижений: 0 из " + total +
        ". Кошелёк: " + walletText(prof ? prof.wallet : { gold: 0 });
      refreshWrongChip();
      updateRunHint();
      return;
    }
    const best = Math.max.apply(null, prof.quizRuns.map((r) => r.percent));
    line.classList.remove("hidden");
    line.textContent =
      name + ": прохождений " + prof.quizRuns.length +
      ", лучший результат " + best + "%" +
      ", достижений " + got + " из " + total +
      ". Кошелёк: " + walletText(prof.wallet);
    refreshWrongChip();
  }

  // Ближайшее недостигнутое достижение — чтобы на старте была видимая цель.
  function updateNextBadge() {
    const node = el("next-badge");
    if (!node) return;
    const name = el("name").value.trim();
    if (!name) {
      node.classList.add("hidden");
      node.textContent = "";
      return;
    }
    const prof = getProfile(name);
    const next = ACHIEVEMENTS.filter((a) => !(prof.badges && prof.badges[a.id]))[0];
    node.classList.remove("hidden");
    node.textContent = next
      ? "Следующая цель: «" + next.title + "» — " + next.desc
      : "Все достижения собраны: " + ACHIEVEMENTS.length + " из " + ACHIEVEMENTS.length + ".";
  }

  // Прогресс по темам из истории прогонов: последний результат по каждой теме,
  // слабые сверху. Кнопка ведёт в короткий прогон по этой теме.
  function renderTopicProgress() {
    const box = el("topic-progress");
    if (!box) return;
    const name = el("name").value.trim();
    const prof = name ? getProfile(name) : null;
    const runs = prof ? prof.quizRuns : [];
    const last = {};
    runs.forEach((run) => {
      const ts = run.topicStats || {};
      Object.keys(ts).forEach((topic) => {
        if (ts[topic] && ts[topic].total) last[topic] = ts[topic];
      });
    });
    // Темы, которые ученик тренировал только в самоподготовке, тоже видны.
    const studyTopics = (prof && prof.study && prof.study.topics) || {};
    Object.keys(studyTopics).forEach((topic) => {
      const t = studyTopics[topic];
      if (t && t.total && !last[topic]) last[topic] = { correct: t.ok || 0, total: t.total };
    });
    const topics = Object.keys(last);
    if (!topics.length) {
      box.classList.add("hidden");
      box.innerHTML = "";
      return;
    }
    const rows = topics
      .sort((a, b) => {
        return last[a].correct / last[a].total - last[b].correct / last[b].total;
      })
      .map((topic) => {
        const t = last[topic];
        const pct = Math.round((t.correct / t.total) * 100);
        const color = pct >= 70 ? "#16a34a" : pct >= 40 ? "#f59e0b" : "#dc2626";
        return (
          "<button type='button' class='tp-row' data-topic='" + topic + "'>" +
          "<span class='tp-name'>" + (TOPICS[topic] || topic) + "</span>" +
          "<span class='tp-bar'><i style='width:" + pct + "%;background:" + color + "'></i></span>" +
          "<span class='tp-pct'>" + pct + " %</span></button>"
        );
      })
      .join("");
    box.classList.remove("hidden");
    box.innerHTML =
      "<p class='tp-title'><b>Мой прогресс по темам</b> — слабые сверху, нажми, чтобы потренировать</p>" +
      rows;
    box.onclick = (e) => {
      const btn = e.target.closest(".tp-row");
      if (!btn) return;
      window.location.href =
        "/quiz?topic=" + encodeURIComponent(btn.dataset.topic) + "&len=15";
    };
  }

  function reset(clearName) {
    state.answers = [];
    state.index = 0;
    state.result = null;
    state.locked = false;
    el("name").value = clearName ? "" : state.name;
    show("start");
    updateProfileLine();
  }

  function openExit() {
    el("exit-modal").classList.remove("hidden");
    el("exit-confirm").focus();
  }

  function closeExit() {
    el("exit-modal").classList.add("hidden");
  }

  document.addEventListener("DOMContentLoaded", () => {
    fillTopics();
    applyParams();
    readSetup();
    prefillName();
    updateProfileLine();
    refreshWrongChip();
    updateRunHint();
    el("name").addEventListener("input", updateProfileLine);

    // Выбор источника заданий и длины прогона — кнопками-чипами.
    const chipBox = (boxId) => {
      const box = el(boxId);
      if (!box) return;
      box.addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (!chip || chip.disabled) return;
        box.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        if (boxId === "source-chips") {
          const wrong = chip.dataset.source === "wrong";
          const sel = el("topic-select");
          if (sel) sel.disabled = wrong;
          el("length-chips").querySelectorAll(".chip").forEach((c) => {
            c.disabled = wrong;
          });
        }
        readSetup();
        updateRunHint();
      });
    };
    chipBox("source-chips");
    chipBox("length-chips");
    const topicSel = el("topic-select");
    if (topicSel) {
      topicSel.addEventListener("change", () => {
        readSetup();
        updateRunHint();
      });
    }

    el("start-btn").addEventListener("click", start);
    el("next-btn").addEventListener("click", next);
    el("download-btn").addEventListener("click", download);
    el("restart-btn").addEventListener("click", () => reset(false));

    el("exit-btn").addEventListener("click", openExit);
    el("exit-cancel").addEventListener("click", closeExit);
    el("exit-confirm").addEventListener("click", () => {
      closeExit();
      reset(true);
      toast("Вы вышли из теста");
    });
    el("exit-modal").addEventListener("click", (e) => {
      if (e.target === el("exit-modal")) closeExit();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !el("exit-modal").classList.contains("hidden")) {
        closeExit();
        return;
      }
      if (el("screen-quiz").classList.contains("hidden")) return;
      if (!el("exit-modal").classList.contains("hidden")) return;
      const tag = (e.target && e.target.tagName) || "";
      // В поле имени, в поле кода и в «повтори код» цифры и Enter — свои.
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      // 1–4 и A–D: на русской раскладке это ф, и, с, в.
      const keys = {
        "1": 0, "2": 1, "3": 2, "4": 3,
        a: 0, b: 1, c: 2, d: 3,
        ф: 0, и: 1, с: 2, в: 3
      };
      const idx = keys[String(e.key).toLowerCase()];
      if (typeof idx === "number") {
        const opts = Array.from(el("options").querySelectorAll(".option"));
        if (opts[idx] && !opts[idx].disabled) {
          e.preventDefault();
          opts[idx].click();
        }
        return;
      }
      if (e.key === "Enter") {
        const nb = el("next-btn");
        if (nb && !nb.classList.contains("hidden")) {
          e.preventDefault();
          nb.click();
        }
      }
    });
    el("name").addEventListener("keydown", (e) => {
      if (e.key === "Enter") start();
    });

    document.getElementById("modes").addEventListener("click", (e) => {
      const mode = e.target.closest(".mode");
      if (!mode) return;
      document
        .querySelectorAll(".mode")
        .forEach((m) => m.classList.remove("active"));
      mode.classList.add("active");
      state.mode = mode.dataset.mode;
    });
  });
})();
