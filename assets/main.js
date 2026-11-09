/* ===========================================================
   AAARemakes — site behaviour
   Vanilla JS, no dependencies.
   =========================================================== */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- contact address ----------
     Kept out of the markup and assembled only on click, so the address never
     appears in the HTML, the visible UI, or a plain-text string in the source. */
  const MAIL_PARTS = ["YnJhbmRvbi5ob29rcw==", "ZWNob3NvZnR3YXJlZGV2LmNvbQ=="];
  const mailAddress = () => MAIL_PARTS.map((part) => atob(part)).join("@");
  const openMail = (subject, body) => {
    const query = [];
    if (subject) query.push(`subject=${encodeURIComponent(subject)}`);
    if (body) query.push(`body=${encodeURIComponent(body)}`);
    window.location.href = `mailto:${mailAddress()}${query.length ? `?${query.join("&")}` : ""}`;
  };

  document.querySelector("[data-mail-link]")?.addEventListener("click", () => {
    openMail("AAARemakes enquiry", "");
  });

  /* ---------- footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- header state ---------- */
  const header = document.getElementById("header");
  const progress = document.getElementById("progress");
  const onScroll = () => {
    if (!header) return;
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 12);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    }
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- mobile nav ---------- */
  const navToggle = document.getElementById("navToggle");
  const nav = document.getElementById("nav");

  const setNav = (open) => {
    if (!header || !navToggle) return;
    header.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
  };

  navToggle?.addEventListener("click", () => {
    setNav(!header.classList.contains("nav-open"));
  });

  nav?.addEventListener("click", (e) => {
    if (e.target.closest("a")) setNav(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setNav(false);
  });

  /* ---------- marquee: duplicate content once for a seamless loop ---------- */
  const track = document.getElementById("marqueeTrack");
  if (track && !reduceMotion) {
    track.innerHTML += track.innerHTML;
    track.setAttribute("aria-hidden", "true");
  }

  /* ---------- scroll reveals ---------- */
  const revealItems = document.querySelectorAll("[data-reveal]");
  if (!reduceMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const group = el.parentElement?.querySelectorAll(":scope > [data-reveal]");
          const index = group ? Array.from(group).indexOf(el) : 0;
          el.style.transitionDelay = `${Math.min(index, 5) * 70}ms`;
          el.classList.add("in");
          io.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    revealItems.forEach((el) => io.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("in"));
  }

  /* ---------- hero pointer glow ---------- */
  const glow = document.getElementById("heroGlow");
  const hero = document.querySelector(".hero");
  if (glow && hero && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      glow.style.setProperty("--mx", `${e.clientX - r.left}px`);
      glow.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  }

  /* ---------- FAQ: one open at a time ---------- */
  const faqItems = document.querySelectorAll(".faq details");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ---------- live release info (progressive enhancement) ---------- */
  const REPO = "shade2363/Fallout-4-Ever";
  const setAll = (selector, value) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = value;
    });
  };

  if (document.querySelector("[data-rel-tag]")) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);

    fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      signal: ctrl.signal,
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((rel) => {
        if (!rel || !rel.tag_name) return;
        const tag = rel.tag_name;
        setAll("[data-rel-version]", tag);
        setAll("[data-rel-tag]", tag);

        if (rel.published_at) {
          const when = new Date(rel.published_at);
          if (!Number.isNaN(when.getTime())) {
            setAll(
              "[data-rel-date]",
              when.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
            );
          }
        }

        const assets = rel.assets || [];
        const installer = assets.find((a) => /CapitalConvert.*\.zip$/i.test(a.name));
        if (installer) {
          setAll("[data-rel-size]", `${(installer.size / 1e6).toFixed(1)} MB`);
          document.querySelectorAll("[data-rel-download]").forEach((a) => {
            a.href = installer.browser_download_url;
          });
        }

        const sums = assets.find((a) => /SHA256SUMS/i.test(a.name));
        if (sums) {
          document.querySelectorAll("[data-rel-sums]").forEach((a) => {
            a.href = sums.browser_download_url;
          });
        }
      })
      .catch(() => {
        /* offline or rate-limited: the static values stay in place */
      })
      .finally(() => clearTimeout(timer));
  }

  /* ---------- contact form → mail client ---------- */
  const form = document.getElementById("contactForm");
  const note = document.getElementById("formNote");

  const markInvalid = (field, invalid) => {
    field.closest(".field")?.classList.toggle("invalid", invalid);
  };

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const topic = form.topic.value;
    const message = form.message.value.trim();

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

    markInvalid(form.name, !name);
    markInvalid(form.email, !emailOk);
    markInvalid(form.message, !message);

    if (!name || !emailOk || !message) {
      note.textContent = "Add your name, a valid email and a few details.";
      note.classList.remove("sent");
      form.querySelector(".field.invalid input, .field.invalid textarea")?.focus();
      return;
    }

    const subject = `AAARemakes enquiry — ${topic}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Enquiry: ${topic}`,
      "",
      message,
    ].join("\n");

    openMail(subject, body);

    note.textContent = "Opening your mail client — send the draft and we'll pick it up.";
    note.classList.add("sent");
  });

  /* clear invalid state as the visitor types */
  form?.querySelectorAll("input, textarea").forEach((input) => {
    input.addEventListener("input", () => markInvalid(input, false));
  });
})();
