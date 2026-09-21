(function () {
  window.QZ = window.QZ || {};

  var TYPE_LABEL = {
    mc: "Multiple choice",
    multi: "Multiple choice",
    tf: "True or false",
    match: "Matching"
  };

  function node(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = text;
    return el;
  }

  function badge(text, extra) {
    return node("span", "badge" + (extra ? " " + extra : ""), text);
  }

  function typeBadge(item) {
    var text = TYPE_LABEL[item.type] || item.type;
    if (item.type === "multi") text += " · choose " + item.choose;
    return badge(text);
  }

  function placeholderFor(step) {
    var placeholders = {};
    step.pool.forEach(function (entry) {
      placeholders[entry.id] = entry.text;
    });
    return placeholders;
  }

  function promptText(item) {
    return item.type === "tf" ? item.statement : item.prompt;
  }

  function buildHead(item) {
    var head = node("div", "card__head");
    head.appendChild(typeBadge(item));
    if (item.topic) head.appendChild(badge(item.topic, "badge--topic"));
    return head;
  }

  function selectedIndexes(step, draft) {
    var item = step.item;
    if (!draft) return [];
    if (item.type === "multi") return (draft.choices || []).slice();
    if (item.type === "tf") return draft.value === null || draft.value === undefined ? [] : [draft.value ? 0 : 1];
    return draft.choice === null || draft.choice === undefined ? [] : [draft.choice];
  }

  function buildOptions(step, handlers, draft) {
    var item = step.item;
    var graded = step.graded;
    var wrap = node("div", item.type === "tf" ? "options tf" : item.type === "multi" ? "options options--multi" : "options");
    var selected = selectedIndexes(step, draft);

    var limit = item.type === "multi" ? item.choose : 1;

    step.options.forEach(function (originalIndex) {
      var option = node("button", "option");
      option.type = "button";
      option.dataset.original = String(originalIndex);
      var mark = node("span", "option__mark", "");
      var label = node("span", "option__label", item.options[originalIndex]);
      option.appendChild(mark);
      option.appendChild(label);

      var isSelected = selected.indexOf(originalIndex) !== -1;
      var isCorrectOption = item.correct.indexOf(originalIndex) !== -1;

      if (graded) {
        option.disabled = true;
        if (isCorrectOption) {
          option.classList.add("option--correct");
          mark.textContent = "✓";
        }
        if (isSelected && !isCorrectOption) {
          option.classList.add("option--wrong");
          mark.textContent = "✕";
        }
        if (isSelected && isCorrectOption) option.classList.add("option--selected");
        if (!isSelected && isCorrectOption && selected.length && item.correct.length > 1) {
          option.classList.add("option--missed");
        }
      } else {
        if (isSelected) {
          option.classList.add("option--selected");
          option.setAttribute("aria-pressed", "true");
        } else {
          option.setAttribute("aria-pressed", "false");
        }
        if (selected.length >= limit && !isSelected) option.disabled = true;
        option.addEventListener("click", function () {
          if (item.type === "multi") {
            var at = selected.indexOf(originalIndex);
            if (at === -1) selected.push(originalIndex);
            else selected.splice(at, 1);
            handlers.select({ choices: selected.slice() });
          } else if (item.type === "tf") {
            selected = [originalIndex];
            handlers.select({ value: originalIndex === 0 });
          } else {
            selected = [originalIndex];
            handlers.select({ choice: originalIndex });
          }
        });
      }

      wrap.appendChild(option);
    });

    return wrap;
  }

  function buildTrueFalse(step, handlers, draft) {
    return buildOptions(step, handlers, draft);
  }

  function buildMatch(step, handlers, draft) {
    var item = step.item;
    var links = (draft && draft.links) ? draft.links : {};
    var placeholder = placeholderFor(step);
    var wrap = node("div", "match");

    var poolWrap = node("div", "match__pool");
    poolWrap.setAttribute("role", "group");
    poolWrap.setAttribute("aria-label", "Answer choices");

    var termsWrap = node("div", "terms");
    var termNodes = [];

    var armedPool = { id: null };

    function termIndexes() {
      return step.left.slice();
    }

    function assignedPoolIds() {
      return termIndexes()
        .map(function (index) { return links[index]; })
        .filter(function (id) { return !!id; });
    }

    function repaint() {
      var used = assignedPoolIds();
      termNodes.forEach(function (entry) {
        var poolId = links[entry.index];
        var slot = entry.slot;
        slot.textContent = "";
        slot.classList.toggle("term__slot--filled", !!poolId);
        var labelHost = node("span", "term__slot-label", poolId ? placeholder[poolId] : "Drop or tap an answer here");
        slot.appendChild(labelHost);
        if (poolId && !step.graded) {
          var unlink = node("button", "term__unlink", "✕");
          unlink.type = "button";
          unlink.setAttribute("aria-label", "Unlink " + item.pairs[entry.index].left);
          unlink.addEventListener("click", function (event) {
            event.stopPropagation();
            assign(entry.index, null);
          });
          slot.appendChild(unlink);
        }
        if (step.graded) {
          var correct = poolId === "p" + entry.index;
          entry.el.classList.toggle("term--correct", correct);
          entry.el.classList.toggle("term--wrong", !correct);
          if (!correct) {
            slot.appendChild(node("span", "term__fix", "Correct: " + item.pairs[entry.index].right));
          }
        }
        entry.label.setAttribute("aria-pressed", poolId ? "true" : "false");
      });

      poolChips.forEach(function (chip) {
        var id = chip.dataset.pool;
        var placed = used.indexOf(id) !== -1;
        chip.classList.toggle("pool-chip--placed", placed && !step.graded);
        chip.classList.toggle("pool-chip--armed", armedPool.id === id && !step.graded);
        chip.disabled = step.graded || placed;
      });
    }

    function assign(termIndex, poolId) {
      if (step.graded) return;
      var termIndexesList = termIndexes();
      termIndexesList.forEach(function (index) {
        if (index !== termIndex && links[index] === poolId && poolId) links[index] = null;
      });
      links[termIndex] = poolId;
      armedPool.id = null;
      repaint();
      handlers.select({ links: links });
    }

    var poolChips = [];
    step.pool.forEach(function (entry) {
      var chip = node("button", "pool-chip", entry.text);
      chip.type = "button";
      chip.dataset.pool = entry.id;
      chip.setAttribute("aria-pressed", "false");
      chip.addEventListener("click", function () {
        if (step.graded || chip.disabled) return;
        if (armedPool.id === entry.id) {
          armedPool.id = null;
          repaint();
          return;
        }
        armedPool.id = entry.id;
        var emptyTerm = termIndexes().filter(function (index) { return !links[index]; })[0];
        var pendingTerm = pendingTermIndex();
        if (pendingTerm !== null && pendingTerm !== undefined) {
          assign(pendingTerm, entry.id);
          return;
        }
        if (emptyTerm !== undefined && emptyTerm !== null) {
          assign(emptyTerm, entry.id);
          return;
        }
        repaint();
      });
      poolChips.push(chip);
      poolWrap.appendChild(chip);
    });

    var selectedTerm = { index: null };

    function pendingTermIndex() {
      return selectedTerm.index;
    }

    termIndexes().forEach(function (index) {
      var term = node("div", "term");
      term.dataset.term = String(index);
      var label = node("button", "term__label", item.pairs[index].left);
      label.type = "button";
      label.setAttribute("aria-pressed", "false");
      var slot = node("div", "term__slot");
      label.addEventListener("click", function () {
        if (step.graded) return;
        if (selectedTerm.index === index) {
          selectedTerm.index = null;
          label.setAttribute("aria-pressed", "false");
          return;
        }
        if (selectedTerm.index !== null && selectedTerm.index !== undefined) {
          termNodes.forEach(function (entry) {
            entry.label.setAttribute("aria-pressed", "false");
          });
        }
        if (armedPool.id) {
          assign(index, armedPool.id);
          return;
        }
        if (links[index]) {
          assign(index, null);
          selectedTerm.index = null;
          label.setAttribute("aria-pressed", "false");
          return;
        }
        selectedTerm.index = index;
        label.setAttribute("aria-pressed", "true");
      });
      term.appendChild(label);
      term.appendChild(slot);
      termNodes.push({ index: index, el: term, slot: slot, label: label });
      termsWrap.appendChild(term);
    });

    repaint();

    if (!step.graded) {
      var targets = termNodes.map(function (entry) {
        return { index: entry.index, el: entry.el };
      });
      poolChips.forEach(function (chip) {
        window.QZ.Motion.drag(chip, {
          targets: targets,
          onStart: function () {
            chip.classList.add("pool-chip--dragging");
          },
          onDrop: function (termIndex) {
            chip.classList.remove("pool-chip--dragging");
            if (termIndex === null || termIndex === undefined) return;
            assign(termIndex, chip.dataset.pool);
          }
        });
      });
    }

    wrap.appendChild(poolWrap);
    wrap.appendChild(termsWrap);
    return wrap;
  }

  function buildFeedback(step) {
    var item = step.item;
    var feedback = node("div", "feedback");
    var verdict = node(
      "p",
      "feedback__verdict " + (step.correct ? "feedback__verdict--good" : "feedback__verdict--bad"),
      step.correct ? "✓ Correct" : "✕ Not quite"
    );
    feedback.appendChild(verdict);

    if (!step.correct) {
      var answerLine = node("p", "feedback__answer", "Correct answer: " + window.QZ.Engine.correctText(step));
      feedback.appendChild(answerLine);
    }

    if (item.explanation) {
      var text = node("p", "feedback__text", item.explanation);
      feedback.appendChild(text);
    }
    return feedback;
  }

  function card(step, context) {
    var item = step.item;
    var handlers = context.handlers || {};
    var draft = context.draft || null;
    var article = node("article", "card card--entering");

    article.appendChild(buildHead(item));

    var code = item.code ? node("pre", "code-block", item.code) : null;
    if (code) article.appendChild(code);

    var body = node("div", "card__body");
    body.appendChild(node("p", "prompt", promptText(item)));

    if (item.type === "match") {
      body.appendChild(node("p", "hint", "Drag an answer onto a term, or tap a term and then tap an answer. Every term needs an answer."));
      body.appendChild(buildMatch(step, handlers, draft));
    } else if (item.type === "tf") {
      body.appendChild(buildTrueFalse(step, handlers, draft));
    } else {
      if (item.type === "multi") {
        body.appendChild(node("p", "hint", "Select exactly " + item.choose + " answers."));
      }
      body.appendChild(buildOptions(step, handlers, draft));
    }

    article.appendChild(body);

    if (step.graded) {
      article.appendChild(buildFeedback(step));
      var actions = node("div", "actions");
      actions.appendChild(node("span", "actions__note", context.note || ""));
      var next = node("button", "btn actions__spacer", context.nextLabel || "Next question");
      next.type = "button";
      next.addEventListener("click", function () {
        if (handlers.next) handlers.next();
      });
      actions.appendChild(next);
      article.appendChild(actions);
      window.requestAnimationFrame(function () {
        var feedback = article.querySelector(".feedback");
        if (feedback) feedback.classList.add("feedback--open");
        next.focus({ preventScroll: true });
      });
    } else {
      var pending = node("div", "actions");
      var note = node("span", "actions__note", context.note || "");
      var confirm = node("button", "btn actions__spacer", "Check answer");
      confirm.type = "button";
      confirm.disabled = !context.ready;
      confirm.addEventListener("click", function () {
        if (handlers.confirm) handlers.confirm();
      });
      pending.appendChild(note);
      pending.appendChild(confirm);
      article.appendChild(pending);
      article.dataset.confirm = "1";
    }

    return article;
  }

  function refreshReady(article, ready) {
    if (!article) return;
    var button = article.querySelector(".actions .btn");
    if (button && article.dataset.confirm) button.disabled = !ready;
  }

  function noteFor(step, draft) {
    var item = step.item;
    if (item.type === "multi") {
      var count = (draft && draft.choices ? draft.choices.length : 0);
      return count + " of " + item.choose + " selected";
    }
    if (item.type === "match") {
      var filled = 0;
      var links = draft || {};
      step.left.forEach(function (index) {
        if (links[index]) filled += 1;
      });
      return filled + " of " + step.left.length + " terms matched";
    }
    return "";
  }

  function homeTiles(handlers) {
    var bank = window.QZ.BANK;
    var wrap = document.createDocumentFragment();

    bank.order.forEach(function (key, position) {
      var deck = bank.decks[key];
      var counts = window.QZ.countByType(deck.items);
      var tile = node("button", "tile" + (key === "both" ? " tile--featured" : ""));
      tile.type = "button";
      tile.appendChild(node("span", "tile__kicker", deck.kicker + (key === "both" ? " · everything" : "")));
      tile.appendChild(node("span", "tile__title", deck.title));

      var facts = node("span", "tile__facts");
      facts.appendChild(node("span", "fact", deck.items.length + " questions"));
      if (counts.mc) facts.appendChild(node("span", "fact", counts.mc + " multiple choice"));
      if (counts.multi) facts.appendChild(node("span", "fact", counts.multi + " multi-select"));
      if (counts.tf) facts.appendChild(node("span", "fact", counts.tf + " true/false"));
      if (counts.match) facts.appendChild(node("span", "fact", counts.match + " matching"));
      tile.appendChild(facts);

      var best = window.QZ.Store.bestFor(key);
      if (best) {
        tile.appendChild(node("span", "tile__best", "Best " + best.pct + "% · " + best.score + " of " + best.total));
      } else {
        tile.appendChild(node("span", "tile__best", deck.blurb));
      }

      var go = node("span", "tile__go", "Start " + deck.items.length + " questions →");
      tile.appendChild(go);

      tile.addEventListener("click", function () {
        if (handlers.start) handlers.start(key);
      });

      wrap.appendChild(tile);
    });

    return wrap;
  }

  window.QZ.Render = {
    card: card,
    refreshReady: refreshReady,
    noteFor: noteFor,
    homeTiles: homeTiles,
    selectedIndexes: selectedIndexes,
    node: node,
    promptText: promptText
  };
})();