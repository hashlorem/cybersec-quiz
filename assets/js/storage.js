(function () {
  window.QZ = window.QZ || {};

  var KEYS = {
    history: "qz.history.v1",
    best: "qz.best.v1",
    session: "qz.session.v1"
  };

  var memory = {};
  var available = true;

  try {
    var probe = "qz.probe";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
  } catch (error) {
    available = false;
  }

  function read(key, fallback) {
    try {
      var raw = available ? window.localStorage.getItem(key) : memory[key];
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    var raw = JSON.stringify(value);
    try {
      if (available) window.localStorage.setItem(key, raw);
      else memory[key] = raw;
      return true;
    } catch (error) {
      memory[key] = raw;
      return false;
    }
  }

  function drop(key) {
    try {
      if (available) window.localStorage.removeItem(key);
      delete memory[key];
    } catch (error) {
      delete memory[key];
    }
  }

  function addAttempt(attempt) {
    var history = read(KEYS.history, []);
    history.unshift(attempt);
    if (history.length > 200) history = history.slice(0, 200);
    write(KEYS.history, history);
    return history;
  }

  function bestFor(deckKey) {
    var all = read(KEYS.best, {});
    return all[deckKey] || null;
  }

  function recordBest(deckKey, attempt) {
    var all = read(KEYS.best, {});
    var current = all[deckKey];
    var better = !current || attempt.pct > current.pct;
    if (better) {
      all[deckKey] = attempt;
      write(KEYS.best, all);
    }
    return better;
  }

  window.QZ.Store = {
    available: available,
    addAttempt: addAttempt,
    history: function () { return read(KEYS.history, []); },
    clearHistory: function () { drop(KEYS.history); drop(KEYS.best); },
    bestFor: bestFor,
    recordBest: recordBest,
    saveSession: function (snapshot) { write(KEYS.session, snapshot); },
    session: function () { return read(KEYS.session, null); },
    clearSession: function () { drop(KEYS.session); }
  };
})();