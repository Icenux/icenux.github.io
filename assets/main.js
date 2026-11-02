/* =========================================================
   Icenux — interactions
   ========================================================= */

(function () {
  "use strict";

  var doc = document;
  var header = doc.getElementById("siteHeader");
  var menuBtn = doc.getElementById("menuBtn");
  var navLinks = doc.getElementById("navLinks");
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header state ---------- */

  function onScroll() {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */

  function closeMenu() {
    if (!menuBtn || !navLinks) return;
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open menu");
    navLinks.classList.remove("is-open");
  }

  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", function () {
      var open = menuBtn.getAttribute("aria-expanded") === "true";
      menuBtn.setAttribute("aria-expanded", String(!open));
      menuBtn.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      navLinks.classList.toggle("is-open", !open);
    });

    navLinks.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });

    doc.addEventListener("click", function (event) {
      if (!navLinks.classList.contains("is-open")) return;
      if (navLinks.contains(event.target) || menuBtn.contains(event.target)) return;
      closeMenu();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  /* ---------- Scroll reveal ---------- */

  var revealEls = doc.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && !prefersReduced) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -50px 0px" }
    );

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------- Card spotlight ---------- */

  if (window.matchMedia("(hover: hover)").matches) {
    doc.querySelectorAll(".app-card").forEach(function (card) {
      card.addEventListener("pointermove", function (event) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((event.clientX - rect.left) / rect.width) * 100 + "%");
        card.style.setProperty("--my", ((event.clientY - rect.top) / rect.height) * 100 + "%");
      });
    });
  }

  /* ---------- Copy buttons ---------- */

  doc.querySelectorAll(".copy-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      var value = button.getAttribute("data-copy") || "";
      var label = button.querySelector("span");
      var original = label ? label.textContent : "";

      function done(ok) {
        button.classList.toggle("is-copied", ok);
        button.classList.toggle("is-error", !ok);
        if (label) label.textContent = ok ? "Copied" : "Press Ctrl+C";
        window.setTimeout(function () {
          button.classList.remove("is-copied", "is-error");
          if (label) label.textContent = original;
        }, 1800);
      }

      function fallbackCopy() {
        var field = doc.createElement("textarea");
        field.value = value;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.top = "-1000px";
        field.style.opacity = "0";
        doc.body.appendChild(field);
        field.select();
        var ok = false;
        try {
          ok = doc.execCommand("copy");
        } catch (error) {
          ok = false;
        }
        doc.body.removeChild(field);
        done(ok);
      }

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value).then(function () {
          done(true);
        }, fallbackCopy);
        return;
      }

      fallbackCopy();
    });
  });

  /* ---------- Footer year ---------- */

  var year = doc.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Search ---------- */

  var searchOverlay = doc.getElementById("searchOverlay");
  var searchOpen = doc.getElementById("searchOpen");
  var searchClose = doc.getElementById("searchClose");
  var searchInput = doc.getElementById("searchInput");
  var searchResults = doc.getElementById("searchResults");

  if (!searchOverlay || !searchOpen || !searchInput || !searchResults) return;

  var shortcutKbd = doc.querySelector(".search-btn__kbd");

  if (shortcutKbd && !/Mac|iPhone|iPad|iPod/.test(navigator.platform)) {
    shortcutKbd.textContent = "Ctrl K";
  }

  var ICONS = {
    home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M4 5.5v15M8 7h8M8 11h6"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.7"/><path d="m4 17 5-5 4 4 3-3 4 4"/>',
    download: '<path d="M12 3v11"/><path d="m7.5 9.5 4.5 4.5 4.5-4.5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    sparkle: '<path d="M12 2 14.4 9.6 22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/>',
    shield: '<path d="M12 3 4 6v5c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6z"/><path d="m9 12 2 2 4-4"/>',
    terminal: '<path d="M4 5h16v14H4z"/><path d="m7 9 3 3-3 3M13 15h4"/>',
    stethoscope: '<path d="M5 3v6a5 5 0 0 0 10 0V3"/><path d="M10 14v3a4 4 0 0 0 8 0v-2"/><circle cx="18" cy="12" r="2.5"/>',
    panel: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M3 15h18M8 15V9M13 15v3M18 15v-5"/>'
  };

  var SITE_INDEX = window.SITE_INDEX || [];

  var activeIndex = 0;
  var renderedResults = [];
  var lastFocused = null;
  var currentQuery = "";

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function tokens(query) {
    return query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(function (token) {
        return token.length > 0;
      });
  }

  function highlight(text, parts) {
    if (!parts.length) return escapeHtml(text);

    var pattern = new RegExp("(" + parts.map(escapeRegExp).join("|") + ")", "ig");
    var segments = text.split(pattern);

    return segments
      .map(function (segment, index) {
        return index % 2 === 1
          ? "<mark>" + escapeHtml(segment) + "</mark>"
          : escapeHtml(segment);
      })
      .join("");
  }

  function score(item, parts, query) {
    var title = item.title.toLowerCase();
    var haystack = (item.title + " " + item.description + " " + item.type).toLowerCase();
    var total = 0;

    for (var i = 0; i < parts.length; i++) {
      if (haystack.indexOf(parts[i]) === -1) return -1;
      if (title.indexOf(parts[i]) !== -1) total += 30;
      if (title.indexOf(parts[i]) === 0) total += 40;
    }

    if (title === query) total += 60;
    if (title.indexOf(query) !== -1) total += 25;

    return total;
  }

  function render(query) {
    currentQuery = query;
    var parts = tokens(query);
    var matches;

    if (!parts.length) {
      matches = SITE_INDEX.slice(0, 8);
    } else {
      matches = SITE_INDEX.map(function (item) {
        return { item: item, score: score(item, parts, query.trim().toLowerCase()) };
      })
        .filter(function (entry) {
          return entry.score > -1;
        })
        .sort(function (a, b) {
          return b.score - a.score;
        })
        .map(function (entry) {
          return entry.item;
        });
    }

    searchResults.innerHTML = "";
    renderedResults = [];
    activeIndex = 0;

    if (!matches.length) {
      var empty = doc.createElement("div");
      empty.className = "search-empty";
      empty.innerHTML =
        "<strong>Nothing found for “" +
        escapeHtml(query.trim()) +
        "”</strong><span>Try “repo-doctor”, “downloads” or “ccc”.</span>";
      searchResults.appendChild(empty);
      return;
    }

    var groups = {};

    matches.forEach(function (item) {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    });

    Object.keys(groups).forEach(function (groupName) {
      var groupEl = doc.createElement("div");
      groupEl.className = "search-group";
      groupEl.textContent = groupName;
      searchResults.appendChild(groupEl);

      groups[groupName].forEach(function (item) {
        var result = doc.createElement("a");
        var index = renderedResults.length;

        result.className = "search-result";
        result.href = item.url;
        result.setAttribute("role", "option");
        result.setAttribute("aria-selected", "false");
        result.dataset.index = String(index);
        result.innerHTML =
          '<span class="search-result__icon"><svg viewBox="0 0 24 24" aria-hidden="true">' +
          (ICONS[item.icon] || ICONS.sparkle) +
          "</svg></span>" +
          '<span class="search-result__text">' +
          '<span class="search-result__title">' +
          highlight(item.title, parts) +
          "</span>" +
          '<span class="search-result__desc">' +
          highlight(item.description, parts) +
          "</span>" +
          "</span>" +
          '<span class="search-result__type">' +
          escapeHtml(item.type) +
          "</span>";

        result.addEventListener("click", function () {
          closeSearch(false);
        });

        searchResults.appendChild(result);
        renderedResults.push(result);
      });
    });

    setActiveResult(0, false);
  }

  function setActiveResult(index, scrollIntoView) {
    if (!renderedResults.length) return;

    if (index < 0) index = renderedResults.length - 1;
    if (index >= renderedResults.length) index = 0;

    activeIndex = index;

    renderedResults.forEach(function (result, i) {
      var isActive = i === activeIndex;
      result.classList.toggle("is-active", isActive);
      result.setAttribute("aria-selected", String(isActive));
    });

    if (scrollIntoView) {
      renderedResults[activeIndex].scrollIntoView({ block: "nearest" });
    }
  }

  function openSearch() {
    if (!searchOverlay.hidden) return;

    lastFocused = doc.activeElement;
    searchOverlay.hidden = false;
    doc.body.classList.add("is-locked");

    window.requestAnimationFrame(function () {
      searchOverlay.classList.add("is-open");
      searchInput.focus();
      searchInput.select();
    });
  }

  function closeSearch(restoreFocus) {
    if (searchOverlay.hidden) return;

    searchOverlay.classList.remove("is-open");
    doc.body.classList.remove("is-locked");
    searchInput.value = "";
    render("");

    window.setTimeout(function () {
      searchOverlay.hidden = true;
      if (restoreFocus !== false && lastFocused && lastFocused.focus) {
        lastFocused.focus();
      }
    }, prefersReduced ? 0 : 220);
  }

  searchOpen.addEventListener("click", openSearch);
  if (searchClose) {
    searchClose.addEventListener("click", function () {
      closeSearch(true);
    });
  }

  searchOverlay.addEventListener("mousedown", function (event) {
    if (event.target === searchOverlay) closeSearch(true);
  });

  searchInput.addEventListener("input", function () {
    render(searchInput.value);
  });

  searchInput.addEventListener("keydown", function (event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveResult(activeIndex + 1, true);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveResult(activeIndex - 1, true);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (renderedResults[activeIndex]) {
        window.location.href = renderedResults[activeIndex].getAttribute("href");
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeSearch(true);
    }
  });

  searchOverlay.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch(true);
    }

    if (event.key === "Tab") {
      var focusables = searchOverlay.querySelectorAll(
        "input, button, a[href]"
      );
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];

      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  doc.addEventListener("keydown", function (event) {
    var key = event.key.toLowerCase();
    var target = event.target;
    var isTyping =
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable);

    if ((event.metaKey || event.ctrlKey) && key === "k") {
      event.preventDefault();
      if (searchOverlay.hidden) openSearch();
      else closeSearch(true);
      return;
    }

    if (key === "/" && !isTyping && searchOverlay.hidden) {
      event.preventDefault();
      openSearch();
    }
  });

  render("");
})();
