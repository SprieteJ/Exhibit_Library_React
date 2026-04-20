import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID } from '../constants';

export default function EthBtcRatio({ from, to }) {
  const url = `/api/eth-btc-ratio?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    chartData = {
      labels: data.dates,
      datasets: [{
        label: 'ETH/BTC', data: data.values,
        borderColor: '#627EEA', backgroundColor: 'rgba(98,126,234,0.08)',
        borderWidth: 1.4, pointRadius: 0, tension: 0.1, fill: true,
      }],
    };
    const last = data.values[data.values.length - 1];
    if (last) summary = <div className="perf-item"><span style={{ color: '#627EEA', fontWeight: 600 }}>ETH/BTC</span> {last.toFixed(4)}</div>;
  }

  return (
    <ChartPanel title="ETH / BTC Ratio" source="Source: CoinGecko Pro"
      loading={loading} error={error} chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: { type: 'category', ticks: { ...XTICK, maxRotation: 0, maxTicksLimit: 8, callback(val) { const l = this.getLabelForValue(val); return l ? l.slice(0, 7) : ''; } }, grid: XGRID },
          y: { ticks: { ...YTICK, callback: v => v.toFixed(3) }, grid: YGRID },
        },
        plugins: { legend: { display: false } },
      }}
      summary={summary}
    />
  );
}
