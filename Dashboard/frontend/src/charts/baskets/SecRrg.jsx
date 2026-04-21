import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

const QUAD_COLORS = { Leading: '#00D64A', Improving: '#2471CC', Lagging: '#EC5B5B', Weakening: '#FFB800' };

export default function SecRrg({ from, to, window: win }) {
  const url = `/api/sector-rrg?to=${to}&window=${win || '10'}&momentum=6`;
  const { data, loading, error } = useChartData(url);
  let chartData = null, summary = null;
  if (data && !data.error && typeof data === 'object') {
    const entries = Object.entries(data).filter(([, v]) => v?.x != null);
    if (entries.length) {
      chartData = { datasets: entries.map(([name, v]) => ({
        label: name, data: [{ x: v.x, y: v.y }],
        backgroundColor: v.color || QUAD_COLORS[v.quadrant] || '#888',
        pointRadius: 7, pointHoverRadius: 9,
      }))};
      summary = entries.slice(0, 4).map(([name, v]) => (
        <div className="perf-item" key={name}>
          <span style={{ color: QUAD_COLORS[v.quadrant] || '#888', fontWeight: 600 }}>{name.length > 15 ? name.slice(0,12) + '…' : name}</span>{' '}
          <span style={{ fontSize: 11 }}>{v.quadrant}</span>
        </div>
      ));
    }
  }
  return <ChartPanel title="Relative Rotation Graph" source="Source: CoinGecko Pro · RS-Ratio vs RS-Momentum" loading={loading} error={error} chartType="scatter" chartData={chartData}
    chartOptions={{ scales: {
      x: { type: 'linear', ticks: XTICK, grid: { ...XGRID, color: ctx => ctx.tick?.value === 100 ? 'rgba(136,139,136,0.4)' : 'rgba(255,255,255,0.04)' }, title: { display: true, text: 'RS-Ratio', color: '#888', font: { size: 11 } } },
      y: { type: 'linear', ticks: YTICK, grid: { ...YGRID, color: ctx => ctx.tick?.value === 100 ? 'rgba(136,139,136,0.4)' : 'rgba(255,255,255,0.04)' }, title: { display: true, text: 'RS-Momentum', color: '#888', font: { size: 11 } } },
    }, plugins: { legend: { display: true, labels: { color: '#888', font: { size: 9 }, boxWidth: 8 } }, tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: (${ctx.raw.x.toFixed(1)}, ${ctx.raw.y.toFixed(1)})` } } } }} summary={summary} />;
}
