import { useState } from 'react';

const TOOLS = [
  { id: 'hline', label: 'H-Line', icon: 'M3,12 L21,12', title: 'Horizontal line — click to place' },
  { id: 'trendline', label: 'Trend', icon: 'M4,18 L20,4', title: 'Trendline — click two points' },
  { id: 'range', label: 'Range', icon: 'M3,8 L21,8 M3,16 L21,16', title: 'Horizontal range — drag vertically' },
];

const COLORS = ['#F7931A', '#00D64A', '#EC5B5B', '#2471CC', '#746BE6', '#E1C87E', '#FFFFFF'];

export default function DrawingToolbar({ drawState, onUpdate }) {
  const [showColors, setShowColors] = useState(false);

  if (!drawState) return null;

  const toggle = (toolId) => {
    if (drawState.tool === toolId) {
      drawState.tool = null;
      drawState.enabled = false;
    } else {
      drawState.tool = toolId;
      drawState.enabled = true;
    }
    // Always reset pending state when switching tools
    drawState.pending = null;
    drawState._phase = 0;
    drawState._dragTarget = null;
    onUpdate();
  };

  const undo = () => {
    if (drawState.pending) {
      drawState.pending = null;
      drawState._phase = 0;
    } else {
      drawState.annotations.pop();
    }
    onUpdate();
  };

  const clear = () => {
    drawState.annotations = [];
    drawState.pending = null;
    drawState._phase = 0;
    onUpdate();
  };

  const setColor = (c) => {
    drawState.color = c;
    setShowColors(false);
    onUpdate();
  };

  const hasAnnotations = drawState.annotations.length > 0 || drawState.pending;

  return (
    <div className="drawing-toolbar">
      {TOOLS.map(t => (
        <button key={t.id} className={`draw-btn${drawState.tool === t.id ? ' active' : ''}`}
          onClick={() => toggle(t.id)} title={t.title}>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round">
            {t.icon.split(' M').map((seg, i) => {
              const d = i === 0 ? seg : 'M' + seg;
              return <path key={i} d={d} />;
            })}
          </svg>
          <span>{t.label}</span>
        </button>
      ))}

      {/* Color */}
      <div className="draw-color-wrap">
        <button className="draw-btn" onClick={() => setShowColors(v => !v)} title="Annotation color">
          <span className="draw-color-dot" style={{ background: drawState.color }} />
        </button>
        {showColors && (
          <div className="draw-color-picker">
            {COLORS.map(c => (
              <button key={c} className={`draw-color-swatch${drawState.color === c ? ' active' : ''}`}
                style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {hasAnnotations && (
        <>
          <button className="draw-btn" onClick={undo} title="Undo last">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1,4 1,10 7,10" /><path d="M3.51,15a9,9,0,1,0,2.13-9.36L1,10" />
            </svg>
          </button>
          <button className="draw-btn" onClick={clear} title="Clear all">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
