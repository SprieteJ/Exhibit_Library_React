import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { YTICK, YGRID, fmtBig, xAxisConfig } from '../constants';
import Chart from 'chart.js/auto';

const GRID_LINES = 6;
const RSI_PERIODS = [7, 14, 21, 30];

const MiniChart = forwardRef(({ type, data, options, style }, ref) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  useImperativeHandle(ref, () => ({ getChart: () => chartRef.current }));
  if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
  setTimeout(() => {
    if (!canvasRef.current || chartRef.current) return;
    chartRef.current = new Chart(canvasRef.current.getContext('2d'), { type, data, options: { ...options, animation: { duration: 0 } } });
  }, 0);
  return <canvas ref={canvasRef} style={style} />;
});

export default function BtcPriceRsi({ from, to }) {
  const [period, setPeriod] = useState(7);
  const url = `/api/btc-rsi?from=${from}&to=${to}&period=${period}`;
  const { data, loading, error } = useChartData(url);

  const dates = data?.dates || [];

  let summary = null;
  if (data?.rsi) {
    const lastRsi = data.rsi.filter(v => v != null).slice(-1)[0];
    const lastPrice = data.price?.[data.price.length - 1];
    const rsiColor = lastRsi > 70 ? '#EC5B5B' : lastRsi < 30 ? '#00D64A' : '#F7931A';
    const rsiLabel = lastRsi > 70 ? 'Overbought' : lastRsi < 30 ? 'Oversold' : 'Neutral';
    summary = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {lastPrice && <div className="perf-item"><span style={{ color: '#F7931A', fontWeight: 600 }}>BTC</span> ${fmtBig(lastPrice)}</div>}
        {lastRsi != null && <div className="perf-item"><span style={{ color: rsiColor, fontWeight: 600 }}>RSI({period})</span> {lastRsi.toFixed(1)} — {rsiLabel}</div>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {RSI_PERIODS.map(p => (
            <button key={p} className={`preset${period === p ? ' active' : ''}`}
              onClick={() => setPeriod(p)}
              style={{ fontSize: 10, padding: '2px 8px' }}>{p}d</button>
          ))}
        </div>
      </div>
    );
  }

  const xCfg = xAxisConfig(dates);

  // Top chart: BTC price with segment coloring based on RSI direction
  const topData = dates.length && data?.price ? {
    labels: dates,
    datasets: [{
      label: 'BTC',
      data: data.price,
      borderColor: '#F7931A',
      borderWidth: 1.6,
      pointRadius: 0,
      tension: 0.1,
      backgroundColor: 'transparent',
      segment: {
        borderColor: ctx => {
          const idx = ctx.p1DataIndex;
          const dir = data.rsi_direction?.[idx];
          return dir === 'green' ? '#00D64A' : dir === 'red' ? '#EC5B5B' : '#F7931A';
        },
      },
    }],
  } : null;

  // Bottom chart: RSI as colored bars
  const rsiColors = data?.rsi?.map(v => {
    if (v == null) return 'rgba(128,128,128,0.3)';
    if (v > 70) return 'rgba(236,91,91,0.7)';
    if (v < 30) return 'rgba(0,214,74,0.7)';
    return 'rgba(247,147,26,0.5)';
  }) || [];

  const bottomData = dates.length && data?.rsi ? {
    labels: dates,
    datasets: [{
      label: `RSI(${period})`,
      data: data.rsi,
      backgroundColor: rsiColors,
      borderColor: rsiColors,
      borderWidth: 0,
      type: 'bar',
      barPercentage: 1.0,
      categoryPercentage: 1.0,
    }],
  } : null;

  return (
    <ChartPanel title={`Price & RSI (${period}d)`} source={`Source: CoinGecko Pro · ${period}-day RSI · Green = RSI falling · Red = RSI rising`}
      loading={loading} error={error} chartType="line" chartData={null} summary={summary}>
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', gap: 4 }}>
        <div style={{ flex: 3, position: 'relative', minHeight: 0 }}>
          {topData && <MiniChart type="line" data={topData} options={{
            responsive: true, maintainAspectRatio: false,
            scales: { x: { ...xCfg, display: false }, y: { type: 'logarithmic', ticks: { ...YTICK, callback: v => '$' + fmtBig(v), maxTicksLimit: GRID_LINES }, grid: YGRID } },
            plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index', intersect: false } },
          }} style={{ width: '100%', height: '100%' }} />}
        </div>
        <div style={{ flex: 2, position: 'relative', minHeight: 0 }}>
          {bottomData && <MiniChart type="bar" data={bottomData} options={{
            responsive: true, maintainAspectRatio: false,
            scales: {
              x: xCfg,
              y: {
                min: 0, max: 100,
                ticks: { ...YTICK, callback: v => v.toFixed(0), stepSize: 20, maxTicksLimit: GRID_LINES },
                grid: {
                  ...YGRID,
                  color: ctx => (ctx.tick.value === 30 || ctx.tick.value === 70) ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                },
              },
            },
            plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index', intersect: false } },
          }} style={{ width: '100%', height: '100%' }} />}
        </div>
      </div>
    </ChartPanel>
  );
}
