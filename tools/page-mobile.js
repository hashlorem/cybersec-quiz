(async function () {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const results = [];
  const record = (name, pass, detail) => results.push({ name, pass: !!pass, detail: detail === undefined ? "" : String(detail) });
  const state = () => window.QZ.state.screen();
  const session = () => window.QZ.state.session();
  const currentStep = () => session().steps[session().index];
  const vw = () => window.innerWidth;

  const controlSelectors = [".tile", ".btn", ".ghost-btn", ".link", ".option", ".pool-chip", ".term__label", ".term__unlink"];
  const measured = [];

  function measureControls(screen) {
    for (const selector of controlSelectors) {
      for (const node of $$(selector)) {
        const rect = node.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        measured.push({
          screen,
          selector,
          h: Math.round(rect.height),
          w: Math.round(rect.width),
          text: (node.textContent || "").trim().replace(/\s+/g, " ").slice(0, 20)
        });
      }
    }
  }

  function overflows(node) {
    return node.scrollWidth > node.clientWidth + 1;
  }

  window.localStorage.clear();

  /* ---------- home ---------- */

  record("viewport meta keeps the page at device width", /width=device-width/.test($('meta[name="viewport"]').content), $('meta[name="viewport"]').content);
  record("no horizontal scrolling", document.documentElement.scrollWidth <= vw(), document.documentElement.scrollWidth + " vs " + vw());
  record("home tiles stack without overflow", $$(".tile").every((tile) => tile.getBoundingClientRect().right <= vw() + 1), "");
  record("hero stat chips fit", $$(".hero__stats .stat-chip").every((chip) => chip.getBoundingClientRect().right <= vw() + 1), $$(".hero__stats .stat-chip").length + " chips");
  const heroSize = parseFloat(getComputedStyle($(".hero__title")).fontSize);
  record("hero title scales down", heroSize >= 28 && heroSize <= 52, heroSize + "px at " + vw() + "px wide");
  record("tiles show their full score line", $$(".tile__best").every((line) => !overflows(line)), "");
  measureControls("home");

  /* ---------- quiz ---------- */

  $$(".tile")[0].click();
  await sleep(500);
  record("quiz screen reached", state() === "quiz", state());
  const row = $(".quizbar__row").getBoundingClientRect();
  record("quiz bar row stays on one line", row.height <= 48, Math.round(row.height) + "px tall");
  record("quiz bar does not overflow sideways", !overflows($(".quizbar__row")), $(".quizbar__row").scrollWidth + " vs " + $(".quizbar__row").clientWidth);
  record("question text is readable", parseFloat(getComputedStyle($(".prompt")).fontSize) >= 17, getComputedStyle($(".prompt")).fontSize);
  record("body text is 16px or larger", parseFloat(getComputedStyle(document.body).fontSize) >= 16, getComputedStyle(document.body).fontSize);
  record("card fits the viewport", $(".card").getBoundingClientRect().right <= vw() + 1, Math.round($(".card").getBoundingClientRect().right) + " vs " + vw());
  record("no content clipped inside the card frame", $(".card-host").getBoundingClientRect().height <= $(".card-frame").getBoundingClientRect().height + 1,
    Math.round($(".card-host").getBoundingClientRect().height) + " vs frame " + Math.round($(".card-frame").getBoundingClientRect().height));
  measureControls("quiz");

  /* walk to a matching board to measure and fill it */
  let reachedMatch = false;
  let guard = 0;
  while (!reachedMatch && state() === "quiz" && guard < 90) {
    guard += 1;
    const step = currentStep();
    if (step.item.type === "match") {
      reachedMatch = true;
      break;
    }
    for (const original of step.item.correct) {
      const button = $('.options .option[data-original="' + original + '"]');
      if (button) button.click();
    }
    const confirm = $(".card .actions .btn");
    if (!confirm || confirm.disabled) break;
    confirm.click();
    await sleep(30);
    const next = $(".card .actions .btn");
    if (!next) break;
    next.click();
    await sleep(30);
  }

  record("matching board reachable at this width", reachedMatch, "after " + guard + " questions");
  if (reachedMatch) {
    const board = currentStep();
    const tfGrid = $(".tf");
    record("true or false rows go one per line", !tfGrid || getComputedStyle(tfGrid).gridTemplateColumns.split(" ").length === 1, tfGrid ? getComputedStyle(tfGrid).gridTemplateColumns : "not a true/false question");
    measureControls("matching-empty");

    for (const index of board.left) {
      $('.term[data-term="' + index + '"] .term__label').click();
      $('.pool-chip[data-pool="p' + index + '"]').click();
    }
    await sleep(200);
    record("every term took its answer at this width", board.left.every((index) => !!$('.term[data-term="' + index + '"] .term__slot--filled')), "");
    measureControls("matching-filled");
    record("term rows do not overflow", $$(".term__slot").every((slot) => !overflows(slot)), "");
    const confirm = $(".card .actions .btn");
    record("filled board enables the check button", confirm && !confirm.disabled, "");
    confirm.click();
    await sleep(700);
    record("matching grades on a phone-width run", currentStep().correct === true, currentStep().correct);
  }

  /* ---------- finish the deck, then check results and review ---------- */

  guard = 0;
  while (state() === "quiz" && guard < 200) {
    guard += 1;
    const step = currentStep();
    if (step.item.type === "match") {
      for (const index of step.left) {
        $('.term[data-term="' + index + '"] .term__label').click();
        $('.pool-chip[data-pool="p' + index + '"]').click();
      }
    } else {
      for (const original of step.item.correct) {
        const button = $('.options .option[data-original="' + original + '"]');
        if (button) button.click();
      }
    }
    const confirm = $(".card .actions .btn");
    if (!confirm || confirm.disabled) break;
    confirm.click();
    await sleep(25);
    const next = $(".card .actions .btn");
    if (!next) break;
    next.click();
    await sleep(20);
  }

  record("results screen reached on this device", state() === "results", state() + " after " + guard + " questions");
  if (state() === "results") {
    const columns = getComputedStyle($(".result-grid")).gridTemplateColumns.split(" ").length;
    record("results grid uses at most two columns", columns <= 2, columns + " columns: " + getComputedStyle($(".result-grid")).gridTemplateColumns);
    record("result cells fit the width", $$(".result-cell").every((cell) => cell.getBoundingClientRect().right <= vw() + 1), "");
    record("result cell text does not overflow", $$(".result-cell").every((cell) => !overflows(cell)), "");
    record("result actions fit the width", $$("#result-actions .btn").every((button) => button.getBoundingClientRect().right <= vw() + 1), "");
    record("make-up note fits", !$("#makeup-note") || $("#makeup-note").getBoundingClientRect().right <= vw() + 1, "");
    measureControls("results");

    const reviewButton = $$("#result-actions .btn").find((button) => /Review/i.test(button.textContent));
    reviewButton.click();
    await sleep(400);
    record("review rows fit the width", $$(".review-item").every((row) => row.getBoundingClientRect().right <= vw() + 1), $$(".review-item").length + " rows");
    record("review rows do not overflow", $$(".review-item").every((row) => !overflows(row)), "");
    record("review filter control usable", $(".review-head .btn").getBoundingClientRect().right <= vw() + 1, "");
    measureControls("review");
  }

  /* ---------- target sizes across every screen ---------- */

  const tooSmall = measured.filter((entry) => entry.h < 44);
  const smallest = measured.slice().sort((a, b) => a.h - b.h).slice(0, 4);
  record("every control is a 44px target or larger", tooSmall.length === 0,
    tooSmall.length ? JSON.stringify(tooSmall.slice(0, 5)) : measured.length + " controls measured, smallest: " + smallest.map((entry) => entry.selector + " " + entry.h + "px").join(", "));

  return {
    results,
    failures: results.filter((entry) => !entry.pass),
    passed: results.filter((entry) => entry.pass).length,
    total: results.length,
    viewport: vw() + "x" + window.innerHeight,
    measured: measured.length
  };
})();