import { useState, useEffect } from 'react';
import TABS from '../charts/registry';
import { getAllMeta } from '../utils/chartMeta';

export default function Sidebar({ activeTab, activeChart, onSelect, metaVersion }) {
  const [openGroups, setOpenGroups] = useState({});
  const [meta, setMeta] = useState({});
  const tab = TABS[activeTab];

  // Reload meta whenever metaVersion changes (triggered by ChartPanel toggle)
  useEffect(() => {
    setMeta(getAllMeta());
  }, [metaVersion, activeTab]);

  if (!tab) return <div className="left-panel"><div className="panel-hdr">Views</div></div>;

  const toggle = (label) => setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));

  return (
    <div className="left-panel">
      <div className="panel-hdr">Views</div>
      <div className="view-tree">
        {tab.groups.map(group => {
          const isOpen = openGroups[group.label] !== false;
          return (
            <div key={group.label} className={`tree-group${isOpen ? ' open' : ''}`}>
              <div className="tree-grp-hdr" onClick={() => toggle(group.label)}>
                <svg className="chevron" viewBox="0 0 16 16"><polyline points="4,6 8,10 12,6" /></svg>
                {group.label}
              </div>
              <div className="tree-children">
                {group.charts.map(c => {
                  const m = meta[c.key];
                  const hasFav = m?.fav;
                  const ticks = [m?.debugged, m?.logic, m?.metadata].filter(Boolean).length;
                  return (
                    <div key={c.key} className={`tree-leaf${activeChart === c.key ? ' active' : ''}`} onClick={() => onSelect(c.key)}>
                      <div className="tree-dot" />
                      <span style={{ flex: 1 }}>{c.label}</span>
                      {ticks > 0 && (
                        <span style={{ fontSize: 9, color: ticks === 3 ? '#00D64A' : '#E1C87E', fontFamily: 'var(--mono)', marginLeft: 4 }}>
                          {ticks}/3
                        </span>
                      )}
                      {hasFav && <span style={{ color: '#F7931A', fontSize: 12, marginLeft: 4, flexShrink: 0 }}>★</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
