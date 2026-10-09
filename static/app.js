(function () {
  "use strict";

  const LETTERS = ["A", "B", "C", "D"];

  const COPY_TOPICS = {
    copy_hello: "strings", copy_hp: "syntax", copy_damage: "operators",
    copy_name: "strings", copy_if: "control", copy_for: "control",
    copy_list: "collections", copy_upper: "strings", copy_def: "functions",
    copy_sum: "operators", copy_while: "control", copy_fstring: "strings"
  };

  const copyLevel = (i) => (i < 3 ? 1 : i < 7 ? 2 : 3);

  const CODE_TOPICS = {
    attack_power: "operators", health_after_hit: "operators", is_alive: "control",
    heal: "functions", double_gold: "operators", total_hp: "collections",
    max_damage: "collections", count_monsters: "collections", greet: "strings",
    count_even: "control", average: "collections"
  };

  const kindTitle = { mc: "Вопрос", fill: "Вставь пропущенное", error: "Найди ошибку", copy: "Повтори код", code: "Напиши код" };

  const state = {
    name: "",
    mode: "practice",
    order: [],
    index: 0,
    answers: [],
    locked: false,
    startedAt: 0,
    result: null
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
    if (m.name) el("name").value = m.name;
  };

  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const buildOrder = () => {
    const pool = [];
    QUESTIONS.forEach((q) => pool.push({ kind: "mc", level: q.level, ref: q }));
    FILL_TASKS.forEach((t) => pool.push({ kind: "fill", level: t.level, ref: t }));
    ERROR_TASKS.forEach((t) => pool.push({ kind: "error", level: t.level, ref: t }));
    COPY_TASKS.forEach((t, i) => pool.push({ kind: "copy", level: copyLevel(i), ref: t }));
    CODE_TASKS.forEach((t) => pool.push({ kind: "code", level: 3, ref: t }));
    const byLevel = {};
    pool.forEach((item) => {
      (byLevel[item.level] = byLevel[item.level] || []).push(item);
    });
    const order = [];
    Object.keys(byLevel)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((lvl) => order.push(...shuffle(byLevel[lvl].slice())));
    return order;
  };

  const itemTopic = (item) => {
    if (item.kind === "copy") return COPY_TOPICS[item.ref.id] || "syntax";
    if (item.kind === "code") return CODE_TOPICS[item.ref.id] || "functions";
    return item.ref.topic;
  };

  const itemText = (item) =>
    item.kind === "mc" ? item.ref.text : item.ref.title;

  const itemCode = (item) => item.ref.code || "";

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
    state.order = buildOrder();
    state.index = 0;
    state.answers = [];
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
      ref.options.forEach((opt, i) => {
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

  function recordAnswer(item, chosen, correct) {
    state.locked = true;
    state.answers.push({
      kind: item.kind,
      id: item.kind === "mc" ? item.ref.id : item.ref.id,
      topic: itemTopic(item),
      level: item.level,
      chosen,
      correct
    });
  }

  function showAnswerFeedback(item, correct, correctText, explanation) {
    const showFeedback = state.mode === "practice";
    const fb = el("feedback");
    if (showFeedback) {
      fb.className = "feedback " + (correct ? "ok" : "no");
      fb.innerHTML =
        "<b>" + (correct ? "Верно!" : "Неверно. " + correctText) + "</b>" + explanation;
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
    const correct = chosen === ref.answer;
    recordAnswer(item, chosen, correct);

    const buttons = Array.from(el("options").children);
    buttons.forEach((b, i) => {
      b.disabled = true;
      if (i === ref.answer) b.classList.add("correct");
      if (i === chosen && !correct) b.classList.add("wrong");
    });

    showAnswerFeedback(
      item,
      correct,
      "Правильный ответ: " + LETTERS[ref.answer],
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
        const correct = data.ok && data.passed === data.total;
        if (res) {
          if (!data.ok) {
            res.innerHTML = "<div style='color:#f87171'>" + (data.error || "Ошибка") + "</div>";
          } else {
            res.innerHTML = (data.results || []).map((t, i) =>
              "<div style='color:" + (t.ok ? "#16a34a" : "#dc2626") + "'>#" + (i + 1) + " " +
              (t.ok ? "пройден" : "провален") + " · ожидалось " + t.expected + ", получено " + t.actual + "</div>"
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
    const rw = rewardForRun(state.result.percent, state.mode);
    state.result.reward = rw;
    setLastName(state.name);
    let earned = [];
    const prof = getProfile(state.name);
    if (prof) {
      prof.quizRuns.push({
        date: state.result.date,
        mode: state.mode,
        percent: state.result.percent,
        level: state.result.level.title,
        correct: state.result.correctCount,
        total: state.result.total
      });
      prof.wallet.gold += rw.gold;
      prof.wallet.small_potion += rw.small_potion;
      prof.wallet.big_potion += rw.big_potion;

      const today = new Date().toISOString().slice(0, 10);
      if (prof.stats.days.indexOf(today) < 0) prof.stats.days.push(today);
      prof.stats.runs += 1;
      prof.stats.correct += state.result.correctCount;

      state.answers.forEach((a) => {
        const idx = prof.wrongPool.findIndex((w) => w.kind === a.kind && w.id === a.id);
        if (!a.correct) {
          if (idx < 0) prof.wrongPool.push({ kind: a.kind, id: a.id });
        } else if (idx >= 0) {
          prof.wrongPool.splice(idx, 1);
          if (a.kind === "code") prof.stats.codeSolved += 1;
        }
      });
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

    const rewardEl = el("reward-line");
    if (rw) {
      const prof = getProfile(r.name);
      rewardEl.classList.remove("hidden");
      rewardEl.innerHTML =
        "<b>Награда в подземелье:</b> +" +
        rw.gold +
        " золота" +
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
        const ref = findRef(a);
        if (!ref) return;
        const item = document.createElement("div");
        item.className = "review-item";
        const title = a.kind === "mc" ? ref.text : ref.title;
        let yours, right;
        if (a.kind === "copy" || a.kind === "code") {
          yours = "Твой код (начало): " + String(a.chosen).split("\n")[0];
          right = "Смотри пояснение по задаче ниже";
        } else {
          yours = LETTERS[a.chosen] + ") " + ref.options[a.chosen];
          right = LETTERS[ref.answer] + ") " + ref.options[ref.answer];
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
    fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
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
    if (!name) {
      line.classList.add("hidden");
      return;
    }
    const prof = getProfile(name);
    if (!prof || prof.quizRuns.length === 0) {
      line.classList.remove("hidden");
      line.textContent = "Новая учётная запись: " + name + ". Кошелёк: " + walletText(prof ? prof.wallet : { gold: 0 });
      return;
    }
    const best = Math.max.apply(null, prof.quizRuns.map((r) => r.percent));
    line.classList.remove("hidden");
    line.textContent =
      name + ": прохождений " + prof.quizRuns.length +
      ", лучший результат " + best + "%. Кошелёк: " + walletText(prof.wallet);
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
    prefillName();
    updateProfileLine();
    el("name").addEventListener("input", updateProfileLine);

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
