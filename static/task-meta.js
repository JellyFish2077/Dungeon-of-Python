// Сведения о заданиях, которых нет в самих записях банка: тема и уровень
// сложности для «повтори код» (copy) и «напиши код» (code). В банке у этих
// заданий нет полей topic и level, поэтому их звёзды всегда были ★★☆☆, а
// тема — неизвестна. Таблицы читают и проверка (app.js), и практикум
// (study.html), поэтому звёзды и темы на обеих страницах совпадают.
(function () {
  "use strict";

  const COPY_TOPICS = {
    copy_hello: "strings", copy_hp: "syntax", copy_damage: "operators",
    copy_name: "strings", copy_if: "control", copy_for: "control",
    copy_list: "collections", copy_upper: "strings", copy_def: "functions",
    copy_sum: "operators", copy_while: "control", copy_fstring: "strings"
  };

  const CODE_TOPICS = {
    attack_power: "operators", health_after_hit: "operators", is_alive: "control",
    heal: "functions", double_gold: "operators", total_hp: "collections",
    max_damage: "collections", count_monsters: "collections", greet: "strings",
    count_even: "control", average: "collections"
  };

  // Уровень «повтори код» растёт вместе с образцом (первые три — простые,
  // дальше средние, с седьмого — сложные). «Напиши код» — самый сложный вид.
  const copyLevel = (i) => (i < 3 ? 1 : i < 7 ? 2 : 3);
  const codeLevel = () => 3;

  const taskTopic = (kind, id) => {
    if (kind === "copy") return COPY_TOPICS[id] || "syntax";
    if (kind === "code") return CODE_TOPICS[id] || "functions";
    return "";
  };

  const taskLevel = (kind, index) => {
    if (kind === "copy") return copyLevel(index);
    if (kind === "code") return codeLevel();
    return 0;
  };

  window.TASK_META = {
    COPY_TOPICS: COPY_TOPICS,
    CODE_TOPICS: CODE_TOPICS,
    copyLevel: copyLevel,
    taskTopic: taskTopic,
    taskLevel: taskLevel
  };
})();
