(async function () {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const results = [];
  const record = (name, pass, detail) => results.push({ name, pass: !!pass, detail: detail === undefined ? "" : String(detail) });
  const state = () => window.QZ.state.screen();
  const session = () => window.QZ.state.session();
  const currentStep = () => session().steps[session().index];

  function click(node) {
    if (!node) throw new Error("click on missing node");
    node.click();
  }

  function answerCurrent() {
    const step = currentStep();
    const item = step.item;
    if (item.type === "match") {
      for (const index of step.left) {
        click($('.term[data-term="' + index + '"] .term__label'));
        click($('.pool-chip[data-pool="p' + index + '"]'));
      }
      return;
    }
    for (const original of item.correct) {
      const button = $('.options .option[data-original="' + original + '"]');
      if (!button) throw new Error("missing option " + original + " on " + item.id);
      click(button);
    }
  }

  window.localStorage.clear();

  record("dark scheme is active", window.matchMedia("(prefers-color-scheme: dark)").matches, "");
  record("quiz bar blends into the dark canvas", getComputedStyle($(".quizbar")).backgroundColor === getComputedStyle(document.body).backgroundColor,
    getComputedStyle($(".quizbar")).backgroundColor + " vs " + getComputedStyle(document.body).backgroundColor);
  record("glow layer stays on the home screen", !$("#screen-quiz .aurora") && !!$("#screen-home .aurora"), "");
  record("surface tokens are the dark ones", getComputedStyle($(".card")).backgroundColor === "rgb(29, 29, 31)", getComputedStyle($(".card")).backgroundColor);
  const barRect = $(".quizbar").getBoundingClientRect();
  record("quiz bar does not spill past the content column", barRect.left > 0 && barRect.right < window.innerWidth, Math.round(barRect.left) + "..." + Math.round(barRect.right) + " of " + window.innerWidth);

  /* walk the whole deck so results and review render in dark mode too */
  let guard = 0;
  while (state() === "quiz" && guard < 160) {
    guard += 1;
    answerCurrent();
    const ready = $(".card .actions .btn");
    if (!ready || ready.disabled) throw new Error("could not answer " + currentStep().item.id + " in dark mode");
    click(ready);
    await sleep(30);
    const next = $(".card .actions .btn");
    if (!next) throw new Error("no advance control after grading " + currentStep().item.id);
    click(next);
    await sleep(20);
  }

  record("dark run reaches the results screen", state() === "results", state() + " after " + guard + " questions");
  if (state() === "results") {
    record("results render in dark mode", getComputedStyle($(".result-cell")).backgroundColor === "rgb(29, 29, 31)", getComputedStyle($(".result-cell")).backgroundColor);
    record("no element paints the canvas over the glow on results", getComputedStyle($(".breakdown")).backgroundColor === "rgb(29, 29, 31)", getComputedStyle($(".breakdown")).backgroundColor);
    const reviewButton = $$("#result-actions .btn").find((button) => /Review/i.test(button.textContent));
    click(reviewButton);
    await sleep(300);
    record("dark review screen renders", state() === "review" && $$(".review-item").length > 0, state() + " with " + $$(".review-item").length + " rows");
    record("review rows use the dark surface", getComputedStyle($(".review-item")).backgroundColor !== "rgb(0, 0, 0)", getComputedStyle($(".review-item")).backgroundColor);
  }

  return {
    results,
    failures: results.filter((entry) => !entry.pass),
    passed: results.filter((entry) => entry.pass).length,
    total: results.length
  };
})();