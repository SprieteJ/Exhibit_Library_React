import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { PAL, XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

const TIERS = ['top10', 'top25', 'top50', 'top100', 'top250'];
const TIER_LABELS = { top10: 'Top 10', top25: 'Top 25', top50: 'Top 50', top100: 'Top 100', top250: 'Top 250' };

export default function AltIntracorr({ from, to }) {
  const url = `/api/alt-intracorr?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);
  let chartData = null;
  if (data?.dates?.length) {
    chartData = { labels: data.dates, datasets: TIERS.filter(t => data[t]).map((t, i) => ({
      label: TIER_LABELS[t], data: data[t], borderColor: PAL[i % PAL.length], backgroundColor: 'transparent', borderWidth: 1.2, pointRadius: 0, tension: 0.1, spanGaps: true,
    }))};
  }
  return <ChartPanel title="Altcoin Intracorrelation" source="Source: CoinGecko Pro · precomputed 30d pairwise avg" loading={loading} error={error} chartType="line" chartData={chartData}
    chartOptions={{ scales: { x: xAxisConfig(data.dates), y: { min: 0, max: 1, ticks: { ...YTICK, callback: v => v.toFixed(1) }, grid: YGRID } }, plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } } }} />;
}
