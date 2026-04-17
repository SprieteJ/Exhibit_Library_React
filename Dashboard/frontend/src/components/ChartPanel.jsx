import { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

const CDEFAULT = {
  responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: '#1A1D1B', borderColor: '#2A2D2B', borderWidth: 1, titleColor: '#E8EAE8', bodyColor: '#888B88', padding: 12 },
  },
};

export default function ChartPanel({ title, source, loading, error, chartType, chartData, chartOptions, summary, children }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const hiddenRef = useRef({});  // persist legend toggle state

  useEffect(() => {
    if (children || !chartData || !canvasRef.current) return;

    // Save hidden state before destroying
    if (chartRef.current?.data?.datasets) {
      chartRef.current.data.datasets.forEach((ds, i) => {
        hiddenRef.current[ds.label] = !chartRef.current.isDatasetVisible(i);
      });
    }
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

    // Apply saved hidden state
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

  return (
    <div className="main">
      <div className="chart-hdr"><div><div className="chart-title">{title || ''}</div></div></div>
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
