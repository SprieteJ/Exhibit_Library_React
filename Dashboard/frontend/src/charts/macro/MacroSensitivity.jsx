import { useState } from 'react';
import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { YTICK, YGRID, xAxisConfig, fmtBig } from '../constants';

export default function MacroSensitivity({ from, to }) {
  const url = `/api/macro-sensitivity?from=${from}&to=${to}&window=30`;
  const { data, loading, error } = useChartData(url);
  const [showBtc, setShowBtc] = useState(false);

  // Fetch BTC price for overlay
  const btcUrl = showBtc ? `/api/btc-ma?from=${from}&to=${to}` : null;
  const btc = useChartData(btcUrl);

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
      percentiles.push(i > 0 ? Math.round(100 * below / i) : 50);
    }

    const barColors = percentiles.map(p =>
      p > 70 ? 'rgba(0,214,74,0.55)' : p > 40 ? 'rgba(225,200,126,0.55)' : 'rgba(85,85,85,0.35)'
    );

    const datasets = [
      // Percentile bars
      {
        label: 'Macro Regime (%)',
        data: percentiles,
        backgroundColor: barColors,
        borderColor: barColors,
        borderWidth: 0,
        type: 'bar',
        barPercentage: 1.0,
        categoryPercentage: 1.0,
        yAxisID: 'y',
        order: 2,
      },
      // Avg |corr| line on top
      {
        label: 'Avg |correlation|',
        data: data.abs_avg,
        borderColor: '#F7931A',
        backgroundColor: 'transparent',
        borderWidth: 1.8,
        pointRadius: 0,
        tension: 0.1,
        type: 'line',
        yAxisID: 'y2',
        order: 1,
      },
    ];

    // BTC price overlay
    if (showBtc && btc.data?.dates?.length) {
      // Align BTC prices to the macro dates
      const btcMap = {};
      btc.data.dates.forEach((d, i) => { btcMap[d] = btc.data.price[i]; });
      const btcAligned = data.dates.map(d => btcMap[d] ?? null);

      datasets.push({
        label: 'BTC Price',
        data: btcAligned,
        borderColor: '#F7931A40',
        backgroundColor: 'transparent',
        borderWidth: 1.2,
        pointRadius: 0,
        tension: 0.1,
        borderDash: [4, 3],
        type: 'line',
        yAxisID: 'y3',
        order: 0,
        spanGaps: true,
      });
    }

    chartData = { labels: data.dates, datasets };

    const c = data.current || {};
    if (c.percentile != null) {
      const pct = Math.round(c.percentile);
      const fg = pct > 70 ? '#00D64A' : pct > 40 ? '#E1C87E' : '#555';
      const tag = pct > 70 ? 'Macro-driven' : pct > 40 ? 'Moderate' : 'Independent';
      summary = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <div className="perf-item"><span style={{ color: fg, fontWeight: 600 }}>{tag}</span> {pct}%</div>
          <div className="perf-item"><span style={{ color: '#F7931A', fontWeight: 600 }}>|corr|</span> {c.abs_avg?.toFixed(2)}</div>
          {c.DXY && <div className="perf-item"><span style={{ color: '#C084FC', fontWeight: 600 }}>DXY</span> {c.DXY.corr > 0 ? '+' : ''}{c.DXY.corr.toFixed(2)}</div>}
          {c.VIX && <div className="perf-item"><span style={{ color: '#EC5B5B', fontWeight: 600 }}>VIX</span> {c.VIX.corr > 0 ? '+' : ''}{c.VIX.corr.toFixed(2)}</div>}
          {c.SPY && <div className="perf-item"><span style={{ color: '#2471CC', fontWeight: 600 }}>SPY</span> {c.SPY.corr > 0 ? '+' : ''}{c.SPY.corr.toFixed(2)}</div>}
          <div style={{ marginLeft: 'auto' }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={showBtc} onChange={e => setShowBtc(e.target.checked)}
                style={{ accentColor: '#F7931A', width: 13, height: 13, cursor: 'pointer' }} />
              BTC price
            </label>
          </div>
        </div>
      );
    }
  }

  const scales = {
    x: xAxisConfig(data?.dates || []),
    y: {
      position: 'left',
      min: 0, max: 100,
      ticks: { ...YTICK, callback: v => v + '%', stepSize: 25 },
      grid: YGRID,
    },
    y2: {
      position: 'right',
      min: 0, max: 0.6,
      ticks: { ...YTICK, callback: v => v.toFixed(1) },
      grid: { display: false },
    },
  };

  if (showBtc) {
    scales.y3 = {
      position: 'right',
      ticks: { display: false },
      grid: { display: false },
    };
  }

  return (
    <ChartPanel
      title="Macro Regime"
      source="Source: CoinGecko + Yahoo Finance · 30d rolling |correlation| percentile vs BTC against DXY, VIX, SPY"
      loading={loading} error={error}
      chartType="bar" chartData={chartData}
      chartOptions={{
        scales,
        plugins: {
          legend: { display: true, labels: { color: '#888', font: { size: 10 }, boxWidth: 10 } },
        },
      }}
      summary={summary}
    />
  );
}
