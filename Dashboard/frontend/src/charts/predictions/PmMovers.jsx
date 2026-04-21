import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';

const CAT_COLORS = {
  Crypto: '#F7931A', Politics: '#2471CC', Geopolitical: '#EC5B5B',
  Economics: '#00D64A', Sports: '#746BE6', Entertainment: '#DB33CB', Other: '#888',
};

function fmtVol(v) {
  if (!v) return '$0';
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
  return '$' + v.toFixed(0);
}

export default function PmMovers() {
  const { data, loading, error } = useChartData('/api/pm-movers?limit=30');
  const movers = data?.movers || [];

  const content = (
    <div style={{ overflow: 'auto', padding: '16px 20px', height: '100%' }}>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
        Markets with the largest probability shift in the last 24 hours, sorted by absolute change.
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Market', 'Category', 'Probability', '24h Change', 'Vol 24h'].map((h, i) => (
              <th key={i} style={{ textAlign: i === 0 ? 'left' : i === 1 ? 'center' : 'right', padding: '8px 8px', fontSize: 10, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.05em', textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {movers.map((m, i) => (
            <tr key={m.id || i} style={{ borderBottom: '0.5px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--tag-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '10px 8px', fontWeight: 500, color: 'var(--graphite)' }}>{m.question}</td>
              <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: (CAT_COLORS[m.category] || '#888') + '18', color: CAT_COLORS[m.category] || '#888', fontWeight: 600 }}>{m.category}</span>
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 14 }}>
                {m.probability != null ? m.probability + '%' : '—'}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 14 }}>
                <span style={{ color: m.change_24h > 0 ? '#00D64A' : '#EC5B5B', background: m.change_24h > 0 ? 'rgba(0,214,74,0.08)' : 'rgba(236,91,91,0.08)', padding: '2px 8px', borderRadius: 4 }}>
                  {m.change_24h > 0 ? '+' : ''}{m.change_24h}pp
                </span>
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{fmtVol(m.volume_24h)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!movers.length && !loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No significant movers in the last 24h.</div>}
    </div>
  );

  return (
    <ChartPanel title="Prediction Markets — 24h Movers" source={data?.cached_at ? `Live · ${data.cached_at}` : ''} loading={loading} error={error} chartType="line" chartData={null}>{content}</ChartPanel>
  );
}
