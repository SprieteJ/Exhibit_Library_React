import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID } from '../constants';

export default function BtcDominance({ from, to }) {
  const url = `/api/btc-dominance?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    chartData = {
      labels: data.dates,
      datasets: [{
        label: 'BTC Dominance', data: data.values,
        borderColor: '#F7931A', backgroundColor: 'rgba(247,147,26,0.08)',
        borderWidth: 1.4, pointRadius: 0, tension: 0.1, fill: true,
      }],
    };
    const last = data.values[data.values.length - 1];
    if (last) summary = <div className="perf-item"><span style={{ color: '#F7931A', fontWeight: 600 }}>Dominance</span> {last.toFixed(1)}%</div>;
  }

  return (
    <ChartPanel
      title="BTC Dominance"
      source="Source: CoinGecko Pro · BTC mcap / total crypto mcap"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: { type: 'category', ticks: { ...XTICK, maxRotation: 0, maxTicksLimit: 8, callback(val) { const l = this.getLabelForValue(val); return l ? l.slice(0, 7) : ''; } }, grid: XGRID },
          y: { ticks: { ...YTICK, callback: v => v.toFixed(0) + '%' }, grid: YGRID },
        },
        plugins: { legend: { display: false } },
      }}
      summary={summary}
    />
  );
}
