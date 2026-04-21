import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

export default function SecSharpe({ from, to, window: win }) {
  const url = `/api/sector-sharpe?to=${to}&window=${win || '30'}`;
  const { data, loading, error } = useChartData(url);
  let chartData = null;
  if (data && !data.error && typeof data === 'object') {
    const entries = Object.entries(data).filter(([, v]) => v?.x != null && v?.y != null);
    if (entries.length) {
      chartData = { datasets: entries.map(([name, v]) => ({
        label: name, data: [{ x: v.x, y: v.y }],
        backgroundColor: v.color || '#888', pointRadius: 7, pointHoverRadius: 9,
      }))};
    }
  }
  return <ChartPanel title={`Sector Risk-Adjusted Returns (${win || 30}d)`} source="Source: CoinGecko Pro · x=vol, y=return" loading={loading} error={error} chartType="scatter" chartData={chartData}
    chartOptions={{ scales: {
      x: { type: 'linear', ticks: { ...XTICK, callback: v => v.toFixed(0) + '%' }, grid: XGRID, title: { display: true, text: 'Annualized Volatility', color: '#888', font: { size: 11 } } },
      y: { type: 'linear', ticks: { ...YTICK, callback: v => v.toFixed(0) + '%' }, grid: YGRID, title: { display: true, text: 'Cumulative Return', color: '#888', font: { size: 11 } } },
    }, plugins: { legend: { display: true, labels: { color: '#888', font: { size: 9 }, boxWidth: 8 } }, tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ret=${ctx.raw.y?.toFixed(1)}%, vol=${ctx.raw.x?.toFixed(1)}%` } } } }} />;
}
