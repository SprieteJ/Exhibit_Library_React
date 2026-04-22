import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { YTICK, YGRID, xAxisConfig } from '../constants';

export default function MacroBtcSpy({ from, to }) {
  const url = `/api/macro-sensitivity?from=${from}&to=${to}&window=30`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length && data.components?.SPY) {
    const corr = data.components.SPY.corr;

    chartData = {
      labels: data.dates,
      datasets: [{
        label: 'BTC vs SPY (30d corr)',
        data: corr,
        borderColor: '#2471CC',
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
          <div className="perf-item"><span style={{ color: '#2471CC', fontWeight: 600 }}>Correlation</span> {last > 0 ? '+' : ''}{last.toFixed(3)}</div>
          <div className="perf-item"><span style={{ color: col, fontWeight: 600 }}>{status}</span></div>
        </>
      );
    }
  }

  return (
    <ChartPanel
      title="BTC vs Equities (SPY) — 30d Correlation"
      source="Source: CoinGecko + Yahoo Finance · Positive = BTC moving with stocks · Negative = BTC diverging from equities"
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
