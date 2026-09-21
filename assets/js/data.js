(function () {
  window.QZ = window.QZ || {};

  var DECKS = window.QZ.DECKS || {};
  var TYPES = ["mc", "multi", "tf", "match"];

  function stamp(deckKey, item) {
    var copy = {};
    for (var k in item) {
      if (Object.prototype.hasOwnProperty.call(item, k)) copy[k] = item[k];
    }
    copy.deck = deckKey;
    if (copy.type === "multi" && !copy.choose) copy.choose = copy.correct.length;
    if (copy.type === "tf") {
      copy.options = ["True", "False"];
      copy.correct = [copy.answer ? 0 : 1];
    }
    if (copy.type === "match") {
      copy.pool = copy.pairs.map(function (pair) {
        return pair.right;
      }).concat(copy.distractors || []);
    }
    return copy;
  }

  function itemsOf(deck) {
    var items = [];
    if (!deck) return items;
    if (Array.isArray(deck.items)) {
      for (var i = 0; i < deck.items.length; i++) items.push(deck.items[i]);
    }
    return items;
  }

  function withDeck(deck, key) {
    return itemsOf(deck).map(function (item) {
      return stamp(key, item);
    });
  }

  var tfItems = itemsOf(DECKS.tf);

  var network = withDeck(DECKS.network, "network")
    .concat(tfItems.filter(function (item) { return item.deck === "network"; }).map(function (item) { return stamp("network", item); }));

  var endpoint = withDeck(DECKS.endpoint, "endpoint")
    .concat(tfItems.filter(function (item) { return item.deck === "endpoint"; }).map(function (item) { return stamp("endpoint", item); }));

  var both = network.concat(endpoint).map(function (item) {
    var copy = {};
    for (var k in item) {
      if (Object.prototype.hasOwnProperty.call(item, k)) copy[k] = item[k];
    }
    copy.deck = "both";
    copy.homeDeck = item.deck;
    return copy;
  });

  function makeDeck(key, title, kicker, blurb, items) {
    return { key: key, title: title, kicker: kicker, blurb: blurb, items: items };
  }

  var deckIndex = {
    network: makeDeck("network", "Network Security Checkpoint", "Modules 1-6", DECKS.network.blurb || "", network),
    endpoint: makeDeck("endpoint", "OS and Endpoint Security Checkpoint", "Modules 7-10", DECKS.endpoint.blurb || "", endpoint),
    both: makeDeck("both", "Full Shuffle", "Modules 1-10", "Both checkpoints combined, every item type, fully shuffled.", both)
  };

  function countByType(items) {
    var counts = {};
    TYPES.forEach(function (type) { counts[type] = 0; });
    items.forEach(function (item) {
      if (counts[item.type] === undefined) counts[item.type] = 0;
      counts[item.type] += 1;
    });
    return counts;
  }

  window.QZ.TYPES = TYPES;
  window.QZ.countByType = countByType;

  window.QZ.BANK = {
    title: "MODULE 1-10 CYBERSECURITY ESSENTIAL QUIZ",
    order: ["network", "endpoint", "both"],
    decks: deckIndex,
    all: both
  };

  window.QZ.selftest = function () {
    var checks = [];
    var all = window.QZ.BANK.all;

    function record(name, pass, detail) {
      checks.push({ name: name, pass: !!pass, detail: detail || "" });
    }

    var ids = {};
    var duplicateIds = [];
    all.forEach(function (item) {
      if (ids[item.id]) duplicateIds.push(item.id);
      ids[item.id] = true;
    });
    record("Unique question ids", duplicateIds.length === 0, duplicateIds.length ? "duplicates: " + duplicateIds.join(", ") : all.length + " ids");

    var missing = [];
    all.forEach(function (item) {
      var text = item.type === "tf" ? item.statement : item.prompt;
      if (!text || !String(text).trim()) missing.push(item.id);
      if (!item.explanation || !String(item.explanation).trim()) missing.push(item.id + " (no explanation)");
      if (!item.topic) missing.push(item.id + " (no topic)");
    });
    record("Every item has a prompt, explanation, and topic", missing.length === 0, missing.length ? missing.join(", ") : "ok");

    var mcBad = [];
    all.filter(function (item) { return item.type === "mc"; }).forEach(function (item) {
      if (!Array.isArray(item.options) || item.options.length < 3) mcBad.push(item.id + " (too few options)");
      if (!Array.isArray(item.correct) || item.correct.length !== 1) mcBad.push(item.id + " (correct must be one index)");
      if (item.correct[0] < 0 || item.correct[0] >= item.options.length) mcBad.push(item.id + " (index out of range)");
      if (new Set(item.options).size !== item.options.length) mcBad.push(item.id + " (duplicate options)");
    });
    record("Multiple choice keys resolve to a single valid option", mcBad.length === 0, mcBad.length ? mcBad.join(", ") : "ok");

    var multiBad = [];
    all.filter(function (item) { return item.type === "multi"; }).forEach(function (item) {
      var correct = item.correct || [];
      if (!Array.isArray(item.options) || item.options.length < correct.length + 1) multiBad.push(item.id + " (too few options)");
      if (correct.length < 2) multiBad.push(item.id + " (needs two or more correct)");
      if (item.choose !== correct.length) multiBad.push(item.id + " (choose " + item.choose + " but " + correct.length + " keyed)");
      if (new Set(correct).size !== correct.length) multiBad.push(item.id + " (duplicate correct indices)");
      correct.forEach(function (index) {
        if (index < 0 || index >= item.options.length) multiBad.push(item.id + " (index out of range)");
      });
      if (new Set(item.options).size !== item.options.length) multiBad.push(item.id + " (duplicate options)");
    });
    record("Multi-select counts match their answer keys", multiBad.length === 0, multiBad.length ? multiBad.join(", ") : "ok");

    var tfBad = [];
    var tfTrue = 0;
    var tfFalse = 0;
    all.filter(function (item) { return item.type === "tf"; }).forEach(function (item) {
      if (typeof item.answer !== "boolean") tfBad.push(item.id + " (answer is not boolean)");
      else if (item.answer) tfTrue += 1;
      else tfFalse += 1;
    });
    record("True or false items carry a boolean answer", tfBad.length === 0, tfBad.length ? tfBad.join(", ") : "ok");
    var tfTotal = tfTrue + tfFalse;
    var trueShare = tfTotal ? tfTrue / tfTotal : 0;
    record("True or false answers are not skewed", trueShare >= 0.3 && trueShare <= 0.7,
      tfTotal + " items: " + tfTrue + " true, " + tfFalse + " false (" + Math.round(trueShare * 100) + "% true)");

    var matchBad = [];
    all.filter(function (item) { return item.type === "match"; }).forEach(function (item) {
      var pairs = item.pairs || [];
      if (pairs.length < 2) matchBad.push(item.id + " (needs two or more pairs)");
      var lefts = [];
      var rights = [];
      pairs.forEach(function (pair) {
        if (!pair.left || !String(pair.left).trim()) matchBad.push(item.id + " (empty left label)");
        if (!pair.right || !String(pair.right).trim()) matchBad.push(item.id + " (empty right label)");
        lefts.push(pair.left);
        rights.push(pair.right);
      });
      var poolRights = (item.pool || []).slice(pairs.length);
      var allRights = rights.concat(poolRights);
      if (new Set(allRights).size !== allRights.length) matchBad.push(item.id + " (duplicate answer labels)");
      if (new Set(lefts).size !== lefts.length) matchBad.push(item.id + " (duplicate left labels)");
      if (poolRights.length === 0 && (item.distractors || []).length) matchBad.push(item.id + " (pool missing distractors)");
    });
    record("Matching items have clean, unambiguous pairs", matchBad.length === 0, matchBad.length ? matchBad.join(", ") : "ok");

    window.QZ.BANK.order.forEach(function (key) {
      var deck = window.QZ.BANK.decks[key];
      var counts = countByType(deck.items);
      var absent = TYPES.filter(function (type) { return !counts[type]; });
      record("Deck " + key + " mixes question types", absent.length === 0,
        deck.items.length + " items, " + TYPES.map(function (type) { return counts[type] + " " + type; }).join(", "));
    });

    var idsInDeck = {};
    window.QZ.BANK.order.forEach(function (key) {
      window.QZ.BANK.decks[key].items.forEach(function (item) {
        idsInDeck[item.id] = (idsInDeck[item.id] || 0) + 1;
      });
    });
    var notInBoth = Object.keys(idsInDeck).filter(function (id) {
      return !window.QZ.BANK.decks.both.items.some(function (item) { return item.id === id; });
    });
    record("Every deck item appears in the full shuffle", notInBoth.length === 0, notInBoth.join(", ") || "ok");

    var passed = checks.filter(function (check) { return check.pass; }).length;
    return {
      ok: passed === checks.length,
      passed: passed,
      total: checks.length,
      checks: checks,
      counts: {
        all: all.length,
        network: window.QZ.BANK.decks.network.items.length,
        endpoint: window.QZ.BANK.decks.endpoint.items.length,
        byType: countByType(all)
      }
    };
  };
})();