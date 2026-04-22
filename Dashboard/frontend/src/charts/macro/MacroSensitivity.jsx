import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { YTICK, YGRID, xAxisConfig } from '../constants';

export default function MacroSensitivity({ from, to }) {
  const url = `/api/macro-sensitivity?from=${from}&to=${to}&window=30`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length && data.abs_avg?.length) {
    // Compute running percentile for each date
    const percentiles = [];
    for (let i = 0; i < data.abs_avg.length; i++) {
      const current = data.abs_avg[i];
      let below = 0;
      for (let j = 0; j < i; j++) {
        if (data.abs_avg[j] <= current) below++;
      }
      const pct = i > 0 ? Math.round(100 * below / i) : 50;
      percentiles.push(pct);
    }

    const colors = percentiles.map(p => p > 70 ? 'rgba(0,214,74,0.7)' : p > 40 ? 'rgba(225,200,126,0.7)' : 'rgba(85,85,85,0.5)');

    chartData = {
      labels: data.dates,
      datasets: [{
        label: 'Macro Sensitivity (%)',
        data: percentiles,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 0,
        pointRadius: 0,
        type: 'bar',
        barPercentage: 1.0,
        categoryPercentage: 1.0,
      }],
    };

    const c = data.current || {};
    if (c.percentile != null) {
      const pct = Math.round(c.percentile);
      const fg = pct > 70 ? '#00D64A' : pct > 40 ? '#E1C87E' : '#555';
      const tag = pct > 70 ? 'Macro-driven' : pct > 40 ? 'Moderate' : 'Independent';
      summary = (
        <>
          <div className="perf-item"><span style={{ color: fg, fontWeight: 600 }}>{tag}</span> {pct}%</div>
          {c.DXY && <div className="perf-item"><span style={{ color: '#C084FC', fontWeight: 600 }}>DXY</span> {c.DXY.corr > 0 ? '+' : ''}{c.DXY.corr.toFixed(2)}</div>}
          {c.VIX && <div className="perf-item"><span style={{ color: '#EC5B5B', fontWeight: 600 }}>VIX</span> {c.VIX.corr > 0 ? '+' : ''}{c.VIX.corr.toFixed(2)}</div>}
          {c.SPY && <div className="perf-item"><span style={{ color: '#2471CC', fontWeight: 600 }}>SPY</span> {c.SPY.corr > 0 ? '+' : ''}{c.SPY.corr.toFixed(2)}</div>}
        </>
      );
    }
  }

  return (
    <ChartPanel
      title="Is Macro Driving Crypto? (Historical)"
      source="Source: CoinGecko + Yahoo Finance · Percentile of average |30d correlation| vs BTC against DXY, VIX, SPY"
      loading={loading} error={error}
      chartType="bar" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(data?.dates || []),
          y: {
            min: 0, max: 100,
            ticks: { ...YTICK, callback: v => v + '%', stepSize: 25 },
            grid: YGRID,
          },
        },
        plugins: { legend: { display: false } },
      }}
      summary={summary}
    />
  );
}
