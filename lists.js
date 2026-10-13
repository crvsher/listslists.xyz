// lists lists: every visit to a list sets it in a randomly chosen face and style, sized to the
// window, the list's length and its longest line. Some lines too long for the screen run to the
// edge and turn the corner, or cram the rest in smaller, like a hand-lettered sign. Which lines
// do that depends only on the window: every line too long for it does, recomputed on resize.
(() => {
  "use strict";

  // Google Fonts families: e-reader faces and the ones type forums keep recommending.
  const FONTS = [
    // serif
    "Literata", "EB Garamond", "Crimson Pro", "Libre Baskerville", "Lora", "Merriweather",
    "Source Serif 4", "Spectral", "Cormorant Garamond", "Alegreya", "Vollkorn", "Gentium Book Plus",
    "Newsreader", "Fraunces", "Instrument Serif", "Playfair Display", "Bodoni Moda", "Old Standard TT",
    "Cardo", "Sorts Mill Goudy", "PT Serif", "Bitter", "Domine", "Libre Caslon Text", "IM Fell English",
    // sans
    "Atkinson Hyperlegible", "Inter", "IBM Plex Sans", "Work Sans", "Fira Sans", "Space Grotesk",
    "Libre Franklin", "Alegreya Sans", "PT Sans", "Manrope", "Archivo", "Syne", "Public Sans", "Jost",
    "Lexend", "Figtree", "Karla",
    // mono
    "IBM Plex Mono", "JetBrains Mono", "Fira Code", "Space Mono", "Courier Prime", "Inconsolata",
    "Victor Mono", "DM Mono", "Overpass Mono", "Cousine", "Martian Mono", "Azeret Mono",
    // odd ones
    "Major Mono Display", "Unica One",
  ];
  const PAPERS = [
    ["#fbf8f1", "#1b1b1b"], ["#111111", "#f2efe6"], ["#f4e9d8", "#3a2a1a"], ["#ffffff", "#0033cc"],
    ["#ffe94d", "#111111"], ["#e9f1ea", "#16351f"], ["#1d1f3a", "#f7d488"], ["#f7f2ff", "#3b1d6e"],
    ["#fff5f5", "#b3001b"], ["#eeeeee", "#222222"], ["#0b3d2e", "#e8f5e9"], ["#fdf0e6", "#c2410c"],
  ];
  const MARKERS = ["disc", "decimal", "none", "lower-roman", "circle", "square", "lower-alpha",
                   '"— "', '"* "', '"→ "', "decimal-leading-zero", "none"];

  const pick = a => a[Math.floor(Math.random() * a.length)];
  const chance = p => Math.random() < p;
  const rand = (lo, hi) => lo + Math.random() * (hi - lo);

  const params = new URLSearchParams(location.search);
  const font = params.get("font") || pick(FONTS);
  const forceKid = params.get("kid");                        // "down" or "cram", for testing
  const [paper, ink] = pick(PAPERS);
  const style = {
    align: chance(.6) ? "left" : chance(.6) ? "center" : "right",
    marker: pick(MARKERS),
    italic: chance(.15),
    spacing: 0,
    leading: rand(.95, 1.35),
    heading: rand(1, 1.7),
  };
  style.spacing = rand(-.03, .05);   // casing always stays as written in the list

  function loadFont() {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=" +
      encodeURIComponent(font).replace(/%20/g, "+") + "&display=block";
    document.head.appendChild(link);
    const ready = new Promise(res => { link.onload = res; link.onerror = res; })
      .then(() => document.fonts.load(`400 48px "${font}"`))
      .catch(() => {});
    return Promise.race([ready, new Promise(res => setTimeout(res, 3500))]);
  }

  function applyStyle(main) {
    const b = document.body.style;
    b.background = paper;
    b.color = ink;
    b.fontFamily = `"${font}", Georgia, serif`;
    main.style.textAlign = style.align;
    main.style.letterSpacing = style.spacing.toFixed(3) + "em";
    main.style.lineHeight = style.leading.toFixed(2);
    main.style.fontStyle = style.italic ? "italic" : "normal";
    main.querySelectorAll("ul, ol").forEach(l => {
      l.style.listStyleType = style.marker;
      l.style.listStylePosition = style.align === "left" ? "outside" : "inside";
      if (style.align !== "left") l.style.paddingLeft = "0";
    });
    const h = main.querySelector("h1");
    if (h) h.style.fontSize = style.heading.toFixed(2) + "em";
  }

  // Largest size where the list fits its height budget without any word poking out the side.
  // Short lists get a screenful; long ones are allowed a few screens and stay readable.
  function fit(main) {
    const n = Math.max(1, main.querySelectorAll("li").length);
    const budget = innerHeight * Math.min(6, Math.max(.8, n / 9));
    let lo = 14, hi = 260;
    for (let i = 0; i < 18; i++) {
      const s = (lo + hi) / 2;
      main.style.fontSize = s + "px";
      const ok = main.scrollHeight <= budget && main.scrollWidth <= main.clientWidth + 1;
      if (ok) lo = s; else hi = s;
    }
    main.style.fontSize = Math.floor(lo) + "px";
    return lo;
  }

  // Width of `text` set like the item it belongs to.
  function width(li, text) {
    const probe = document.createElement("span");
    probe.style.whiteSpace = "nowrap";
    probe.textContent = text;
    li.appendChild(probe);
    const w = probe.getBoundingClientRect().width;
    probe.remove();
    return w;
  }

  function kidSigns(main, size) {
    main.querySelectorAll("li").forEach(li => {
      const W = li.clientWidth;
      const first = li.firstChild;
      if (!first || first.nodeType !== 3) return;           // only plain-text items
      if (li.querySelector("a")) return;
      const text = first.textContent.trim();
      if (!text || width(li, text) <= W * .98) return;       // fits on one line
      const room = W - size * 1.1;                           // keep a column for the turn
      let lo = 1, hi = text.length;
      while (lo < hi) {                                      // longest prefix that fits
        const mid = Math.ceil((lo + hi) / 2);
        if (width(li, text.slice(0, mid)) <= room) lo = mid; else hi = mid - 1;
      }
      const head = text.slice(0, lo), rest = text.slice(lo);
      if (!rest) return;
      const sign = document.createElement("span");
      sign.className = "kid";
      const run = document.createElement("span");
      run.className = "run";
      run.textContent = head;
      sign.appendChild(run);
      // Letter spacing is in em, and inherited spacing is fixed at the parent's size: reset it.
      const spacing = style.spacing.toFixed(3) + "em";
      const down = forceKid ? forceKid === "down" : rest.length <= 26;
      if (down) {                                            // turn the corner and go down
        const down = document.createElement("span");
        down.className = "down";
        down.textContent = rest.replace(/ /g, " ");
        sign.appendChild(down);
      } else {                                               // cram the rest in smaller
        let scale = Math.min(.7, (W * .95) / width(li, rest));
        const wrap = scale < .3;                             // too much for one line: cram several
        if (wrap) scale = .45;
        const cram = document.createElement("span");
        cram.className = "cram";
        cram.style.fontSize = scale.toFixed(3) + "em";
        cram.style.whiteSpace = wrap ? "normal" : "nowrap";
        cram.style.letterSpacing = spacing;
        cram.textContent = rest;
        sign.style.display = "block";
        sign.appendChild(cram);
      }
      li.replaceChild(sign, first);
    });
  }

  function credit() {
    const nav = document.querySelector("nav");
    if (!nav) return;
    const s = document.createElement("span");
    s.style.cssText = "float:right;opacity:.6";
    s.textContent = font;
    nav.appendChild(s);
  }

  async function run() {
    const main = document.querySelector("main");
    if (!main) return;
    const original = main.innerHTML;
    await loadFont();
    const render = () => {
      main.innerHTML = original;
      applyStyle(main);
      const size = fit(main);
      kidSigns(main, size);
    };
    render();
    credit();
    document.body.classList.add("styled");
    let t;
    let lastW = innerWidth;
    addEventListener("resize", () => {
      if (Math.abs(innerWidth - lastW) < 30) return;         // ignore mobile toolbar jiggle
      lastW = innerWidth;
      clearTimeout(t);
      t = setTimeout(render, 200);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
