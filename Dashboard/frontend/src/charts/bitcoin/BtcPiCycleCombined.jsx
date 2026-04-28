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

export default function BtcPiCycleCombined({ from, to }) {
  const url = `/api/btc-pi-cycle?from=${from}&to=${to}`;
  const { data, loading, error } = useChartData(url);

  const dates = data?.dates || [];

  // Compute gap: (111d / 2x350d - 1) * 100
  let gapData = [];
  if (data?.ma111 && data?.ma350x2) {
    gapData = data.ma111.map((v, i) => {
      const b = data.ma350x2[i];
      if (v != null && b != null && b > 0) return Math.round(((v / b) - 1) * 10000) / 100;
      return null;
    });
  }

  let summary = null;
  if (data?.ma111) {
    const last111 = data.ma111.filter(v => v != null).slice(-1)[0];
    const last350 = data.ma350x2.filter(v => v != null).slice(-1)[0];
    const lastGap = gapData.filter(v => v != null).slice(-1)[0];
    summary = (
      <>
        {last111 && <div className="perf-item"><span style={{ color: '#00D64A', fontWeight: 600 }}>111d</span> ${fmtBig(last111)}</div>}
        {last350 && <div className="perf-item"><span style={{ color: '#EC5B5B', fontWeight: 600 }}>2×350d</span> ${fmtBig(last350)}</div>}
        {lastGap != null && <div className="perf-item"><span style={{ color: lastGap >= 0 ? '#EC5B5B' : '#00D64A', fontWeight: 600 }}>{lastGap >= 0 ? 'WARNING' : 'Safe'}</span> {lastGap >= 0 ? '+' : ''}{lastGap.toFixed(1)}%</div>}
      </>
    );
  }

  const xCfg = xAxisConfig(dates);

  const topData = dates.length ? {
    labels: dates,
    datasets: [
      { label: 'BTC', data: data.price, borderColor: '#F7931A', borderWidth: 1.4, pointRadius: 0, tension: 0.1, backgroundColor: 'transparent' },
      { label: '111d MA', data: data.ma111, borderColor: '#00D64A', borderWidth: 1.2, pointRadius: 0, tension: 0.1, borderDash: [4, 3], backgroundColor: 'transparent', spanGaps: true },
      { label: '2× 350d MA', data: data.ma350x2, borderColor: '#EC5B5B', borderWidth: 1.2, pointRadius: 0, tension: 0.1, borderDash: [4, 3], backgroundColor: 'transparent', spanGaps: true },
    ],
  } : null;

  const gapColors = gapData.map(v => v != null && v >= 0 ? 'rgba(236,91,91,0.6)' : 'rgba(0,214,74,0.6)');
  const bottomData = dates.length ? {
    labels: dates,
    datasets: [{ label: 'Pi Gap %', data: gapData, backgroundColor: gapColors, borderColor: gapColors, borderWidth: 0, pointRadius: 0, type: 'bar' }],
  } : null;

  return (
    <ChartPanel title="Pi Cycle (2p)" source="Source: CoinGecko Pro · 111d MA vs 2× 350d MA — cross = cycle top"
      loading={loading} error={error} chartType="line" chartData={null} summary={summary}>
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', gap: 4 }}>
        <div style={{ flex: 3, position: 'relative', minHeight: 0 }}>
          {topData && <MiniChart type="line" data={topData} options={{
            responsive: true, maintainAspectRatio: false,
            scales: { x: { ...xCfg, display: false }, y: { type: 'logarithmic', ticks: { ...YTICK, callback: v => '$' + fmtBig(v), maxTicksLimit: GRID_LINES }, grid: YGRID } },
            plugins: { legend: { display: true, labels: { color: '#888', font: { size: 10 }, boxWidth: 10 } }, tooltip: { enabled: true, mode: 'index', intersect: false } },
          }} style={{ width: '100%', height: '100%' }} />}
        </div>
        <div style={{ flex: 2, position: 'relative', minHeight: 0 }}>
          {bottomData && <MiniChart type="bar" data={bottomData} options={{
            responsive: true, maintainAspectRatio: false,
            scales: { x: xCfg, y: { ticks: { ...YTICK, callback: v => v.toFixed(0) + '%', maxTicksLimit: GRID_LINES }, grid: YGRID } },
            plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index', intersect: false } },
          }} style={{ width: '100%', height: '100%' }} />}
        </div>
      </div>
    </ChartPanel>
  );
}
