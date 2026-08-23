/* Ismat Allam — homepage animations.
   Everything here is decorative: the page works with JS disabled, and all
   motion is turned off when the visitor prefers reduced motion. */
"use strict";

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ============ scroll reveal ============ */
{
  const els = document.querySelectorAll(".reveal");
  if (REDUCED || !("IntersectionObserver" in window)) {
    els.forEach(el => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(entries => {
      for (const e of entries)
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }, {threshold: 0.12});
    els.forEach(el => io.observe(el));
  }
}

/* ============ typing roles ============ */
{
  const el = document.getElementById("roleText");
  const ROLES = ["real-time data pipelines", "neural nets from scratch",
                 "155-year market backtests", "algorithms you can watch think"];
  if (el && !REDUCED) {
    let r = 0, i = ROLES[0].length, dir = 1, hold = 30;
    setInterval(() => {
      if (hold > 0) { hold--; return; }
      i += dir;
      if (dir > 0 && i >= ROLES[r].length) { hold = 45; dir = -1; i = ROLES[r].length; }
      if (dir < 0 && i <= 0) { dir = 1; r = (r + 1) % ROLES.length; hold = 6; }
      el.textContent = ROLES[r].slice(0, Math.max(i, 0));
    }, 45);
  }
}

/* ============ hero particle network ============ */
{
  const cv = document.getElementById("heroCanvas");
  if (cv && !REDUCED) {
    const ctx = cv.getContext("2d");
    let W, H, pts = [];
    const DPR = Math.min(devicePixelRatio || 1, 2);
    const mouse = {x: -1e4, y: -1e4};
    function size() {
      const r = cv.parentElement.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W * DPR; cv.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const n = Math.min(70, Math.floor(W / 18));
      pts = Array.from({length: n}, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      }));
    }
    size();
    addEventListener("resize", size);
    cv.parentElement.addEventListener("mousemove", e => {
      const r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    cv.parentElement.addEventListener("mouseleave", () => { mouse.x = mouse.y = -1e4; });
    const LINK = 115;
    let running = true;
    new IntersectionObserver(es => { running = es[0].isIntersecting; }).observe(cv);
    (function frame() {
      requestAnimationFrame(frame);
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        // gentle pull toward the cursor
        const dx = mouse.x - p.x, dy = mouse.y - p.y, d2 = dx * dx + dy * dy;
        if (d2 < 160 * 160) { p.x += dx * 0.002; p.y += dy * 0.002; }
      }
      ctx.lineWidth = 1;
      for (let a = 0; a < pts.length; a++) {
        for (let b = a + 1; b < pts.length; b++) {
          const dx = pts[a].x - pts[b].x, dy = pts[a].y - pts[b].y;
          const d = Math.hypot(dx, dy);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(57,135,229,${0.16 * (1 - d / LINK)})`;
            ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "rgba(57,135,229,0.55)";
      for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, 7); ctx.fill(); }
    })();
  }
}

/* ============ live mini-demos in the project cards ============ */
const minis = [];
function registerMini(canvas, stepFn, staticFn) {
  if (!canvas) return;
  if (REDUCED) { staticFn(); return; }
  const m = {canvas, step: stepFn, visible: false};
  new IntersectionObserver(es => { m.visible = es[0].isIntersecting; }).observe(canvas);
  minis.push(m);
}
let last = 0;
(function miniLoop(t) {
  requestAnimationFrame(miniLoop);
  if (t - last < 33) return;           // ~30 fps is plenty
  last = t;
  for (const m of minis) if (m.visible) m.step();
})(0);

/* ---- mini 1: BFS flood through a random maze ---- */
{
  const cv = document.getElementById("miniPath");
  if (cv) {
    const ctx = cv.getContext("2d");
    const CW = 26, CH = 14, cell = cv.width / CW;
    let walls, order, path, k, phase, holdN;
    function gen() {
      const idx = (c, r) => r * CW + c;
      while (true) {
        walls = Array.from({length: CW * CH}, () => Math.random() < 0.24);
        const s = idx(1, Math.floor(CH / 2)), e = idx(CW - 2, Math.floor(CH / 2));
        walls[s] = walls[e] = false;
        // BFS
        const parent = new Int32Array(CW * CH).fill(-1), seen = new Uint8Array(CW * CH);
        const q = [s]; seen[s] = 1; order = [];
        while (q.length) {
          const i = q.shift(); order.push(i);
          if (i === e) break;
          const c = i % CW, r = (i / CW) | 0;
          for (const [nc, nr] of [[c+1,r],[c-1,r],[c,r+1],[c,r-1]])
            if (nc >= 0 && nc < CW && nr >= 0 && nr < CH) {
              const n = idx(nc, nr);
              if (!seen[n] && !walls[n]) { seen[n] = 1; parent[n] = i; q.push(n); }
            }
        }
        if (!seen[e]) continue;          // unlucky maze — try again
        path = []; for (let i = e; i !== -1; i = parent[i]) path.push(i);
        path.reverse(); k = 0; phase = 0; holdN = 26;
        return {s, e};
      }
    }
    let ends = gen();
    ctx.imageSmoothingEnabled = false;
    function draw(visN, pathN) {
      ctx.fillStyle = "#161615"; ctx.fillRect(0, 0, cv.width, cv.height);
      for (let i = 0; i < CW * CH; i++) {
        const x = (i % CW) * cell, y = ((i / CW) | 0) * cell;
        if (walls[i]) { ctx.fillStyle = "#3d3c37"; ctx.fillRect(x, y, cell - 1, cell - 1); }
      }
      ctx.fillStyle = "rgba(57,135,229,0.55)";
      for (let j = 0; j < visN; j++) {
        const i = order[j], x = (i % CW) * cell, y = ((i / CW) | 0) * cell;
        ctx.fillRect(x, y, cell - 1, cell - 1);
      }
      ctx.fillStyle = "#eda100";
      for (let j = 0; j < pathN; j++) {
        const i = path[j], x = (i % CW) * cell, y = ((i / CW) | 0) * cell;
        ctx.fillRect(x, y, cell - 1, cell - 1);
      }
      const dot = (i, col) => {
        ctx.fillStyle = col;
        ctx.fillRect((i % CW) * cell, ((i / CW) | 0) * cell, cell - 1, cell - 1);
      };
      dot(ends.s, "#0ca30c"); dot(ends.e, "#d03b3b");
    }
    registerMini(cv, () => {
      if (phase === 0) { k += 7; if (k >= order.length) { k = order.length; phase = 1; } draw(k, 0); }
      else if (phase === 1) { k += 1.5; if (k >= path.length + 8) phase = 2; draw(order.length, Math.min(path.length, k | 0)); }
      else if (--holdN <= 0) { ends = gen(); }
    }, () => { draw(order.length, path.length); });
  }
}

/* ---- mini 2: logistic regression learning the circles data, live ---- */
{
  const cv = document.getElementById("miniNN");
  if (cv) {
    const ctx = cv.getContext("2d");
    const F = p => [1, p.x, p.y, p.x * p.x, p.y * p.y, p.x * p.y];  // poly features
    let w, data, iter;
    function reset() {
      w = F({x: 0, y: 0}).map(() => (Math.random() - 0.5) * 0.4);
      iter = 0;
      data = [];
      for (let i = 0; i < 46; i++) {
        const t = Math.random() * 7, r = Math.random() * 0.34;
        data.push({x: r * Math.cos(t), y: r * Math.sin(t), l: 0});
      }
      for (let i = 0; i < 46; i++) {
        const t = Math.random() * 7, r = 0.62 + Math.random() * 0.3;
        data.push({x: r * Math.cos(t), y: r * Math.sin(t), l: 1});
      }
    }
    const sig = z => 1 / (1 + Math.exp(-z));
    const predict = p => sig(F(p).reduce((s, f, i) => s + f * w[i], 0));
    function trainSteps(n) {
      for (let s = 0; s < n; s++) {
        const g = w.map(() => 0);
        for (const p of data) {
          const err = predict(p) - p.l, f = F(p);
          for (let i = 0; i < w.length; i++) g[i] += err * f[i];
        }
        for (let i = 0; i < w.length; i++) w[i] -= 0.9 / data.length * g[i];
      }
      iter += n;
    }
    const GX = 44, GY = 24;
    function draw() {
      const cw = cv.width / GX, ch = cv.height / GY;
      for (let gy = 0; gy < GY; gy++)
        for (let gx = 0; gx < GX; gx++) {
          const p = predict({x: (gx + 0.5) / GX * 2.2 - 1.1, y: (gy + 0.5) / GY * 2.2 - 1.1});
          const t = Math.abs(p - 0.5) * 2, dark = [26, 26, 25],
                col = p < 0.5 ? [57, 135, 229] : [217, 89, 38], k = 0.12 + 0.5 * t;
          ctx.fillStyle = `rgb(${dark.map((d, i) => Math.round(d + (col[i] - d) * k)).join(",")})`;
          ctx.fillRect(gx * cw, gy * ch, cw + 1, ch + 1);
        }
      for (const p of data) {
        ctx.beginPath();
        ctx.arc((p.x + 1.1) / 2.2 * cv.width, (p.y + 1.1) / 2.2 * cv.height, 2.6, 0, 7);
        ctx.fillStyle = p.l ? "#d95926" : "#3987e5"; ctx.fill();
      }
    }
    reset();
    registerMini(cv, () => {
      trainSteps(6); draw();
      if (iter > 900) reset();          // start over so it keeps "learning"
    }, () => { trainSteps(900); draw(); });
  }
}

/* ---- mini 3: convolution presets cycling on a sample image ---- */
{
  const cv = document.getElementById("miniKernel");
  if (cv) {
    const ctx = cv.getContext("2d");
    const KS = [
      ["Original",  [0,0,0,0,1,0,0,0,0], 1, 0],
      ["Edge detect", [-1,-1,-1,-1,8,-1,-1,-1,-1], 1, 0],
      ["Emboss",    [-2,-1,0,-1,1,1,0,1,2], 1, 60],
      ["Sobel",     [-1,0,1,-2,0,2,-1,0,1], 1, 40],
      ["Blur",      [1,2,1,2,4,2,1,2,1], 16, 0],
    ];
    const im = new Image();
    let base = null, ki = 0, tick = 0;
    im.onload = () => {
      const oc = document.createElement("canvas");
      oc.width = cv.width; oc.height = cv.height;
      const octx = oc.getContext("2d");
      // cover-fit the sample into the card canvas
      const sc = Math.max(cv.width / im.width, cv.height / im.height);
      octx.drawImage(im, (cv.width - im.width * sc) / 2, (cv.height - im.height * sc) / 2,
                     im.width * sc, im.height * sc);
      base = octx.getImageData(0, 0, cv.width, cv.height);
      apply();
    };
    im.src = "data:image/png;base64,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";
    function apply() {
      if (!base) return;
      const [name, K, dv, of] = KS[ki];
      const w = cv.width, h = cv.height, s = base.data;
      const out = ctx.createImageData(w, h), o = out.data;
      for (let y = 0; y < h; y++) {
        const ym = Math.max(y - 1, 0), yp = Math.min(y + 1, h - 1);
        for (let x = 0; x < w; x++) {
          const xm = Math.max(x - 1, 0), xp = Math.min(x + 1, w - 1);
          const i4 = (y * w + x) * 4;
          const n = [(ym*w+xm)*4,(ym*w+x)*4,(ym*w+xp)*4,(y*w+xm)*4,i4,(y*w+xp)*4,(yp*w+xm)*4,(yp*w+x)*4,(yp*w+xp)*4];
          for (let c = 0; c < 3; c++) {
            let v = of;
            for (let j = 0; j < 9; j++) v += s[n[j] + c] * K[j] / dv;
            o[i4 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
          }
          o[i4 + 3] = 255;
        }
      }
      ctx.putImageData(out, 0, 0);
      ctx.fillStyle = "rgba(13,13,13,0.72)";
      ctx.fillRect(8, cv.height - 26, ctx.measureText(name).width + 46, 19);
      ctx.fillStyle = "#c3c2b7"; ctx.font = "600 11px system-ui";
      ctx.fillText("kernel: " + name, 14, cv.height - 13);
    }
    registerMini(cv, () => {
      if (++tick % 55 === 0) { ki = (ki + 1) % KS.length; apply(); }
    }, () => { ki = 1; apply(); });
  }
}
