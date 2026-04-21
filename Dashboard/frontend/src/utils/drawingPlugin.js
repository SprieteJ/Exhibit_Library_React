/**
 * drawingPlugin.js — Custom Chart.js plugin for chart annotations.
 * No external dependencies. Renders directly on the chart canvas.
 * Annotations are included in PNG export automatically.
 *
 * Tools: hline (horizontal line), trendline (two-point line), range (horizontal band)
 *
 * Usage:
 *   import { drawingPlugin, createDrawingState } from '../utils/drawingPlugin';
 *   Chart.register(drawingPlugin);
 *   const drawState = createDrawingState();
 *   // pass drawState into chart options: plugins: { drawing: drawState }
 */

/**
 * Create a fresh drawing state object. One per chart instance.
 */
export function createDrawingState() {
  return {
    enabled: false,
    tool: null,        // 'hline' | 'trendline' | 'range' | null
    annotations: [],   // completed annotations
    pending: null,      // annotation being drawn (trendline 2nd click, range drag)
    color: '#F7931A',
  };
}

/**
 * Convert pixel position to data coordinates using chart scales.
 */
function pixelToData(chart, x, y) {
  const xScale = chart.scales.x;
  const yScale = Object.values(chart.scales).find(s => s.id !== 'x' && s.id !== 'x2');
  if (!xScale || !yScale) return null;

  const xVal = xScale.getValueForPixel(x);
  const yVal = yScale.getValueForPixel(y);
  return { x: xVal, y: yVal, px: x, py: y };
}

/**
 * Convert data coordinates back to pixels.
 */
function dataToPixel(chart, xVal, yVal) {
  const xScale = chart.scales.x;
  const yScale = Object.values(chart.scales).find(s => s.id !== 'x' && s.id !== 'x2');
  if (!xScale || !yScale) return null;

  return {
    x: xScale.getPixelForValue(xVal),
    y: yScale.getPixelForValue(yVal),
  };
}

/**
 * Draw all annotations on the chart canvas.
 */
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
    ctx.strokeStyle = ann.color || state.color;
    ctx.fillStyle = (ann.color || state.color) + '18'; // 10% opacity fill
    ctx.lineWidth = ann.lineWidth || 1.5;
    ctx.setLineDash(ann.dash || []);

    if (ann.type === 'hline') {
      const yScale = Object.values(chart.scales).find(s => s.id !== 'x' && s.id !== 'x2');
      if (!yScale) continue;
      const py = yScale.getPixelForValue(ann.y);
      if (py < area.top || py > area.bottom) continue;

      ctx.beginPath();
      ctx.moveTo(area.left, py);
      ctx.lineTo(area.right, py);
      ctx.stroke();

      // Label
      ctx.fillStyle = ann.color || state.color;
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      const label = typeof ann.y === 'number' ? ann.y.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '';
      ctx.fillText(label, area.right - 4, py - 3);

    } else if (ann.type === 'trendline') {
      const p1 = dataToPixel(chart, ann.x1, ann.y1);
      const p2 = dataToPixel(chart, ann.x2, ann.y2);
      if (!p1 || !p2) continue;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Small circles at endpoints
      for (const p of [p1, p2]) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = ann.color || state.color;
        ctx.fill();
      }

    } else if (ann.type === 'range') {
      const yScale = Object.values(chart.scales).find(s => s.id !== 'x' && s.id !== 'x2');
      if (!yScale) continue;
      const py1 = yScale.getPixelForValue(ann.y1);
      const py2 = yScale.getPixelForValue(ann.y2);
      const top = Math.min(py1, py2);
      const h = Math.abs(py2 - py1);

      ctx.fillStyle = (ann.color || state.color) + '20'; // 12% opacity
      ctx.fillRect(area.left, top, area.right - area.left, h);

      ctx.beginPath();
      ctx.setLineDash([6, 4]);
      ctx.moveTo(area.left, py1); ctx.lineTo(area.right, py1);
      ctx.moveTo(area.left, py2); ctx.lineTo(area.right, py2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Labels
      ctx.fillStyle = ann.color || state.color;
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      const l1 = typeof ann.y1 === 'number' ? ann.y1.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '';
      const l2 = typeof ann.y2 === 'number' ? ann.y2.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '';
      ctx.fillText(l1, area.right - 4, py1 - 3);
      ctx.fillText(l2, area.right - 4, py2 - 3);
    }
  }

  ctx.restore();
}

/**
 * The Chart.js plugin object. Register once: Chart.register(drawingPlugin)
 */
export const drawingPlugin = {
  id: 'drawing',

  afterDraw(chart) {
    const state = chart.options.plugins?.drawing;
    if (!state || !state.enabled) return;
    drawAnnotations(chart, state);
  },
};

/**
 * Attach mouse event handlers to a chart canvas for drawing interactions.
 * Call this after the chart is created. Returns a cleanup function.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Chart} chart
 * @param {object} state - drawingState from createDrawingState()
 * @param {function} onUpdate - called after any annotation change (to trigger re-render)
 */
export function attachDrawingHandlers(canvas, chart, state, onUpdate) {
  let dragStart = null;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function isInChartArea(pos) {
    const a = chart.chartArea;
    return a && pos.x >= a.left && pos.x <= a.right && pos.y >= a.top && pos.y <= a.bottom;
  }

  function handleClick(e) {
    if (!state.enabled || !state.tool) return;
    const pos = getPos(e);
    if (!isInChartArea(pos)) return;

    const data = pixelToData(chart, pos.x, pos.y);
    if (!data) return;

    if (state.tool === 'hline') {
      state.annotations.push({ type: 'hline', y: data.y, color: state.color });
      onUpdate();

    } else if (state.tool === 'trendline') {
      if (!state.pending) {
        state.pending = { type: 'trendline', x1: data.x, y1: data.y, x2: data.x, y2: data.y, color: state.color };
        onUpdate();
      } else {
        state.pending.x2 = data.x;
        state.pending.y2 = data.y;
        state.annotations.push({ ...state.pending });
        state.pending = null;
        onUpdate();
      }
    }
  }

  function handleMouseDown(e) {
    if (!state.enabled || state.tool !== 'range') return;
    const pos = getPos(e);
    if (!isInChartArea(pos)) return;
    const data = pixelToData(chart, pos.x, pos.y);
    if (!data) return;

    dragStart = data.y;
    state.pending = { type: 'range', y1: data.y, y2: data.y, color: state.color };
    onUpdate();
  }

  function handleMouseMove(e) {
    if (!state.enabled) return;
    const pos = getPos(e);
    if (!isInChartArea(pos)) return;
    const data = pixelToData(chart, pos.x, pos.y);
    if (!data) return;

    if (state.tool === 'trendline' && state.pending) {
      state.pending.x2 = data.x;
      state.pending.y2 = data.y;
      chart.draw();
    }

    if (state.tool === 'range' && dragStart !== null && state.pending) {
      state.pending.y2 = data.y;
      chart.draw();
    }
  }

  function handleMouseUp(e) {
    if (state.tool === 'range' && dragStart !== null && state.pending) {
      state.annotations.push({ ...state.pending });
      state.pending = null;
      dragStart = null;
      onUpdate();
    }
  }

  canvas.addEventListener('click', handleClick);
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);

  return () => {
    canvas.removeEventListener('click', handleClick);
    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseup', handleMouseUp);
  };
}
