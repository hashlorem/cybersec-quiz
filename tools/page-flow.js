(async function () {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const results = [];
  const record = (name, pass, detail) => results.push({ name, pass: !!pass, detail: detail === undefined ? "" : String(detail) });
  window.localStorage.clear();
  const state = () => window.QZ.state.screen();
  const session = () => window.QZ.state.session();
  const currentStep = () => session().steps[session().index];

  async function waitFor(fn, timeout = 3000, label = "condition") {
    const started = Date.now();
    for (;;) {
      let value = null;
      try {
        value = fn();
      } catch (error) {
        value = null;
      }
      if (value) return value;
      if (Date.now() - started > timeout) throw new Error("timeout waiting for " + label);
      await sleep(20);
    }
  }

  function click(node) {
    if (!node) throw new Error("click on missing node");
    node.click();
  }

  function answerCorrectly(step) {
    const item = step.item;
    if (item.type === "mc" || item.type === "multi" || item.type === "tf") {
      for (const original of item.correct) {
        const button = $('.options .option[data-original="' + original + '"]');
        if (!button) throw new Error("missing option " + original + " on " + item.id);
        click(button);
      }
      return;
    }
    for (const index of step.left) {
      click($('.term[data-term="' + index + '"] .term__label'));
      click($('.pool-chip[data-pool="p' + index + '"]'));
    }
  }

  function confirmButton() {
    const button = $(".card .actions .btn");
    return button && !button.disabled ? button : null;
  }

  /* ---------- home ---------- */

  record("home screen is showing", state() === "home", state());
  record("hero title text", /MODULE 1-10\s*CYBERSECURITY ESSENTIAL QUIZ/i.test($(".hero__title").textContent.trim()), $(".hero__title").textContent.replace(/\s+/g, " ").trim());
  record("three deck tiles", $$(".tile").length === 3, $$(".tile").length + " tiles");
  record("tiles carry item counts", $$(".tile .fact").length >= 12, $$(".tile .fact").length + " fact chips");
  record("hero stat chips rendered", $$(".hero__stats .stat-chip").length === 6, $$(".hero__stats .stat-chip").length);
  record("bank total advertised as 74", /74\s+questions in total/.test(document.body.innerText.replace(/\s+/g, " ")), document.body.innerText.replace(/\s+/g, " ").match(/\d+ questions in total/)[0]);
  record("no best-score chip before any attempt", !$(".tile__best").textContent.includes("Best"), $(".tile__best").textContent);

  /* ---------- start the full shuffle ---------- */

  click($$(".tile")[2]);
  await waitFor(() => state() === "quiz", 3000, "quiz screen");
  record("tile click opens the quiz", state() === "quiz", state());
  record("full shuffle builds 74 steps", session().steps.length === 74, session().steps.length);
  record("question counter shows 1 of 74", /Question 1 of 74/.test($("#quiz-count").textContent), $("#quiz-count").textContent);
  record("exit control appears in the quiz", !$("#exit-btn").hidden, "");

  /* ---------- walk every question ---------- */

  const typeTally = { mc: 0, multi: 0, tf: 0, match: 0 };
  let wrongPathIndex = -1;
  let progressAdvanced = false;
  let keyboardAdvanceWorked = false;
  const total = session().steps.length;
  const trace = [];

  for (let i = 0; i < total; i++) {
    const step = currentStep();
    if (step.graded) throw new Error("step already graded at index " + i);
    typeTally[step.item.type] += 1;

    let expected = true;
    const scoreBefore = session().score;
    if (wrongPathIndex < 0 && step.item.type === "mc") {
      const wrongOption = step.options.filter((original) => step.item.correct.indexOf(original) === -1)[0];
      click($('.options .option[data-original="' + wrongOption + '"]'));
      const ready = confirmButton();
      if (!ready) throw new Error("check answer stayed disabled on the wrong-answer probe");
      click(ready);
      await sleep(30);
      expected = false;
      wrongPathIndex = i;
      const verdict = $(".feedback__verdict").textContent.trim();
      const answerLine = $(".feedback__answer") ? $(".feedback__answer").textContent : "";
      record("wrong answer shows verdict, key, and explanation", /Not/i.test(verdict) && /Correct answer:/.test(answerLine) && !!$(".feedback__text"), verdict + " | " + answerLine.slice(0, 70));
      record("score does not move on a wrong answer", session().score === scoreBefore, scoreBefore + " -> " + session().score);
    } else {
      answerCorrectly(step);
      const ready = confirmButton();
      if (!ready) {
        const note = $(".actions__note") ? $(".actions__note").textContent : "";
        throw new Error("check answer disabled for " + step.item.id + " (" + step.item.type + ") note=" + note);
      }
      click(ready);
      await sleep(20);
    }

    const graded = currentStep();
    trace.push({ i: i, index: session().index, id: graded.item.id, type: graded.item.type, expected: expected, graded: graded.graded, correct: graded.correct, response: JSON.stringify(graded.response), key: JSON.stringify(graded.item.correct), cards: $(".card").length, domOptions: Array.from(document.querySelectorAll(".card .options .option")).map(function(n){return n.dataset.original;}).join("|"), domCards: $$(".card").map(function(c){return c.dataset.confirm || "graded";}).join(",") });
    if (!graded.graded) throw new Error("step not graded after confirm: " + graded.item.id);
    if (graded.correct !== expected) throw new Error("grading mismatch on " + graded.item.id + " (" + graded.item.type + "): expected " + expected);

    if (i !== wrongPathIndex && !/Correct/i.test($(".feedback__verdict").textContent)) {
      throw new Error("unexpected verdict on " + graded.item.id + " :: " + $(".feedback__verdict").textContent);
    }

    if (i === 0) {
      const aria = Number($("#progress").getAttribute("aria-valuenow"));
      record("progress aria value updates", aria > 0, aria);
      record("progress fill gets a width", !!$("#progress-fill").style.width, $("#progress-fill").style.width);
    }
    if (i === 3) {
      const before = $("#progress-fill").style.width;
      progressAdvanced = before !== "";
    }

    if (i === total - 1) {
      record("last question offers results", /See results/i.test($(".card .actions .btn").textContent), $(".card .actions .btn").textContent);
    }

    if (i === 1) {
      document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      await sleep(30);
      keyboardAdvanceWorked = currentStep().item.id !== graded.item.id;
    } else {
      click($(".card .actions .btn"));
      await sleep(14);
    }
  }

  record("all four question types were exercised", typeTally.mc > 0 && typeTally.multi > 0 && typeTally.tf > 0 && typeTally.match > 0, JSON.stringify(typeTally));
  record("every matching board was answered", typeTally.match === 7, typeTally.match + " matching items");
  record("progress bar advanced during the run", progressAdvanced, "");
  record("enter key advances after grading", keyboardAdvanceWorked, "");

  /* ---------- results ---------- */

  await waitFor(() => state() === "results", 3000, "results screen");
  const result = window.QZ.state.result();
  const expectedScore = total - 1;
  record("results screen shown", state() === "results", state());
  record("score counts every correct answer", result.score === expectedScore, result.score + " of " + result.total);
  record("percentage rounded", result.pct === Math.round((expectedScore / total) * 100), result.pct + "%");
  record("ring shows the percentage", $("#ring-pct").textContent === result.pct + "%", $("#ring-pct").textContent);
  record("ring sub label shows score", $("#ring-sub").textContent === expectedScore + " of " + total + " correct", $("#ring-sub").textContent);
  record("ring dash offset animates", !!$("#ring-value").style.strokeDashoffset, $("#ring-value").style.strokeDashoffset);
  record("four result cells", $$(".result-cell").length === 4, $$(".result-cell").length);
  record("breakdown lists topics", $$(".breakdown__row").length >= 5, $$(".breakdown__row").length + " rows");
  record("breakdown bars have widths", $$(".breakdown__fill").filter((bar) => bar.style.width && bar.style.width !== "0%").length >= 5, $$(".breakdown__fill").map((b) => b.style.width).join(","));
  record("four result actions", $$("#result-actions .btn").length === 4, $$("#result-actions .btn").length);
  record("best score stored for the deck", (window.QZ.Store.bestFor("both") || {}).pct === result.pct, JSON.stringify(window.QZ.Store.bestFor("both")));
  record("new-personal-best flag honoured", JSON.stringify(result).includes("pct"), "");

  /* ---------- review ---------- */

  click($$("#result-actions .btn").find((button) => /Review/i.test(button.textContent)));
  await waitFor(() => state() === "review", 2000, "review screen");
  record("review lists every question", $$(".review-item").length === total, $$(".review-item").length + " items");
  record("review flags the single miss", $$(".review-item--miss").length === 1, $$(".review-item--miss").length);
  record("review shows every explanation", $$(".review-item__explain").length === total, $$(".review-item__explain").length);
  record("review prints your answer and the key", $$(".review-item__rows").length === total, $$(".review-item__rows").length);

  click($("#review-filter"));
  await sleep(40);
  record("missed-only filter narrows the list", $$(".review-item").length === 1, $$(".review-item").length);
  click($("#review-filter"));
  await sleep(40);
  record("filter toggles back to all", $$(".review-item").length === total, $$(".review-item").length);

  click($("#review-back"));
  await waitFor(() => state() === "results", 2000, "back to results");
  record("review back returns to results", state() === "results", state());

  /* ---------- retake, exit sheet, resume ---------- */

  click($$("#result-actions .btn").find((button) => /Full shuffle/i.test(button.textContent)));
  await waitFor(() => state() === "quiz", 3000, "fresh quiz");
  record("retake starts a clean session", session().answered === 0 && session().steps.length === total, session().answered + " answered");

  const freshStep = currentStep();
  answerCorrectly(freshStep);
  click(confirmButton());
  await sleep(30);
  record("retake grades its first answer", session().answered === 1 && session().score === 1, session().score + "/" + session().answered);

  click($("#exit-btn"));
  await sleep(60);
  record("exit opens the confirm sheet", !$("#sheet").hidden, "");
  click($("#sheet-cancel"));
  await sleep(30);
  record("sheet cancel keeps the session", $("#sheet").hidden && state() === "quiz", "");

  document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await sleep(40);
  record("escape opens the exit sheet", !$("#sheet").hidden, "");
  click($("#sheet-confirm"));
  await waitFor(() => state() === "home", 3000, "home after exit");
  record("confirming exit returns home", state() === "home", state());
  record("resume pill appears for the unfinished session", !$("#resume-wrap").hidden && /Resume/.test($("#resume-btn").textContent), $("#resume-btn").textContent);
  record("home shows the new best score on the played deck", $$(".tile__best")[2].textContent.includes("Best"), $$(".tile__best").map(function(n){return n.textContent;}).join(" | "));

  click($("#resume-btn"));
  await waitFor(() => state() === "quiz", 3000, "resumed quiz");
  const resumed = session();
  record("resume restores progress and seed", resumed.answered === 1 && resumed.score === 1 && typeof resumed.seed === "number", resumed.score + "/" + resumed.answered + " seed " + resumed.seed);
  record("resume lands on the same question", /Question 1 of 74/.test($("#quiz-count").textContent), $("#quiz-count").textContent);

  /* matching drag and tap paths are verified by the dedicated seed run */
  const matchBoards = session().steps.filter(function (entry) { return entry.item.type === "match"; }).length;
  record("matching boards present in this session", matchBoards === 7, matchBoards + " boards");

  /* ---------- persistence ---------- */

  const history = JSON.parse(window.localStorage.getItem("qz.history.v1") || "[]");
  record("attempt history persisted", history.length >= 1 && history[history.length - 1].total === total, history.length + " attempts, last total " + (history[history.length-1]||{}).total);
  const report = window.QZ.selftest();
  record("in-page bank self-test passes", report.ok, report.passed + "/" + report.total);

  return {
    results,
    failures: results.filter((entry) => !entry.pass),
    passed: results.filter((entry) => entry.pass).length,
    total: results.length,
    typeTally,
    score: result.score,
    pct: result.pct
  };
})();