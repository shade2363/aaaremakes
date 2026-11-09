/* ===========================================================
   AAARemakes — animated background
   Slow ember/dust motes rising through the page, drawn at 30fps
   on a fixed canvas. Pauses when the tab is hidden, removed for
   visitors who ask for reduced motion.
   =========================================================== */

(function () {
  "use strict";

  const canvas = document.getElementById("bg");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  /* ?motion=on forces full speed; with reduced motion the drift slows to about a third
     instead of freezing, so the layer still reads as alive without being busy. */
  const forceMotion = new URLSearchParams(location.search).get("motion") === "on";
  const motionScale = () => (forceMotion || !motionQuery.matches ? 1 : 0.34);

  const PALETTE = [
    [255, 150, 80], // ember, warm
    [255, 92, 36], // forge orange
    [186, 198, 214], // dust, cool grey
    [110, 160, 255], // engine blue
  ];

  /* pre-rendered glow sprites: much cheaper than gradients per frame */
  const sprites = PALETTE.map(([r, g, b]) => {
    const s = document.createElement("canvas");
    s.width = s.height = 32;
    const c = s.getContext("2d");
    const grad = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
    grad.addColorStop(0.32, `rgba(${r},${g},${b},0.52)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    c.fillStyle = grad;
    c.fillRect(0, 0, 32, 32);
    return s;
  });

  let width = 0;
  let height = 0;
  let particles = [];
  let raf = 0;
  let lastDraw = 0;
  let lastTime = 0;

  const makeParticle = (seeded) => {
    const ember = Math.random() < 0.45;
    const kind = ember
      ? Math.random() < 0.68
        ? 0
        : 1
      : Math.random() < 0.5
        ? 2
        : 3;

    return {
      baseX: Math.random() * width,
      phase: Math.random() * Math.PI * 2,
      y: seeded ? Math.random() * height : height + 20 + Math.random() * 60,
      r: ember ? 0.6 + Math.random() * 1.35 : 0.45 + Math.random() * 0.95,
      rise: (ember ? 9 + Math.random() * 20 : 4 + Math.random() * 12),
      sway: 0.12 + Math.random() * 0.5,
      amp: 6 + Math.random() * 26,
      alpha: (ember ? 0.22 : 0.12) + Math.random() * 0.26,
      sprite: sprites[kind],
    };
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const target = Math.round(Math.min(130, Math.max(44, (width * height) / 14000)));
    particles = Array.from({ length: target }, () => makeParticle(true));
    canvas.dataset.ready = "1";
  };

  const draw = (time, dt) => {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";

    const scale = motionScale();
    const step = dt * scale;
    const t = (time / 1000) * scale;

    for (const p of particles) {
      p.y -= p.rise * step;

      if (p.y < -40) {
        Object.assign(p, makeParticle(false));
        continue;
      }

      const x = p.baseX + Math.sin(t * p.sway + p.phase) * p.amp;
      const edge = Math.min(1, Math.min(p.y + 30, height - p.y) / 90);
      const size = p.r * 16;

      ctx.globalAlpha = p.alpha * edge;
      ctx.drawImage(p.sprite, x - size / 2, p.y - size / 2, size, size);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  };

  const loop = (time) => {
    raf = requestAnimationFrame(loop);
    /* 30fps is plenty for drifting dust and keeps the page cheap */
    if (time - lastDraw < 33) return;
    lastDraw = time;
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    draw(time, dt);
  };

  const start = () => {
    if (raf) return;
    lastTime = 0;
    raf = requestAnimationFrame(loop);
  };

  const stop = () => {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
  };

  resize();
  draw(0, 0); /* paint one frame immediately so the canvas is never blank */
  start();

  let resizeTimer = 0;
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 180);
    },
    { passive: true }
  );

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
})();
