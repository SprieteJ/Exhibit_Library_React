/**
 * Export a Chart.js instance to a styled PNG.
 * mode = 'raw':     Just the chart, no decorations.
 * mode = 'branded': Chart + logo + title + source footer.
 */
export default function exportPng(chart, opts = {}) {
  if (!chart) return;

  const {
    title = '',
    filename = 'chart',
    mode = 'branded',
    logoImg = null,
  } = opts;

  const isRaw = mode === 'raw';
  const W = 2400;
  const H = isRaw ? 1000 : 1200;
  const PAD = 40;
  const CHART_PAD = 16;
  // Raw: small top/bottom margin. Branded: room for logo+title and source.
  const TOP = isRaw ? PAD : 80;
  const BOTTOM = isRaw ? PAD : 52;

  const EXP_BG = '#FAFAFA';
  const EXP_FRAME = '#070B09';
  const EXP_TEXT = '#070B09';

  const chartW = W - PAD * 2 - CHART_PAD * 2;
  const chartH = H - TOP - BOTTOM - CHART_PAD * 2;

  // ── Save originals ──
  const save = {
    dpr: chart.options.devicePixelRatio,
    w: chart.canvas.style.width, h: chart.canvas.style.height,
    cw: chart.canvas.width, ch: chart.canvas.height,
    scales: {}, legendColor: null, legendSize: null, widths: [],
  };
  for (const [id, scale] of Object.entries(chart.options.scales || {})) {
    save.scales[id] = {
      tickColor: scale.ticks?.color, tickFontSize: scale.ticks?.font?.size,
      borderColor: scale.border?.color, borderDisplay: scale.border?.display,
      gridColor: scale.grid?.color, gridDisplay: scale.grid?.display,
      gridDrawBorder: scale.grid?.drawBorder, titleColor: scale.title?.color,
      titleFontSize: scale.title?.font?.size,
    };
  }
  if (chart.options.plugins?.legend?.labels) {
    save.legendColor = chart.options.plugins.legend.labels.color;
    save.legendSize = chart.options.plugins.legend.labels.font?.size;
  }
  save.widths = chart.data.datasets.map(d => d.borderWidth);

  // ── Apply export theme ──
  for (const [, scale] of Object.entries(chart.options.scales || {})) {
    if (scale.ticks) { scale.ticks.color = EXP_FRAME; if (!scale.ticks.font) scale.ticks.font = {}; scale.ticks.font.size = 18; }
    if (!scale.border) scale.border = {};
    scale.border.color = EXP_FRAME; scale.border.display = true;
    if (scale.grid) { scale.grid.color = 'rgba(0,0,0,0)'; scale.grid.display = false; scale.grid.drawBorder = true; }
    if (scale.title) { scale.title.color = EXP_FRAME; if (scale.title.font) scale.title.font.size = 16; }
  }
  if (chart.options.plugins?.legend?.labels) {
    chart.options.plugins.legend.labels.color = EXP_TEXT;
    if (!chart.options.plugins.legend.labels.font) chart.options.plugins.legend.labels.font = {};
    chart.options.plugins.legend.labels.font.size = 14;
  }
  chart.data.datasets.forEach(d => { if (d.borderWidth) d.borderWidth = Math.max(d.borderWidth * 2, 3); });

  // Resize and force synchronous render
  chart.options.devicePixelRatio = 1;
  chart.canvas.style.width = chartW + 'px';
  chart.canvas.style.height = chartH + 'px';
  chart.canvas.width = chartW;
  chart.canvas.height = chartH;
  chart.resize(chartW, chartH);
  chart.update('none'); // synchronous, no animation

  // ── Compose export canvas ──
  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const ctx = off.getContext('2d');

  // Background
  ctx.fillStyle = EXP_BG;
  ctx.fillRect(0, 0, W, H);

  // Frame
  const fx = PAD, fy = TOP, fw = W - PAD * 2, fh = H - TOP - BOTTOM;
  ctx.strokeStyle = EXP_FRAME; ctx.lineWidth = 1.5;
  ctx.strokeRect(fx, fy, fw, fh);

  // Chart
  ctx.drawImage(chart.canvas, fx + CHART_PAD, fy + CHART_PAD, chartW, chartH);

  // Branded decorations
  if (!isRaw) {
    // Logo (top-left)
    if (logoImg?.naturalWidth) {
      const lh = 42, lw = (lh / logoImg.naturalHeight) * logoImg.naturalWidth;
      try { ctx.drawImage(logoImg, PAD, 18, lw, lh); } catch (e) { /* skip */ }
    }
    // Title (centered)
    if (title) {
      ctx.fillStyle = EXP_TEXT;
      ctx.font = '400 24px DM Sans, Helvetica Neue, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, W / 2, 50);
      ctx.textAlign = 'left';
    }
    // Source (bottom-right)
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const now = new Date();
    ctx.fillStyle = 'rgba(7,11,9,0.6)';
    ctx.font = '400 14px DM Sans, Helvetica Neue, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Source: Wintermute    Data as of: ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear(), W - PAD, H - 16);
    ctx.textAlign = 'left';
  }

  // Download
  const suffix = isRaw ? '_raw' : '_branded';
  const a = document.createElement('a');
  a.download = filename + suffix + '_' + new Date().toISOString().split('T')[0] + '.png';
  a.href = off.toDataURL('image/png');
  a.click();

  // ── Restore ──
  chart.options.devicePixelRatio = save.dpr || undefined;
  for (const [id, scale] of Object.entries(chart.options.scales || {})) {
    const o = save.scales[id] || {};
    if (scale.ticks) { scale.ticks.color = o.tickColor; if (scale.ticks.font) scale.ticks.font.size = o.tickFontSize; }
    if (scale.border) { scale.border.color = o.borderColor; scale.border.display = o.borderDisplay; }
    if (scale.grid) { scale.grid.color = o.gridColor; scale.grid.display = o.gridDisplay; scale.grid.drawBorder = o.gridDrawBorder; }
    if (scale.title) { scale.title.color = o.titleColor; if (scale.title.font) scale.title.font.size = o.titleFontSize; }
  }
  if (chart.options.plugins?.legend?.labels) {
    chart.options.plugins.legend.labels.color = save.legendColor;
    if (chart.options.plugins.legend.labels.font) chart.options.plugins.legend.labels.font.size = save.legendSize;
  }
  chart.data.datasets.forEach((d, i) => { d.borderWidth = save.widths[i]; });
  chart.canvas.width = save.cw; chart.canvas.height = save.ch;
  chart.canvas.style.width = save.w; chart.canvas.style.height = save.h;
  chart.resize(); chart.update('none');
}
