import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import Chart from 'chart.js/auto';
import useChartData from '../../hooks/useChartData';
import exportCombinedPng from '../../utils/exportCombinedPng';
import { XTICK, YTICK, XGRID, YGRID, fmtBig } from '../constants';

const CDEFAULT = {
  responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } },
    tooltip: { backgroundColor: '#1A1D1B', borderColor: '#2A2D2B', borderWidth: 1, titleColor: '#E8EAE8', bodyColor: '#888B88', padding: 12 },
  },
};

const _logoImg = new Image();
_logoImg.width = 960;
_logoImg.height = 108;
_logoImg.src = '/static/logo.svg';

const MiniChart = forwardRef(function MiniChart({ chartData, chartOptions, chartType, height }, ref) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const hiddenRef = useRef({});
  useImperativeHandle(ref, () => ({ getChart: () => chartRef.current }));

  useEffect(() => {
    if (!chartData || !canvasRef.current) return;
    if (chartRef.current?.data?.datasets) {
      chartRef.current.data.datasets.forEach((ds, i) => { hiddenRef.current[ds.label] = !chartRef.current.isDatasetVisible(i); });
    }
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    const datasets = chartData.datasets.map(ds => ({ ...ds, hidden: hiddenRef.current[ds.label] ?? ds.hidden ?? false }));
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: chartType || 'line', data: { ...chartData, datasets },
      options: { ...CDEFAULT, ...chartOptions, plugins: { ...CDEFAULT.plugins, ...chartOptions?.plugins } },
    });
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [chartData, chartType, chartOptions]);

  return <div style={{ position: 'relative', height }}><canvas ref={canvasRef} /></div>;
});

export default function BtcMaCombined({ from, to }) {
  const ma = useChartData(`/api/btc-ma?from=${from}&to=${to}`);
  const gap = useChartData(`/api/btc-ma-gap?from=${from}&to=${to}`);
  const topRef = useRef(null);
  const botRef = useRef(null);
  const [dropOpen, setDropOpen] = useState(false);

  const loading = ma.loading || gap.loading;
  const error = ma.error || gap.error;

  let maChart = null, gapChart = null, summary = null;

  if (ma.data?.dates?.length) {
    maChart = { labels: ma.data.dates, datasets: [
      { label: 'BTC', data: ma.data.price, borderColor: '#F7931A', borderWidth: 1.6, pointRadius: 0, tension: 0.1, backgroundColor: 'transparent' },
      { label: '50d MA', data: ma.data.ma50, borderColor: '#00D64A', borderWidth: 1, pointRadius: 0, tension: 0.1, borderDash: [4,3], backgroundColor: 'transparent', spanGaps: true },
      { label: '200d MA', data: ma.data.ma200, borderColor: '#EC5B5B', borderWidth: 1, pointRadius: 0, tension: 0.1, borderDash: [4,3], backgroundColor: 'transparent', spanGaps: true },
    ]};
    const last = ma.data.price[ma.data.price.length - 1];
    const last50 = ma.data.ma50?.filter(v => v != null).slice(-1)[0];
    const last200 = ma.data.ma200?.filter(v => v != null).slice(-1)[0];
    summary = (<>
      <div className="perf-item"><span style={{ color: '#F7931A', fontWeight: 600 }}>BTC</span> ${fmtBig(last)}</div>
      {last50 && <div className="perf-item"><span style={{ color: '#00D64A', fontWeight: 600 }}>50d</span> ${fmtBig(last50)}</div>}
      {last200 && <div className="perf-item"><span style={{ color: '#EC5B5B', fontWeight: 600 }}>200d</span> ${fmtBig(last200)}</div>}
    </>);
  }

  if (gap.data?.dates?.length) {
    const colors = gap.data.gap.map(v => v != null && v >= 0 ? 'rgba(0,214,74,0.6)' : 'rgba(236,91,91,0.6)');
    gapChart = { labels: gap.data.dates, datasets: [{ label: 'MA Gap %', data: gap.data.gap, backgroundColor: colors, borderColor: colors, borderWidth: 0, pointRadius: 0, type: 'bar' }] };
    const lastGap = gap.data.gap?.filter(v => v != null).slice(-1)[0];
    if (lastGap != null && summary) {
      summary = (<>{summary}<div className="perf-item"><span style={{ color: lastGap >= 0 ? '#00D64A' : '#EC5B5B', fontWeight: 600 }}>Gap</span> <span className={lastGap >= 0 ? 'pos' : 'neg'}>{lastGap >= 0 ? '+' : ''}{lastGap.toFixed(1)}%</span></div></>);
    }
  }

  useEffect(() => {
    if (!dropOpen) return;
    const close = () => setDropOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [dropOpen]);

  const handleExport = useCallback((mode) => {
    const top = topRef.current?.getChart();
    const bot = botRef.current?.getChart();
    if (!top || !bot) return;
    exportCombinedPng(top, bot, { title: 'BTC Moving Averages — Combined', filename: 'btc_ma_combined', mode, logoImg: _logoImg });
    setDropOpen(false);
  }, []);

  const xTicksCb = function(val) { const l = this.getLabelForValue(val); return l ? l.slice(0,7) : ''; };

  return (
    <div className="main">
      <div className="chart-hdr">
        <div><div className="chart-title">BTC Moving Averages — Combined</div></div>
        <div className="export-wrap">
          <button className="export-btn" onClick={(e) => { e.stopPropagation(); setDropOpen(v => !v); }} title="Save as PNG">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          {dropOpen && (
            <div className="export-drop">
              <button onClick={() => handleExport('raw')}>Raw chart</button>
              <button onClick={() => handleExport('branded')}>Branded (logo + title)</button>
            </div>
          )}
        </div>
      </div>
      <div className="perf-row">{summary}</div>
      <div className="chart-area" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div className={`spinner-wrap${loading ? ' on' : ''}`}><div className="spinner" /></div>
        {error && !loading && (<div className="empty" style={{ display: 'flex' }}><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg><p>Error: {error.message}</p></div>)}
        {maChart && <MiniChart ref={topRef} height="calc(65% - 4px)" chartData={maChart} chartType="line" chartOptions={{ scales: { x: { type: 'category', ticks: { ...XTICK, maxRotation: 0, maxTicksLimit: 8, display: false }, grid: XGRID }, y: { type: 'logarithmic', ticks: { ...YTICK, callback: v => '$' + fmtBig(v) }, grid: YGRID } } }} />}
        <div style={{ height: 1, background: 'var(--border)', flexShrink: 0 }} />
        {gapChart && <MiniChart ref={botRef} height="calc(35% - 5px)" chartData={gapChart} chartType="bar" chartOptions={{ scales: { x: { type: 'category', ticks: { ...XTICK, maxRotation: 0, maxTicksLimit: 8, callback: xTicksCb }, grid: XGRID }, y: { ticks: { ...YTICK, callback: v => v.toFixed(0) + '%' }, grid: YGRID } }, plugins: { legend: { display: false } } }} />}
      </div>
      <div className="chart-src">Source: CoinGecko Pro · price with 50d/200d MA (top) · MA gap % (bottom)</div>
    </div>
  );
}
