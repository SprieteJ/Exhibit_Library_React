import { useRef, useEffect, useState, useCallback } from 'react';
import Chart from 'chart.js/auto';
import exportPng from '../utils/exportPng';

const CDEFAULT = {
  responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: '#1A1D1B', borderColor: '#2A2D2B', borderWidth: 1, titleColor: '#E8EAE8', bodyColor: '#888B88', padding: 12 },
  },
};

// Preload logo once
const _logoImg = new Image();
_logoImg.crossOrigin = 'anonymous';
_logoImg.src = '/static/logo.png';

export default function ChartPanel({ title, source, loading, error, chartType, chartData, chartOptions, summary, children }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const hiddenRef = useRef({});

  const [expLogo, setExpLogo] = useState(true);
  const [expTitle, setExpTitle] = useState(true);
  const [expSource, setExpSource] = useState(true);

  useEffect(() => {
    if (children || !chartData || !canvasRef.current) return;

    if (chartRef.current?.data?.datasets) {
      chartRef.current.data.datasets.forEach((ds, i) => {
        hiddenRef.current[ds.label] = !chartRef.current.isDatasetVisible(i);
      });
    }
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

    const datasets = chartData.datasets.map(ds => ({
      ...ds,
      hidden: hiddenRef.current[ds.label] ?? ds.hidden ?? false,
    }));

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: chartType || 'line',
      data: { ...chartData, datasets },
      options: { ...CDEFAULT, ...chartOptions, plugins: { ...CDEFAULT.plugins, ...chartOptions?.plugins } },
    });

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [chartData, chartType, chartOptions, children]);

  const handleExport = useCallback(() => {
    if (!chartRef.current) return;
    const slug = (title || 'chart').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    exportPng(chartRef.current, {
      title: expTitle ? (title || '') : '',
      filename: slug,
      showLogo: expLogo,
      showTitle: expTitle,
      showSource: expSource,
      logoImg: _logoImg,
    });
  }, [title, expLogo, expTitle, expSource]);

  const hasChart = !children && chartData;

  return (
    <div className="main">
      <div className="chart-hdr">
        <div>
          <div className="chart-title">{title || ''}</div>
        </div>
        {/* Export button — only show for canvas-based charts */}
        {hasChart && (
          <button className="export-btn" onClick={handleExport} title="Save as PNG">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        )}
      </div>

      {/* Export options row — only when chart exists */}
      {hasChart && (
        <div className="export-options">
          <label><input type="checkbox" checked={expLogo} onChange={e => setExpLogo(e.target.checked)} /> Logo</label>
          <label><input type="checkbox" checked={expTitle} onChange={e => setExpTitle(e.target.checked)} /> Title</label>
          <label><input type="checkbox" checked={expSource} onChange={e => setExpSource(e.target.checked)} /> Source</label>
        </div>
      )}

      <div className="perf-row">{summary || null}</div>
      <div className="chart-area">
        {children ? children : <canvas ref={canvasRef} />}
        <div className={`spinner-wrap${loading ? ' on' : ''}`}><div className="spinner" /></div>
        {error && !loading && (
          <div className="empty" style={{ display: 'flex' }}>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <p>Error: {error.message}</p>
          </div>
        )}
      </div>
      <div className="chart-src">{source || ''}</div>
    </div>
  );
}
