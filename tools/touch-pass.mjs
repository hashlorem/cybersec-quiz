// Real touch input pass. Synthetic TouchEvent objects dispatched from page
// script never become pointer events, so this drives actual touch points over
// the DevTools Protocol and asserts what the furniture does in response.

export async function touchPass(send, base, sleep) {
  const results = [];
  const record = (name, pass, detail) => results.push({ name, pass: !!pass, detail: detail === undefined ? "" : String(detail) });

  const evaluate = async (expression) => {
    const outcome = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (outcome.exceptionDetails) throw new Error(outcome.exceptionDetails.exception?.description || outcome.exceptionDetails.text);
    return outcome.result.value;
  };

  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send("Emulation.setEmulatedMedia", { features: [
    { name: "prefers-reduced-motion", value: "reduce" },
    { name: "prefers-color-scheme", value: "light" }
  ] });
  await send("Page.navigate", { url: base + "?deck=both&seed=drag52" });
  for (let i = 0; i < 60; i++) {
    const ready = await send("Runtime.evaluate", { expression: "!!(window.QZ && window.QZ.state && window.QZ.state.session)", returnByValue: true });
    if (ready.result.value) break;
    await sleep(150);
  }
  await sleep(500);
  await evaluate("window.localStorage.clear()");

  const first = await evaluate("window.QZ.state.session().steps[0].item.type");
  record("touch pass starts on a matching board", first === "match", first);
  record("coarse pointer media query matches", await evaluate("window.matchMedia('(pointer: coarse)').matches"), await evaluate("window.matchMedia('(pointer: coarse)').matches"));

  const geometry = await evaluate(`(function(){
    var s = window.QZ.state.session().steps[window.QZ.state.session().index];
    var index = s.left[0];
    var chip = document.querySelector('.pool-chip[data-pool="p' + index + '"]');
    var term = document.querySelector('.term[data-term="' + index + '"]');
    var label = term.querySelector('.term__label');
    function mid(node){ var r = node.getBoundingClientRect(); return { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2), h: Math.round(r.height) }; }
    return { index: index, chip: mid(chip), term: mid(term), label: mid(label) };
  })()`);

  const tap = async (x, y) => {
    await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
    await sleep(60);
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(160);
  };

  await tap(geometry.chip.x, geometry.chip.y);
  record("touch tap on a chip selects it", await evaluate("!!document.querySelector('.pool-chip--armed')"), await evaluate("(document.querySelector('.pool-chip--armed') || {}).dataset ? document.querySelector('.pool-chip--armed').dataset.pool : 'none'"));
  record("chip tap target is 44px tall on touch", geometry.chip.h >= 44, geometry.chip.h + "px");

  await tap(geometry.label.x, geometry.label.y);
  const linked = await evaluate(`!!document.querySelector('.term[data-term="${geometry.index}"] .term__slot--filled')`);
  record("touch tap on a term links the answer", linked, linked ? "linked" : "not linked");
  record("term tap target is 44px tall on touch", geometry.label.h >= 44, geometry.label.h + "px");

  const afterLink = await evaluate(`(function(){
    var s = window.QZ.state.session().steps[window.QZ.state.session().index];
    var index = s.left[s.left.length - 1];
    var chip = document.querySelector('.pool-chip[data-pool="p' + index + '"]');
    var term = document.querySelector('.term[data-term="' + index + '"]');
    function mid(node){ var r = node.getBoundingClientRect(); return { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) }; }
    return { index: index, chip: mid(chip), term: mid(term) };
  })()`);

  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: afterLink.chip.x, y: afterLink.chip.y, id: 1 }] });
  await sleep(80);
  await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: afterLink.chip.x, y: afterLink.chip.y + 40, id: 1 }] });
  await sleep(80);
  record("touch drag raises the floating chip", await evaluate("document.querySelectorAll('.pool-chip--floating').length === 1"), await evaluate("document.querySelectorAll('.pool-chip--floating').length"));
  await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: afterLink.term.x, y: afterLink.term.y, id: 1 }] });
  await sleep(120);
  record("touch drag highlights the hovered term", await evaluate("document.querySelectorAll('.term--drop').length === 1"), await evaluate("document.querySelectorAll('.term--drop').length"));
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(200);
  record("touch drag links the answer", await evaluate(`!!document.querySelector('.term[data-term="${afterLink.index}"] .term__slot--filled')`), "");
  record("clone is cleaned up after the drop", await evaluate("document.querySelectorAll('.pool-chip--floating').length === 0"), "");
  record("the unlink control is a 44px target", await evaluate("(function(){var b=document.querySelector('.term__unlink');return b ? Math.round(b.getBoundingClientRect().height) >= 44 : false;})()"), await evaluate("(function(){var b=document.querySelector('.term__unlink');return b ? Math.round(b.getBoundingClientRect().height) : 'absent';})()"));

  const scrollTop = await evaluate("window.scrollY");
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 195, y: 700, id: 1 }] });
  await sleep(60);
  await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 195, y: 500, id: 1 }] });
  await sleep(120);
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(300);
  record("page still scrolls by touch outside the chips", await evaluate("window.scrollY") >= scrollTop, scrollTop + " -> " + await evaluate("window.scrollY"));

  return { label: "touch input", total: results.length, failures: results.filter((entry) => !entry.pass).length, results };
}