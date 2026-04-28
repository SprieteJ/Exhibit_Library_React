import { useRef, forwardRef, useImperativeHandle } from 'react';
import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { YTICK, YGRID, fmtBig, xAxisConfig } from '../constants';
import Chart from 'chart.js/auto';

const GRID_LINES = 6;

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

export default function BtcMaCombined({ from, to }) {
  const topRef = useRef(null);
  const botRef = useRef(null);
  const maUrl = `/api/btc-ma?from=${from}&to=${to}`;
  const gapUrl = `/api/btc-ma-gap?from=${from}&to=${to}`;
  const ma = useChartData(maUrl);
  const gap = useChartData(gapUrl);

  const loading = ma.loading || gap.loading;
  const error = ma.error || gap.error;
  const dates = ma.data?.dates || [];

  let summary = null;
  if (ma.data?.price) {
    const last = ma.data.price[ma.data.price.length - 1];
    const last50 = ma.data.ma50?.filter(v => v != null).slice(-1)[0];
    const last200 = ma.data.ma200?.filter(v => v != null).slice(-1)[0];
    const lastGap = gap.data?.gap?.filter(v => v != null).slice(-1)[0];
    summary = (
      <>
        <div className="perf-item"><span style={{ color: '#F7931A', fontWeight: 600 }}>BTC</span> ${fmtBig(last)}</div>
        {last50 && <div className="perf-item"><span style={{ color: '#00D64A', fontWeight: 600 }}>50d</span> ${fmtBig(last50)}</div>}
        {last200 && <div className="perf-item"><span style={{ color: '#EC5B5B', fontWeight: 600 }}>200d</span> ${fmtBig(last200)}</div>}
        {lastGap != null && <div className="perf-item"><span style={{ color: lastGap >= 0 ? '#00D64A' : '#EC5B5B', fontWeight: 600 }}>Gap</span> {lastGap >= 0 ? '+' : ''}{lastGap.toFixed(1)}%</div>}
      </>
    );
  }

  const xCfg = xAxisConfig(dates);

  const topData = dates.length ? {
    labels: dates,
    datasets: [
      { label: 'BTC', data: ma.data.price, borderColor: '#F7931A', borderWidth: 1.6, pointRadius: 0, tension: 0.1, backgroundColor: 'transparent' },
      { label: '50d MA', data: ma.data.ma50, borderColor: '#00D64A', borderWidth: 1, pointRadius: 0, tension: 0.1, borderDash: [4, 3], backgroundColor: 'transparent', spanGaps: true },
      { label: '200d MA', data: ma.data.ma200, borderColor: '#EC5B5B', borderWidth: 1, pointRadius: 0, tension: 0.1, borderDash: [4, 3], backgroundColor: 'transparent', spanGaps: true },
    ],
  } : null;

  const gapColors = gap.data?.gap?.map(v => v != null && v >= 0 ? 'rgba(0,214,74,0.6)' : 'rgba(236,91,91,0.6)') || [];
  const bottomData = gap.data?.dates?.length ? {
    labels: gap.data.dates,
    datasets: [{ label: 'MA Gap %', data: gap.data.gap, backgroundColor: gapColors, borderColor: gapColors, borderWidth: 0, pointRadius: 0, type: 'bar' }],
  } : null;

  return (
    <ChartPanel miniChartRefs={[topRef, botRef]} title="Moving Averages — 50d & 200d (2p)" source="Source: CoinGecko Pro"
      loading={loading} error={error} chartType="line" chartData={null} summary={summary}>
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', gap: 4 }}>
        <div style={{ flex: 3, position: 'relative', minHeight: 0 }}>
          {topData && <MiniChart ref={topRef} type="line" data={topData} options={{
            responsive: true, maintainAspectRatio: false,
            scales: { x: { ...xCfg, display: false }, y: { type: 'logarithmic', ticks: { ...YTICK, callback: v => '$' + fmtBig(v), maxTicksLimit: GRID_LINES }, grid: YGRID } },
            plugins: { legend: { display: true, labels: { color: '#888', font: { size: 10 }, boxWidth: 10 } }, tooltip: { enabled: true, mode: 'index', intersect: false } },
          }} style={{ width: '100%', height: '100%' }} />}
        </div>
        <div style={{ flex: 2, position: 'relative', minHeight: 0 }}>
          {bottomData && <MiniChart ref={botRef} type="bar" data={bottomData} options={{
            responsive: true, maintainAspectRatio: false,
            scales: { x: xCfg, y: { ticks: { ...YTICK, callback: v => v.toFixed(0) + '%', maxTicksLimit: GRID_LINES }, grid: YGRID } },
            plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index', intersect: false } },
          }} style={{ width: '100%', height: '100%' }} />}
        </div>
      </div>
    </ChartPanel>
  );
}
