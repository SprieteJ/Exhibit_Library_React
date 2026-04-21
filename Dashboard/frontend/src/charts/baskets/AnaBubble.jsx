import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID, fmtBig } from '../constants';

export default function AnaBubble({ from, to, window: win }) {
  const url = `/api/sector-bubble?to=${to}&window=${win || '30'}`;
  const { data, loading, error } = useChartData(url);
  let chartData = null;
  if (data && !data.error && typeof data === 'object') {
    const entries = Object.entries(data).filter(([, v]) => v?.x != null && v?.y != null);
    if (entries.length) {
      const maxMcap = Math.max(...entries.map(([, v]) => v.mcap || 1));
      chartData = { datasets: entries.map(([name, v]) => ({
        label: name, data: [{ x: v.x, y: v.y, r: Math.max(4, Math.sqrt(v.mcap / maxMcap) * 25) }],
        backgroundColor: (v.color || '#888') + '99', borderColor: v.color || '#888', borderWidth: 1,
      }))};
    }
  }
  return <ChartPanel title={`Momentum vs Autocorrelation (${win || 30}d)`} source="Source: CoinGecko Pro · bubble size = mcap" loading={loading} error={error} chartType="bubble" chartData={chartData}
    chartOptions={{ scales: {
      x: { type: 'linear', ticks: { ...XTICK, callback: v => v.toFixed(2) }, grid: XGRID, title: { display: true, text: 'Autocorrelation (lag-1)', color: '#888', font: { size: 11 } } },
      y: { type: 'linear', ticks: { ...YTICK, callback: v => v.toFixed(0) + '%' }, grid: YGRID, title: { display: true, text: 'Momentum (%)', color: '#888', font: { size: 11 } } },
    }, plugins: { legend: { display: true, labels: { color: '#888', font: { size: 9 }, boxWidth: 8 } }, tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: mom=${ctx.raw.y?.toFixed(1)}%, autocorr=${ctx.raw.x?.toFixed(2)}` } } } }} />;
}
