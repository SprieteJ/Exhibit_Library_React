import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { YTICK, YGRID, xAxisConfig } from '../constants';

export default function MacroBtcVix({ from, to }) {
  const url = `/api/macro-sensitivity?from=${from}&to=${to}&window=30`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length && data.components?.VIX) {
    const corr = data.components.VIX.corr;

    chartData = {
      labels: data.dates,
      datasets: [{
        label: 'BTC vs VIX (30d corr)',
        data: corr,
        borderColor: '#EC5B5B',
        backgroundColor: 'transparent',
        borderWidth: 1.5, pointRadius: 0, tension: 0.1,
      }],
    };

    const last = corr[corr.length - 1];
    if (last != null) {
      const abs = Math.abs(last);
      const status = abs > 0.3 ? 'Active' : abs > 0.15 ? 'Weak' : 'Inactive';
      const col = abs > 0.3 ? '#00D64A' : abs > 0.15 ? '#E1C87E' : '#555';
      summary = (
        <>
          <div className="perf-item"><span style={{ color: '#EC5B5B', fontWeight: 600 }}>Correlation</span> {last > 0 ? '+' : ''}{last.toFixed(3)}</div>
          <div className="perf-item"><span style={{ color: col, fontWeight: 600 }}>{status}</span></div>
        </>
      );
    }
  }

  return (
    <ChartPanel
      title="BTC vs Volatility (VIX) — 30d Correlation"
      source="Source: CoinGecko + Yahoo Finance · Negative = BTC sells when fear spikes · Positive = BTC rallies on fear"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(data?.dates || []),
          y: { min: -1, max: 1, ticks: { ...YTICK, callback: v => v.toFixed(1), stepSize: 0.25 }, grid: YGRID },
        },
        plugins: { legend: { display: false } },
      }}
      summary={summary}
    />
  );
}
