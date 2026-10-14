// lists lists: every visit to a list sets it in a randomly chosen face and style, sized to the
// window, the list's length and its longest line. Some lines too long for the screen run to the
// edge and turn the corner (letters tilted 45° on the way down), or cram the rest in smaller, like
// a hand-lettered sign. One visit in fifty does that to one line too long for the window
// (recomputed on resize); every other visit wraps normally.
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
    ["#fff8e7", "#7a1f00"], ["#0f1e3d", "#ffd6a5"], ["#f0fff4", "#05603a"], ["#2b0a3d", "#ffb3f6"],
    ["#ffefd5", "#5b2c06"], ["#002b36", "#93e1d8"], ["#fdf6e3", "#073642"], ["#ff6b6b", "#1a0000"],
    ["#ffd1dc", "#6b0f2b"], ["#e0f7fa", "#004d57"], ["#3d0000", "#ffcfa3"], ["#f5f5dc", "#3b3b00"],
    ["#000000", "#39ff14"], ["#14213d", "#fca311"], ["#ffffff", "#008000"], ["#ffe4e1", "#8b0000"],
    ["#283618", "#fefae0"], ["#fefae0", "#bc4749"], ["#cdeac0", "#2d3a1f"], ["#03045e", "#caf0f8"],
    ["#f8edeb", "#6d597a"], ["#2d00f7", "#ffffff"], ["#ff9f1c", "#1d1d1d"], ["#a8dadc", "#1d3557"],
    ["#ffffff", "#7b2cbf"], ["#1e1e1e", "#ff8c42"], ["#f2e8cf", "#386641"], ["#ffc6ff", "#3a0ca3"],
    ["#06d6a0", "#073b4c"], ["#ffbe0b", "#3a0ca3"], ["#22223b", "#f2e9e4"], ["#ffd6e0", "#0b3954"],
    ["#00a6fb", "#001b2e"],
  ];
  const MARKERS = ["disc", "decimal", "none", "lower-roman", "circle", "square", "lower-alpha",
                   '"— "', '"* "', '"→ "', "decimal-leading-zero", "none"];

  const pick = a => a[Math.floor(Math.random() * a.length)];
  const chance = p => Math.random() < p;
  const rand = (lo, hi) => lo + Math.random() * (hi - lo);

  const params = new URLSearchParams(location.search);
  const forceKid = params.get("kid");                        // "down" or "cram", for testing
  const isIndex = document.body.classList.contains("index");
  let font, paper, ink, style, kidVisit;

  // Pick this visit's look; the rainbow button picks again.
  function roll(first) {
    font = (first && params.get("font")) || pick(FONTS.filter(f => f !== font));
    [paper, ink] = pick(PAPERS.filter(p => p[0] !== paper));
    // One visit in fifty gets a kid-sign line, never more than one per list (user, 2026-10-13).
    kidVisit = forceKid ? true : chance(.02);
    style = {
      // The index is always left-aligned (user); lists can be left, centred or right.
      align: isIndex ? "left" : chance(.6) ? "left" : chance(.6) ? "center" : "right",
      marker: pick(MARKERS),
      italic: chance(.15),
      spacing: rand(-.03, .05),     // casing always stays as written in the list
      leading: rand(.95, 1.35),
      heading: rand(1, 1.7),
    };
  }
  roll(true);

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
    if (!kidVisit) return;
    // Never more than one per list: pick one of the lines too long for the window.
    const long = [...main.querySelectorAll("li")].filter(li => {
      const first = li.firstChild;
      if (!first || first.nodeType !== 3 || li.querySelector("a")) return false;  // plain text only
      const text = first.textContent.trim();
      return text && width(li, text) > li.clientWidth * .98;
    });
    if (!long.length) return;
    [pick(long)].forEach(li => {
      const W = li.clientWidth;
      const first = li.firstChild;
      const text = first.textContent.trim();
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
        const col = document.createElement("span");
        col.className = "down";
        for (const ch of rest) {                             // each letter tilted as it heads down
          const l = document.createElement("span");
          l.textContent = ch === " " ? "\u00a0" : ch;
          col.appendChild(l);
        }
        sign.appendChild(col);
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
    let s = nav.querySelector(".font-name");
    if (!s) {
      s = document.createElement("span");
      s.className = "font-name";
      s.style.cssText = "float:right;opacity:.6";
      nav.appendChild(s);
    }
    s.textContent = font;
  }

  // A rainbow button at the top of every page that restyles it in place.
  function restyleButton(main, render) {
    const b = document.createElement("button");
    b.className = "restyle";
    b.type = "button";
    b.setAttribute("aria-label", "Restyle");
    b.title = "Restyle";
    b.addEventListener("click", async () => {
      b.disabled = true;
      roll(false);
      await loadFont();
      render();
      b.disabled = false;
    });
    document.body.insertBefore(b, main);
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
      credit();
    };
    restyleButton(main, render);
    render();
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
