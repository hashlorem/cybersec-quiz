(async function () {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const results = [];
  const record = (name, pass, detail) => results.push({ name, pass: !!pass, detail: detail === undefined ? "" : String(detail) });
  const state = () => window.QZ.state;
  const session = () => state().session();
  const step = () => session().steps[session().index];

  await sleep(200);
  window.localStorage.clear();

  record("seed URL starts a session directly", state().screen() === "quiz", state().screen());
  record("seed URL opens a matching board first", step().item.type === "match", step().item.id + " " + step().item.type);
  record("seed is reproducible from the URL", session().seed === window.QZ.Engine.seedFrom("drag52"), session().seed);

  const board = step();
  const termIndex = board.left[0];
  const term = $('.term[data-term="' + termIndex + '"]');
  const chip = $('.pool-chip[data-pool="p' + termIndex + '"]');
  const chipRect = chip.getBoundingClientRect();
  const termRect = term.getBoundingClientRect();
  const opts = (x, y) => ({ bubbles: true, cancelable: true, composed: true, pointerId: 7, pointerType: "mouse", isPrimary: true, button: 0, buttons: 1, clientX: x, clientY: y });

  chip.dispatchEvent(new PointerEvent("pointerdown", opts(chipRect.left + 8, chipRect.top + 8)));
  await sleep(30);
  chip.dispatchEvent(new PointerEvent("pointermove", opts(chipRect.left + 30, chipRect.top + 40)));
  await sleep(60);
  record("drag raises a floating clone", $$(".pool-chip--floating").length === 1, $$(".pool-chip--floating").length);
  record("drag body is selection-locked", document.body.style.userSelect === "none", document.body.style.userSelect);

  chip.dispatchEvent(new PointerEvent("pointermove", opts(termRect.left + 24, termRect.top + 10)));
  await sleep(60);
  record("drag highlights the hovered term", term.classList.contains("term--drop"), term.className);

  chip.dispatchEvent(new PointerEvent("pointerup", opts(termRect.left + 24, termRect.top + 10)));
  await sleep(60);
  record("drag drop removes the clone", $$(".pool-chip--floating").length === 0, $$(".pool-chip--floating").length);
  record("drag links the answer into the term", !!term.querySelector(".term__slot--filled"), term.querySelector(".term__slot").textContent);
  record("drag marks the chip as placed", chip.classList.contains("pool-chip--placed"), chip.className);
  record("drag clears the hover highlight", !term.classList.contains("term--drop"), term.className);
  record("drag selection lock released", document.body.style.userSelect === "", document.body.style.userSelect);
  record("drag writes the draft link", (state().draft().links || {})[termIndex] === "p" + termIndex, JSON.stringify(state().draft()));
  record("drag leaves check answer disabled until every term is filled", $(".card .actions .btn").disabled, $(".card .actions .btn").disabled);

  // A dropped chip must not also count as a tap, so give the drag guard time
  // to expire before exercising the tap path.
  await sleep(360);

  term.querySelector(".term__label").click();
  await sleep(30);
  record("unlink clears the drag assignment", !term.querySelector(".term__slot--filled"), term.querySelector(".term__slot").textContent);

  const tapTermIndex = board.left[0];
  $('.term[data-term="' + tapTermIndex + '"] .term__label').click();
  await sleep(30);
  record("tapping a term holds it for an answer", $('.term[data-term="' + tapTermIndex + '"] .term__label').getAttribute("aria-pressed") === "true", "");
  $('.pool-chip[data-pool="p' + tapTermIndex + '"]').click();
  await sleep(30);
  record("tapping an answer links it to the held term", !!$('.term[data-term="' + tapTermIndex + '"] .term__slot--filled'), "");

  const armedIndex = board.left[1];
  $('.pool-chip[data-pool="p' + armedIndex + '"]').click();
  await sleep(30);
  record("tapping an answer with no term held arms it instead of guessing", $('.pool-chip[data-pool="p' + armedIndex + '"]').classList.contains("pool-chip--armed"), "");
  $('.term[data-term="' + armedIndex + '"] .term__label').click();
  await sleep(30);
  record("the armed answer lands on the term tapped next", !!$('.term[data-term="' + armedIndex + '"] .term__slot--filled'), "");

  for (const index of board.left) {
    if ($('.term[data-term="' + index + '"] .term__slot--filled')) continue;
    $('.term[data-term="' + index + '"] .term__label').click();
    $('.pool-chip[data-pool="p' + index + '"]').click();
    await sleep(20);
  }
  record("tap path fills a board partially dragged", !!$(".card .actions .btn") && !$(".card .actions .btn").disabled, "");
  $(".card .actions .btn").click();
  await sleep(40);
  record("mixed drag and tap answer grades correct", step().correct === true, JSON.stringify(step().response));

  const distractorBoard = session().steps.slice(1).find((entry) => entry.item.type === "match" && (entry.item.distractors || []).length);
  record("distractor-bearing boards keep every pool entry", !distractorBoard || distractorBoard.pool.length > distractorBoard.item.pairs.length, distractorBoard ? distractorBoard.item.id + " pool " + distractorBoard.pool.length + " pairs " + distractorBoard.item.pairs.length : "none in deck");

  return { results, failures: results.filter((entry) => !entry.pass), passed: results.filter((entry) => entry.pass).length, total: results.length };
})();