import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID, fmtBig , xAxisConfig } from '../constants';

export default function CmTotalMcap({ from, to }) {
  const url = `/api/total-mcap?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);
  let chartData = null, summary = null;
  if (data?.dates?.length) {
    chartData = { labels: data.dates, datasets: [
      { label: 'Total Mcap', data: data.mcap, borderColor: '#00D64A', backgroundColor: 'rgba(0,214,74,0.06)', borderWidth: 1.4, pointRadius: 0, tension: 0.1, fill: true },
      { label: '50d MA', data: data.ma50, borderColor: '#2471CC', borderWidth: 1, pointRadius: 0, tension: 0.1, borderDash: [4,3], backgroundColor: 'transparent', spanGaps: true },
      { label: '200d MA', data: data.ma200, borderColor: '#EC5B5B', borderWidth: 1, pointRadius: 0, tension: 0.1, borderDash: [4,3], backgroundColor: 'transparent', spanGaps: true },
    ]};
    const last = data.mcap[data.mcap.length - 1];
    if (last) summary = <div className="perf-item"><span style={{ color: '#00D64A', fontWeight: 600 }}>Total Crypto</span> ${fmtBig(last)}</div>;
  }
  return <ChartPanel title="Total Crypto Market Cap" source="Source: CoinGecko Pro" loading={loading} error={error} chartType="line" chartData={chartData}
    chartOptions={{ scales: { x: xAxisConfig(data?.dates || []), y: { ticks: { ...YTICK, callback: v => '$' + fmtBig(v) }, grid: YGRID } }, plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } } }} summary={summary} />;
}
