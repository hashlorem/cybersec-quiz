(function () {
  window.QZ = window.QZ || {};

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffled(list, rand) {
    var out = list.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function sameSet(a, b) {
    if (a.length !== b.length) return false;
    var sortedA = a.slice().sort(function (x, y) { return x - y; });
    var sortedB = b.slice().sort(function (x, y) { return x - y; });
    for (var i = 0; i < sortedA.length; i++) {
      if (sortedA[i] !== sortedB[i]) return false;
    }
    return true;
  }

  function newSeed() {
    return Math.floor(Math.random() * 2147483647);
  }

  function seedFrom(value) {
    if (!value) return newSeed();
    var str = String(value);
    var hash = 2166136261;
    for (var i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function buildStep(item, rand, origin) {
    var step = { item: item, response: null, graded: false, correct: false, origin: origin || "primary" };

    if (item.type === "mc" || item.type === "multi") {
      step.options = shuffled(item.options.map(function (_, index) { return index; }), rand);
    } else if (item.type === "tf") {
      // True and False keep their positions: True is always the left option, so
      // the answer never depends on where the shuffle happened to put them.
      step.options = item.options.map(function (_, index) { return index; });
    } else if (item.type === "match") {
      step.left = shuffled(item.pairs.map(function (_, index) { return index; }), rand);
      var pool = item.pairs.map(function (pair, index) {
        return { id: "p" + index, text: pair.right, source: "pair" };
      });
      (item.distractors || []).forEach(function (text, index) {
        pool.push({ id: "x" + index, text: text, source: "distractor" });
      });
      step.pool = shuffled(pool, rand);
    }
    return step;
  }

  function emptySession(deck, seed) {
    return {
      deck: deck.key,
      deckTitle: deck.title,
      seed: seed,
      steps: [],
      index: 0,
      itemIds: null,
      primaryTotal: 0,
      score: 0,
      answered: 0,
      streak: 0,
      bestStreak: 0,
      requeued: [],
      makeup: { total: 0, answered: 0, cleared: 0 },
      startedAt: Date.now(),
      finishedAt: null
    };
  }

  function build(deckKey, seed) {
    var deck = window.QZ.BANK.decks[deckKey] || window.QZ.BANK.decks.both;
    var value = typeof seed === "number" ? seed : seedFrom(seed);
    var rand = mulberry32(value);
    var session = emptySession(deck, value);
    session.steps = shuffled(deck.items, rand).map(function (item) {
      return buildStep(item, rand, "primary");
    });
    session.primaryTotal = session.steps.length;
    return session;
  }

  /// A session restricted to specific items, used to re-drill the questions
  /// that were still missed after the make-up round.
  function buildSubset(deckKey, itemIds, seed) {
    var deck = window.QZ.BANK.decks[deckKey] || window.QZ.BANK.decks.both;
    var wanted = itemIds || [];
    var items = deck.items.filter(function (item) {
      return wanted.indexOf(item.id) !== -1;
    });
    var value = typeof seed === "number" ? seed : seedFrom(seed);
    var rand = mulberry32(value);
    var session = emptySession(deck, value);
    session.itemIds = wanted.slice();
    session.deckTitle = deck.title + " · missed only";
    session.steps = shuffled(items, rand).map(function (item) {
      return buildStep(item, rand, "primary");
    });
    session.primaryTotal = session.steps.length;
    return session;
  }

  /// Appends a missed question to the end of the queue so it gets one more
  /// chance. Each item is re-asked at most once, which keeps a wrong make-up
  /// answer from looping forever.
  function requeue(session, step) {
    if (!step) return false;
    if (step.origin !== "primary") return false;
    var id = step.item.id;
    if (session.requeued.indexOf(id) !== -1) return false;
    session.requeued.push(id);
    var rand = mulberry32(session.seed + session.requeued.length * 7919);
    var clone = buildStep(step.item, rand, "makeup");
    clone.sourceIndex = session.steps.indexOf(step);
    session.steps.push(clone);
    session.makeup.total += 1;
    return true;
  }

  function recompute(session) {
    var score = 0;
    var answered = 0;
    var primaryTotal = 0;
    var makeup = { total: 0, answered: 0, cleared: 0 };
    var streak = 0;
    var bestStreak = 0;

    session.steps.forEach(function (step) {
      if (step.origin === "primary") primaryTotal += 1;
      else makeup.total += 1;
      if (!step.graded) return;
      if (step.origin === "primary") {
        answered += 1;
        if (step.correct) score += 1;
      } else {
        makeup.answered += 1;
        if (step.correct) makeup.cleared += 1;
      }
      streak = step.correct ? streak + 1 : 0;
      if (streak > bestStreak) bestStreak = streak;
    });

    session.primaryTotal = primaryTotal;
    session.score = score;
    session.answered = answered;
    session.makeup = makeup;
    session.streak = streak;
    session.bestStreak = bestStreak;
    return session;
  }

  function snapshot(session) {
    return {
      deck: session.deck,
      seed: session.seed,
      index: session.index,
      itemIds: session.itemIds ? session.itemIds.slice() : null,
      startedAt: session.startedAt,
      requeued: session.requeued.slice(),
      responses: session.steps.map(function (step) {
        return { response: step.response, correct: step.correct, graded: step.graded };
      })
    };
  }

  function restore(snapshotData) {
    if (!snapshotData || !snapshotData.deck) return null;
    var session = snapshotData.itemIds && snapshotData.itemIds.length
      ? buildSubset(snapshotData.deck, snapshotData.itemIds, snapshotData.seed)
      : build(snapshotData.deck, snapshotData.seed);

    (snapshotData.requeued || []).forEach(function (id) {
      var primary = session.steps.filter(function (step) {
        return step.item.id === id && step.origin === "primary";
      })[0];
      if (primary) requeue(session, primary);
    });

    (snapshotData.responses || []).forEach(function (saved, index) {
      var step = session.steps[index];
      if (!step || !saved || !saved.graded) return;
      step.response = saved.response;
      step.graded = true;
      step.correct = !!saved.correct;
      step.detail = grade(step, saved.response).detail;
    });

    session.index = Math.min(snapshotData.index || 0, session.steps.length - 1);
    session.startedAt = snapshotData.startedAt || session.startedAt;
    recompute(session);
    return session;
  }

  function grade(step, response) {
    var item = step.item;
    var correct = false;
    var detail = {};

    if (item.type === "mc") {
      var choice = response && typeof response.choice === "number" ? response.choice : -1;
      correct = choice === item.correct[0];
      detail.selected = choice >= 0 ? [choice] : [];
      detail.expected = item.correct.slice();
    } else if (item.type === "multi") {
      var choices = (response && response.choices) || [];
      correct = sameSet(choices, item.correct);
      detail.selected = choices.slice();
      detail.expected = item.correct.slice();
    } else if (item.type === "tf") {
      var value = response ? response.value : null;
      correct = value === item.answer;
      detail.selected = value;
      detail.expected = item.answer;
    } else if (item.type === "match") {
      var links = (response && response.links) || {};
      var ok = true;
      var missing = 0;
      detail.links = {};
      item.pairs.forEach(function (_, index) {
        var target = links[index] || null;
        if (!target) missing += 1;
        if (target !== "p" + index) ok = false;
        detail.links[index] = target;
      });
      correct = ok && missing === 0;
      detail.expected = item.pairs.map(function (_, index) { return "p" + index; });
    }

    return { correct: correct, detail: detail };
  }

  function apply(session, response) {
    var step = session.steps[session.index];
    if (!step) return session;
    var result = grade(step, response);
    var first = !step.graded;

    step.response = response;
    step.graded = true;
    step.correct = result.correct;
    step.detail = result.detail;

    if (first) {
      if (step.origin === "primary") {
        session.answered += 1;
        if (result.correct) session.score += 1;
      } else {
        session.makeup.answered += 1;
        if (result.correct) session.makeup.cleared += 1;
      }
      session.streak = result.correct ? session.streak + 1 : 0;
      if (session.streak > session.bestStreak) session.bestStreak = session.streak;
      if (!result.correct) requeue(session, step);
    }

    return session;
  }

  function correctText(step) {
    var item = step.item;
    if (item.type === "mc") return item.options[item.correct[0]];
    if (item.type === "multi") {
      return item.correct.map(function (index) { return item.options[index]; }).join(" · ");
    }
    if (item.type === "tf") return item.answer ? "True" : "False";
    if (item.type === "match") {
      return item.pairs.map(function (pair) { return pair.left + " → " + pair.right; }).join(" · ");
    }
    return "";
  }

  function selectedText(step) {
    var item = step.item;
    var detail = step.detail || {};
    var response = step.response || {};
    if (item.type === "mc") {
      var choice = detail.selected && detail.selected[0];
      return choice === undefined || choice === null ? "No answer" : item.options[choice];
    }
    if (item.type === "multi") {
      var picks = detail.selected || [];
      if (!picks.length) return "No answer";
      return picks.map(function (index) { return item.options[index]; }).join(" · ");
    }
    if (item.type === "tf") {
      if (response.value === null || response.value === undefined) return "No answer";
      return response.value ? "True" : "False";
    }
    if (item.type === "match") {
      var links = response.links || {};
      var rows = item.pairs.map(function (pair, index) {
        var target = links[index];
        var text = "unanswered";
        if (target) {
          var found = (step.pool || []).filter(function (entry) { return entry.id === target; })[0];
          text = found ? found.text : target;
        }
        return pair.left + " → " + text;
      });
      return rows.join(" · ");
    }
    return "";
  }

  function breakdown(session) {
    var byTopic = {};
    var byType = {};
    session.steps.forEach(function (step) {
      if (!step.graded) return;
      var topic = step.item.topic || "General";
      var type = step.item.type;
      if (!byTopic[topic]) byTopic[topic] = { correct: 0, total: 0 };
      if (!byType[type]) byType[type] = { correct: 0, total: 0 };
      byTopic[topic].total += 1;
      byType[type].total += 1;
      if (step.correct) {
        byTopic[topic].correct += 1;
        byType[type].correct += 1;
      }
    });
    return { byTopic: byTopic, byType: byType };
  }

  function progress(session) {
    var done = session.answered + session.makeup.answered;
    return {
      done: done,
      total: session.steps.length,
      pct: session.steps.length ? Math.round((done / session.steps.length) * 100) : 0
    };
  }

  function missedSteps(session) {
    return session.steps.filter(function (step) {
      return step.graded && !step.correct && step.origin === "primary";
    });
  }

  window.QZ.Engine = {
    build: build,
    buildSubset: buildSubset,
    restore: restore,
    snapshot: snapshot,
    apply: apply,
    grade: grade,
    requeue: requeue,
    recompute: recompute,
    progress: progress,
    missedSteps: missedSteps,
    correctText: correctText,
    selectedText: selectedText,
    breakdown: breakdown,
    newSeed: newSeed,
    seedFrom: seedFrom,
    shuffled: shuffled,
    mulberry32: mulberry32,
    sameSet: sameSet
  };
})();