(() => {
  const STORAGE_KEY = "nas_enabled";

  const state = {
    enabled: true,
    lastClickAtMs: 0,
    observer: null,
    intervalId: null,
    started: false
  };

  function now() {
    return Date.now();
  }

  function log(...args) {
    // Keep quiet by default; enable for debugging if needed.
    // console.debug("[Netflix Auto Skip Intro]", ...args);
    void args;
  }

  function getEnabledFromStorage() {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.get({ [STORAGE_KEY]: true }, (items) => {
          resolve(Boolean(items?.[STORAGE_KEY]));
        });
      } catch {
        resolve(true);
      }
    });
  }

  function setEnabled(nextEnabled) {
    state.enabled = Boolean(nextEnabled);
    log("enabled =", state.enabled);
  }

  function normalizedText(el) {
    if (!el) return "";
    const txt =
      (el.getAttribute?.("aria-label") || "") +
      " " +
      (el.textContent || "") +
      " " +
      (el.getAttribute?.("data-uia") || "");
    return txt.replace(/\s+/g, " ").trim().toLowerCase();
  }

  function isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect?.();
    if (!rect) return false;
    if (rect.width <= 1 || rect.height <= 1) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    return true;
  }

  function tryClick(el, reason) {
    if (!state.enabled) return false;
    if (!el) return false;
    if (!isVisible(el)) return false;

    const cooldownMs = 1200;
    const t = now();
    if (t - state.lastClickAtMs < cooldownMs) return false;

    try {
      el.click();
      state.lastClickAtMs = t;
      log("clicked:", reason, el);
      return true;
    } catch (e) {
      log("click failed:", e);
      return false;
    }
  }

  function findButtons() {
    // Netflix commonly uses data-uia hooks for player controls.
    const selectors = [
      'button[data-uia="player-skip-intro"]',
      'button[data-uia="player-skip-recap"]',
      'button[data-uia="player-skip"]',
      // Fallbacks: less stable but helpful when Netflix changes attributes.
      'button[aria-label*="Skip Intro" i]',
      'button[aria-label*="Skip recap" i]',
      'button[aria-label*="Skip" i]'
    ];

    const found = [];
    for (const sel of selectors) {
      try {
        document.querySelectorAll(sel).forEach((b) => found.push(b));
      } catch {
        // ignore selector errors
      }
    }

    // Text-based fallback: scan visible buttons in player overlay.
    try {
      const allButtons = Array.from(document.querySelectorAll("button"));
      for (const b of allButtons) {
        const t = normalizedText(b);
        if (!t) continue;
        if (
          t.includes("skip intro") ||
          t.includes("skip recap") ||
          t === "skip" ||
          t.includes("skip to next episode") ||
          t.includes("next episode")
        ) {
          found.push(b);
        }
      }
    } catch {
      // ignore
    }

    // De-duplicate while preserving order.
    return Array.from(new Set(found));
  }

  function tick() {
    if (!state.enabled) return;

    const buttons = findButtons();
    if (!buttons.length) return;

    for (const b of buttons) {
      const t = normalizedText(b);

      // Be conservative: prefer specific skips over generic "next episode".
      if (t.includes("skip intro")) {
        if (tryClick(b, "skip intro")) return;
      }
    }
    for (const b of buttons) {
      const t = normalizedText(b);
      if (t.includes("skip recap")) {
        if (tryClick(b, "skip recap")) return;
      }
    }
    for (const b of buttons) {
      const t = normalizedText(b);
      if (t.includes("skip")) {
        if (tryClick(b, "skip (generic)")) return;
      }
    }
  }

  function start() {
    if (state.started) return;
    state.started = true;

    // MutationObserver makes this responsive to Netflix UI changes.
    state.observer = new MutationObserver(() => tick());
    try {
      state.observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style", "aria-label", "data-uia"]
      });
    } catch {
      // ignore
    }

    // Interval fallback in case mutations are missed.
    state.intervalId = window.setInterval(tick, 900);

    // Initial attempt.
    tick();
  }

  function listenForStorageChanges() {
    try {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "sync") return;
        if (!changes?.[STORAGE_KEY]) return;
        setEnabled(Boolean(changes[STORAGE_KEY].newValue));
      });
    } catch {
      // ignore
    }
  }

  (async () => {
    setEnabled(await getEnabledFromStorage());
    listenForStorageChanges();
    start();
  })();
})();

