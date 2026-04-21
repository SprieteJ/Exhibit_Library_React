/**
 * Export two stacked Chart.js instances into a single styled PNG.
 * mode = 'raw':     Just the two charts stacked.
 * mode = 'branded': Charts + logo + title + source.
 */
export default function exportCombinedPng(topChart, botChart, opts = {}) {
  if (!topChart || !botChart) return;

  const {
    title = '',
    filename = 'chart',
    mode = 'branded',
    logoImg = null,
  } = opts;

  const isRaw = mode === 'raw';
  const W = 2400;
  const H = isRaw ? 1100 : 1300;
  const PAD = 40;
  const CHART_PAD = 16;
  const TOP = isRaw ? PAD : 80;
  const BOTTOM = isRaw ? PAD : 52;
  const GAP = 12;

  const EXP_BG = '#FAFAFA';
  const EXP_FRAME = '#070B09';
  const EXP_TEXT = '#070B09';

  const innerW = W - PAD * 2 - CHART_PAD * 2;
  const totalH = H - TOP - BOTTOM - CHART_PAD * 2 - GAP;
  const topH = Math.round(totalH * 0.65);
  const botH = totalH - topH;

  function applyTheme(c) {
    const s = {
      dpr: c.options.devicePixelRatio, cw: c.canvas.width, ch: c.canvas.height,
      w: c.canvas.style.width, h: c.canvas.style.height, scales: {},
      legendColor: null, legendSize: null, widths: [],
    };
    for (const [id, sc] of Object.entries(c.options.scales || {})) {
      s.scales[id] = {
        tickColor: sc.ticks?.color, tickFontSize: sc.ticks?.font?.size,
        borderColor: sc.border?.color, borderDisplay: sc.border?.display,
        gridColor: sc.grid?.color, gridDisplay: sc.grid?.display,
        gridDrawBorder: sc.grid?.drawBorder, titleColor: sc.title?.color,
        titleFontSize: sc.title?.font?.size,
      };
      if (sc.ticks) { sc.ticks.color = EXP_FRAME; if (!sc.ticks.font) sc.ticks.font = {}; sc.ticks.font.size = 16; }
      if (!sc.border) sc.border = {};
      sc.border.color = EXP_FRAME; sc.border.display = true;
      if (sc.grid) { sc.grid.color = 'rgba(0,0,0,0)'; sc.grid.display = false; sc.grid.drawBorder = true; }
      if (sc.title) { sc.title.color = EXP_FRAME; if (sc.title.font) sc.title.font.size = 14; }
    }
    if (c.options.plugins?.legend?.labels) {
      s.legendColor = c.options.plugins.legend.labels.color;
      s.legendSize = c.options.plugins.legend.labels.font?.size;
      c.options.plugins.legend.labels.color = EXP_TEXT;
      if (!c.options.plugins.legend.labels.font) c.options.plugins.legend.labels.font = {};
      c.options.plugins.legend.labels.font.size = 13;
    }
    s.widths = c.data.datasets.map(d => d.borderWidth);
    c.data.datasets.forEach(d => { if (d.borderWidth) d.borderWidth = Math.max(d.borderWidth * 2, 3); });
    c.options.devicePixelRatio = 1;
    return s;
  }

  function render(c, w, h) {
    c.canvas.style.width = w + 'px'; c.canvas.style.height = h + 'px';
    c.canvas.width = w; c.canvas.height = h;
    c.resize(w, h); c.update('none');
  }

  function restore(c, s) {
    c.options.devicePixelRatio = s.dpr || undefined;
    for (const [id, sc] of Object.entries(c.options.scales || {})) {
      const o = s.scales[id] || {};
      if (sc.ticks) { sc.ticks.color = o.tickColor; if (sc.ticks.font) sc.ticks.font.size = o.tickFontSize; }
      if (sc.border) { sc.border.color = o.borderColor; sc.border.display = o.borderDisplay; }
      if (sc.grid) { sc.grid.color = o.gridColor; sc.grid.display = o.gridDisplay; sc.grid.drawBorder = o.gridDrawBorder; }
      if (sc.title) { sc.title.color = o.titleColor; if (sc.title.font) sc.title.font.size = o.titleFontSize; }
    }
    if (c.options.plugins?.legend?.labels) {
      c.options.plugins.legend.labels.color = s.legendColor;
      if (c.options.plugins.legend.labels.font) c.options.plugins.legend.labels.font.size = s.legendSize;
    }
    c.data.datasets.forEach((d, i) => { d.borderWidth = s.widths[i]; });
    c.canvas.width = s.cw; c.canvas.height = s.ch;
    c.canvas.style.width = s.w; c.canvas.style.height = s.h;
    c.resize(); c.update('none');
  }

  const topS = applyTheme(topChart);
  const botS = applyTheme(botChart);
  render(topChart, innerW, topH);
  render(botChart, innerW, botH);

  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const ctx = off.getContext('2d');

  ctx.fillStyle = EXP_BG; ctx.fillRect(0, 0, W, H);

  // Frame
  const fx = PAD, fy = TOP, fw = W - PAD * 2, fh = H - TOP - BOTTOM;
  ctx.strokeStyle = EXP_FRAME; ctx.lineWidth = 1.5;
  ctx.strokeRect(fx, fy, fw, fh);

  // Charts
  ctx.drawImage(topChart.canvas, fx + CHART_PAD, fy + CHART_PAD, innerW, topH);
  ctx.drawImage(botChart.canvas, fx + CHART_PAD, fy + CHART_PAD + topH + GAP, innerW, botH);

  // Divider
  const divY = fy + CHART_PAD + topH + GAP / 2;
  ctx.strokeStyle = 'rgba(7,11,9,0.15)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(fx + 8, divY); ctx.lineTo(fx + fw - 8, divY); ctx.stroke();

  if (!isRaw) {
    if (logoImg?.naturalWidth) {
      const lh = 42, lw = (lh / logoImg.naturalHeight) * logoImg.naturalWidth;
      try { ctx.drawImage(logoImg, PAD, 18, lw, lh); } catch (e) { /* skip */ }
    }
    if (title) {
      ctx.fillStyle = EXP_TEXT; ctx.font = '400 24px DM Sans, Helvetica Neue, sans-serif';
      ctx.textAlign = 'center'; ctx.fillText(title, W / 2, 50); ctx.textAlign = 'left';
    }
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const now = new Date();
    ctx.fillStyle = 'rgba(7,11,9,0.6)'; ctx.font = '400 14px DM Sans, Helvetica Neue, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Source: Wintermute    Data as of: ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear(), W - PAD, H - 16);
    ctx.textAlign = 'left';
  }

  const suffix = isRaw ? '_raw' : '_branded';
  const a = document.createElement('a');
  a.download = filename + suffix + '_' + new Date().toISOString().split('T')[0] + '.png';
  a.href = off.toDataURL('image/png'); a.click();

  restore(topChart, topS);
  restore(botChart, botS);
}
