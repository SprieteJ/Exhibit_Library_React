import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';

function corrColor(v) {
  if (v == null) return 'var(--surface)';
  const r = Math.max(-1, Math.min(1, v));
  if (r >= 0) return `rgba(0, 214, 74, ${r * 0.7})`;
  return `rgba(236, 91, 91, ${-r * 0.7})`;
}

export default function SecXheatmap({ from, to, window: win }) {
  const url = `/api/sector-xheatmap?from=${from}&to=${to}&window=${win || '30'}`;
  const { data, loading, error } = useChartData(url);
  let content = null;
  if (data?.matrix && data.sectors?.length) {
    content = (
      <div style={{ overflow: 'auto', padding: '12px 0' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 10, fontFamily: 'var(--mono)', width: '100%' }}>
          <thead><tr><th></th>{data.sectors.map(s => <th key={s} style={{ padding: '4px 4px', color: 'var(--muted)', fontSize: 9, fontWeight: 600, writingMode: 'vertical-lr', whiteSpace: 'nowrap' }}>{s.length > 18 ? s.slice(0,15) + '…' : s}</th>)}</tr></thead>
          <tbody>{data.sectors.map((s, ri) => (
            <tr key={s}><td style={{ padding: '4px 8px', fontWeight: 600, color: 'var(--graphite)', whiteSpace: 'nowrap', fontSize: 10 }}>{s.length > 20 ? s.slice(0,17) + '…' : s}</td>
              {data.matrix[ri].map((v, ci) => <td key={ci} style={{ padding: '4px 4px', textAlign: 'center', background: corrColor(v), color: 'var(--graphite)', borderRadius: 2, fontWeight: 500, fontSize: 10 }}>{v != null ? v.toFixed(2) : ''}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
    );
  }
  return <ChartPanel title={`Cross-Sector Correlation (${win || 30}d)`} source="Source: CoinGecko Pro" loading={loading} error={error} chartType="line" chartData={null}>{content}</ChartPanel>;
}
