import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { PAL, XTICK, YTICK, XGRID, YGRID , xAxisConfig } from '../constants';

/**
 * Generic multi-sector line chart. Used by most Baskets charts.
 * Backend returns { [sectorName]: { dates, rebased, color, count }, ... }
 */
export default function SectorLineChart({ url, title, source, yFormat, yMin, yMax, loading: extLoading, error: extError }) {
  const { data, loading, error } = useChartData(url);
  let chartData = null, summary = null;

  if (data && !data.error && typeof data === 'object') {
    const sectors = Object.entries(data).filter(([, v]) => v?.dates?.length);
    if (sectors.length) {
      const allDates = new Set();
      sectors.forEach(([, v]) => v.dates.forEach(d => allDates.add(d)));
      const dates = [...allDates].sort();
      const datasets = sectors.map(([name, v], i) => {
        const dateMap = {};
        v.dates.forEach((d, j) => dateMap[d] = v.rebased[j]);
        return {
          label: name, data: dates.map(d => dateMap[d] ?? null),
          borderColor: v.color || PAL[i % PAL.length], backgroundColor: 'transparent',
          borderWidth: 1.4, pointRadius: 0, tension: 0.1, spanGaps: true,
        };
      });
      chartData = { labels: dates, datasets };

      summary = sectors.slice(0, 6).map(([name, v], i) => {
        const last = v.rebased[v.rebased.length - 1];
        return last != null ? (
          <div className="perf-item" key={name}>
            <span style={{ color: v.color || PAL[i % PAL.length], fontWeight: 600 }}>{name.length > 15 ? name.slice(0, 12) + '…' : name}</span>{' '}
            <span>{typeof last === 'number' ? (yFormat === '%' ? last.toFixed(1) + '%' : last.toFixed(2)) : last}</span>
          </div>
        ) : null;
      });
    }
  }

  return (
    <ChartPanel title={title} source={source} loading={extLoading || loading} error={extError || error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(dates),
          y: { ...(yMin != null ? { min: yMin } : {}), ...(yMax != null ? { max: yMax } : {}), ticks: { ...YTICK, callback: v => yFormat === '%' ? v.toFixed(0) + '%' : yFormat === 'corr' ? v.toFixed(1) : v.toFixed(0) }, grid: YGRID },
        },
        plugins: { legend: { display: true, labels: { color: '#888', font: { size: 10 }, boxWidth: 10 } } },
      }}
      summary={summary}
    />
  );
}
