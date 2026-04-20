import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID } from '../constants';

export default function BtcGoldRatio({ from, to }) {
  const url = `/api/btc-gold-ratio?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    chartData = {
      labels: data.dates,
      datasets: [{
        label: 'BTC / GLD', data: data.values,
        borderColor: '#E1C87E', backgroundColor: 'rgba(225,200,126,0.08)',
        borderWidth: 1.4, pointRadius: 0, tension: 0.1, fill: true,
      }],
    };
    const last = data.values[data.values.length - 1];
    if (last) summary = <div className="perf-item"><span style={{ color: '#E1C87E', fontWeight: 600 }}>Ratio</span> {last.toFixed(2)}</div>;
  }

  return (
    <ChartPanel
      title="BTC / Gold Ratio"
      source="Source: CoinGecko + Yahoo Finance · BTC price / GLD close"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: { type: 'category', ticks: { ...XTICK, maxRotation: 0, maxTicksLimit: 8, callback(val) { const l = this.getLabelForValue(val); return l ? l.slice(0, 7) : ''; } }, grid: XGRID },
          y: { ticks: YTICK, grid: YGRID },
        },
        plugins: { legend: { display: false } },
      }}
      summary={summary}
    />
  );
}
