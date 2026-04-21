/**
 * drawingPlugin.js — Custom Chart.js plugin for chart annotations.
 * No external dependencies. Renders on canvas. Included in PNG export.
 *
 * Tools: hline, trendline, range
 * All annotations are draggable after placement.
 */

export function createDrawingState() {
  return {
    enabled: false,
    tool: null,        // 'hline' | 'trendline' | 'range' | null
    annotations: [],
    pending: null,
    color: '#F7931A',
    _dragTarget: null,  // annotation being dragged
    _dragOffset: 0,     // y offset for drag
    _phase: 0,          // for trendline: 0=waiting first click, 1=waiting second click
  };
}

function getYScale(chart) {
  // Find the first y-axis (skip 'x' scales)
  for (const [id, scale] of Object.entries(chart.scales)) {
    if (id === 'x' || id === 'x2') continue;
    return scale;
  }
  return null;
}

function getXScale(chart) {
  return chart.scales.x || null;
}

function yPixelToValue(chart, py) {
  const s = getYScale(chart);
  return s ? s.getValueForPixel(py) : null;
}

function yValueToPixel(chart, val) {
  const s = getYScale(chart);
  return s ? s.getPixelForValue(val) : null;
}

function xPixelToValue(chart, px) {
  const s = getXScale(chart);
  return s ? s.getValueForPixel(px) : null;
}

function xValueToPixel(chart, val) {
  const s = getXScale(chart);
  return s ? s.getPixelForValue(val) : null;
}

function inArea(chart, x, y) {
  const a = chart.chartArea;
  return a && x >= a.left && x <= a.right && y >= a.top && y <= a.bottom;
}

/**
 * Hit-test: find annotation near pixel position for dragging.
 * Returns { ann, part } or null.
 * part: 'body' for hline/range, 'p1'/'p2' for trendline endpoints, 'body' for trendline mid
 */
function hitTest(chart, state, px, py) {
  const THRESH = 8;

  for (let i = state.annotations.length - 1; i >= 0; i--) {
    const ann = state.annotations[i];

    if (ann.type === 'hline') {
      const ay = yValueToPixel(chart, ann.y);
      if (ay != null && Math.abs(py - ay) < THRESH) return { ann, index: i, part: 'body' };
    }

    if (ann.type === 'trendline') {
      const x1 = xValueToPixel(chart, ann.x1), y1 = yValueToPixel(chart, ann.y1);
      const x2 = xValueToPixel(chart, ann.x2), y2 = yValueToPixel(chart, ann.y2);
      if (x1 == null || y1 == null || x2 == null || y2 == null) continue;
      // Check endpoints
      if (Math.hypot(px - x1, py - y1) < THRESH + 2) return { ann, index: i, part: 'p1' };
      if (Math.hypot(px - x2, py - y2) < THRESH + 2) return { ann, index: i, part: 'p2' };
      // Check proximity to line segment
      const len = Math.hypot(x2 - x1, y2 - y1);
      if (len < 1) continue;
      const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / (len * len)));
      const cx = x1 + t * (x2 - x1), cy = y1 + t * (y2 - y1);
      if (Math.hypot(px - cx, py - cy) < THRESH) return { ann, index: i, part: 'body' };
    }

    if (ann.type === 'range') {
      const ay1 = yValueToPixel(chart, ann.y1), ay2 = yValueToPixel(chart, ann.y2);
      if (ay1 == null || ay2 == null) continue;
      const top = Math.min(ay1, ay2), bot = Math.max(ay1, ay2);
      // Edge hit (borders)
      if (Math.abs(py - ay1) < THRESH) return { ann, index: i, part: 'edge1' };
      if (Math.abs(py - ay2) < THRESH) return { ann, index: i, part: 'edge2' };
      // Interior hit (drag whole range)
      if (py >= top && py <= bot) return { ann, index: i, part: 'body' };
    }
  }
  return null;
}

function drawAnnotations(chart, state) {
  const ctx = chart.ctx;
  const area = chart.chartArea;
  if (!area) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(area.left, area.top, area.right - area.left, area.bottom - area.top);
  ctx.clip();

  const all = [...state.annotations];
  if (state.pending) all.push(state.pending);

  for (const ann of all) {
    const c = ann.color || state.color;
    ctx.lineWidth = ann === state._dragTarget ? 2.5 : 1.5;
    ctx.setLineDash([]);

    if (ann.type === 'hline') {
      const py = yValueToPixel(chart, ann.y);
      if (py == null || py < area.top || py > area.bottom) continue;
      ctx.strokeStyle = c;
      ctx.beginPath();
      ctx.moveTo(area.left, py);
      ctx.lineTo(area.right, py);
      ctx.stroke();
      // Label
      ctx.fillStyle = c;
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(fmtVal(ann.y), area.right - 4, py - 3);

    } else if (ann.type === 'trendline') {
      const px1 = xValueToPixel(chart, ann.x1), py1 = yValueToPixel(chart, ann.y1);
      const px2 = xValueToPixel(chart, ann.x2), py2 = yValueToPixel(chart, ann.y2);
      if (px1 == null || py1 == null || px2 == null || py2 == null) continue;
      ctx.strokeStyle = c;
      ctx.beginPath();
      ctx.moveTo(px1, py1);
      ctx.lineTo(px2, py2);
      ctx.stroke();
      // Endpoints
      ctx.fillStyle = c;
      for (const [ex, ey] of [[px1, py1], [px2, py2]]) {
        ctx.beginPath(); ctx.arc(ex, ey, 4, 0, Math.PI * 2); ctx.fill();
      }

    } else if (ann.type === 'range') {
      const py1 = yValueToPixel(chart, ann.y1), py2 = yValueToPixel(chart, ann.y2);
      if (py1 == null || py2 == null) continue;
      const top = Math.min(py1, py2), h = Math.abs(py2 - py1);
      // Fill
      ctx.fillStyle = c + '20';
      ctx.fillRect(area.left, top, area.right - area.left, h);
      // Borders
      ctx.strokeStyle = c;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(area.left, py1); ctx.lineTo(area.right, py1);
      ctx.moveTo(area.left, py2); ctx.lineTo(area.right, py2);
      ctx.stroke();
      ctx.setLineDash([]);
      // Labels
      ctx.fillStyle = c;
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(fmtVal(ann.y1), area.right - 4, py1 - 3);
      ctx.fillText(fmtVal(ann.y2), area.right - 4, py2 - 3);
    }
  }

  ctx.restore();
}

function fmtVal(v) {
  if (v == null) return '';
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  if (Math.abs(v) >= 1) return v.toFixed(2);
  return v.toFixed(4);
}

export const drawingPlugin = {
  id: 'drawing',
  afterDraw(chart) {
    const state = chart.options.plugins?.drawing;
    if (!state || (!state.annotations.length && !state.pending)) return;
    drawAnnotations(chart, state);
  },
};

/**
 * Attach mouse handlers. Returns cleanup function.
 */
export function attachDrawingHandlers(canvas, chart, state, onUpdate) {
  let isDragging = false;
  let dragHit = null;
  let dragStartPy = 0;
  let dragStartVals = null;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handleMouseDown(e) {
    const pos = getPos(e);
    if (!inArea(chart, pos.x, pos.y)) return;

    // If no tool active, check for drag on existing annotation
    if (!state.tool) {
      const hit = hitTest(chart, state, pos.x, pos.y);
      if (hit) {
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        dragHit = hit;
        dragStartPy = pos.y;
        state._dragTarget = hit.ann;
        // Save starting values
        const ann = hit.ann;
        if (ann.type === 'hline') dragStartVals = { y: ann.y };
        else if (ann.type === 'trendline') dragStartVals = { x1: ann.x1, y1: ann.y1, x2: ann.x2, y2: ann.y2 };
        else if (ann.type === 'range') dragStartVals = { y1: ann.y1, y2: ann.y2 };
        canvas.style.cursor = 'grabbing';
        chart.draw();
        return;
      }
    }

    // Tool: range — start drag
    if (state.enabled && state.tool === 'range') {
      e.preventDefault();
      const yVal = yPixelToValue(chart, pos.y);
      if (yVal == null) return;
      state.pending = { type: 'range', y1: yVal, y2: yVal, color: state.color };
      isDragging = true;
      dragHit = { part: 'create_range' };
      dragStartPy = pos.y;
      chart.draw();
    }
  }

  function handleMouseMove(e) {
    const pos = getPos(e);

    // Dragging an existing annotation
    if (isDragging && dragHit && dragHit.part !== 'create_range' && !state.tool) {
      const ann = dragHit.ann;
      const dy = pos.y - dragStartPy;
      const yNow = yPixelToValue(chart, pos.y);
      const yStart = yPixelToValue(chart, dragStartPy);
      if (yNow == null || yStart == null) return;
      const yDelta = yNow - yStart;

      if (ann.type === 'hline') {
        ann.y = dragStartVals.y + yDelta;
      } else if (ann.type === 'trendline') {
        if (dragHit.part === 'p1') {
          ann.x1 = xPixelToValue(chart, pos.x) ?? ann.x1;
          ann.y1 = yNow;
        } else if (dragHit.part === 'p2') {
          ann.x2 = xPixelToValue(chart, pos.x) ?? ann.x2;
          ann.y2 = yNow;
        } else {
          ann.y1 = dragStartVals.y1 + yDelta;
          ann.y2 = dragStartVals.y2 + yDelta;
        }
      } else if (ann.type === 'range') {
        if (dragHit.part === 'edge1') {
          ann.y1 = dragStartVals.y1 + yDelta;
        } else if (dragHit.part === 'edge2') {
          ann.y2 = dragStartVals.y2 + yDelta;
        } else {
          ann.y1 = dragStartVals.y1 + yDelta;
          ann.y2 = dragStartVals.y2 + yDelta;
        }
      }
      chart.draw();
      return;
    }

    // Creating range via drag
    if (isDragging && dragHit?.part === 'create_range' && state.pending) {
      const yVal = yPixelToValue(chart, pos.y);
      if (yVal != null) state.pending.y2 = yVal;
      chart.draw();
      return;
    }

    // Trendline: live preview of second point
    if (state.enabled && state.tool === 'trendline' && state._phase === 1 && state.pending) {
      if (!inArea(chart, pos.x, pos.y)) return;
      state.pending.x2 = xPixelToValue(chart, pos.x) ?? state.pending.x2;
      state.pending.y2 = yPixelToValue(chart, pos.y) ?? state.pending.y2;
      chart.draw();
      return;
    }

    // Update cursor based on hover
    if (!state.tool && !isDragging && inArea(chart, pos.x, pos.y)) {
      const hit = hitTest(chart, state, pos.x, pos.y);
      canvas.style.cursor = hit ? 'grab' : '';
    }
  }

  function handleMouseUp(e) {
    // Finish range creation
    if (isDragging && dragHit?.part === 'create_range' && state.pending) {
      if (Math.abs(state.pending.y1 - state.pending.y2) > 0.001) {
        state.annotations.push({ ...state.pending });
      }
      state.pending = null;
      isDragging = false;
      dragHit = null;
      onUpdate();
      return;
    }

    // Finish drag of existing annotation
    if (isDragging) {
      state._dragTarget = null;
      isDragging = false;
      dragHit = null;
      dragStartVals = null;
      canvas.style.cursor = '';
      chart.draw();
      onUpdate();
    }
  }

  function handleClick(e) {
    if (!state.enabled || !state.tool) return;
    if (isDragging) return; // don't fire click after drag

    const pos = getPos(e);
    if (!inArea(chart, pos.x, pos.y)) return;

    const yVal = yPixelToValue(chart, pos.y);
    const xVal = xPixelToValue(chart, pos.x);
    if (yVal == null) return;

    if (state.tool === 'hline') {
      state.annotations.push({ type: 'hline', y: yVal, color: state.color });
      chart.draw();
      onUpdate();
    }

    if (state.tool === 'trendline') {
      if (state._phase === 0) {
        state.pending = { type: 'trendline', x1: xVal, y1: yVal, x2: xVal, y2: yVal, color: state.color };
        state._phase = 1;
        chart.draw();
      } else {
        state.pending.x2 = xVal;
        state.pending.y2 = yVal;
        state.annotations.push({ ...state.pending });
        state.pending = null;
        state._phase = 0;
        chart.draw();
        onUpdate();
      }
    }
    // Range is handled via mousedown/up, not click
  }

  // Use pointerdown for better touch/mouse support
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('click', handleClick);
  // Prevent context menu interfering with drawing
  const preventCtx = (e) => { if (state.enabled) e.preventDefault(); };
  canvas.addEventListener('contextmenu', preventCtx);

  return () => {
    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseup', handleMouseUp);
    canvas.removeEventListener('click', handleClick);
    canvas.removeEventListener('contextmenu', preventCtx);
  };
}
