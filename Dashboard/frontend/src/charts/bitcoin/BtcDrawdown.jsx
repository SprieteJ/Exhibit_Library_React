import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID } from '../constants';

export default function BtcDrawdown({ from, to }) {
  const url = `/api/btc-drawdown?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    chartData = {
      labels: data.dates,
      datasets: [{
        label: 'Drawdown %', data: data.values,
        borderColor: '#EC5B5B', backgroundColor: 'rgba(236,91,91,0.1)',
        borderWidth: 1.4, pointRadius: 0, tension: 0.1, fill: true,
      }],
    };
    const last = data.values[data.values.length - 1];
    if (last != null) {
      summary = (
        <div className="perf-item">
          <span style={{ color: last > -5 ? '#00D64A' : '#EC5B5B', fontWeight: 600 }}>From ATH</span>{' '}
          <span className="neg">{last.toFixed(1)}%</span>
        </div>
      );
    }
  }

  return (
    <ChartPanel
      title="BTC Drawdown from All-Time High"
      source="Source: CoinGecko Pro · rolling max drawdown"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: { type: 'category', ticks: { ...XTICK, maxRotation: 0, maxTicksLimit: 8, callback(val) { const l = this.getLabelForValue(val); return l ? l.slice(0, 7) : ''; } }, grid: XGRID },
          y: { max: 0, ticks: { ...YTICK, callback: v => v.toFixed(0) + '%' }, grid: YGRID },
        },
        plugins: { legend: { display: false } },
      }}
      summary={summary}
    />
  );
}
