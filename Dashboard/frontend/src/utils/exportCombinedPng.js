/**
 * Export two Chart.js instances as a combined PNG.
 * Top chart gets 2/3 height, bottom gets 1/3.
 */
export default function exportCombinedPng(topChart, bottomChart, opts = {}) {
  if (!topChart || !bottomChart) return;

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
  const TOP = isRaw ? PAD : 80;
  const BOTTOM = isRaw ? PAD : 52;
  const GAP = 8;

  const EXP_BG = '#FAFAFA';
  const EXP_FRAME = '#070B09';
  const EXP_TEXT = '#070B09';

  const innerW = W - PAD * 2 - CHART_PAD * 2;
  const innerH = H - TOP - BOTTOM - CHART_PAD * 2;
  const topH = Math.round((innerH - GAP) * 2 / 3);
  const botH = innerH - GAP - topH;

  // Helper to render a chart at a specific size and return its canvas image
  function renderAtSize(chart, w, h) {
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
        titleColor: scale.title?.color,
      };
    }
    if (chart.options.plugins?.legend?.labels) {
      save.legendColor = chart.options.plugins.legend.labels.color;
      save.legendSize = chart.options.plugins.legend.labels.font?.size;
    }
    save.widths = chart.data.datasets.map(d => d.borderWidth);

    // Apply export theme
    for (const [, scale] of Object.entries(chart.options.scales || {})) {
      if (scale.ticks) { scale.ticks.color = EXP_FRAME; if (!scale.ticks.font) scale.ticks.font = {}; scale.ticks.font.size = 16; }
      if (!scale.border) scale.border = {};
      scale.border.color = EXP_FRAME; scale.border.display = true;
      if (scale.grid) { scale.grid.color = 'rgba(0,0,0,0)'; scale.grid.display = false; }
      if (scale.title) { scale.title.color = EXP_FRAME; }
    }
    if (chart.options.plugins?.legend?.labels) {
      chart.options.plugins.legend.labels.color = EXP_TEXT;
      if (!chart.options.plugins.legend.labels.font) chart.options.plugins.legend.labels.font = {};
      chart.options.plugins.legend.labels.font.size = 13;
    }
    chart.data.datasets.forEach(d => { if (d.borderWidth) d.borderWidth = Math.max(d.borderWidth * 2, 3); });

    chart.options.devicePixelRatio = 1;
    chart.canvas.style.width = w + 'px';
    chart.canvas.style.height = h + 'px';
    chart.canvas.width = w;
    chart.canvas.height = h;
    chart.resize(w, h);
    chart.update();

    // Capture
    const img = document.createElement('canvas');
    img.width = w; img.height = h;
    img.getContext('2d').drawImage(chart.canvas, 0, 0);

    // Restore
    chart.data.datasets.forEach((d, i) => { d.borderWidth = save.widths[i]; });
    chart.options.devicePixelRatio = save.dpr || undefined;
    for (const [id, scale] of Object.entries(chart.options.scales || {})) {
      const o = save.scales[id] || {};
      if (scale.ticks) { scale.ticks.color = o.tickColor; if (scale.ticks.font) scale.ticks.font.size = o.tickFontSize; }
      if (scale.border) { scale.border.color = o.borderColor; scale.border.display = o.borderDisplay; }
      if (scale.grid) { scale.grid.color = o.gridColor; scale.grid.display = o.gridDisplay; }
      if (scale.title) { scale.title.color = o.titleColor; }
    }
    if (chart.options.plugins?.legend?.labels) {
      chart.options.plugins.legend.labels.color = save.legendColor;
      if (chart.options.plugins.legend.labels.font) chart.options.plugins.legend.labels.font.size = save.legendSize;
    }
    chart.canvas.width = save.cw; chart.canvas.height = save.ch;
    chart.canvas.style.width = save.w; chart.canvas.style.height = save.h;
    chart.resize(); chart.update();

    return img;
  }

  const topImg = renderAtSize(topChart, innerW, topH);
  const botImg = renderAtSize(bottomChart, innerW, botH);

  // Compose
  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const ctx = off.getContext('2d');

  ctx.fillStyle = EXP_BG;
  ctx.fillRect(0, 0, W, H);

  const fx = PAD, fy = TOP, fw = W - PAD * 2, fh = H - TOP - BOTTOM;
  ctx.strokeStyle = EXP_FRAME; ctx.lineWidth = 1.5;
  ctx.strokeRect(fx, fy, fw, fh);

  ctx.drawImage(topImg, fx + CHART_PAD, fy + CHART_PAD, innerW, topH);
  // Separator line
  ctx.strokeStyle = 'rgba(7,11,9,0.15)'; ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(fx + CHART_PAD, fy + CHART_PAD + topH + GAP / 2);
  ctx.lineTo(fx + CHART_PAD + innerW, fy + CHART_PAD + topH + GAP / 2);
  ctx.stroke();
  ctx.drawImage(botImg, fx + CHART_PAD, fy + CHART_PAD + topH + GAP, innerW, botH);

  // Branded decorations
  if (!isRaw) {
    if (logoImg?.naturalWidth) {
      const lh = 42, lw = (lh / logoImg.naturalHeight) * logoImg.naturalWidth;
      try { ctx.drawImage(logoImg, PAD, 18, lw, lh); } catch (e) { /* skip */ }
    }
    if (title) {
      ctx.fillStyle = EXP_TEXT;
      ctx.font = '400 24px DM Sans, Helvetica Neue, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, W / 2, 50);
      ctx.textAlign = 'left';
    }
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
}
