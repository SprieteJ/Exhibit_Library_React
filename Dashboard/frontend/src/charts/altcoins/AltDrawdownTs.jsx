import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { PAL, XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

export default function AltDrawdownTs({ from, to }) {
  const url = `/api/alt-drawdown-ts?from=${from}&to=${to}&topn=10`;
  const { data, loading, error } = useChartData(url);
  let chartData = null;
  if (data?.series && Object.keys(data.series).length) {
    const datasets = [];
    let i = 0;
    for (const [sym, s] of Object.entries(data.series)) {
      const dateMap = {};
      s.dates.forEach((d, j) => dateMap[d] = s.drawdowns[j]);
      datasets.push({ label: sym, data: data.dates.map(d => dateMap[d] ?? null), borderColor: PAL[i % PAL.length], backgroundColor: 'transparent', borderWidth: 1.2, pointRadius: 0, tension: 0.1, spanGaps: true });
      i++;
    }
    chartData = { labels: data.dates, datasets };
  }
  return <ChartPanel title="Altcoin Drawdown Over Time" source="Source: CoinGecko Pro · top 10 by mcap" loading={loading} error={error} chartType="line" chartData={chartData}
    chartOptions={{ scales: { x: xAxisConfig(data?.dates || []), y: { max: 0, ticks: { ...YTICK, callback: v => v + '%' }, grid: YGRID } }, plugins: { legend: { display: true, labels: { color: '#888', font: { size: 10 }, boxWidth: 10 } } } }} />;
}
