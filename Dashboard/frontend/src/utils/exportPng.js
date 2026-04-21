/**
 * Export a Chart.js instance to a styled PNG.
 * mode = 'raw':    Just the chart, no decorations. 2400×1000.
 * mode = 'branded': Chart + logo + title + source. 2400×1200 (taller for header/footer).
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
  const HEADER_H = isRaw ? 0 : 72;
  const FOOTER_H = isRaw ? 0 : 44;

  const EXP_BG = '#FAFAFA';
  const EXP_FRAME = '#070B09';
  const EXP_TEXT = '#070B09';

  // ── Save originals ──
  const origDPR = chart.options.devicePixelRatio;
  const origW = chart.canvas.style.width;
  const origH = chart.canvas.style.height;
  const origCW = chart.canvas.width;
  const origCH = chart.canvas.height;

  const origScales = {};
  for (const [id, scale] of Object.entries(chart.options.scales || {})) {
    origScales[id] = {
      tickColor: scale.ticks?.color, tickFontSize: scale.ticks?.font?.size,
      borderColor: scale.border?.color, borderDisplay: scale.border?.display,
      gridColor: scale.grid?.color, gridDisplay: scale.grid?.display,
      gridDrawBorder: scale.grid?.drawBorder, titleColor: scale.title?.color,
      titleFontSize: scale.title?.font?.size,
    };
  }
  const origLegendColor = chart.options.plugins?.legend?.labels?.color;
  const origLegendSize = chart.options.plugins?.legend?.labels?.font?.size;
  const origWidths = chart.data.datasets.map(d => d.borderWidth);

  // ── Apply export theme ──
  for (const [id, scale] of Object.entries(chart.options.scales || {})) {
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

  const chartAreaW = W - PAD * 2 - CHART_PAD * 2;
  const chartAreaH = H - HEADER_H - FOOTER_H - CHART_PAD * 2;
  chart.options.devicePixelRatio = 1;
  chart.canvas.width = chartAreaW; chart.canvas.height = chartAreaH;
  chart.canvas.style.width = chartAreaW + 'px'; chart.canvas.style.height = chartAreaH + 'px';
  chart.resize(chartAreaW, chartAreaH); chart.update();

  // ── Build export canvas ──
  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const ctx = off.getContext('2d');

  ctx.fillStyle = EXP_BG; ctx.fillRect(0, 0, W, H);

  const fx = PAD, fy = HEADER_H || PAD;
  const fw = W - PAD * 2, fh = H - (HEADER_H || PAD) - (FOOTER_H || PAD);
  ctx.strokeStyle = EXP_FRAME; ctx.lineWidth = 1.5;
  ctx.strokeRect(fx, fy, fw, fh);
  ctx.drawImage(chart.canvas, fx + CHART_PAD, fy + CHART_PAD, chartAreaW, chartAreaH);

  if (!isRaw) {
    // Logo
    if (logoImg?.naturalWidth) {
      const logoH = 42;
      const logoW = (logoH / logoImg.naturalHeight) * logoImg.naturalWidth;
      try { ctx.drawImage(logoImg, PAD, 14, logoW, logoH); } catch (e) { /* ignore */ }
    }
    // Title
    if (title) {
      ctx.fillStyle = EXP_TEXT;
      ctx.font = '400 24px DM Sans, Helvetica Neue, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, W / 2, 46);
      ctx.textAlign = 'left';
    }
    // Source
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const now = new Date();
    const dateStr = now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();
    ctx.fillStyle = 'rgba(7,11,9,0.6)';
    ctx.font = '400 14px DM Sans, Helvetica Neue, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Source: Wintermute    Data as of: ' + dateStr, W - PAD, H - 14);
    ctx.textAlign = 'left';
  }

  // Download
  const suffix = isRaw ? '_raw' : '_branded';
  const a = document.createElement('a');
  const dt = new Date().toISOString().split('T')[0];
  a.download = filename + suffix + '_' + dt + '.png';
  a.href = off.toDataURL('image/png');
  a.click();

  // ── Restore ──
  chart.options.devicePixelRatio = origDPR || undefined;
  for (const [id, scale] of Object.entries(chart.options.scales || {})) {
    const orig = origScales[id] || {};
    if (scale.ticks) { scale.ticks.color = orig.tickColor; if (scale.ticks.font) scale.ticks.font.size = orig.tickFontSize; }
    if (scale.border) { scale.border.color = orig.borderColor; scale.border.display = orig.borderDisplay; }
    if (scale.grid) { scale.grid.color = orig.gridColor; scale.grid.display = orig.gridDisplay; scale.grid.drawBorder = orig.gridDrawBorder; }
    if (scale.title) { scale.title.color = orig.titleColor; if (scale.title.font) scale.title.font.size = orig.titleFontSize; }
  }
  if (chart.options.plugins?.legend?.labels) {
    chart.options.plugins.legend.labels.color = origLegendColor;
    if (chart.options.plugins.legend.labels.font) chart.options.plugins.legend.labels.font.size = origLegendSize;
  }
  chart.data.datasets.forEach((d, i) => { d.borderWidth = origWidths[i]; });
  chart.canvas.width = origCW; chart.canvas.height = origCH;
  chart.canvas.style.width = origW; chart.canvas.style.height = origH;
  chart.resize(); chart.update();
}
