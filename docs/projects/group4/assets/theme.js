(function () {
  const STORAGE_KEY = "sleep-signals-theme";
  const root = document.documentElement;
  let button = null;

  function readStoredTheme() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored === "light" || stored === "dark" ? stored : null;
    } catch (error) {
      return null;
    }
  }

  function getTheme() {
    return root.dataset.theme === "light" ? "light" : "dark";
  }

  function setButtonCopy(theme) {
    if (!button) return;
    const current = theme === "light" ? "Light" : "Dark";
    const next = theme === "light" ? "Dark mode" : "Light mode";
    button.querySelector("[data-theme-current]").textContent = current;
    button.querySelector("[data-theme-target]").textContent = next;
    button.setAttribute("aria-label", `Switch to ${next.toLowerCase()}`);
    button.setAttribute("title", `Switch to ${next}`);
  }

  function applyTheme(theme, options = {}) {
    const nextTheme = theme === "light" ? "light" : "dark";
    const persist = options.persist !== false;
    const announce = options.announce !== false;

    root.dataset.theme = nextTheme;

    if (persist) {
      try {
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
      } catch (error) {
        // Ignore storage failures and continue with the in-memory theme.
      }
    }

    setButtonCopy(nextTheme);

    if (announce) {
      window.dispatchEvent(
        new CustomEvent("sleepSignals:themechange", {
          detail: { theme: nextTheme },
        })
      );
    }
  }

  function mountToggle() {
    const navLinks = document.querySelector(".nav-links");
    if (!navLinks || navLinks.querySelector("[data-theme-toggle]")) return;

    button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";
    button.setAttribute("data-theme-toggle", "");
    button.innerHTML = `
      <span class="theme-toggle-track" aria-hidden="true">
        <span class="theme-toggle-thumb"></span>
      </span>
      <span class="theme-toggle-copy">
        <span class="theme-toggle-kicker">Theme</span>
        <strong data-theme-current>Dark</strong>
        <span class="theme-toggle-target" data-theme-target>Light mode</span>
      </span>
    `;

    button.addEventListener("click", () => {
      applyTheme(getTheme() === "dark" ? "light" : "dark");
    });

    navLinks.appendChild(button);
    setButtonCopy(getTheme());
  }

  const initialTheme = readStoredTheme() || "dark";
  root.dataset.theme = initialTheme;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountToggle, { once: true });
  } else {
    mountToggle();
  }

  window.SleepSignalsTheme = {
    applyTheme,
    getTheme,
  };
})();
