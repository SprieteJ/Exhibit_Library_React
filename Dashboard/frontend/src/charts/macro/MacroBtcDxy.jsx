import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { YTICK, YGRID, xAxisConfig } from '../constants';

export default function MacroBtcDxy({ from, to }) {
  const url = `/api/macro-sensitivity?from=${from}&to=${to}&window=30`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length && data.components?.DXY) {
    const corr = data.components.DXY.corr;
    const colors = corr.map(v => v != null && Math.abs(v) > 0.3 ? 'rgba(0,214,74,0.6)' : v != null && Math.abs(v) > 0.15 ? 'rgba(225,200,126,0.6)' : 'rgba(85,85,85,0.4)');

    chartData = {
      labels: data.dates,
      datasets: [{
        label: 'BTC vs DXY (30d corr)',
        data: corr,
        borderColor: '#C084FC',
        backgroundColor: colors,
        borderWidth: 1.5, pointRadius: 0, tension: 0.1,
        segment: { borderColor: ctx => { const v = ctx.p1.parsed.y; return Math.abs(v) > 0.3 ? '#C084FC' : Math.abs(v) > 0.15 ? '#C084FC80' : '#C084FC40'; } },
      }],
    };

    const last = corr[corr.length - 1];
    if (last != null) {
      const abs = Math.abs(last);
      const status = abs > 0.3 ? 'Active' : abs > 0.15 ? 'Weak' : 'Inactive';
      const col = abs > 0.3 ? '#00D64A' : abs > 0.15 ? '#E1C87E' : '#555';
      summary = (
        <>
          <div className="perf-item"><span style={{ color: '#C084FC', fontWeight: 600 }}>Correlation</span> {last > 0 ? '+' : ''}{last.toFixed(3)}</div>
          <div className="perf-item"><span style={{ color: col, fontWeight: 600 }}>{status}</span></div>
        </>
      );
    }
  }

  return (
    <ChartPanel
      title="BTC vs US Dollar (DXY) — 30d Correlation"
      source="Source: CoinGecko + Yahoo Finance · Negative = BTC rises when dollar weakens · Positive = BTC follows dollar strength"
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
