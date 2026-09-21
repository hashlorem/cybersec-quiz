import fs from "node:fs";
import vm from "node:vm";

const dir = "/Users/uzi/Projects/cybersec-quiz/assets/js/";
const read = (name) => fs.readFileSync(dir + name + ".js", "utf8");

const syntaxTargets = ["deck-network", "deck-endpoint", "deck-tf", "data", "engine", "storage", "motion", "render", "app"];
let syntaxFailures = 0;
for (const name of syntaxTargets) {
  try {
    new vm.Script(read(name), { filename: name + ".js" });
  } catch (error) {
    syntaxFailures += 1;
    console.log("SYNTAX FAIL " + name + ".js: " + error.message);
  }
}
console.log(syntaxFailures === 0 ? "syntax: all " + syntaxTargets.length + " files parse" : "syntax: " + syntaxFailures + " failures");

const context = vm.createContext({ window: {}, console });
for (const name of ["deck-network", "deck-endpoint", "deck-tf", "data", "engine"]) {
  vm.runInContext(read(name), context, { filename: name + ".js" });
}
const QZ = context.window.QZ;

const report = QZ.selftest();
console.log("\n=== bank self-test: " + (report.ok ? "PASS" : "FAIL") + " (" + report.passed + "/" + report.total + ") ===");
for (const check of report.checks) {
  console.log((check.pass ? "  ok   " : "  FAIL ") + check.name + " -> " + check.detail);
}
console.log("\ncounts:", JSON.stringify(report.counts));

if (!report.ok) process.exit(1);

const typeMap = {};
for (const key of QZ.BANK.order) {
  const counts = QZ.countByType(QZ.BANK.decks[key].items);
  typeMap[key] = counts;
  const total = QZ.BANK.decks[key].items.length;
  const chooseChecks = QZ.BANK.decks[key].items.filter((i) => i.type === "multi" && i.choose !== i.correct.length);
  if (chooseChecks.length) {
    console.log("FAIL deck " + key + " choose mismatch: " + chooseChecks.map((i) => i.id).join(","));
    process.exit(1);
  }
  console.log("deck " + key + ": " + total + " items " + JSON.stringify(counts));
}

const session = QZ.Engine.build("both", 12345);
console.log("\nsession both: " + session.steps.length + " steps, seed " + session.seed);

const seedA = QZ.Engine.build("both", 42).steps.map((s) => s.item.id).join(",");
const seedB = QZ.Engine.build("both", 42).steps.map((s) => s.item.id).join(",");
const seedC = QZ.Engine.build("both", 43).steps.map((s) => s.item.id).join(",");
console.log("shuffle deterministic: " + (seedA === seedB));
console.log("different seed differs: " + (seedA !== seedC));

const seen = new Set(session.steps.map((s) => s.item.id));
console.log("full shuffle covers every id once: " + (seen.size === QZ.BANK.all.length));

let groupShuffleOk = true;
for (const deckKey of ["network", "endpoint"]) {
  const s = QZ.Engine.build(deckKey, 7);
  const ids = s.steps.map((x) => x.item.id);
  const onlyDeck = QZ.BANK.decks[deckKey].items.map((i) => i.id).sort().join(",");
  if (ids.slice().sort().join(",") !== onlyDeck) groupShuffleOk = false;
}
console.log("deck sessions contain exactly their own items: " + groupShuffleOk);

let gradingOk = true;
const checks = [];
for (const step of session.steps) {
  const item = step.item;
  let response;
  if (item.type === "mc") response = { choice: item.correct[0] };
  if (item.type === "multi") response = { choices: item.correct.slice() };
  if (item.type === "tf") response = { value: item.answer };
  if (item.type === "match") {
    const links = {};
    item.pairs.forEach((_, index) => { links[index] = "p" + index; });
    response = { links };
  }
  const result = QZ.Engine.grade(step, response);
  if (!result.correct) {
    gradingOk = false;
    checks.push("FAIL keyed answer graded wrong: " + item.id + " (" + item.type + ")");
  }
  if (item.type === "mc" || item.type === "multi") {
    const wrong = QZ.Engine.grade(step, { choice: -1, choices: [] });
    if (wrong.correct) {
      gradingOk = false;
      checks.push("FAIL empty answer graded correct: " + item.id);
    }
  }
}
console.log("every keyed answer grades correct: " + gradingOk);
checks.forEach((line) => console.log("  " + line));

const mcStep = session.steps.find((s) => s.item.type === "mc");
const order = mcStep.options.join(",");
const sortedOptions = mcStep.options.slice().sort((a, b) => a - b).join(",");
console.log("option order is a permutation: " + (order.split(",").length === mcStep.item.options.length && mcStep.options.length === new Set(mcStep.options).size));

const matchStep = session.steps.find((s) => s.item.type === "match");
const poolIds = matchStep.pool.map((p) => p.id).sort().join(",");
const expectedIds = matchStep.item.pairs.map((_, i) => "p" + i).concat((matchStep.item.distractors || []).map((_, i) => "x" + i)).sort().join(",");
console.log("matching pool holds every pair plus distractors: " + (poolIds === expectedIds));

function keyedResponse(item) {
  if (item.type === "mc") return { choice: item.correct[0] };
  if (item.type === "multi") return { choices: item.correct.slice() };
  if (item.type === "tf") return { value: item.answer };
  const links = {};
  item.pairs.forEach((_, index) => { links[index] = "p" + index; });
  return { links };
}

for (const type of ["mc", "multi", "tf", "match"]) {
  const s = QZ.Engine.build("both", 999);
  const index = s.steps.findIndex((step) => step.item.type === type);
  s.index = index;
  const item = s.steps[index].item;
  QZ.Engine.apply(s, keyedResponse(item));
  const scoreOk = s.score === 1 && s.answered === 1 && s.steps[index].correct === true;
  console.log("apply() scores a correct " + type + " answer: " + scoreOk + (scoreOk ? "" : " (score " + s.score + ", answered " + s.answered + ", type " + item.type + ")"));
  if (!scoreOk) process.exit(1);

  const replay = QZ.Engine.restore(QZ.Engine.snapshot(s));
  const replayOk = replay.score === 1 && replay.answered === 1 && replay.steps[index].correct === true;
  console.log("snapshot/restore keeps the " + type + " result: " + replayOk);
  if (!replayOk) process.exit(1);
}

const partial = QZ.Engine.build("both", 5);
const multiIndex = partial.steps.findIndex((step) => step.item.type === "multi");
partial.index = multiIndex;
const multiItem = partial.steps[multiIndex].item;
QZ.Engine.apply(partial, { choices: multiItem.correct.slice(0, multiItem.choose - 1) });
const partialOk = partial.score === 0 && partial.answered === 1;
const fullAnswers = partial.steps.filter((step) => step.item.type === "multi").map((step) => step.item.correct.slice(0, step.item.choose - 1));
console.log("multi-select needs the exact set (partial picks score zero): " + partialOk);
if (!partialOk) process.exit(1);

console.log("\nALL CHECKS PASS");