(function () {
  window.QZ = window.QZ || {};

  var Engine = window.QZ.Engine;
  var Motion = window.QZ.Motion;
  var Render = window.QZ.Render;
  var Store = window.QZ.Store;
  var node = Render.node;

  var screens = {};
  var session = null;
  var draft = null;
  var currentScreen = "home";
  var lastResult = null;
  var reviewMissedOnly = false;
  var lastStreakShown = 0;

  var el = {
    frame: document.getElementById("card-frame"),
    cardHost: document.getElementById("question-card"),
    deckChip: document.getElementById("quiz-deck"),
    count: document.getElementById("quiz-count"),
    score: document.getElementById("quiz-score"),
    streak: document.getElementById("quiz-streak"),
    progress: document.getElementById("progress"),
    progressFill: document.getElementById("progress-fill"),
    tiles: document.getElementById("deck-tiles"),
    heroStats: document.getElementById("hero-stats"),
    resumeWrap: document.getElementById("resume-wrap"),
    resumeBtn: document.getElementById("resume-btn"),
    exitBtn: document.getElementById("exit-btn"),
    sheet: document.getElementById("sheet"),
    sheetTitle: document.getElementById("sheet-title"),
    sheetBody: document.getElementById("sheet-body"),
    sheetCancel: document.getElementById("sheet-cancel"),
    sheetConfirm: document.getElementById("sheet-confirm"),
    toast: document.getElementById("toast"),
    live: document.getElementById("live"),
    selftest: document.getElementById("selftest"),
    results: {
      eyebrow: document.getElementById("results-eyebrow"),
      ring: document.getElementById("ring-value"),
      pct: document.getElementById("ring-pct"),
      sub: document.getElementById("ring-sub"),
      makeupNote: document.getElementById("makeup-note"),
      grid: document.getElementById("result-grid"),
      breakdown: document.getElementById("breakdown"),
      actions: document.getElementById("result-actions"),
      seed: document.getElementById("result-seed")
    },
    reviewList: document.getElementById("review-list"),
    reviewFilter: document.getElementById("review-filter"),
    historyList: document.getElementById("history-list")
  };

  function announce(text) {
    el.live.textContent = text;
  }

  function showToast(text, ms) {
    el.toast.textContent = text;
    el.toast.classList.add("toast--visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      el.toast.classList.remove("toast--visible");
    }, ms || 2600);
  }

  function registerScreens() {
    var list = document.querySelectorAll("[data-screen]");
    for (var i = 0; i < list.length; i++) {
      screens[list[i].dataset.screen] = list[i];
    }
  }

  function go(name) {
    if (name === currentScreen) return;
    var target = screens[name];
    var from = screens[currentScreen];
    currentScreen = name;
    Motion.swap(from, target);
    el.exitBtn.hidden = name !== "quiz";
    window.scrollTo({ top: 0, behavior: Motion.reduced() ? "auto" : "smooth" });
  }

  function deckLabel(key) {
    return window.QZ.BANK.decks[key].title;
  }

  function percent(correct, total) {
    return total ? Math.round((correct / total) * 100) : 0;
  }

  function formatDuration(ms) {
    var totalSeconds = Math.round(ms / 1000);
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    if (minutes >= 60) {
      var hours = Math.floor(minutes / 60);
      return hours + "h " + (minutes % 60) + "m";
    }
    return minutes + "m " + (seconds < 10 ? "0" + seconds : seconds) + "s";
  }

  function compact() {
    return window.matchMedia("(max-width: 560px)").matches;
  }

  /* ---------- home ---------- */

  function renderHome() {
    el.tiles.textContent = "";
    el.tiles.appendChild(Render.homeTiles({ start: startSession }));
    Motion.stagger(el.tiles, ".tile", 60);

    var counts = window.QZ.countByType(window.QZ.BANK.all);
    el.heroStats.textContent = "";
    var facts = [
      window.QZ.BANK.all.length + " questions in total",
      window.QZ.BANK.decks.network.items.length + " modules 1-6",
      window.QZ.BANK.decks.endpoint.items.length + " modules 7-10",
      counts.mc + counts.multi + " multiple choice",
      counts.tf + " true or false",
      counts.match + " matching"
    ];
    facts.forEach(function (text) {
      var chip = node("span", "stat-chip");
      var parts = text.split(" ");
      chip.appendChild(node("b", null, parts[0]));
      chip.appendChild(document.createTextNode(" " + parts.slice(1).join(" ")));
      el.heroStats.appendChild(chip);
    });

    var saved = Store.session();
    if (saved && saved.responses && saved.responses.filter(function (entry) { return entry.graded; }).length > 0) {
      var answered = saved.responses.filter(function (entry) { return entry.graded; }).length;
      el.resumeBtn.textContent = "Resume " + deckLabel(saved.deck) + " · " + answered + " answered";
      el.resumeWrap.hidden = false;
    } else {
      el.resumeWrap.hidden = true;
    }
  }

  /* ---------- session ---------- */

  function seedFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var value = params.get("seed");
    return value ? Engine.seedFrom(value) : Engine.newSeed();
  }

  function startSession(deckKey, seed, itemIds) {
    session = itemIds && itemIds.length
      ? Engine.buildSubset(deckKey, itemIds, seed || Engine.newSeed())
      : Engine.build(deckKey, seed || seedFromUrl());
    draft = null;
    lastStreakShown = 0;
    Store.saveSession(Engine.snapshot(session));
    go("quiz");
    renderStep();
  }

  function resumeSession() {
    var saved = Store.session();
    if (!saved) return;
    session = Engine.restore(saved);
    if (!session) return;
    lastStreakShown = session.streak;
    go("quiz");
    renderStep();
  }

  function emptyDraft(step) {
    if (step.item.type === "multi") return { choices: [] };
    if (step.item.type === "tf") return { value: null };
    if (step.item.type === "match") return { links: {} };
    return { choice: null };
  }

  function draftFor(step) {
    return normalizeDraft(step, step.response) || emptyDraft(step);
  }

  function normalizeDraft(step, response) {
    if (!response) return null;
    if (step.item.type === "multi") return { choices: (response.choices || []).slice() };
    if (step.item.type === "tf") return { value: response.value === undefined ? null : response.value };
    if (step.item.type === "match") {
      var links = {};
      var source = response.links || {};
      Object.keys(source).forEach(function (key) {
        links[key] = source[key];
      });
      return { links: links };
    }
    return { choice: response.choice === undefined ? null : response.choice };
  }

  function selectedIndexes(step, draft) {
    return Render.selectedIndexes(step, draft);
  }

  function isReady(step, draft) {
    var item = step.item;
    if (item.type === "multi") return (draft.choices || []).length === item.choose;
    if (item.type === "tf") return draft.value !== null && draft.value !== undefined;
    if (item.type === "match") {
      var links = draft.links || {};
      return step.left.every(function (index) { return !!links[index]; });
    }
    return draft.choice !== null && draft.choice !== undefined;
  }

  function paintStreak() {
    var streak = session.streak;
    var isNew = streak >= 2 && streak !== lastStreakShown;
    lastStreakShown = streak;

    if (streak < 2) {
      el.streak.hidden = true;
      el.streak.textContent = "";
      el.streak.classList.remove("streak--pop", "streak--hot");
      return;
    }

    el.streak.hidden = false;
    el.streak.textContent = streak + (compact() ? "×" : " in a row");
    el.streak.classList.toggle("streak--hot", streak >= 5);
    if (isNew) {
      el.streak.classList.remove("streak--pop");
      void el.streak.offsetWidth;
      el.streak.classList.add("streak--pop");
    }
  }

  function updateQuizBar() {
    var progressNow = Engine.progress(session);
    var pending = session.steps.length - progressNow.done;

    el.deckChip.textContent = session.deckTitle;
    el.count.textContent = compact()
      ? (session.index + 1) + " / " + session.steps.length
      : "Question " + (session.index + 1) + " of " + session.steps.length;
    el.score.textContent = compact()
      ? session.score + " / " + session.answered
      : session.score + " correct · " + session.answered + " answered" + (pending ? " · " + pending + " left" : "");
    paintStreak();
    el.progress.setAttribute("aria-valuenow", String(progressNow.pct));
    Motion.animateWidth(el.progressFill, progressNow.pct);
  }

  function renderStep() {
    var step = session.steps[session.index];
    draft = draftFor(step);
    updateQuizBar();

    var context = {
      draft: draft,
      ready: step.graded ? true : isReady(step, draft),
      note: step.graded ? "" : Render.noteFor(step, draft),
      nextLabel: session.index === session.steps.length - 1 ? "See results" : "Next question",
      handlers: {
        select: onSelect,
        confirm: onConfirm,
        next: onNext
      }
    };

    Motion.releaseHeight(el.frame);
    var card = Render.card(step, context);
    el.cardHost.textContent = "";
    el.cardHost.appendChild(card);
    Motion.syncHeight(el.frame, el.cardHost);
    window.requestAnimationFrame(function () {
      Motion.syncHeight(el.frame, el.cardHost);
    });

    var feedback = el.cardHost.querySelector(".feedback");
    if (feedback) {
      var settle = function () {
        Motion.syncHeight(el.frame, el.cardHost);
      };
      feedback.addEventListener("transitionend", function (event) {
        if (event.propertyName === "max-height") settle();
      });
      window.setTimeout(settle, Motion.reduced() ? 40 : 520);
    }

    announce("Question " + (session.index + 1) + " of " + session.steps.length + ". " + Render.promptText(step.item));
  }

  function paintOptions(step, draft) {
    var card = el.cardHost.querySelector(".card");
    if (!card || step.graded) return;
    var selected = selectedIndexes(step, draft);
    var limit = step.item.type === "multi" ? step.item.choose : 1;
    var buttons = card.querySelectorAll(".options .option");
    for (var i = 0; i < buttons.length; i++) {
      var button = buttons[i];
      var original = Number(button.dataset.original);
      var isSelected = selected.indexOf(original) !== -1;
      button.classList.toggle("option--selected", isSelected);
      button.setAttribute("aria-pressed", isSelected ? "true" : "false");
      button.disabled = selected.length >= limit && !isSelected;
    }
  }

  function onSelect(response) {
    var step = session.steps[session.index];
    if (step.graded) return;
    if (step.item.type === "match") {
      draft = { links: response.links };
    } else if (step.item.type === "tf") {
      draft = { value: response.value };
    } else if (step.item.type === "multi") {
      draft = { choices: response.choices };
    } else {
      draft = { choice: response.choice };
    }

    paintOptions(step, draft);

    var card = el.cardHost.querySelector(".card");
    var note = card ? card.querySelector(".actions__note") : null;
    if (note) note.textContent = Render.noteFor(step, draft);
    Render.refreshReady(card, isReady(step, draft));
    Store.saveSession(Engine.snapshot(session));
  }

  function onConfirm() {
    var step = session.steps[session.index];
    if (step.graded) return;
    if (!isReady(step, draft)) {
      showToast("Finish the answer first");
      return;
    }

    var queuedBefore = session.requeued.length;
    var streaksBefore = Engine.missedSteps(session).length;
    var missedThis = !step.correct;

    Engine.apply(session, draft);
    Store.saveSession(Engine.snapshot(session));
    updateQuizBar();
    renderStep();

    if (session.requeued.length > queuedBefore && missedThis && step.origin === "primary") {
      showToast("Missed one, it goes into the make-up round at the end");
    } else if (step.correct && session.streak === 5) {
      showToast("Five in a row");
    } else if (step.correct && session.streak === 10) {
      showToast("Ten in a row, keep it going");
    }

    announce(
      (step.origin === "makeup"
        ? (step.correct ? "Cleared. " : "Still missed. ")
        : (step.correct ? "Correct. " : "Incorrect. ")) + Engine.correctText(step) +
        (streaksBefore !== Engine.missedSteps(session).length ? " Added to the make-up round." : "")
    );
  }

  function onNext() {
    if (session.index >= session.steps.length - 1) {
      finishSession();
      return;
    }
    session.index += 1;
    Store.saveSession(Engine.snapshot(session));
    renderStep();
  }

  function finishSession() {
    session.finishedAt = Date.now();
    Store.clearSession();
    var missed = Engine.missedSteps(session);
    var stillMissed = missed.filter(function (step) {
      return session.requeued.indexOf(step.item.id) !== -1;
    }).filter(function (step) {
      var makeup = session.steps.filter(function (candidate) {
        return candidate.origin === "makeup" && candidate.item.id === step.item.id;
      })[0];
      return !makeup || !makeup.correct;
    });

    var streakRecord = Store.recordStreak(session.deck, session.bestStreak);

    lastResult = {
      deck: session.deck,
      deckTitle: session.deckTitle,
      score: session.score,
      total: session.primaryTotal,
      pct: percent(session.score, session.primaryTotal),
      duration: session.finishedAt - session.startedAt,
      seed: session.seed,
      date: new Date().toISOString(),
      bestStreak: session.bestStreak,
      streakRecord: streakRecord.isRecord && streakRecord.best > 0,
      streakBest: streakRecord.best,
      missed: missed.length,
      makeupTotal: session.makeup.total,
      makeupCleared: session.makeup.cleared,
      stillMissedIds: stillMissed.map(function (step) { return step.item.id; })
    };

    var isBest = Store.recordBest(session.deck, lastResult);
    Store.addAttempt(lastResult);
    renderResults(isBest);
    go("results");
  }

  /* ---------- results ---------- */

  function renderResults(isBest) {
    var result = lastResult;
    el.results.eyebrow.textContent = result.streakRecord
      ? result.deckTitle + " · best streak record"
      : result.deckTitle;
    el.results.pct.textContent = result.pct + "%";
    el.results.sub.textContent = result.score + " of " + result.total + " correct";

    var radius = 94;
    var circumference = 2 * Math.PI * radius;
    el.results.ring.style.strokeDasharray = circumference;
    el.results.ring.style.strokeDashoffset = circumference;
    window.requestAnimationFrame(function () {
      el.results.ring.style.strokeDashoffset = circumference * (1 - result.pct / 100);
    });

    if (result.makeupTotal > 0) {
      el.results.makeupNote.hidden = false;
      el.results.makeupNote.className = "makeup-note " + (result.makeupCleared === result.makeupTotal ? "makeup-note--good" : "makeup-note--warn");
      el.results.makeupNote.textContent = result.makeupCleared === result.makeupTotal
        ? "All " + result.makeupTotal + " missed questions cleared in the make-up round."
        : "Cleared " + result.makeupCleared + " of " + result.makeupTotal + " re-asked questions.";
    } else {
      el.results.makeupNote.hidden = true;
      el.results.makeupNote.textContent = "";
    }

    el.results.grid.textContent = "";
    var cells = [
      { label: "Score", value: result.score + " / " + result.total },
      { label: "Accuracy", value: result.pct + "%" },
      { label: "Best streak", value: result.bestStreak + (result.bestStreak === 1 ? " answer" : " in a row") },
      { label: "Time", value: formatDuration(result.duration) },
      { label: "Best", value: isBest ? "New best" : (Store.bestFor(result.deck) ? Store.bestFor(result.deck).pct + "%" : "n/a") }
    ];
    cells.forEach(function (cell) {
      var box = node("div", "result-cell");
      box.appendChild(node("p", "result-cell__label", cell.label));
      box.appendChild(node("p", "result-cell__value", cell.value));
      el.results.grid.appendChild(box);
    });

    var summary = Engine.breakdown(session);
    el.results.breakdown.textContent = "";
    var rows = Object.keys(summary.byTopic).map(function (topic) {
      var entry = summary.byTopic[topic];
      return { label: topic, correct: entry.correct, total: entry.total, pct: percent(entry.correct, entry.total) };
    });
    rows.sort(function (a, b) { return a.pct - b.pct || a.label.localeCompare(b.label); });
    rows.forEach(function (row, index) {
      var wrap = node("div", "breakdown__row");
      var meta = node("div", "breakdown__meta");
      meta.appendChild(node("span", null, row.label));
      meta.appendChild(node("span", null, row.correct + " of " + row.total + " · " + row.pct + "%"));
      var bar = node("div", "breakdown__bar");
      var fill = node("div", "breakdown__fill");
      bar.appendChild(fill);
      wrap.appendChild(meta);
      wrap.appendChild(bar);
      el.results.breakdown.appendChild(wrap);
      window.setTimeout(function () {
        Motion.animateWidth(fill, row.pct);
      }, Motion.reduced() ? 0 : 90 + index * 55);
    });

    var typeRows = Object.keys(summary.byType).map(function (type) {
      var entry = summary.byType[type];
      return type.toUpperCase() + " " + entry.correct + "/" + entry.total;
    });
    if (typeRows.length) {
      var types = node("div", "breakdown__row");
      var meta = node("div", "breakdown__meta");
      meta.appendChild(node("span", null, "By question type"));
      meta.appendChild(node("span", null, typeRows.join(" · ")));
      types.appendChild(meta);
      el.results.breakdown.appendChild(types);
    }

    el.results.seed.textContent = "seed " + result.seed + " · add ?seed=" + result.seed + " to replay this run";

    el.results.actions.textContent = "";
    if (result.stillMissedIds.length) {
      var retry = node("button", "btn", "Retry the " + result.stillMissedIds.length + " still missed");
      retry.type = "button";
      retry.addEventListener("click", function () {
        startSession(result.deck, undefined, result.stillMissedIds);
      });
      el.results.actions.appendChild(retry);
    }

    var again = node("button", "btn" + (result.stillMissedIds.length ? " btn--ghost" : ""), "Retake " + result.deckTitle);
    again.type = "button";
    again.addEventListener("click", function () {
      startSession(result.deck);
    });
    var full = node("button", "btn btn--ghost", "Full shuffle");
    full.type = "button";
    full.addEventListener("click", function () {
      startSession("both");
    });
    var review = node("button", "btn btn--ghost", "Review answers");
    review.type = "button";
    review.addEventListener("click", function () {
      renderReview();
      go("review");
    });
    var home = node("button", "btn btn--ghost", "Home");
    home.type = "button";
    home.addEventListener("click", function () {
      renderHome();
      go("home");
    });
    el.results.actions.appendChild(again);
    el.results.actions.appendChild(full);
    el.results.actions.appendChild(review);
    el.results.actions.appendChild(home);
  }

  /* ---------- review ---------- */

  function renderReview() {
    el.reviewList.textContent = "";
    var shown = 0;
    session.steps.forEach(function (step, index) {
      if (reviewMissedOnly && step.correct) return;
      if (!step.graded) return;
      shown += 1;
      var question = step.item;
      var makeup = step.origin === "makeup";
      var row = document.createElement("li");
      row.className = "review-item" + (step.correct ? "" : " review-item--miss") + (makeup ? " review-item--makeup" : "");

      var head = node("div", "review-item__head");
      var label = makeup
        ? "Make-up · " + (step.correct ? "cleared" : "still missed")
        : "Q" + (index + 1) + " · " + (step.correct ? "correct" : "missed, re-asked at the end");
      head.appendChild(node("span", "badge" + (step.correct ? "" : " badge--topic"), label));
      if (question.topic) head.appendChild(node("span", "badge badge--topic", question.topic));
      var prompt = node("p", "review-item__prompt", Render.promptText(question));
      row.appendChild(head);
      row.appendChild(prompt);

      var rows = node("div", "review-item__rows");
      var your = node("span");
      your.appendChild(node("b", null, "Your answer: "));
      your.appendChild(document.createTextNode(Engine.selectedText(step) || "No answer"));
      var correct = node("span", "tie" + (step.correct ? "" : " tie--bad"));
      correct.appendChild(node("b", null, "Correct answer: "));
      correct.appendChild(document.createTextNode(Engine.correctText(step)));
      rows.appendChild(your);
      rows.appendChild(correct);
      row.appendChild(rows);

      if (question.explanation) {
        row.appendChild(node("p", "review-item__explain", question.explanation));
      }

      el.reviewList.appendChild(row);
    });

    if (!shown) {
      var empty = document.createElement("li");
      empty.className = "review-item";
      empty.textContent = reviewMissedOnly ? "Nothing missed in this session." : "No graded answers yet.";
      el.reviewList.appendChild(empty);
    }
  }

  /* ---------- history ---------- */

  function renderHistory() {
    var history = Store.history();
    el.historyList.textContent = "";
    if (!history.length) {
      var empty = document.createElement("li");
      empty.className = "history-row";
      empty.textContent = "No attempts saved yet on this browser.";
      el.historyList.appendChild(empty);
      return;
    }
    history.forEach(function (entry) {
      var row = document.createElement("li");
      row.className = "history-row";
      var when = new Date(entry.date);
      var detail = [entry.score + "/" + entry.total, entry.pct + "%"];
      if (entry.bestStreak) detail.push("streak " + entry.bestStreak);
      if (entry.makeupTotal) detail.push("make-up " + entry.makeupCleared + "/" + entry.makeupTotal);
      row.appendChild(node("span", null, entry.deckTitle + " · " + detail.join(" · ")));
      row.appendChild(node("span", null, when.toLocaleDateString() + " " + when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })));
      el.historyList.appendChild(row);
    });
  }

  /* ---------- selftest ---------- */

  function renderSelftest() {
    var report = window.QZ.selftest();
    document.title = (report.ok ? "Self-test passed · " : "Self-test failed · ") + "MODULE 1-10 CYBERSECURITY ESSENTIAL QUIZ";
    el.selftest.textContent = "";

    var summary = node("div", "selftest__summary");
    summary.appendChild(node("span", "stat-chip", report.checks.length + " checks"));
    summary.appendChild(node("span", "stat-chip", report.passed + " passed"));
    summary.appendChild(node("span", "stat-chip", report.total - report.passed + " failed"));
    summary.appendChild(node("span", "stat-chip", report.counts.all + " items · network " + report.counts.network + " · endpoint " + report.counts.endpoint));
    el.selftest.appendChild(summary);

    var table = node("table", "selftest__table");
    var head = node("thead");
    var headRow = node("tr");
    headRow.appendChild(node("th", null, "Check"));
    headRow.appendChild(node("th", null, "Result"));
    headRow.appendChild(node("th", null, "Detail"));
    head.appendChild(headRow);
    table.appendChild(head);

    var body = node("tbody");
    report.checks.forEach(function (check) {
      var row = node("tr");
      row.appendChild(node("td", null, check.name));
      row.appendChild(node("td", check.pass ? "pass" : "fail", check.pass ? "pass" : "fail"));
      row.appendChild(node("td", null, check.detail));
      body.appendChild(row);
    });
    table.appendChild(body);
    el.selftest.appendChild(table);

    if (window.console && window.console.table) {
      window.console.table(report.checks.map(function (check) {
        return { check: check.name, pass: check.pass, detail: check.detail };
      }));
    }
    return report;
  }

  /* ---------- sheet ---------- */

  function openSheet(title, body, confirmLabel, onConfirm) {
    el.sheetTitle.textContent = title;
    el.sheetBody.textContent = body;
    el.sheetConfirm.textContent = confirmLabel;
    el.sheet.hidden = false;
    el.sheetConfirm.onclick = function () {
      closeSheet();
      onConfirm();
    };
    el.sheetCancel.focus();
  }

  function closeSheet() {
    el.sheet.hidden = true;
  }

  function requestExit() {
    if (!session) {
      renderHome();
      go("home");
      return;
    }
    if (session.answered + session.makeup.answered === 0) {
      Store.clearSession();
      session = null;
      renderHome();
      go("home");
      return;
    }
    openSheet(
      "End this session?",
      "Your progress is kept, so you can resume from the home screen and the make-up round stays queued.",
      "End session",
      function () {
        renderHome();
        go("home");
      }
    );
  }

  /* ---------- wiring ---------- */

  function wire() {
    el.exitBtn.addEventListener("click", requestExit);
    el.sheetCancel.addEventListener("click", closeSheet);
    el.sheet.addEventListener("click", function (event) {
      if (event.target === el.sheet) closeSheet();
    });

    el.resumeBtn.addEventListener("click", resumeSession);

    document.getElementById("history-btn").addEventListener("click", function () {
      renderHistory();
      go("history");
    });
    document.getElementById("history-back").addEventListener("click", function () {
      renderHome();
      go("home");
    });
    document.getElementById("history-clear").addEventListener("click", function () {
      Store.clearHistory();
      renderHistory();
      renderHome();
      showToast("History cleared");
    });

    document.getElementById("review-back").addEventListener("click", function () {
      go("results");
    });
    el.reviewFilter.addEventListener("click", function () {
      reviewMissedOnly = !reviewMissedOnly;
      el.reviewFilter.setAttribute("aria-pressed", reviewMissedOnly ? "true" : "false");
      el.reviewFilter.textContent = reviewMissedOnly ? "Show all" : "Show missed only";
      renderReview();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        if (!el.sheet.hidden) {
          closeSheet();
          return;
        }
        if (currentScreen === "quiz") requestExit();
        return;
      }
      if (currentScreen !== "quiz" || !session) return;
      var step = session.steps[session.index];
      if (!step || !step.graded) return;
      var tag = (event.target && event.target.tagName) || "";
      if (tag === "BUTTON" && event.key === "Enter") return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onNext();
      }
    });

    window.addEventListener("resize", function () {
      if (currentScreen === "quiz") {
        Motion.syncHeight(el.frame, el.cardHost);
        if (session) updateQuizBar();
      }
    });
  }

  function boot() {
    registerScreens();
    wire();

    var params = new URLSearchParams(window.location.search);
    if (params.get("selftest") === "1") {
      Motion.enter(screens.selftest);
      renderSelftest();
      return;
    }

    var deckParam = params.get("deck");
    if (deckParam && window.QZ.BANK.decks[deckParam]) {
      startSession(deckParam);
      return;
    }

    renderHome();
    Motion.enter(screens.home);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.QZ.state = {
    screen: function () { return currentScreen; },
    session: function () { return session; },
    draft: function () { return draft; },
    result: function () { return lastResult; }
  };
})();