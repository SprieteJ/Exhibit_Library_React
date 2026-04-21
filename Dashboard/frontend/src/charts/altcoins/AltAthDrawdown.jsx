import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID } from '../constants';

export default function AltAthDrawdown({ from, to }) {
  const url = `/api/alt-ath-drawdown?topn=30`;
  const { data, loading, error } = useChartData(url);
  let chartData = null;
  if (data?.points?.length) {
    chartData = { labels: data.points.map(p => p.symbol), datasets: [{ label: 'Drawdown %', data: data.points.map(p => p.drawdown_pct), backgroundColor: data.points.map(p => p.drawdown_pct > -30 ? 'rgba(0,214,74,0.5)' : p.drawdown_pct > -70 ? 'rgba(255,184,0,0.5)' : 'rgba(236,91,91,0.5)'), borderWidth: 0 }] };
  }
  return <ChartPanel title="Altcoin Distance from ATH" source="Source: CoinGecko Pro · sorted worst-first" loading={loading} error={error} chartType="bar" chartData={chartData}
    chartOptions={{ indexAxis: 'y', scales: { x: { max: 0, ticks: { ...XTICK, callback: v => v + '%' }, grid: XGRID }, y: { ticks: { ...YTICK, font: { size: 10 } }, grid: { display: false } } }, plugins: { legend: { display: false } } }} />;
}
