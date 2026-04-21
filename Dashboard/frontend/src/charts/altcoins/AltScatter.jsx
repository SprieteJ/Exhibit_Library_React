import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID } from '../constants';

export default function AltScatter({ from, to }) {
  const url = `/api/alt-scatter?to=${to}&days=30&topn=50`;
  const { data, loading, error } = useChartData(url);
  let chartData = null, summary = null;
  if (data?.points?.length) {
    chartData = { datasets: [{ label: 'Altcoins', data: data.points.map(p => ({ x: p.vol, y: p.perf, label: p.symbol })), backgroundColor: 'rgba(0,214,74,0.5)', borderColor: '#00D64A', pointRadius: 4, pointHoverRadius: 6 }] };
    summary = <div className="perf-item"><span style={{ color: '#F7931A', fontWeight: 600 }}>BTC 30d</span> {data.btc_return > 0 ? '+' : ''}{data.btc_return?.toFixed(1)}%</div>;
  }
  return <ChartPanel title="Altcoin Performance vs BTC (30d)" source="Source: CoinGecko Pro · top 50 by mcap" loading={loading} error={error} chartType="scatter" chartData={chartData}
    chartOptions={{ scales: { x: { type: 'linear', ticks: { ...XTICK, callback: v => v.toFixed(0) + '%' }, grid: XGRID, title: { display: true, text: 'Excess Volatility vs BTC', color: '#888', font: { size: 11 } } }, y: { ticks: { ...YTICK, callback: v => v.toFixed(0) + '%' }, grid: YGRID, title: { display: true, text: 'Excess Return vs BTC', color: '#888', font: { size: 11 } } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.raw.label}: ${ctx.raw.y > 0 ? '+' : ''}${ctx.raw.y.toFixed(1)}% ret, ${ctx.raw.x > 0 ? '+' : ''}${ctx.raw.x.toFixed(1)}% vol` } } } }} summary={summary} />;
}
