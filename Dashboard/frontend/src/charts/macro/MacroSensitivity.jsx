import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';
import { YTICK, YGRID, xAxisConfig } from '../constants';

const COMP_COLORS = {
  DXY: '#C084FC',
  '10Y': '#ED9B9B',
};

export default function MacroSensitivity({ from, to, window: win }) {
  const w = win || '30';
  const url = `/api/macro-sensitivity?from=${from}&to=${to}&window=${w}&z_trail=365`;
  const { data, loading, error } = useChartData(url);

  let chartData = null;
  let summary = null;

  if (data?.dates?.length) {
    const datasets = [];

    // Component z-scores (thin, muted)
    for (const [key, comp] of Object.entries(data.components || {})) {
      datasets.push({
        label: comp.label + ' (z)',
        data: comp.zscore,
        borderColor: COMP_COLORS[key] || '#888',
        backgroundColor: 'transparent',
        borderWidth: 1, pointRadius: 0, tension: 0.1,
        borderDash: [4, 3], spanGaps: true,
      });
    }

    // Absolute blend z-score (filled area — this is the "macro sensitivity" reading)
    datasets.push({
      label: 'Macro Sensitivity (|z| blend)',
      data: data.blend_abs_zscore,
      borderColor: '#00D64A',
      backgroundColor: 'rgba(0,214,74,0.08)',
      borderWidth: 2, pointRadius: 0, tension: 0.1,
      fill: true, spanGaps: true,
    });

    // Directional blend z-score (shows whether correlation is positive or negative)
    datasets.push({
      label: 'Directional blend (z)',
      data: data.blend_zscore,
      borderColor: '#F7931A',
      backgroundColor: 'transparent',
      borderWidth: 1.5, pointRadius: 0, tension: 0.1,
      spanGaps: true,
    });

    chartData = { labels: data.dates, datasets };

    // Summary: current readings
    const lastAbs = data.blend_abs_zscore?.[data.blend_abs_zscore.length - 1];
    const lastDir = data.blend_zscore?.[data.blend_zscore.length - 1];
    const regime = lastAbs > 1.5 ? 'Macro-driven' : lastAbs > 0.8 ? 'Moderate' : 'Independent';
    const regimeColor = lastAbs > 1.5 ? '#EC5B5B' : lastAbs > 0.8 ? '#E1C87E' : '#00D64A';

    summary = (
      <>
        <div className="perf-item">
          <span style={{ color: regimeColor, fontWeight: 600 }}>{regime}</span>{' '}
          <span>|z| = {lastAbs?.toFixed(2)}</span>
        </div>
        {Object.entries(data.components || {}).map(([key, comp]) => {
          const lastZ = comp.zscore?.[comp.zscore.length - 1];
          const lastCorr = comp.corr?.[comp.corr.length - 1];
          return (
            <div className="perf-item" key={key}>
              <span style={{ color: COMP_COLORS[key], fontWeight: 600 }}>{key}</span>{' '}
              <span>ρ={lastCorr?.toFixed(2)} z={lastZ?.toFixed(1)}</span>
            </div>
          );
        })}
      </>
    );
  }

  return (
    <ChartPanel
      title={`Macro Sensitivity (${w}d corr, 1y z-score)`}
      source="Source: CoinGecko + Yahoo Finance · BTC log returns vs DXY log returns & 10Y yield changes"
      loading={loading} error={error}
      chartType="line" chartData={chartData}
      chartOptions={{
        scales: {
          x: xAxisConfig(data?.dates || []),
          y: {
            ticks: { ...YTICK, callback: v => v.toFixed(1) },
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
