import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID } from '../constants';

export default function SecCumulative({ from, to }) {
  const url = `/api/sector-cumulative?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);
  let chartData = null;
  if (data && !data.error) {
    const sorted = Object.entries(data).filter(([,v]) => v?.value != null).sort((a, b) => b[1].value - a[1].value);
    if (sorted.length) {
      chartData = { labels: sorted.map(([n]) => n.length > 20 ? n.slice(0,17) + '…' : n), datasets: [{ label: 'Return %', data: sorted.map(([,v]) => v.value), backgroundColor: sorted.map(([,v]) => v.value >= 0 ? v.color || 'rgba(0,214,74,0.6)' : 'rgba(236,91,91,0.6)'), borderWidth: 0 }] };
    }
  }
  return <ChartPanel title="Cumulative Returns by Sector" source="Source: CoinGecko Pro · EW index" loading={loading} error={error} chartType="bar" chartData={chartData}
    chartOptions={{ indexAxis: 'y', scales: { x: { ticks: { ...XTICK, callback: v => v.toFixed(0) + '%' }, grid: XGRID }, y: { ticks: { ...YTICK, font: { size: 10 } }, grid: { display: false } } }, plugins: { legend: { display: false } } }} />;
}
