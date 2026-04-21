import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';

function corrColor(v) {
  if (v == null) return 'var(--surface)';
  const r = Math.max(-1, Math.min(1, v));
  if (r >= 0) return `rgba(0, 214, 74, ${r * 0.7})`;
  return `rgba(236, 91, 91, ${-r * 0.7})`;
}

export default function AltHeatmap({ from, to, window: win }) {
  const symbols = 'BTC,ETH,SOL,XRP,BNB,ADA,AVAX,DOT,LINK,MATIC';
  const url = `/api/alt-heatmap?symbols=${symbols}&from=${from}&to=${to}&window=${win || '30'}`;
  const { data, loading, error } = useChartData(url);
  let content = null;
  if (data?.matrix && data.symbols?.length) {
    content = (
      <div style={{ overflow: 'auto', padding: '12px 0' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--mono)', width: '100%' }}>
          <thead><tr><th style={{ padding: '6px 10px' }}></th>{data.symbols.map(s => <th key={s} style={{ padding: '6px 6px', textAlign: 'center', color: 'var(--muted)', fontSize: 10, fontWeight: 600 }}>{s}</th>)}</tr></thead>
          <tbody>{data.symbols.map((s, ri) => (
            <tr key={s}><td style={{ padding: '6px 10px', fontWeight: 600, color: 'var(--graphite)' }}>{s}</td>
              {data.matrix[ri].map((v, ci) => <td key={ci} style={{ padding: '6px 6px', textAlign: 'center', background: corrColor(v), color: 'var(--graphite)', borderRadius: 3, fontWeight: 500 }}>{v != null ? v.toFixed(2) : '—'}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
    );
  }
  return <ChartPanel title={`Altcoin Correlation Heatmap (${win || 30}d)`} source="Source: CoinGecko Pro" loading={loading} error={error} chartType="line" chartData={null}>{content}</ChartPanel>;
}
