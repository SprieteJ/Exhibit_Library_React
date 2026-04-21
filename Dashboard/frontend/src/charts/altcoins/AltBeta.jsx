import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

export default function AltBeta({ from, to, window: win }) {
  const url = `/api/alt-beta?to=${to}&window=${win || '60'}&topn=50`;
  const { data, loading, error } = useChartData(url);
  let chartData = null;
  if (data?.points?.length) {
    chartData = { datasets: [{ label: 'Alts', data: data.points.map(p => ({ x: p.beta, y: p.alpha, label: p.symbol })), backgroundColor: data.points.map(p => p.color_sector || '#888'), pointRadius: 5, pointHoverRadius: 7 }] };
  }
  return <ChartPanel title={`Beta to BTC (${win || 60}d)`} source="Source: CoinGecko Pro · OLS log-return regression" loading={loading} error={error} chartType="scatter" chartData={chartData}
    chartOptions={{ scales: { x: { type: 'linear', ticks: XTICK, grid: XGRID, title: { display: true, text: 'Beta to BTC', color: '#888', font: { size: 11 } } }, y: { ticks: { ...YTICK, callback: v => v.toFixed(0) + '%' }, grid: YGRID, title: { display: true, text: 'Alpha (ann. %)', color: '#888', font: { size: 11 } } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.raw.label}: β=${ctx.raw.x.toFixed(2)}, α=${ctx.raw.y > 0 ? '+' : ''}${ctx.raw.y.toFixed(0)}%` } } } }} />;
}
