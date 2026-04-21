/**
 * Export two stacked Chart.js instances into a single styled PNG.
 * mode = 'raw':    Just the two charts stacked, no decorations.
 * mode = 'branded': Charts + logo + title + source, taller canvas.
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
  const H = isRaw ? 1000 : 1200;
  const PAD = 40;
  const CHART_PAD = 16;
  const HEADER_H = isRaw ? 0 : 72;
  const FOOTER_H = isRaw ? 0 : 44;
  const GAP = 12;

  const EXP_BG = '#FAFAFA';
  const EXP_FRAME = '#070B09';
  const EXP_TEXT = '#070B09';

  const innerW = W - PAD * 2 - CHART_PAD * 2;
  const totalChartH = H - (HEADER_H || PAD) - (FOOTER_H || PAD) - CHART_PAD * 2 - GAP;
  const topH = Math.round(totalChartH * 0.65);
  const botH = totalChartH - topH;

  function applyTheme(chart) {
    const saves = {
      dpr: chart.options.devicePixelRatio,
      cw: chart.canvas.width, ch: chart.canvas.height,
      w: chart.canvas.style.width, h: chart.canvas.style.height,
      scales: {}, legendColor: null, legendSize: null, widths: [],
    };
    for (const [id, scale] of Object.entries(chart.options.scales || {})) {
      saves.scales[id] = {
        tickColor: scale.ticks?.color, tickFontSize: scale.ticks?.font?.size,
        borderColor: scale.border?.color, borderDisplay: scale.border?.display,
        gridColor: scale.grid?.color, gridDisplay: scale.grid?.display,
        gridDrawBorder: scale.grid?.drawBorder, titleColor: scale.title?.color,
        titleFontSize: scale.title?.font?.size,
      };
      if (scale.ticks) { scale.ticks.color = EXP_FRAME; if (!scale.ticks.font) scale.ticks.font = {}; scale.ticks.font.size = 16; }
      if (!scale.border) scale.border = {};
      scale.border.color = EXP_FRAME; scale.border.display = true;
      if (scale.grid) { scale.grid.color = 'rgba(0,0,0,0)'; scale.grid.display = false; scale.grid.drawBorder = true; }
      if (scale.title) { scale.title.color = EXP_FRAME; if (scale.title.font) scale.title.font.size = 14; }
    }
    if (chart.options.plugins?.legend?.labels) {
      saves.legendColor = chart.options.plugins.legend.labels.color;
      saves.legendSize = chart.options.plugins.legend.labels.font?.size;
      chart.options.plugins.legend.labels.color = EXP_TEXT;
      if (!chart.options.plugins.legend.labels.font) chart.options.plugins.legend.labels.font = {};
      chart.options.plugins.legend.labels.font.size = 13;
    }
    saves.widths = chart.data.datasets.map(d => d.borderWidth);
    chart.data.datasets.forEach(d => { if (d.borderWidth) d.borderWidth = Math.max(d.borderWidth * 2, 3); });
    chart.options.devicePixelRatio = 1;
    return saves;
  }

  function render(chart, w, h) {
    chart.canvas.width = w; chart.canvas.height = h;
    chart.canvas.style.width = w + 'px'; chart.canvas.style.height = h + 'px';
    chart.resize(w, h); chart.update();
  }

  function restore(chart, saves) {
    chart.options.devicePixelRatio = saves.dpr || undefined;
    for (const [id, scale] of Object.entries(chart.options.scales || {})) {
      const o = saves.scales[id] || {};
      if (scale.ticks) { scale.ticks.color = o.tickColor; if (scale.ticks.font) scale.ticks.font.size = o.tickFontSize; }
      if (scale.border) { scale.border.color = o.borderColor; scale.border.display = o.borderDisplay; }
      if (scale.grid) { scale.grid.color = o.gridColor; scale.grid.display = o.gridDisplay; scale.grid.drawBorder = o.gridDrawBorder; }
      if (scale.title) { scale.title.color = o.titleColor; if (scale.title.font) scale.title.font.size = o.titleFontSize; }
    }
    if (chart.options.plugins?.legend?.labels) {
      chart.options.plugins.legend.labels.color = saves.legendColor;
      if (chart.options.plugins.legend.labels.font) chart.options.plugins.legend.labels.font.size = saves.legendSize;
    }
    chart.data.datasets.forEach((d, i) => { d.borderWidth = saves.widths[i]; });
    chart.canvas.width = saves.cw; chart.canvas.height = saves.ch;
    chart.canvas.style.width = saves.w; chart.canvas.style.height = saves.h;
    chart.resize(); chart.update();
  }

  const topSaves = applyTheme(topChart);
  const botSaves = applyTheme(botChart);
  render(topChart, innerW, topH);
  render(botChart, innerW, botH);

  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const ctx = off.getContext('2d');

  ctx.fillStyle = EXP_BG; ctx.fillRect(0, 0, W, H);

  const fx = PAD, fy = HEADER_H || PAD;
  const fw = W - PAD * 2, fh = H - (HEADER_H || PAD) - (FOOTER_H || PAD);
  ctx.strokeStyle = EXP_FRAME; ctx.lineWidth = 1.5;
  ctx.strokeRect(fx, fy, fw, fh);

  ctx.drawImage(topChart.canvas, fx + CHART_PAD, fy + CHART_PAD, innerW, topH);
  ctx.drawImage(botChart.canvas, fx + CHART_PAD, fy + CHART_PAD + topH + GAP, innerW, botH);

  const divY = fy + CHART_PAD + topH + GAP / 2;
  ctx.strokeStyle = 'rgba(7,11,9,0.15)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(fx + 8, divY); ctx.lineTo(fx + fw - 8, divY); ctx.stroke();

  if (!isRaw) {
    if (logoImg?.naturalWidth) {
      const logoH = 42, logoW = (logoH / logoImg.naturalHeight) * logoImg.naturalWidth;
      try { ctx.drawImage(logoImg, PAD, 14, logoW, logoH); } catch (e) { /* ignore */ }
    }
    if (title) {
      ctx.fillStyle = EXP_TEXT; ctx.font = '400 24px DM Sans, Helvetica Neue, sans-serif';
      ctx.textAlign = 'center'; ctx.fillText(title, W / 2, 46); ctx.textAlign = 'left';
    }
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const now = new Date();
    ctx.fillStyle = 'rgba(7,11,9,0.6)'; ctx.font = '400 14px DM Sans, Helvetica Neue, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Source: Wintermute    Data as of: ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear(), W - PAD, H - 14);
    ctx.textAlign = 'left';
  }

  const suffix = isRaw ? '_raw' : '_branded';
  const a = document.createElement('a');
  a.download = filename + suffix + '_' + new Date().toISOString().split('T')[0] + '.png';
  a.href = off.toDataURL('image/png'); a.click();

  restore(topChart, topSaves);
  restore(botChart, botSaves);
}
