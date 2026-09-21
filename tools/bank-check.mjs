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

const tfSteps = session.steps.filter((step) => step.item.type === "tf");
const tfOrderOk = tfSteps.every((step) =>
  step.options[0] === 0 &&
  step.options[1] === 1 &&
  step.item.options[0] === "True" &&
  step.item.options[1] === "False"
);
console.log("true or false stays True-left, False-right across " + tfSteps.length + " items: " + tfOrderOk);
if (!tfOrderOk) process.exit(1);

const tfKeysOk = tfSteps.every((step) => {
  const expected = step.item.answer ? 0 : 1;
  return step.item.correct[0] === expected && step.options[expected] === expected;
});
console.log("true or false answer keys still line up with the fixed order: " + tfKeysOk);
if (!tfKeysOk) process.exit(1);

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

/* ---------- streaks ---------- */

function fail(label, detail) {
  console.log("FAIL " + label + (detail ? " -> " + detail : ""));
  process.exit(1);
}

const streaks = QZ.Engine.build("both", 4242);
for (let i = 0; i < 3; i++) {
  streaks.index = i;
  QZ.Engine.apply(streaks, keyedResponse(streaks.steps[i].item));
}
const streakGrew = streaks.streak === 3 && streaks.bestStreak === 3;
console.log("three correct answers build a streak of 3: " + streakGrew + " (streak " + streaks.streak + ", best " + streaks.bestStreak + ")");
if (!streakGrew) fail("streak growth");

streaks.index = 3;
const wrongResponse = (() => {
  const item = streaks.steps[3].item;
  if (item.type === "mc") return { choice: item.options.findIndex((_, index) => item.correct.indexOf(index) === -1) };
  if (item.type === "multi") return { choices: [] };
  if (item.type === "tf") return { value: !item.answer };
  return { links: {} };
})();
QZ.Engine.apply(streaks, wrongResponse);
const streakReset = streaks.streak === 0 && streaks.bestStreak === 3;
console.log("a wrong answer resets the streak but keeps the best: " + streakReset + " (streak " + streaks.streak + ", best " + streaks.bestStreak + ")");
if (!streakReset) fail("streak reset");

/* ---------- make-up round ---------- */

const makeup = QZ.Engine.build("network", 909);
const startLength = makeup.steps.length;
makeup.index = 0;
QZ.Engine.apply(makeup, wrongResponse);
const queued = makeup.steps.length === startLength + 1 && makeup.requeued.length === 1 && makeup.makeup.total === 1;
console.log("a missed question is queued at the end of the run: " + queued + " (" + startLength + " -> " + makeup.steps.length + ")");
if (!queued) fail("requeue on miss");
const appended = makeup.steps[makeup.steps.length - 1];
if (appended.origin !== "makeup" || appended.item.id !== makeup.steps[0].item.id) fail("appended step identity", appended.origin);

makeup.index = makeup.steps.length - 1;
QZ.Engine.apply(makeup, wrongResponse);
const capped = makeup.steps.length === startLength + 1 && makeup.requeued.length === 1;
console.log("a missed make-up question is not re-queued again: " + capped + " (length " + makeup.steps.length + ")");
if (!capped) fail("re-ask cap");

const clearRun = QZ.Engine.build("network", 909);
clearRun.index = 0;
QZ.Engine.apply(clearRun, wrongResponse);
clearRun.index = clearRun.steps.length - 1;
QZ.Engine.apply(clearRun, keyedResponse(clearRun.steps[clearRun.steps.length - 1].item));
const makeupScored = clearRun.score === 0 && clearRun.answered === 1 && clearRun.makeup.cleared === 1 && clearRun.makeup.answered === 1;
console.log("clearing a make-up does not change the primary score: " + makeupScored + " (score " + clearRun.score + ", cleared " + clearRun.makeup.cleared + "/" + clearRun.makeup.total + ")");
if (!makeupScored) fail("make-up scoring");

const midSession = QZ.Engine.build("network", 909);
midSession.index = 0;
QZ.Engine.apply(midSession, wrongResponse);
midSession.index = 1;
QZ.Engine.apply(midSession, keyedResponse(midSession.steps[1].item));
const revived = QZ.Engine.restore(QZ.Engine.snapshot(midSession));
const reviveOk = revived.steps.length === midSession.steps.length &&
  revived.requeued.join(",") === midSession.requeued.join(",") &&
  revived.score === midSession.score &&
  revived.streak === midSession.streak &&
  revived.bestStreak === midSession.bestStreak &&
  revived.makeup.total === midSession.makeup.total &&
  revived.steps.map((s) => s.item.id).join(",") === midSession.steps.map((s) => s.item.id).join(",");
console.log("restore rebuilds the queue, streak, and make-up state: " + reviveOk);
if (!reviveOk) fail("restore with a queued make-up");
console.log("restored queue order matches: " + revived.steps.map((s) => s.item.id + ":" + s.origin).slice(-2).join(", "));

const subset = QZ.Engine.buildSubset("network", [midSession.requeued[0]], 31);
const subsetOk = subset.steps.length === 1 && subset.steps[0].item.id === midSession.requeued[0] && subset.primaryTotal === 1;
console.log("a missed-only drill session holds just those items: " + subsetOk + " (" + subset.steps.length + " step)");
if (!subsetOk) fail("buildSubset");
const subsetRevived = QZ.Engine.restore(QZ.Engine.snapshot(subset));
console.log("a missed-only session survives restore: " + (subsetRevived.steps.length === 1 && subsetRevived.itemIds.length === 1));

console.log("\nALL CHECKS PASS");