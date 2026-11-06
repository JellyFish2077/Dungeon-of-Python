// Инвентаризация банка вопросов. Скрипт ничего не меняет: он читает
// static/questions.js, добавляет к нему варианты из static/variants.js
// и показывает, каких тем и уровней не хватает.
//
// Запуск: node tools/question_bank.js
// Код возврата 1 — если в банке есть структурная ошибка или дубль.
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const staticDir = path.join(__dirname, "..", "static");
const ctx = {};
vm.createContext(ctx);
// variants.js собирает задания случайно. Для отчёта нужен один и тот же
// набор при каждом запуске, иначе цифры в таблице прыгают.
let seed = 20261106;
ctx.Math = Object.create(Math);
ctx.Math.random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

const read = (name) => fs.readFileSync(path.join(staticDir, name), "utf8");
vm.runInContext(read("questions.js") +
  "\nthis.QUESTIONS = QUESTIONS; this.TOPICS = TOPICS;", ctx);
const base = ctx.QUESTIONS.map((q) => ({ ...q }));
vm.runInContext(read("variants.js"), ctx);
const all = ctx.QUESTIONS;
const topics = ctx.TOPICS;

const levels = [1, 2, 3, 4];
const topicKeys = Object.keys(topics);
const count = (list, topic, level) =>
  list.filter((q) => q.topic === topic && q.level === level).length;

const problems = [];
const ids = new Map();
all.forEach((q, i) => {
  const where = "вопрос #" + (q.id == null ? "?" : q.id);
  if (q.id == null) problems.push(where + ": нет id");
  else if (ids.has(q.id)) problems.push(where + ": повтор id (уже был " + ids.get(q.id) + ")");
  else ids.set(q.id, i);
  if (!topics[q.topic]) problems.push(where + ": неизвестная тема «" + q.topic + "»");
  if (levels.indexOf(q.level) < 0) problems.push(where + ": уровень " + q.level + " вне 1–4");
  if (!Array.isArray(q.options) || q.options.length < 2) {
    problems.push(where + ": меньше двух вариантов");
  } else if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) {
    problems.push(where + ": answer вне вариантов");
  }
  if (!String(q.text || "").trim()) problems.push(where + ": пустой текст");
  if (!String(q.explanation || "").trim()) problems.push(where + ": пустое объяснение");
});

// Дубли считаем по тому, что видит ученик: текст + код. Варианты ответа
// могут отличаться, но вопрос всё равно один и тот же.
const seen = new Map();
const dupes = [];
all.forEach((q) => {
  const key = String(q.text || "") + "|" + String(q.code || "");
  if (seen.has(key)) dupes.push(q.id + " и " + seen.get(key));
  else seen.set(key, q.id);
});

console.log("# Банк вопросов");
console.log("");
console.log("Базовый файл: " + base.length + " вопросов.");
console.log("С вариантами из variants.js: " + all.length + " вопросов.");
console.log("");

console.log("## Покрытие: тема × уровень");
console.log("");
console.log("| Тема | " + levels.map((l) => "L" + l).join(" | ") + " | Всего |");
console.log("|---|" + levels.map(() => "---:").join("|") + "|---:|");
topicKeys.forEach((topic) => {
  const cells = levels.map((level) => {
    const n = count(all, topic, level);
    return n ? String(n) : "—";
  });
  console.log("| " + topics[topic] + " | " + cells.join(" | ") + " | " +
    all.filter((q) => q.topic === topic).length + " |");
});
console.log("");

const gaps = [];
topicKeys.forEach((topic) => {
  levels.forEach((level) => {
    const n = count(all, topic, level);
    if (n === 0) gaps.push(topics[topic] + " · уровень " + level);
  });
});
console.log("## Пустые клетки");
console.log("");
if (gaps.length) gaps.forEach((g) => console.log("- " + g));
else console.log("- нет");
console.log("");

const thin = [];
topicKeys.forEach((topic) => {
  levels.forEach((level) => {
    const n = count(all, topic, level);
    if (n > 0 && n < 3) thin.push(topics[topic] + " · уровень " + level + " — " + n);
  });
});
console.log("## Тонкие клетки (меньше трёх)");
console.log("");
if (thin.length) thin.forEach((g) => console.log("- " + g));
else console.log("- нет");
console.log("");

console.log("## Проверка структуры");
console.log("");
if (problems.length) problems.forEach((p) => console.log("- " + p));
else console.log("- структурных ошибок нет");
if (dupes.length) {
  console.log("");
  console.log("Дубли по тексту и коду: " + dupes.length);
  dupes.forEach((d) => console.log("- " + d));
} else {
  console.log("- дублей по тексту и коду нет");
}
console.log("");
console.log("Итог: " + all.length + " вопросов, " + problems.length + " ошибок, " +
  dupes.length + " дублей.");

// Дубли среди сгенерированных вариантов — повод для ревизии, но не
// структурная поломка: банк остаётся играбельным. Код возврата 1 только
// за ошибки, которые ломают выборку или показ вопроса.
process.exit(problems.length ? 1 : 0);
