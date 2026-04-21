import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID, fmtBig , xAxisConfig } from '../constants';

export default function EthMa({ from, to }) {
  const url = `/api/eth-ma?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    chartData = {
      labels: data.dates,
      datasets: [
        { label: 'ETH', data: data.price, borderColor: '#627EEA', borderWidth: 1.6, pointRadius: 0, tension: 0.1, backgroundColor: 'transparent' },
        { label: '50d MA', data: data.ma50, borderColor: '#00D64A', borderWidth: 1, pointRadius: 0, tension: 0.1, borderDash: [4, 3], backgroundColor: 'transparent', spanGaps: true },
        { label: '200d MA', data: data.ma200, borderColor: '#EC5B5B', borderWidth: 1, pointRadius: 0, tension: 0.1, borderDash: [4, 3], backgroundColor: 'transparent', spanGaps: true },
        { label: '200w MA', data: data.ma200w, borderColor: '#746BE6', borderWidth: 1, pointRadius: 0, tension: 0.1, borderDash: [2, 2], backgroundColor: 'transparent', spanGaps: true },
      ],
    };
    const last = data.price[data.price.length - 1];
    summary = <div className="perf-item"><span style={{ color: '#627EEA', fontWeight: 600 }}>ETH</span> ${fmtBig(last)}</div>;
  }

  return (
    <ChartPanel title="ETH Moving Averages" source="Source: CoinGecko Pro"
      loading={loading} error={error} chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(data.dates),
          y: { type: 'logarithmic', ticks: { ...YTICK, callback: v => '$' + fmtBig(v) }, grid: YGRID },
        },
        plugins: { legend: { display: true, labels: { color: '#888', font: { size: 11 }, boxWidth: 12 } } },
      }}
      summary={summary}
    />
  );
}
