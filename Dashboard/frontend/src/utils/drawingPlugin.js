/**
 * drawingPlugin.js v4 — Overlay canvas approach.
 * Annotations render on a separate transparent canvas layered on top of Chart.js.
 * This eliminates all conflicts with Chart.js rendering during drag/draw.
 * On PNG export, both canvases are composited.
 */

export function createDrawingState() {
  return {
    enabled: false,
    tool: null,
    annotations: [],
    pending: null,
    color: '#7FB2F1',
    _phase: 0,
    _overlay: null,   // overlay canvas element
    _chartRef: null,   // reference to Chart.js instance
  };
}

function getYScale(chart) {
  for (const [id, scale] of Object.entries(chart.scales)) {
    if (id !== 'x' && id !== 'x2') return scale;
  }
  return null;
}

function yPx2Val(chart, py) { const s = getYScale(chart); return s ? s.getValueForPixel(py) : null; }
function yVal2Px(chart, v) { const s = getYScale(chart); return s ? s.getPixelForValue(v) : null; }
function xPx2Val(chart, px) { const s = chart.scales.x; return s ? s.getValueForPixel(px) : null; }
function xVal2Px(chart, v) { const s = chart.scales.x; return s ? s.getPixelForValue(v) : null; }

function inArea(chart, x, y) {
  const a = chart.chartArea;
  return a && x >= a.left && x <= a.right && y >= a.top && y <= a.bottom;
}

function hitTest(chart, state, px, py) {
  const T = 10;
  for (let i = state.annotations.length - 1; i >= 0; i--) {
    const ann = state.annotations[i];
    if (ann.type === 'hline') {
      const ay = yVal2Px(chart, ann.y);
      if (ay != null && Math.abs(py - ay) < T) return { ann, i, part: 'body' };
    }
    if (ann.type === 'trendline') {
      const x1 = xVal2Px(chart, ann.x1), y1 = yVal2Px(chart, ann.y1);
      const x2 = xVal2Px(chart, ann.x2), y2 = yVal2Px(chart, ann.y2);
      if (x1 == null || y1 == null || x2 == null || y2 == null) continue;
      if (Math.hypot(px - x1, py - y1) < T + 2) return { ann, i, part: 'p1' };
      if (Math.hypot(px - x2, py - y2) < T + 2) return { ann, i, part: 'p2' };
      const len = Math.hypot(x2 - x1, y2 - y1);
      if (len < 1) continue;
      const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / (len * len)));
      const cx = x1 + t * (x2 - x1), cy = y1 + t * (y2 - y1);
      if (Math.hypot(px - cx, py - cy) < T) return { ann, i, part: 'body' };
    }
    if (ann.type === 'range') {
      const ay1 = yVal2Px(chart, ann.y1), ay2 = yVal2Px(chart, ann.y2);
      if (ay1 == null || ay2 == null) continue;
      if (Math.abs(py - ay1) < T) return { ann, i, part: 'edge1' };
      if (Math.abs(py - ay2) < T) return { ann, i, part: 'edge2' };
      if (py >= Math.min(ay1, ay2) && py <= Math.max(ay1, ay2)) return { ann, i, part: 'body' };
    }
  }
  return null;
}

function fmtVal(v) {
  if (v == null) return '';
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  if (Math.abs(v) >= 1) return v.toFixed(2);
  return v.toFixed(4);
}

/**
 * Render all annotations onto an overlay canvas context.
 */
export function renderAnnotations(chart, state, ctx) {
  const area = chart.chartArea;
  if (!area) return;

  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.save();
  ctx.beginPath();
  ctx.rect(area.left, area.top, area.right - area.left, area.bottom - area.top);
  ctx.clip();

  const all = [...state.annotations];
  if (state.pending) all.push(state.pending);

  for (const ann of all) {
    const c = ann.color || state.color;
    ctx.lineWidth = ann._dragging ? 2.5 : 1.5;
    ctx.setLineDash([]);

    if (ann.type === 'hline') {
      const py = yVal2Px(chart, ann.y);
      if (py == null || py < area.top || py > area.bottom) continue;
      ctx.strokeStyle = c;
      ctx.beginPath(); ctx.moveTo(area.left, py); ctx.lineTo(area.right, py); ctx.stroke();
      ctx.fillStyle = c; ctx.font = '11px monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText(fmtVal(ann.y), area.right - 4, py - 3);
    }
    if (ann.type === 'trendline') {
      const px1 = xVal2Px(chart, ann.x1), py1 = yVal2Px(chart, ann.y1);
      const px2 = xVal2Px(chart, ann.x2), py2 = yVal2Px(chart, ann.y2);
      if (px1 == null || py1 == null || px2 == null || py2 == null) continue;
      ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(px1, py1); ctx.lineTo(px2, py2); ctx.stroke();
      ctx.fillStyle = c;
      for (const [ex, ey] of [[px1, py1], [px2, py2]]) { ctx.beginPath(); ctx.arc(ex, ey, 4, 0, Math.PI * 2); ctx.fill(); }
    }
    if (ann.type === 'range') {
      const py1 = yVal2Px(chart, ann.y1), py2 = yVal2Px(chart, ann.y2);
      if (py1 == null || py2 == null) continue;
      const top = Math.min(py1, py2), h2 = Math.abs(py2 - py1);
      ctx.fillStyle = c + '20'; ctx.fillRect(area.left, top, area.right - area.left, h2);
      ctx.strokeStyle = c; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(area.left, py1); ctx.lineTo(area.right, py1);
      ctx.moveTo(area.left, py2); ctx.lineTo(area.right, py2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = c; ctx.font = '11px monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText(fmtVal(ann.y1), area.right - 4, py1 - 3);
      ctx.fillText(fmtVal(ann.y2), area.right - 4, py2 - 3);
    }
  }
  ctx.restore();
}

/**
 * Attach mouse handlers to the OVERLAY canvas.
 */
export function attachDrawingHandlers(overlay, chart, state, onUpdate) {
  let downPos = null, downTime = 0, dragging = false, dragHit = null, dragStartVals = null;

  function getPos(e) {
    const r = overlay.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function repaint() {
    const ctx = overlay.getContext('2d');
    renderAnnotations(chart, state, ctx);
  }

  function handleMouseDown(e) {
    const pos = getPos(e);
    if (!inArea(chart, pos.x, pos.y)) return;
    downPos = pos; downTime = Date.now(); dragging = false;

    if (!state.tool) {
      const hit = hitTest(chart, state, pos.x, pos.y);
      if (hit) {
        e.preventDefault(); e.stopPropagation();
        dragHit = hit;
        hit.ann._dragging = true;
        const a = hit.ann;
        if (a.type === 'hline') dragStartVals = { y: a.y };
        else if (a.type === 'trendline') dragStartVals = { x1: a.x1, y1: a.y1, x2: a.x2, y2: a.y2 };
        else if (a.type === 'range') dragStartVals = { y1: a.y1, y2: a.y2 };
        overlay.style.cursor = 'grabbing';
        document.addEventListener('mousemove', handleDocMove);
        document.addEventListener('mouseup', handleDocUp);
      }
    }
  }

  function handleDocMove(e) {
    const pos = getPos(e);
    if (downPos && !dragging && Math.hypot(pos.x - downPos.x, pos.y - downPos.y) > 4) dragging = true;

    if (dragging && dragHit && downPos) {
      const ann = dragHit.ann;
      const yNow = yPx2Val(chart, pos.y), yStart = yPx2Val(chart, downPos.y);
      if (yNow == null || yStart == null) return;
      const yDelta = yNow - yStart;
      if (ann.type === 'hline') ann.y = dragStartVals.y + yDelta;
      else if (ann.type === 'trendline') {
        if (dragHit.part === 'p1') { ann.x1 = xPx2Val(chart, pos.x) ?? ann.x1; ann.y1 = yNow; }
        else if (dragHit.part === 'p2') { ann.x2 = xPx2Val(chart, pos.x) ?? ann.x2; ann.y2 = yNow; }
        else { ann.y1 = dragStartVals.y1 + yDelta; ann.y2 = dragStartVals.y2 + yDelta; }
      } else if (ann.type === 'range') {
        if (dragHit.part === 'edge1') ann.y1 = dragStartVals.y1 + yDelta;
        else if (dragHit.part === 'edge2') ann.y2 = dragStartVals.y2 + yDelta;
        else { ann.y1 = dragStartVals.y1 + yDelta; ann.y2 = dragStartVals.y2 + yDelta; }
      }
      repaint();
      return;
    }
  }

  function handleDocUp(e) {
    if (dragHit) dragHit.ann._dragging = false;
    document.removeEventListener('mousemove', handleDocMove);
    document.removeEventListener('mouseup', handleDocUp);
    overlay.style.cursor = '';
    dragging = false; dragHit = null; dragStartVals = null; downPos = null;
    repaint();
    onUpdate();
  }

  function handleMouseMove(e) {
    const pos = getPos(e);

    // Range creation drag
    if (dragging && state.pending?.type === 'range') {
      const yVal = yPx2Val(chart, pos.y);
      if (yVal != null) state.pending.y2 = yVal;
      repaint();
      return;
    }

    // Trendline preview
    if (state.enabled && state.tool === 'trendline' && state._phase === 1 && state.pending) {
      if (!inArea(chart, pos.x, pos.y)) return;
      state.pending.x2 = xPx2Val(chart, pos.x) ?? state.pending.x2;
      state.pending.y2 = yPx2Val(chart, pos.y) ?? state.pending.y2;
      repaint();
      return;
    }

    // Hover cursor when no tool
    if (!state.tool && inArea(chart, pos.x, pos.y)) {
      const hit = hitTest(chart, state, pos.x, pos.y);
      overlay.style.cursor = hit ? 'grab' : '';
    }
  }

  function handleMouseUp(e) {
    const pos = getPos(e);
    const wasClick = !dragging && downPos && Date.now() - downTime < 300;

    // Finish range creation
    if (dragging && state.pending?.type === 'range') {
      if (Math.abs(state.pending.y1 - state.pending.y2) > 0.0001) {
        state.annotations.push({ ...state.pending });
      }
      state.pending = null;
      downPos = null; dragging = false;
      repaint(); onUpdate();
      return;
    }

    // Click placement
    if (wasClick && state.enabled && state.tool && inArea(chart, pos.x, pos.y)) {
      const yVal = yPx2Val(chart, pos.y), xVal = xPx2Val(chart, pos.x);
      if (yVal == null) { downPos = null; return; }

      if (state.tool === 'hline') {
        state.annotations.push({ type: 'hline', y: yVal, color: state.color });
        repaint(); onUpdate();
      }
      if (state.tool === 'trendline') {
        if (state._phase === 0) {
          state.pending = { type: 'trendline', x1: xVal, y1: yVal, x2: xVal, y2: yVal, color: state.color };
          state._phase = 1;
          repaint(); onUpdate();
        } else {
          state.pending.x2 = xVal; state.pending.y2 = yVal;
          state.annotations.push({ ...state.pending });
          state.pending = null; state._phase = 0;
          repaint(); onUpdate();
        }
      }

      // Range: detect start of drag
      if (state.tool === 'range') {
        dragging = true;
        state.pending = { type: 'range', y1: yVal, y2: yVal, color: state.color };
      }
    }

    downPos = null; dragging = false;
  }

  // Detect drag start for range on mousedown
  function handleOverlayMouseDown(e) {
    const pos = getPos(e);
    if (!inArea(chart, pos.x, pos.y)) return;
    downPos = pos; downTime = Date.now(); dragging = false;

    // Drag existing annotation
    handleMouseDown(e);

    // Range tool: start tracking for drag
    if (state.enabled && state.tool === 'range') {
      const yVal = yPx2Val(chart, pos.y);
      if (yVal != null) {
        state.pending = { type: 'range', y1: yVal, y2: yVal, color: state.color };
      }
    }
  }

  function handleOverlayMouseMove(e) {
    const pos = getPos(e);
    if (downPos && !dragging && Math.hypot(pos.x - downPos.x, pos.y - downPos.y) > 4) dragging = true;

    // Range creation
    if (dragging && state.pending?.type === 'range' && state.tool === 'range') {
      const yVal = yPx2Val(chart, pos.y);
      if (yVal != null) state.pending.y2 = yVal;
      repaint();
      return;
    }

    handleMouseMove(e);
  }

  function handleOverlayMouseUp(e) {
    // Range completion
    if (dragging && state.pending?.type === 'range' && state.tool === 'range') {
      if (Math.abs(state.pending.y1 - state.pending.y2) > 0.0001) {
        state.annotations.push({ ...state.pending });
      }
      state.pending = null;
      downPos = null; dragging = false;
      repaint(); onUpdate();
      return;
    }

    handleMouseUp(e);
  }

  // Keyboard: Ctrl+Z / Cmd+Z
  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (state.pending) { state.pending = null; state._phase = 0; }
      else if (state.annotations.length) state.annotations.pop();
      repaint(); onUpdate();
    }
  }

  overlay.addEventListener('mousedown', handleOverlayMouseDown);
  overlay.addEventListener('mousemove', handleOverlayMouseMove);
  overlay.addEventListener('mouseup', handleOverlayMouseUp);
  document.addEventListener('keydown', handleKeyDown);

  // Initial paint
  repaint();

  return () => {
    overlay.removeEventListener('mousedown', handleOverlayMouseDown);
    overlay.removeEventListener('mousemove', handleOverlayMouseMove);
    overlay.removeEventListener('mouseup', handleOverlayMouseUp);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('mousemove', handleDocMove);
    document.removeEventListener('mouseup', handleDocUp);
  };
}

/**
 * Composite the overlay onto the chart canvas for export.
 * Call before toDataURL/drawImage in export functions.
 */
export function compositeOverlay(chartCanvas, overlayCanvas) {
  const ctx = chartCanvas.getContext('2d');
  ctx.drawImage(overlayCanvas, 0, 0);
}
