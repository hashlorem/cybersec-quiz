(async function () {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const results = [];
  const record = (name, pass, detail) => results.push({ name, pass: !!pass, detail: detail === undefined ? "" : String(detail) });
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

  /// Answers the current question correctly and waits until the app has
  /// actually graded it, so a missed click fails loudly instead of silently
  /// skewing the checks that follow.
  async function answerAndConfirm(label) {
    const before = currentStep().item.id;
    answerCorrectly(currentStep());
    const ready = confirmButton();
    if (!ready) {
      const note = $(".actions__note") ? $(".actions__note").textContent : "";
      throw new Error("could not answer " + before + " (" + currentStep().item.type + ") for " + label + "; note: " + note);
    }
    click(ready);
    await sleep(30);
    const graded = session().steps.filter((step) => step.item.id === before && step.graded)[0];
    if (!graded) throw new Error("confirm did not grade " + before + " while " + label);
    return graded;
  }

  async function answerAndAdvance(label) {
    const graded = await answerAndConfirm(label);
    click($(".card .actions .btn"));
    await sleep(20);
    return graded;
  }

  window.localStorage.clear();

  /* ---------- home ---------- */

  record("home screen is showing", state() === "home", state());
  record("top header bar is gone", $$(".topbar, .brand, #topbar-status").length === 0, $$(".topbar, .brand, #topbar-status").length);
  record("hero title text", /MODULE 1-10\s*CYBERSECURITY ESSENTIAL QUIZ/i.test($(".hero__title").textContent.trim()), $(".hero__title").textContent.replace(/\s+/g, " ").trim());
  record("three deck tiles", $$(".tile").length === 3, $$(".tile").length + " tiles");
  record("hero stat chips rendered", $$(".hero__stats .stat-chip").length === 6, $$(".hero__stats .stat-chip").length);
  record("bank total advertised as 74", /74\s+questions in total/.test(document.body.innerText.replace(/\s+/g, " ")), "");
  record("no best-score chip before any attempt", !$(".tile__best").textContent.includes("Best"), $(".tile__best").textContent);

  /* ---------- start the full shuffle ---------- */

  click($$(".tile")[2]);
  await waitFor(() => state() === "quiz", 3000, "quiz screen");
  record("tile click opens the quiz", state() === "quiz", state());
  record("full shuffle builds 74 steps", session().steps.length === 74, session().steps.length);
  record("question counter shows 1 of 74", /Question 1 of 74/.test($("#quiz-count").textContent), $("#quiz-count").textContent);
  record("exit control lives in the quiz bar", $("#exit-btn").closest(".quizbar") !== null, "");
  const barBg = getComputedStyle($(".quizbar")).backgroundColor;
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  record("quiz bar blends into the canvas (no stray block)", barBg === bodyBg, barBg + " vs body " + bodyBg);
  record("the glow layer is scoped to the home screen", !$("#screen-quiz .aurora") && !!$("#screen-home .aurora"), "quiz=" + !!$("#screen-quiz .aurora") + " home=" + !!$("#screen-home .aurora"));
  record("sticky bar spans the content column only", $("#exit-btn").getBoundingClientRect().right <= $(".card").getBoundingClientRect().right + 1, "");
  record("streak chip hidden before any answer", $("#quiz-streak").hidden, $("#quiz-streak").hidden);
  record("progress starts empty", !$("#progress-fill").style.width || $("#progress-fill").style.width === "0%", $("#progress-fill").style.width);

  /* ---------- walk the whole run, including the make-up round ---------- */

  const typeTally = { mc: 0, multi: 0, tf: 0, match: 0 };
  let expectedStreak = 0;
  let bestStreak = 0;
  let wrongPathDone = false;
  let queueGrew = false;
  let makeupBadgeSeen = false;
  let streakShown = false;
  let streakHotSeen = false;
  let keyboardAdvanceWorked = false;
  let iterations = 0;
  let selectionChecksDone = false;
  let multiChecksDone = false;

  const tfOrders = [];
  while (state() === "quiz" && iterations < 220) {
    iterations += 1;
    const step = currentStep();
    if (step.graded) throw new Error("step already graded: " + step.item.id);
    typeTally[step.item.type] += 1;

    if (step.item.type === "tf" && tfOrders.length < 2) {
      const labels = $$(".card .options .option .option__label").map((node) => node.textContent.trim());
      const boxes = $$(".card .options .option").map((node) => node.getBoundingClientRect());
      tfOrders.push({
        id: step.item.id,
        labels: labels,
        leftFirst: boxes[0].left < boxes[1].left,
        sideBySide: Math.abs(boxes[0].top - boxes[1].top) < 4,
        answer: step.item.answer
      });
      if (tfOrders.length === 2) {
        record("true or false shows True left and False right", tfOrders.every((order) => order.labels[0] === "True" && order.labels[1] === "False"), JSON.stringify(tfOrders.map((order) => order.labels.join("/"))));
        record("the order holds whichever answer is correct", tfOrders[0].answer !== tfOrders[1].answer, tfOrders.map((order) => order.id + " answer=" + order.answer).join(", "));
        record("True sits to the left of False on a wide screen", tfOrders.every((order) => order.sideBySide && order.leftFirst), JSON.stringify(tfOrders.map((order) => order.leftFirst + "/" + order.sideBySide)));
      }
    }

    if (!selectionChecksDone && step.origin === "primary" && step.item.type === "mc") {
      const options = $$(".card .options .option");
      const first = options[0];
      const second = options[1];
      first.click();
      await sleep(25);
      const pickedFirst = window.QZ.state.draft().choice === Number(first.dataset.original);
      const readyAfterPick = !$(".card .actions .btn").disabled;
      second.click();
      await sleep(25);
      const pickedSecond = window.QZ.state.draft().choice === Number(second.dataset.original);
      const movedOffFirst = !first.classList.contains("option--selected") && second.classList.contains("option--selected");
      second.click();
      await sleep(25);
      const cleared = window.QZ.state.draft().choice === null && !$$(".card .options .option--selected").length;
      const disabledAfterClear = $(".card .actions .btn").disabled;
      const noneDisabled = $$(".card .options .option").every((option) => !option.disabled);
      record("picking an answer selects it", pickedFirst && readyAfterPick, "");
      record("an answer can be changed before checking", pickedSecond && movedOffFirst, "");
      record("an answer can be cleared by picking it again", cleared && disabledAfterClear, "");
      record("single choice never locks out the other answers", noneDisabled, "");
      selectionChecksDone = true;
    }

    if (!multiChecksDone && step.origin === "primary" && step.item.type === "multi") {
      for (const original of step.item.correct) {
        click($('.options .option[data-original="' + original + '"]'));
        await sleep(15);
      }
      const lockedOut = $$(".card .options .option").filter((option) => option.disabled).length;
      const readyAtCount = !$(".card .actions .btn").disabled;
      record("multi-select locks the rest once the count is met", lockedOut > 0 && readyAtCount, lockedOut + " locked with the full count");
      const dropOne = step.item.correct[0];
      click($('.options .option[data-original="' + dropOne + '"]'));
      await sleep(20);
      const freed = $$(".card .options .option").filter((option) => option.disabled).length === 0;
      const shortAgain = $(".card .actions .btn").disabled;
      record("deselecting frees the other options again", freed && shortAgain, freed ? "all enabled again" : "still locked");
      click($('.options .option[data-original="' + dropOne + '"]'));
      await sleep(20);
      record("the freed option can be picked again", !$(".card .actions .btn").disabled, "");
      while ($(".card .options .option--selected")) {
        $(".card .options .option--selected").click();
        await sleep(15);
      }
      multiChecksDone = true;
    }

    let expected = true;
    const scoreBefore = session().score;
    const answeredBefore = session().answered;
    if (!wrongPathDone && step.item.type === "mc" && step.origin === "primary") {
      const wrongOption = step.options.filter((original) => step.item.correct.indexOf(original) === -1)[0];
      click($('.options .option[data-original="' + wrongOption + '"]'));
      const ready = confirmButton();
      if (!ready) throw new Error("check answer stayed disabled on the wrong-answer probe");
      click(ready);
      await sleep(30);
      expected = false;
      wrongPathDone = true;
      const verdict = $(".feedback__verdict").textContent.trim();
      const answerLine = $(".feedback__answer") ? $(".feedback__answer").textContent : "";
      record("wrong answer shows verdict, key, and explanation", /Not/i.test(verdict) && /Correct answer:/.test(answerLine) && !!$(".feedback__text"), verdict + " | " + answerLine.slice(0, 70));
      queueGrew = session().requeued.length === 1 && session().steps.length === 75;
      record("missed question is queued at the end of the run", queueGrew, session().steps.length + " steps, requeued " + JSON.stringify(session().requeued));
      record("make-up announcement is shown", $("#toast").classList.contains("toast--visible") && /make-up/i.test($("#toast").textContent), $("#toast").textContent);
      record("primary score untouched by a miss", session().score === scoreBefore && session().answered === answeredBefore + 1, scoreBefore + "->" + session().score + " score, " + answeredBefore + "->" + session().answered + " answered");
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
    if (!graded.graded) throw new Error("step not graded after confirm: " + graded.item.id);
    if (graded.correct !== expected) throw new Error("grading mismatch on " + graded.item.id + " (" + graded.item.type + "): expected " + expected);

    if (graded.origin === "makeup") {
      const badge = $(".badge--makeup");
      if (badge && /Make-up round/.test(badge.textContent)) makeupBadgeSeen = true;
      if (expected && !/Cleared/i.test($(".feedback__verdict").textContent)) {
        throw new Error("cleared make-up not labelled: " + $(".feedback__verdict").textContent);
      }
    } else if (iterations > 1 && expected && !/Correct/i.test($(".feedback__verdict").textContent)) {
      throw new Error("unexpected verdict on " + graded.item.id + ": " + $(".feedback__verdict").textContent);
    }

    expectedStreak = graded.correct ? expectedStreak + 1 : 0;
    if (expectedStreak > bestStreak) bestStreak = expectedStreak;
    if (session().streak !== expectedStreak) throw new Error("streak " + session().streak + " but expected " + expectedStreak);
    if (session().bestStreak !== bestStreak) throw new Error("best streak " + session().bestStreak + " but expected " + bestStreak);

    const chip = $("#quiz-streak");
    if (expectedStreak >= 2) {
      if (chip.hidden) throw new Error("streak chip hidden at streak " + expectedStreak);
      if (!chip.textContent.includes(String(expectedStreak))) throw new Error("streak chip reads " + chip.textContent + " at streak " + expectedStreak);
      streakShown = true;
      if (expectedStreak >= 5 && chip.classList.contains("streak--hot")) streakHotSeen = true;
    } else if (!chip.hidden) {
      throw new Error("streak chip visible at streak " + expectedStreak);
    }

    if (iterations === 4) {
      const before = currentStep().item.id;
      document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      await sleep(30);
      keyboardAdvanceWorked = currentStep().item.id !== before;
    } else {
      click($(".card .actions .btn"));
      await sleep(14);
    }
  }

  record("walked the whole run including make-ups", state() === "results", iterations + " questions answered, screen " + state());
  record("all four question types were exercised", typeTally.mc > 0 && typeTally.multi > 0 && typeTally.tf > 0 && typeTally.match > 0, JSON.stringify(typeTally));
  record("every matching board was answered", typeTally.match === 7, typeTally.match + " matching items");
  record("the run grew by exactly the one miss", typeTally.mc + typeTally.multi + typeTally.tf + typeTally.match === 75, iterations);
  record("make-up question carries its badge", makeupBadgeSeen, "");
  record("streak chip showed a running streak", streakShown, "best " + bestStreak);
  record("streak chip goes hot at five in a row", streakHotSeen, "");
  record("enter key advances after grading", keyboardAdvanceWorked, "");

  /* ---------- results ---------- */

  await waitFor(() => state() === "results", 3000, "results screen");
  const result = window.QZ.state.result();
  record("results screen shown", state() === "results", state());
  record("score counts the primary questions only", result.score === result.total - 1, result.score + " of " + result.total);
  record("primary total stays 74 despite the extra question", result.total === 74, result.total);
  record("percentage from the primary total", result.pct === Math.round((result.score / result.total) * 100), result.pct + "%");
  record("ring shows the percentage", $("#ring-pct").textContent === result.pct + "%", $("#ring-pct").textContent);
  record("ring sub label shows score", $("#ring-sub").textContent === result.score + " of " + result.total + " correct", $("#ring-sub").textContent);
  record("best streak recorded in the result", result.bestStreak === bestStreak, result.bestStreak + " vs " + bestStreak);
  record("make-up totals recorded", result.makeupTotal === 1 && result.makeupCleared === 1, result.makeupCleared + "/" + result.makeupTotal);
  record("make-up note confirms everything cleared", !$("#makeup-note").hidden && /All 1 missed questions cleared/.test($("#makeup-note").textContent), $("#makeup-note").textContent);
  record("five result cells", $$(".result-cell").length === 5, $$(".result-cell").length);
  record("best streak cell rendered", $$(".result-cell__label").some((label) => /Best streak/i.test(label.textContent)), $$(".result-cell__label").map((l) => l.textContent).join(", "));
  record("breakdown lists topics", $$(".breakdown__row").length >= 5, $$(".breakdown__row").length + " rows");
  await sleep(1800);
  record("breakdown bars have widths", $$(".breakdown__fill").filter((bar) => bar.style.width && bar.style.width !== "0%").length >= 5, $$(".breakdown__fill").map((b) => b.style.width).slice(0, 5).join(","));
  record("four result actions when nothing is still missed", $$("#result-actions .btn").length === 4, $$("#result-actions .btn").length);
  record("no retry button once everything is cleared", !$$("#result-actions .btn").some((button) => /still missed/i.test(button.textContent)), "");
  record("seed caption replaces the old header seed", /seed \d+/.test($("#result-seed").textContent), $("#result-seed").textContent);
  record("best score stored for the deck", (window.QZ.Store.bestFor("both") || {}).pct === result.pct, JSON.stringify(window.QZ.Store.bestFor("both")));
  record("all-time streak stored", window.QZ.Store.streakFor("both") === bestStreak, window.QZ.Store.streakFor("both"));

  /* ---------- review ---------- */

  click($$("#result-actions .btn").find((button) => /Review/i.test(button.textContent)));
  await waitFor(() => state() === "review", 2000, "review screen");
  record("review lists the run plus the make-up", $$(".review-item").length === 75, $$(".review-item").length + " items");
  record("review flags the single miss", $$(".review-item--miss").length === 1, $$(".review-item--miss").length);
  record("review marks the make-up row", $$(".review-item--makeup").length === 1, $$(".review-item--makeup").length);
  record("review shows every explanation", $$(".review-item__explain").length === 75, $$(".review-item__explain").length);
  record("review labels the re-asked question", $$(".review-item .badge").some((badge) => /re-asked at the end/.test(badge.textContent)), "");

  click($("#review-filter"));
  await sleep(40);
  record("missed-only filter narrows the list", $$(".review-item").length === 1, $$(".review-item").length);
  click($("#review-filter"));
  await sleep(40);
  record("filter toggles back to all", $$(".review-item").length === 75, $$(".review-item").length);
  click($("#review-back"));
  await waitFor(() => state() === "results", 2000, "back to results");

  /* ---------- retake, streak on a fresh run, exit sheet, resume ---------- */

  click($$("#result-actions .btn").find((button) => /Full shuffle/i.test(button.textContent)));
  await waitFor(() => state() === "quiz", 3000, "fresh quiz");
  record("retake starts a clean session", session().answered === 0 && session().steps.length === 74 && session().streak === 0, session().answered + " answered, " + session().steps.length + " steps");
  record("retake clears the streak chip", $("#quiz-streak").hidden, "");

  await answerAndAdvance("the retake first answer");
  await answerAndAdvance("the retake second answer");
  record("two correct answers make a streak of two", session().streak === 2 && !$("#quiz-streak").hidden, session().streak + " " + $("#quiz-streak").textContent);

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
  record("home shows the new best score", $$(".tile__best")[2].textContent.includes("Best"), $$(".tile__best")[2].textContent);

  click($("#resume-btn"));
  await waitFor(() => state() === "quiz", 3000, "resumed quiz");
  const resumed = session();
  record("resume restores progress and streak", resumed.answered === 2 && resumed.score === 2 && resumed.streak === 2, resumed.score + "/" + resumed.answered + " streak " + resumed.streak);
  record("resume keeps the streak chip visible", !$("#quiz-streak").hidden && /2/.test($("#quiz-streak").textContent), $("#quiz-streak").textContent);

  click($("#exit-btn"));
  await sleep(60);
  click($("#sheet-confirm"));
  await waitFor(() => state() === "home", 3000, "home from resume");

  click($("#history-btn"));
  await waitFor(() => state() === "history", 2000, "history screen");
  const historyText = $(".history-row").textContent;
  record("history row includes the streak", /streak \d+/.test(historyText), historyText);
  record("history row includes the make-up result", /make-up 1\/1/.test(historyText), historyText);
  click($("#history-back"));
  await waitFor(() => state() === "home", 2000, "home from history");

  /* ---------- missed-only drill ---------- */

  const drill = window.QZ.Engine.buildSubset("both", ["n09", "e23"], 7);
  record("missed-only drill builds from chosen ids", drill.steps.length === 2 && drill.primaryTotal === 2, drill.steps.length + " steps");
  const revived = window.QZ.Engine.restore(window.QZ.Engine.snapshot(drill));
  record("missed-only drill survives a restore", revived.steps.length === 2 && revived.itemIds.length === 2, revived.steps.length + " steps");

  const history = JSON.parse(window.localStorage.getItem("qz.history.v1") || "[]");
  record("attempt history persisted", history.length === 1 && history[0].total === 74, history.length + " attempts");
  const report = window.QZ.selftest();
  record("in-page bank self-test passes", report.ok, report.passed + "/" + report.total);

  return {
    results,
    failures: results.filter((entry) => !entry.pass),
    passed: results.filter((entry) => entry.pass).length,
    total: results.length,
    typeTally,
    score: result.score,
    pct: result.pct,
    bestStreak: result.bestStreak
  };
})();