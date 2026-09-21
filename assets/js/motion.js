(function () {
  window.QZ = window.QZ || {};

  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function reduced() {
    return reduceQuery.matches;
  }

  function duration(ms) {
    return reduced() ? 0 : ms;
  }

  function enter(el) {
    if (!el) return;
    el.hidden = false;
    el.classList.remove("screen--leaving");
    el.classList.add("screen--entering");
    window.setTimeout(function () {
      el.classList.remove("screen--entering");
    }, duration(460));
  }

  function leave(el) {
    if (!el) return;
    el.classList.add("screen--leaving");
    window.setTimeout(function () {
      el.classList.remove("screen--leaving");
      el.hidden = true;
    }, duration(170));
  }

  function swap(fromEl, toEl) {
    if (toEl && toEl !== fromEl) enter(toEl);
    if (fromEl && fromEl !== toEl) leave(fromEl);
  }

  function syncHeight(frame, content) {
    if (!frame || !content) return;
    var target = content.getBoundingClientRect().height;
    frame.style.height = Math.ceil(target) + "px";
  }

  function releaseHeight(frame) {
    if (!frame) return;
    frame.style.height = "auto";
  }

  function stagger(container, selector, step) {
    if (!container) return;
    var nodes = container.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].style.setProperty("--tile-delay", (reduced() ? 0 : i * (step || 60)) + "ms");
    }
  }

  function animateWidth(el, pct) {
    if (!el) return;
    window.requestAnimationFrame(function () {
      el.style.width = Math.max(0, Math.min(100, pct)) + "%";
    });
  }

  function drag(chip, options) {
    var settings = options || {};
    var targets = settings.targets || [];
    var rects = [];
    var pointerId = null;
    var origin = null;
    var clone = null;
    var active = false;
    var armed = null;
    var captured = false;
    var startTime = 0;

    function measureTargets() {
      rects = targets
        .filter(function (target) { return !!target.el; })
        .map(function (target) {
          return { index: target.index, el: target.el, rect: target.el.getBoundingClientRect() };
        });
    }

    function hitTest(x, y) {
      for (var i = 0; i < rects.length; i++) {
        var rect = rects[i].rect;
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return rects[i];
      }
      return null;
    }

    function setArmed(target) {
      if (armed === target) return;
      if (armed && armed.el) armed.el.classList.remove("term--drop");
      armed = target;
      if (armed && armed.el) armed.el.classList.add("term--drop");
    }

    function makeClone(rect) {
      clone = chip.cloneNode(true);
      clone.classList.add("pool-chip--floating", "pool-chip--dragging");
      clone.removeAttribute("tabindex");
      clone.style.width = rect.width + "px";
      clone.style.height = rect.height + "px";
      clone.style.left = rect.left + "px";
      clone.style.top = rect.top + "px";
      document.body.appendChild(clone);
      return clone;
    }

    function moveClone(x, y) {
      if (!clone || !origin) return;
      var dx = x - origin.x;
      var dy = y - origin.y;
      clone.style.transform = "translate3d(" + dx + "px," + dy + "px,0) scale(1.04)";
    }

    function finish(dropped) {
      if (captured && pointerId !== null && chip.releasePointerCapture) {
        try {
          chip.releasePointerCapture(pointerId);
        } catch (error) {
          captured = false;
        }
      }
      captured = false;
      pointerId = null;
      active = false;
      document.body.style.userSelect = "";
      if (clone && clone.parentNode) clone.parentNode.removeChild(clone);
      clone = null;
      var target = armed;
      setArmed(null);
      origin = null;
      if (dropped && settings.onDrop) settings.onDrop(target ? target.index : null, target ? target.el : null);
    }

    chip.addEventListener("pointerdown", function (event) {
      if (event.button !== undefined && event.button !== 0) return;
      if (chip.disabled) return;
      pointerId = event.pointerId;
      captured = false;
      startTime = Date.now();
      measureTargets();
      origin = { x: event.clientX, y: event.clientY };
      var rect = chip.getBoundingClientRect();
      origin.rect = rect;
      if (chip.setPointerCapture) {
        try {
          chip.setPointerCapture(pointerId);
          captured = true;
        } catch (error) {
          captured = false;
        }
      }
      event.preventDefault();
    });

    chip.addEventListener("pointermove", function (event) {
      if (pointerId === null || event.pointerId !== pointerId) return;
      var dx = event.clientX - origin.x;
      var dy = event.clientY - origin.y;
      if (!active) {
        if (Date.now() - startTime < 90 && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        active = true;
        document.body.style.userSelect = "none";
        if (settings.onStart) settings.onStart();
        makeClone(origin.rect);
      }
      window.requestAnimationFrame(function () {
        moveClone(event.clientX, event.clientY);
      });
      setArmed(hitTest(event.clientX, event.clientY));
      event.preventDefault();
    });

    chip.addEventListener("pointerup", function (event) {
      if (pointerId === null || event.pointerId !== pointerId) return;
      var wasActive = active;
      finish(wasActive);
      event.preventDefault();
    });

    chip.addEventListener("pointercancel", function () {
      finish(false);
    });

    return {
      update: function (next) {
        targets = next || [];
      },
      refresh: measureTargets
    };
  }

  window.QZ.Motion = {
    reduced: reduced,
    duration: duration,
    enter: enter,
    leave: leave,
    swap: swap,
    syncHeight: syncHeight,
    releaseHeight: releaseHeight,
    stagger: stagger,
    animateWidth: animateWidth,
    drag: drag
  };
})();