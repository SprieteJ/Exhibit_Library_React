import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

export default function EtfDailyBar({ from, to }) {
  const url = `/api/etf-flows?from=${from}&to=${to}&window=1`;
  const { data, loading, error } = useChartData(url);
  let chartData = null;
  if (data?.assets) {
    const allDates = new Set();
    for (const v of Object.values(data.assets)) v.dates.forEach(d => allDates.add(d));
    const dates = [...allDates].sort();
    const datasets = [];
    for (const [asset, v] of Object.entries(data.assets)) {
      const dateMap = {};
      v.dates.forEach((d, i) => dateMap[d] = v.daily[i]);
      const color = asset === 'BTC' ? '#F7931A' : '#627EEA';
      datasets.push({ label: asset, data: dates.map(d => dateMap[d] ?? null), backgroundColor: color + '99', borderColor: color, borderWidth: 1, stack: 'flows' });
    }
    if (datasets.length) chartData = { labels: dates, datasets };
  }
  return <ChartPanel title="Daily Spot ETF Flows" source="Source: Farside Investors" loading={loading} error={error} chartType="bar" chartData={chartData}
    chartOptions={{ scales: { x: { ...xAxisConfig(dates), stacked: true }, y: { stacked: true, ticks: { ...YTICK, callback: v => '$' + v.toFixed(0) + 'M' }, grid: YGRID } }, plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } } }} />;
}
