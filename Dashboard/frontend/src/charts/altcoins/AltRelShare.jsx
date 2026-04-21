import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

export default function AltRelShare({ from, to }) {
  const url = `/api/alt-rel-share?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);
  let chartData = null;
  if (data?.dates?.length) {
    chartData = { labels: data.dates, datasets: [
      { label: 'vs Total', data: data.vs_total, borderColor: '#00D64A', borderWidth: 1.4, pointRadius: 0, tension: 0.1, backgroundColor: 'transparent', yAxisID: 'y', spanGaps: true },
      { label: 'vs BTC', data: data.vs_btc, borderColor: '#F7931A', borderWidth: 1.2, pointRadius: 0, tension: 0.1, backgroundColor: 'transparent', yAxisID: 'y1', spanGaps: true },
      { label: 'vs ETH', data: data.vs_eth, borderColor: '#627EEA', borderWidth: 1.2, pointRadius: 0, tension: 0.1, backgroundColor: 'transparent', yAxisID: 'y1', spanGaps: true },
    ]};
  }
  return <ChartPanel title="Altcoin Relative Share" source="Source: CoinGecko Pro" loading={loading} error={error} chartType="line" chartData={chartData}
    chartOptions={{ scales: { x: xAxisConfig(data?.dates || []), y: { position: 'left', ticks: { ...YTICK, callback: v => v.toFixed(0) + '%' }, grid: YGRID, title: { display: true, text: 'vs Total %', color: '#888', font: { size: 11 } } }, y1: { position: 'right', ticks: { ...YTICK, callback: v => v.toFixed(0) + '%' }, grid: { display: false } } }, plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } } }} />;
}
