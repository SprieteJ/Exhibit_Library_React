import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { YTICK, YGRID, fmtBig, xAxisConfig } from '../constants';
import Chart from 'chart.js/auto';

const GRID_LINES = 6;

const MiniChart = forwardRef(({ type, data, options, style }, ref) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  useImperativeHandle(ref, () => ({ getChart: () => chartRef.current }));
  useEffect(() => {
    if (!canvasRef.current || !data) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    chartRef.current = new Chart(canvasRef.current.getContext('2d'), { type, data, options: { ...options, animation: { duration: 0 } } });
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [data, type, options]);
  return <canvas ref={canvasRef} style={style} />;
});

export default function Btc200wCombined({ from, to }) {
  const topRef = useRef(null);
  const botRef = useRef(null);
  const floorUrl = `/api/btc-200w-floor?from=${from}&to=${to}`;
  const devUrl = `/api/btc-200d-dev?from=${from}&to=${to}`;
  const floor = useChartData(floorUrl);
  const dev = useChartData(devUrl);

  const loading = floor.loading || dev.loading;
  const error = floor.error || dev.error;
  const dates = floor.data?.dates || [];

  let summary = null;
  if (floor.data?.price) {
    const lastMa = floor.data.ma200w?.filter(v => v != null).slice(-1)[0];
    const lastMult = floor.data.multiplier?.filter(v => v != null).slice(-1)[0];
    const lastDev = dev.data?.deviation?.filter(v => v != null).slice(-1)[0];
    summary = (
      <>
        {lastMa && <div className="perf-item"><span style={{ color: '#EC5B5B', fontWeight: 600 }}>200w MA</span> ${fmtBig(lastMa)}</div>}
        {lastMult && <div className="perf-item"><span style={{ color: '#F7931A', fontWeight: 600 }}>Multiple</span> {lastMult.toFixed(2)}x</div>}
        {lastDev != null && <div className="perf-item"><span style={{ color: lastDev >= 0 ? '#00D64A' : '#EC5B5B', fontWeight: 600 }}>Deviation</span> {lastDev >= 0 ? '+' : ''}{lastDev.toFixed(1)}%</div>}
      </>
    );
  }

  const xCfg = xAxisConfig(dates);

  const topData = dates.length ? {
    labels: dates,
    datasets: [
      { label: 'BTC', data: floor.data.price, borderColor: '#F7931A', borderWidth: 1.4, pointRadius: 0, tension: 0.1, backgroundColor: 'transparent' },
      { label: '200w MA', data: floor.data.ma200w, borderColor: '#EC5B5B', borderWidth: 1.2, pointRadius: 0, tension: 0.1, borderDash: [4, 3], backgroundColor: 'transparent', spanGaps: true },
    ],
  } : null;

  const devColors = dev.data?.deviation?.map(v => v != null && v >= 0 ? 'rgba(0,214,74,0.5)' : 'rgba(236,91,91,0.5)') || [];
  const bottomData = dev.data?.dates?.length ? {
    labels: dev.data.dates,
    datasets: [{ label: 'Deviation %', data: dev.data.deviation, backgroundColor: devColors, borderColor: devColors, borderWidth: 0, pointRadius: 0, type: 'bar' }],
  } : null;

  return (
    <ChartPanel miniChartRefs={[topRef, botRef]} title="Moving Averages — 200w (2p)" source="Source: CoinGecko Pro · 1400d SMA as macro floor"
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
