import TABS from '../charts/registry';

export default function TabLanding({ tabKey, onSelect }) {
  const tab = TABS[tabKey];
  if (!tab?.groups) return null;

  return (
    <div className="main" style={{ overflow: 'auto' }}>
      <div style={{ padding: '24px 28px' }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--graphite)', marginBottom: 4 }}>{tab.label}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24 }}>
          {tab.groups.reduce((n, g) => n + g.charts.length, 0)} charts across {tab.groups.length} categories
        </div>

        {tab.groups.map(group => (
          <div key={group.label} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
              {group.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {group.charts.map(chart => (
                <div key={chart.key}
                  onClick={() => onSelect(chart.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                    borderRadius: 6, cursor: 'pointer', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--tag-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--graphite)' }}>{chart.label}</div>
                    {chart.sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{chart.sub}</div>}
                  </div>
                  {chart.src && <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', flexShrink: 0 }}>{chart.src}</div>}
                  <span style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>&#8594;</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
