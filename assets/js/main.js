// Cal.com booking: opens as an embedded popup; falls back to a plain new-tab link if the embed can't load.
const CAL_LINK = "warplydesigned/20-min-bottleneck-audit";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealElements.forEach((el) => revealObserver.observe(el));
} else {
  revealElements.forEach((el) => el.classList.add("is-visible"));
}

const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const emailLinks = document.querySelectorAll("[data-email-user][data-email-domain]");
emailLinks.forEach((link) => {
  const user = link.dataset.emailUser;
  const domain = link.dataset.emailDomain;
  if (!user || !domain) {
    return;
  }

  const subject = link.dataset.mailtoSubject || "";
  const body = link.dataset.mailtoBody || "";
  const params = [];
  if (subject) {
    params.push(`subject=${encodeURIComponent(subject)}`);
  }
  if (body) {
    params.push(`body=${encodeURIComponent(body)}`);
  }

  const query = params.length ? `?${params.join("&")}` : "";
  link.setAttribute("href", `mailto:${user}@${domain}${query}`);
});

(function (C, A, L) {
  const p = (a, ar) => a.q.push(ar);
  const d = C.document;
  C.Cal = C.Cal || function () {
    const cal = C.Cal;
    const ar = arguments;
    if (!cal.loaded) {
      cal.ns = {};
      cal.q = cal.q || [];
      const s = d.head.appendChild(d.createElement("script"));
      s.src = A;
      s.onerror = () => { C.calFailed = true; };
      cal.loaded = true;
    }
    if (ar[0] === L) {
      const api = function () { p(api, arguments); };
      api.q = api.q || [];
      p(cal, ar);
      return;
    }
    p(cal, ar);
  };
})(window, "https://app.cal.com/embed/embed.js", "init");

Cal("init", { origin: "https://app.cal.com" });
Cal("ui", { theme: "dark", styles: { branding: { brandColor: "#34d399" } }, hideEventTypeDetails: false, layout: "month_view" });

document.querySelectorAll("[data-booking]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (window.calFailed) {
      return; // let the link open Cal.com in a new tab
    }
    event.preventDefault();
    Cal("modal", { calLink: CAL_LINK, config: { layout: "month_view", theme: "dark" } });
  });
});

// ---- Hero: AI workflow pipeline preview (lightweight DOM animation, no dependencies) ----
const pipeIn = document.getElementById("pipe-in");
const pipeOut = document.getElementById("pipe-out");
if (pipeIn && pipeOut) {
  const items = [
    { raw: "re: invoice 4471 ??? pls fix", out: "Billing · Invoice #4471", tag: "auto", ms: 820 },
    { raw: "URGENT cant login SSO!!", out: "Access · SSO reset", tag: "auto", ms: 640 },
    { raw: "PO_final_v3 (1).pdf", out: "Order · PO-2291 matched", tag: "auto", ms: 1100 },
    { raw: "refund?? double charged", out: "Refund > $500 · review", tag: "review", ms: 950 },
    { raw: "need report by fri thx", out: "Report · Weekly ops", tag: "auto", ms: 710 },
    { raw: "cust data export req", out: "Compliance · needs sign-off", tag: "review", ms: 1240 }
  ];
  const statEls = {
    processed: document.getElementById("stat-processed"),
    auto: document.getElementById("stat-auto"),
    latency: document.getElementById("stat-latency"),
    flag: document.getElementById("stat-flag")
  };
  const bar = document.getElementById("agent-bar");
  const checks = document.querySelectorAll(".chk");
  const MAX_ROWS = 4;
  let processed = 0, auto = 0, flagged = 0, latencySum = 0, idx = 0;

  const addRow = (list, text, cls) => {
    const li = document.createElement("li");
    li.textContent = text;
    if (cls) li.className = cls;
    list.prepend(li);
    while (list.children.length > MAX_ROWS) list.lastChild.remove();
    requestAnimationFrame(() => li.classList.add("in"));
  };

  const updateStats = () => {
    statEls.processed.textContent = String(processed);
    statEls.auto.textContent = processed ? `${Math.round((auto / processed) * 100)}%` : "0%";
    statEls.latency.textContent = processed ? `${Math.round(latencySum / processed)}ms` : "—";
    statEls.flag.textContent = String(flagged);
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const step = async () => {
    const item = items[idx % items.length];
    idx += 1;
    addRow(pipeIn, item.raw, "raw");
    checks.forEach((c) => c.classList.remove("done"));
    bar.style.width = "0%";
    for (let i = 0; i < checks.length; i += 1) {
      await sleep(380);
      bar.style.width = `${((i + 1) / checks.length) * 100}%`;
      if (i < 2 || item.tag === "auto") checks[i].classList.add("done");
    }
    await sleep(250);
    processed += 1;
    latencySum += item.ms;
    if (item.tag === "auto") auto += 1; else flagged += 1;
    addRow(pipeOut, item.out, item.tag);
    updateStats();
  };

  const loop = async () => {
    // Seed instantly so reduced-motion users and first paint see a populated view.
    while (true) {
      await step();
      await sleep(500);
      if (prefersReducedMotion && processed >= items.length) break;
    }
  };

  let started = false;
  const start = () => { if (!started) { started = true; loop(); } };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries, obs) => {
      if (entries.some((e) => e.isIntersecting)) { start(); obs.disconnect(); }
    }).observe(document.getElementById("pipeline"));
  } else {
    start();
  }
}
