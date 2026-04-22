import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { YTICK, YGRID, xAxisConfig } from '../constants';

export default function MacroSensitivity({ from, to }) {
  const url = `/api/macro-sensitivity?from=${from}&to=${to}&window=30`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    chartData = {
      labels: data.dates,
      datasets: [
        {
          label: 'Macro Sensitivity (avg |corr|)',
          data: data.abs_avg,
          borderColor: '#00D64A',
          backgroundColor: 'rgba(0,214,74,0.06)',
          borderWidth: 2, pointRadius: 0, tension: 0.1, fill: true,
        },
        {
          label: 'BTC vs DXY',
          data: data.components?.DXY?.corr || [],
          borderColor: '#C084FC',
          backgroundColor: 'transparent',
          borderWidth: 1.2, pointRadius: 0, tension: 0.1, borderDash: [4, 3],
        },
        {
          label: 'BTC vs VIX',
          data: data.components?.VIX?.corr || [],
          borderColor: '#EC5B5B',
          backgroundColor: 'transparent',
          borderWidth: 1.2, pointRadius: 0, tension: 0.1, borderDash: [4, 3],
        },
        {
          label: 'BTC vs SPY',
          data: data.components?.SPY?.corr || [],
          borderColor: '#2471CC',
          backgroundColor: 'transparent',
          borderWidth: 1.2, pointRadius: 0, tension: 0.1, borderDash: [4, 3],
        },
      ],
    };

    const c = data.current || {};
    if (c.abs_avg != null) {
      const pct = c.percentile != null ? Math.round(c.percentile) : null;
      summary = (
        <>
          <div className="perf-item">
            <span style={{ color: '#00D64A', fontWeight: 600 }}>Sensitivity</span>{' '}
            {pct != null ? `${pct}%` : c.abs_avg.toFixed(2)}
          </div>
          {c.DXY && <div className="perf-item"><span style={{ color: '#C084FC', fontWeight: 600 }}>DXY</span> {c.DXY.corr > 0 ? '+' : ''}{c.DXY.corr.toFixed(2)}</div>}
          {c.VIX && <div className="perf-item"><span style={{ color: '#EC5B5B', fontWeight: 600 }}>VIX</span> {c.VIX.corr > 0 ? '+' : ''}{c.VIX.corr.toFixed(2)}</div>}
          {c.SPY && <div className="perf-item"><span style={{ color: '#2471CC', fontWeight: 600 }}>SPY</span> {c.SPY.corr > 0 ? '+' : ''}{c.SPY.corr.toFixed(2)}</div>}
        </>
      );
    }
  }

  return (
    <ChartPanel
      title="Macro Sensitivity (30d rolling)"
      source="Source: CoinGecko + Yahoo Finance · 30d rolling correlation of BTC daily returns vs DXY, VIX, SPY"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(data?.dates || []),
          y: {
            min: -1, max: 1,
            ticks: { ...YTICK, callback: v => v.toFixed(1), stepSize: 0.25 },
            grid: YGRID,
          },
        },
        plugins: {
          legend: { display: true, labels: { color: '#888', font: { size: 10 }, boxWidth: 10 } },
        },
      }}
      summary={summary}
    />
  );
}
