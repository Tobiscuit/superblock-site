(() => {
  let ov, stage, canvas, zlabel, title, svgEl;
  let k = 1, x = 0, y = 0, natW = 0, natH = 0;
  const pointers = new Map();
  let pinchD = 0, pinchMid = null;
  const cx = () => stage.clientWidth / 2, cy = () => stage.clientHeight / 2;

  function build() {
    ov = document.createElement("div");
    ov.className = "dv-overlay"; ov.hidden = true;
    ov.innerHTML =
      '<div class="dv-toolbar"><span class="dv-title"></span>' +
      '<button data-act="out" title="Zoom out (-)">−</button>' +
      '<span class="dv-zoom">100%</span>' +
      '<button data-act="in" title="Zoom in (+)">+</button>' +
      '<button data-act="fit" title="Fit (0)">Fit</button>' +
      '<button data-act="one" title="Actual size (1)">1:1</button>' +
      '<button data-act="recall" title="Recall mode (R): blank labels; hold Space to peek">Recall</button>' +
      '<button data-act="full" title="Fullscreen (F)">⛶</button>' +
      '<button data-act="close" title="Close (Esc)">✕</button></div>' +
      '<div class="dv-stage"><div class="dv-canvas"></div></div>' +
      '<div class="dv-hint">drag to pan · scroll to zoom · <b>R</b> recall (hold <b>Space</b> to peek) · <b>F</b> fullscreen · <b>Esc</b> close</div>';
    document.body.appendChild(ov);
    stage = ov.querySelector(".dv-stage");
    canvas = ov.querySelector(".dv-canvas");
    zlabel = ov.querySelector(".dv-zoom");
    title = ov.querySelector(".dv-title");

    ov.querySelector(".dv-toolbar").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      ({ in: () => zoomAt(1.25, cx(), cy()), out: () => zoomAt(0.8, cx(), cy()),
         fit, one: () => { k = 1; center(); }, recall: () => toggleRecall(b),
         full: toggleFull, close })[b.dataset.act]();
    });

    stage.addEventListener("pointerdown", (e) => {
      stage.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) startPinch();
    });
    stage.addEventListener("pointermove", (e) => {
      const p = pointers.get(e.pointerId); if (!p) return;
      if (pointers.size === 2) { p.x = e.clientX; p.y = e.clientY; doPinch(); return; }
      x += e.clientX - p.x; y += e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; apply();
    });
    const up = (e) => { pointers.delete(e.pointerId); if (pointers.size < 2) pinchD = 0; };
    stage.addEventListener("pointerup", up);
    stage.addEventListener("pointercancel", up);
    stage.addEventListener("wheel", (e) => {
      e.preventDefault();
      const r = stage.getBoundingClientRect();
      zoomAt(e.deltaY < 0 ? 1.12 : 0.89, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });

    document.addEventListener("keydown", (e) => {
      if (ov.hidden) return;
      const key = e.key.toLowerCase();
      if (e.key === "Escape") close();
      else if (e.key === "+" || e.key === "=") zoomAt(1.25, cx(), cy());
      else if (e.key === "-") zoomAt(0.8, cx(), cy());
      else if (e.key === "0") fit();
      else if (e.key === "1") { k = 1; center(); }
      else if (key === "r") toggleRecall(ov.querySelector('[data-act=recall]'));
      else if (key === "f") toggleFull();
      else if (e.key === " " && canvas.classList.contains("recall")) { canvas.classList.add("peek"); e.preventDefault(); }
    });
    document.addEventListener("keyup", (e) => { if (e.key === " ") canvas.classList.remove("peek"); });
  }

  function startPinch() {
    const p = [...pointers.values()];
    pinchD = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    const r = stage.getBoundingClientRect();
    pinchMid = { x: (p[0].x + p[1].x) / 2 - r.left, y: (p[0].y + p[1].y) / 2 - r.top };
  }
  function doPinch() {
    const p = [...pointers.values()];
    const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    if (pinchD) zoomAt(d / pinchD, pinchMid.x, pinchMid.y);
    pinchD = d;
  }
  function zoomAt(f, px, py) {
    const nk = Math.min(40, Math.max(0.05, k * f)); f = nk / k;
    x = px - (px - x) * f; y = py - (py - y) * f; k = nk; apply();
  }
  function apply() {
    canvas.style.transform = "translate(" + x + "px," + y + "px) scale(" + k + ")";
    zlabel.textContent = Math.round(k * 100) + "%";
  }
  function center() { x = (stage.clientWidth - natW * k) / 2; y = (stage.clientHeight - natH * k) / 2; apply(); }
  function fit() {
    if (!natW) return;
    k = Math.min((stage.clientWidth - 48) / natW, (stage.clientHeight - 48) / natH);
    center();
  }
  function toggleRecall(b) {
    const on = canvas.classList.toggle("recall"); canvas.classList.remove("peek");
    if (b) b.classList.toggle("on", on);
  }
  function toggleFull() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (ov.requestFullscreen) ov.requestFullscreen();
  }
  function open(src, name) {
    if (!ov) build();
    title.textContent = name || ""; ov.hidden = false;
    canvas.classList.remove("recall", "peek");
    ov.querySelector('[data-act=recall]').classList.remove("on");
    fetch(src).then((r) => r.text()).then((txt) => {
      canvas.innerHTML = txt; svgEl = canvas.querySelector("svg"); if (!svgEl) return;
      const vb = svgEl.viewBox && svgEl.viewBox.baseVal;
      if (vb && vb.width) { natW = vb.width; natH = vb.height; }
      else { const bb = svgEl.getBBox(); natW = bb.width; natH = bb.height; }
      svgEl.removeAttribute("width"); svgEl.removeAttribute("height");
      svgEl.style.width = natW + "px"; svgEl.style.height = natH + "px";
      fit();
    });
  }
  function close() {
    if (document.fullscreenElement) document.exitFullscreen();
    ov.hidden = true; canvas.innerHTML = ""; svgEl = null;
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button.explore"); if (!b) return;
    open(b.dataset.svg, b.dataset.name);
  });
})();
