import { useState } from 'react';
import TABS from '../charts/registry';

export default function Sidebar({ activeTab, activeChart, onSelect }) {
  const [openGroups, setOpenGroups] = useState({});
  const tab = TABS[activeTab];
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
                {group.charts.map(c => (
                  <div key={c.key} className={`tree-leaf${activeChart === c.key ? ' active' : ''}`} onClick={() => onSelect(c.key)}>
                    <div className="tree-dot" />{c.label}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
