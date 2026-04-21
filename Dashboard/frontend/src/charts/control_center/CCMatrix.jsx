import { useState } from 'react';
import useChartData from '../../hooks/useChartData';
import ChartPanel from '../../components/ChartPanel';

const DOT_GREEN = { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#00D64A' };
const DOT_GREY  = { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--border)' };

export default function CCMatrix() {
  const url = '/api/control-center';
  const { data, loading, error } = useChartData(url);
  const [mode, setMode] = useState('flagged'); // 'flagged' or 'all'

  let content = null;

  if (data?.charts?.length) {
    const charts = mode === 'flagged'
      ? data.charts.filter(c => c.rules?.some(r => r.active))
      : data.charts;

    const flaggedCount = data.charts.reduce((n, c) => n + (c.rules?.filter(r => r.active).length || 0), 0);
    const totalCount = data.charts.reduce((n, c) => n + (c.rules?.length || 0), 0);

    let lastCat = null;

    content = (
      <div style={{ overflow: 'auto', padding: '0 0 12px' }}>
        {/* Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setMode('flagged')} style={{
              fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 10px', borderRadius: 20,
              border: '1px solid var(--border)', cursor: 'pointer',
              background: mode === 'flagged' ? 'var(--graphite)' : 'none',
              color: mode === 'flagged' ? 'var(--bg)' : 'var(--muted)',
            }}>Flagged ({flaggedCount})</button>
            <button onClick={() => setMode('all')} style={{
              fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 10px', borderRadius: 20,
              border: '1px solid var(--border)', cursor: 'pointer',
              background: mode === 'all' ? 'var(--graphite)' : 'none',
              color: mode === 'all' ? 'var(--bg)' : 'var(--muted)',
            }}>All ({totalCount})</button>
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{data.updated}</span>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', padding: '8px 10px', width: '22%' }}>Chart</th>
              <th style={{ textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', padding: '8px 10px', width: '20%' }}>Rule</th>
              <th style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', padding: '8px 10px', width: '6%' }}>Status</th>
              <th style={{ textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', padding: '8px 10px', width: '25%' }}>Detail</th>
              <th style={{ textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', padding: '8px 10px', width: '27%' }}>Context</th>
            </tr>
          </thead>
          <tbody>
            {charts.map((c, ci) => {
              const rows = [];

              // Category band
              if (c.category !== lastCat) {
                lastCat = c.category;
                rows.push(
                  <tr key={`cat-${c.category}`}>
                    <td colSpan={5} style={{
                      padding: '18px 0 8px', textAlign: 'center', fontSize: 13, fontWeight: 700,
                      color: 'var(--graphite)', letterSpacing: '.08em', textTransform: 'uppercase',
                      background: 'rgba(128,128,128,0.03)',
                      borderTop: '2px solid var(--border)', borderBottom: '1px solid var(--border)',
                    }}>{c.category}</td>
                  </tr>
                );
              }

              // Rules
              const rules = c.rules || [];
              rules.forEach((r, ri) => {
                const opacity = (mode === 'flagged' || r.active) ? 1 : 0.35;
                const rowBg = r.active ? 'rgba(0,214,74,0.04)' : 'transparent';

                rows.push(
                  <tr key={`${ci}-${ri}`} style={{ opacity, background: rowBg, borderBottom: '1px solid var(--border)' }}>
                    {ri === 0 ? (
                      <td rowSpan={rules.length} style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                        {c.chart_key && c.chart_tab ? (
                          <a href="#" onClick={(e) => { e.preventDefault(); /* navigation handled by parent */ }}
                            style={{ color: 'var(--graphite)', textDecoration: 'none', borderBottom: '1px dotted var(--muted)', fontWeight: 600 }}>
                            {c.chart_name} →
                          </a>
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>{c.chart_name}</span>
                        )}
                      </td>
                    ) : null}
                    <td style={{ padding: '8px 10px', color: 'var(--graphite)' }}>
                      {r.name}
                      {r.weight === 'major' && <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--muted)' }}>★</span>}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <span style={r.active ? DOT_GREEN : DOT_GREY} />
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--graphite)' }}>
                      {r.detail || '—'}
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: 12, color: 'var(--muted)' }}>
                      {r.context || ''}
                    </td>
                  </tr>
                );
              });

              return rows;
            })}
          </tbody>
        </table>

        {charts.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
            {mode === 'flagged' ? 'No rules currently flagged. Switch to "All" to see the full matrix.' : 'No data available.'}
          </div>
        )}
      </div>
    );
  }

  return (
    <ChartPanel
      title="Control Center — Signal Matrix"
      source={data?.updated ? `Last computed: ${data.updated}` : ''}
      loading={loading} error={error}
      chartType="line" chartData={null}
    >
      {content}
    </ChartPanel>
  );
}
