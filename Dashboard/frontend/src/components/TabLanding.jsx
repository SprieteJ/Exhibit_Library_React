import TABS from '../charts/registry';
import { getAllMeta } from '../utils/chartMeta';
import { useState, useEffect } from 'react';

const GROUP_ICONS = {
  'Price Performance': 'M3,17 L9,11 13,15 21,7',
  'Moving Averages': 'M2,16 C6,16 6,8 10,8 C14,8 14,16 18,16 C22,16 22,8 22,8',
  'Market Cap': 'M4,20 L4,4 M4,20 L20,20 M7,16 L7,10 M11,16 L11,7 M15,16 L15,12 M19,16 L19,5',
  'Volatility': 'M2,12 L6,4 L10,20 L14,4 L18,20 L22,12',
  'Derivatives': 'M4,16 Q12,2 20,16 M4,16 L20,16',
  'Cycles': 'M3,18 C7,6 11,6 12,12 C13,18 17,18 21,6',
  'Cycle Analysis': 'M3,18 C7,6 11,6 12,12 C13,18 17,18 21,6',
  'Gold': 'M12,2 L15,9 L22,9 L16,14 L18,21 L12,17 L6,21 L8,14 L2,9 L9,9 Z',
  'Correlation': 'M4,4 L4,20 L20,20 M6,14 L10,10 L14,12 L18,6',
  'Momentum': 'M3,20 L8,12 L12,15 L21,4 M16,4 L21,4 L21,9',
  'Relative Performance': 'M2,18 L8,10 L12,14 L22,4',
  'Relative': 'M2,18 L8,10 L12,14 L22,4',
  'Drawdown': 'M2,4 L6,4 L10,12 L14,8 L18,16 L22,20',
  'Price Action': 'M3,17 L9,11 13,15 21,7',
  'Breadth': 'M4,4 L4,20 L20,20 M6,10 L10,14 L14,8 L18,12',
  'Rotation': 'M12,12 m-6,0 a6,6 0 1,1 12,0 a6,6 0 1,1 -12,0 M12,6 L12,4 M18,12 L20,12',
  'Analysis': 'M4,4 L4,20 L20,20 M8,16 a2,2,0,1,1,0,-0.01 M12,12 a3,3,0,1,1,0,-0.01 M17,8 a4,4,0,1,1,0,-0.01',
  'Risk Regime': 'M4,12 a8,8,0,1,1,16,0 M12,12 L12,6 M12,12 L16,8',
  'Risk-Adjusted': 'M4,20 L4,4 M4,20 L20,20 M6,16 L10,8 L14,12 L18,6',
  'Macro Sensitivity': 'M2,12 L6,8 L10,14 L14,6 L18,10 L22,4',
  'Rates': 'M4,4 L4,20 L20,20 M6,14 L20,14 M6,10 C10,6 14,18 20,10',
  'Flows': 'M4,12 L8,8 L8,16 L12,12 L16,8 L16,16 L20,12',
  'Session Analysis': 'M4,20 L4,4 M4,20 L20,20 M8,14 L8,8 M12,14 L12,6 M16,14 L16,10',
  'Overview': 'M4,4 L4,20 L20,20 M7,14 L11,8 L15,12 L19,6',
  'Questions': 'M12,2 a10,10,0,1,1,0,20 a10,10,0,1,1,0,-20 M12,7 L12,13 M12,16 L12,17',
  'Live Markets': 'M2,12 L6,12 L8,6 L10,18 L12,12 L22,12',
  'Personal': 'M12,2 L15,9 L22,9 L16,14 L18,21 L12,17 L6,21 L8,14 L2,9 L9,9 Z',
  'Database': 'M4,6 a8,3,0,1,0,16,0 a8,3,0,1,0,-16,0 M4,6 L4,18 a8,3,0,0,0,16,0 L20,6 M4,12 a8,3,0,0,0,16,0',
  'Assets Under Management': 'M4,20 L4,4 M4,20 L20,20 M7,16 L7,8 M11,16 L11,5 M15,16 L15,10 M19,16 L19,7',
  'BTC Dominance': 'M12,2 a10,10,0,1,1,0,20 a10,10,0,1,1,0,-20 M12,2 L12,22 M2,12 L22,12',
};

function GroupIcon({ label }) {
  const path = GROUP_ICONS[label];
  if (!path) return <div style={{ width: 20, height: 20, borderRadius: 4, background: 'var(--border)', flexShrink: 0 }} />;
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={path} />
    </svg>
  );
}

export default function TabLanding({ tabKey, onSelect }) {
  const tab = TABS[tabKey];
  const [meta, setMeta] = useState({});

  useEffect(() => {
    setMeta(getAllMeta());
  }, [tabKey]);

  if (!tab?.groups) return null;

  const totalCharts = tab.groups.reduce((n, g) => n + g.charts.length, 0);

  return (
    <div className="main" style={{ overflow: 'auto' }}>
      <div style={{ padding: '24px 28px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--graphite)' }}>{tab.label}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            Visual overview of all {tab.label} charts, grouped by category.
          </div>
        </div>

        {/* Card grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
          alignItems: 'start',
        }}>
          {tab.groups.map(group => (
            <div key={group.label} style={{
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden',
              background: 'var(--surface)',
            }}>
              {/* Card header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
              }}>
                <GroupIcon label={group.label} />
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--graphite)', flex: 1 }}>{group.label}</div>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--muted)',
                  background: 'var(--tag-bg)', borderRadius: 10,
                  padding: '2px 8px', minWidth: 20, textAlign: 'center',
                }}>{group.charts.length}</div>
              </div>

              {/* Chart rows */}
              <div>
                {group.charts.map((chart, ci) => {
                  const m = meta[chart.key];
                  const hasFav = m?.fav;
                  return (
                    <div key={chart.key}
                      onClick={() => onSelect(chart.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 16px',
                        cursor: 'pointer', transition: 'background 0.1s',
                        borderTop: ci > 0 ? '0.5px solid rgba(128,128,128,0.08)' : 'none',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--tag-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--graphite)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {chart.label}
                          {hasFav && <span style={{ color: '#F7931A', fontSize: 11 }}>★</span>}
                        </div>
                        {chart.sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{chart.sub}</div>}
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--muted)', flexShrink: 0 }}>›</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
