import { useMemo } from 'react';
import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { YTICK, YGRID, fmtBig, xAxisConfig } from '../constants';

export default function BtcPiCycle({ from, to }) {
  const url = `/api/btc-pi-cycle?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  const { topData, bottomData, gapMean, lastGap, summary } = useMemo(() => {
    if (!data?.dates?.length) return {};

    // Top panel: price + MAs
    const topData = {
      labels: data.dates,
      datasets: [
        { label: 'BTC', data: data.price, borderColor: '#F7931A', borderWidth: 1.4, pointRadius: 0, tension: 0.1, backgroundColor: 'transparent' },
        { label: '111d MA', data: data.ma111, borderColor: '#00D64A', borderWidth: 1.2, pointRadius: 0, tension: 0.1, borderDash: [4, 3], backgroundColor: 'transparent', spanGaps: true },
        { label: '2× 350d MA', data: data.ma350x2, borderColor: '#EC5B5B', borderWidth: 1.2, pointRadius: 0, tension: 0.1, borderDash: [4, 3], backgroundColor: 'transparent', spanGaps: true },
      ],
    };

    // Compute gap: (111d / 2×350d - 1) * 100
    const gap = data.dates.map((_, i) => {
      const a = data.ma111[i];
      const b = data.ma350x2[i];
      if (a == null || b == null || b === 0) return null;
      return ((a / b) - 1) * 100;
    });

    // Mean of non-null gaps
    const validGaps = gap.filter(v => v != null);
    const gapMean = validGaps.length ? validGaps.reduce((s, v) => s + v, 0) / validGaps.length : 0;

    // Color: yellow (#E1C87E) above mean, blue (#2471CC) below mean
    const aboveMean = gap.map(v => v != null && v >= gapMean ? v : null);
    const belowMean = gap.map(v => v != null && v < gapMean ? v : null);

    const lastGap = gap.filter(v => v != null).slice(-1)[0];

    const bottomData = {
      labels: data.dates,
      datasets: [
        {
          label: 'Gap (above mean)',
          data: aboveMean,
          backgroundColor: 'rgba(225, 200, 126, 0.5)',
          borderColor: 'rgba(225, 200, 126, 0.7)',
          borderWidth: 0,
          pointRadius: 0,
          type: 'bar',
          barPercentage: 1.0,
          categoryPercentage: 1.0,
        },
        {
          label: 'Gap (below mean)',
          data: belowMean,
          backgroundColor: 'rgba(36, 113, 204, 0.5)',
          borderColor: 'rgba(36, 113, 204, 0.7)',
          borderWidth: 0,
          pointRadius: 0,
          type: 'bar',
          barPercentage: 1.0,
          categoryPercentage: 1.0,
        },
        {
          label: 'Mean',
          data: data.dates.map(() => gapMean),
          borderColor: '#888',
          borderWidth: 1,
          borderDash: [4, 4],
          pointRadius: 0,
          type: 'line',
          fill: false,
        },
      ],
    };

    const summary = lastGap != null ? (
      <>
        <div className="perf-item">
          <span style={{ color: lastGap >= 0 ? '#EC5B5B' : '#00D64A', fontWeight: 600 }}>
            {lastGap >= 0 ? 'WARNING — 111d above 2×350d' : 'Safe'}
          </span>
        </div>
        <div className="perf-item">
          <span style={{ fontWeight: 600 }}>Gap</span> {lastGap.toFixed(1)}%
        </div>
        <div className="perf-item">
          <span style={{ color: '#888', fontWeight: 600 }}>Mean</span> {gapMean.toFixed(1)}%
        </div>
        <div className="perf-item">
          <span style={{ color: lastGap >= gapMean ? '#E1C87E' : '#2471CC', fontWeight: 600 }}>
            {lastGap >= gapMean ? 'Above mean' : 'Below mean'}
          </span>
        </div>
      </>
    ) : null;

    return { topData, bottomData, gapMean, lastGap, summary };
  }, [data]);

  return (
    <ChartPanel
      title="Pi Cycle Top Indicator"
      source="Source: CoinGecko Pro · 111d MA vs 2× 350d MA — cross = cycle top · Bottom: gap colored vs historical mean (yellow = above, blue = below)"
      loading={loading} error={error}
      chartType="line" chartData={null}
      summary={summary}
    >
      {topData && bottomData && (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', gap: 0 }}>
          {/* Top panel: Price + MAs */}
          <div style={{ flex: 3, position: 'relative', minHeight: 0 }}>
            <MiniChart
              type="line"
              data={topData}
              options={{
                scales: {
                  x: { ...xAxisConfig(data?.dates || []), display: false },
                  y: { type: 'logarithmic', ticks: { ...YTICK, callback: v => '$' + fmtBig(v) }, grid: YGRID },
                },
                plugins: { legend: { display: true, labels: { color: '#888', font: { size: 10 }, boxWidth: 10 } } },
              }}
            />
          </div>
          {/* Bottom panel: Gap vs mean */}
          <div style={{ flex: 2, position: 'relative', minHeight: 0 }}>
            <MiniChart
              type="bar"
              data={bottomData}
              options={{
                scales: {
                  x: xAxisConfig(data?.dates || []),
                  y: {
                    ticks: { ...YTICK, callback: v => v.toFixed(0) + '%' },
                    grid: {
                      ...YGRID,
                      color: ctx => {
                        if (Math.abs(ctx.tick.value - (gapMean || 0)) < 1) return 'rgba(255,255,255,0.15)';
                        return 'rgba(255,255,255,0.04)';
                      },
                    },
                  },
                },
                plugins: {
                  legend: { display: true, labels: { color: '#888', font: { size: 10 }, boxWidth: 10 } },
                  annotation: {
                    annotations: {
                      meanLine: {
                        type: 'line',
                        yMin: gapMean, yMax: gapMean,
                        borderColor: '#888', borderWidth: 1, borderDash: [4, 4],
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      )}
    </ChartPanel>
  );
}

// Lightweight Chart.js wrapper for panels
import { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

function MiniChart({ type, data, options }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current.getContext('2d'), {
      type,
      data,
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 0 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          tooltip: { backgroundColor: '#1A1D1B', borderColor: '#2A2D2B', borderWidth: 1, titleColor: '#E8EAE8', bodyColor: '#888B88', padding: 12 },
          ...options?.plugins,
        },
        scales: options?.scales,
      },
    });
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [data, type, options]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
}
