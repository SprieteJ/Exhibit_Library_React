/**
 * Export two stacked Chart.js instances into a single styled PNG.
 * Top chart gets 65% height, bottom gets 35%.
 *
 * @param {Chart} topChart - Top Chart.js instance
 * @param {Chart} botChart - Bottom Chart.js instance
 * @param {Object} opts - Same options as exportPng
 */
export default function exportCombinedPng(topChart, botChart, opts = {}) {
  if (!topChart || !botChart) return;

  const {
    title = '',
    filename = 'chart',
    showLogo = true,
    showTitle = true,
    showSource = true,
    logoImg = null,
  } = opts;

  const W = 2400, H = 1200;
  const PAD = 40;
  const CHART_PAD = 16;
  const HEADER_H = showTitle ? 56 : 16;
  const FOOTER_H = showSource ? 40 : 16;
  const GAP = 12;

  const EXP_BG = '#FAFAFA';
  const EXP_FRAME = '#070B09';
  const EXP_TEXT = '#070B09';

  const innerW = W - PAD * 2 - CHART_PAD * 2;
  const totalChartH = H - HEADER_H - FOOTER_H - CHART_PAD * 2 - GAP;
  const topH = Math.round(totalChartH * 0.65);
  const botH = totalChartH - topH;

  function applyExportTheme(chart) {
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

  function renderChart(chart, w, h) {
    chart.canvas.width = w; chart.canvas.height = h;
    chart.canvas.style.width = w + 'px'; chart.canvas.style.height = h + 'px';
    chart.resize(w, h); chart.update();
  }

  function restoreChart(chart, saves) {
    chart.options.devicePixelRatio = saves.dpr || undefined;
    for (const [id, scale] of Object.entries(chart.options.scales || {})) {
      const orig = saves.scales[id] || {};
      if (scale.ticks) { scale.ticks.color = orig.tickColor; if (scale.ticks.font) scale.ticks.font.size = orig.tickFontSize; }
      if (scale.border) { scale.border.color = orig.borderColor; scale.border.display = orig.borderDisplay; }
      if (scale.grid) { scale.grid.color = orig.gridColor; scale.grid.display = orig.gridDisplay; scale.grid.drawBorder = orig.gridDrawBorder; }
      if (scale.title) { scale.title.color = orig.titleColor; if (scale.title.font) scale.title.font.size = orig.titleFontSize; }
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

  // Apply theme + resize
  const topSaves = applyExportTheme(topChart);
  const botSaves = applyExportTheme(botChart);
  renderChart(topChart, innerW, topH);
  renderChart(botChart, innerW, botH);

  // Build export canvas
  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const ctx = off.getContext('2d');

  ctx.fillStyle = EXP_BG;
  ctx.fillRect(0, 0, W, H);

  // Frame
  const fx = PAD, fy = HEADER_H;
  const fw = W - PAD * 2, fh = H - HEADER_H - FOOTER_H;
  ctx.strokeStyle = EXP_FRAME; ctx.lineWidth = 1.5;
  ctx.strokeRect(fx, fy, fw, fh);

  // Draw charts
  ctx.drawImage(topChart.canvas, fx + CHART_PAD, fy + CHART_PAD, innerW, topH);
  ctx.drawImage(botChart.canvas, fx + CHART_PAD, fy + CHART_PAD + topH + GAP, innerW, botH);

  // Divider line between panels
  const divY = fy + CHART_PAD + topH + GAP / 2;
  ctx.strokeStyle = 'rgba(7,11,9,0.15)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(fx + 8, divY); ctx.lineTo(fx + fw - 8, divY); ctx.stroke();

  // Logo
  if (showLogo && logoImg?.naturalWidth) {
    const logoH = 36;
    const logoW = (logoH / logoImg.naturalHeight) * logoImg.naturalWidth;
    try { ctx.drawImage(logoImg, PAD, 10, logoW, logoH); } catch (e) { /* ignore */ }
  }

  // Title
  if (showTitle && title) {
    ctx.fillStyle = EXP_TEXT;
    ctx.font = '400 22px DM Sans, Helvetica Neue, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 36);
    ctx.textAlign = 'left';
  }

  // Source
  if (showSource) {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const now = new Date();
    const dateFormatted = now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();
    ctx.fillStyle = 'rgba(7,11,9,0.6)';
    ctx.font = '400 14px DM Sans, Helvetica Neue, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Source: Wintermute    Data as of: ' + dateFormatted, W - PAD, H - 12);
    ctx.textAlign = 'left';
  }

  // Download
  const a = document.createElement('a');
  const dt = new Date().toISOString().split('T')[0];
  a.download = filename + '_' + dt + '.png';
  a.href = off.toDataURL('image/png');
  a.click();

  // Restore
  restoreChart(topChart, topSaves);
  restoreChart(botChart, botSaves);
}
