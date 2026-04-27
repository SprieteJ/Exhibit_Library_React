import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Chart from 'chart.js/auto';
import exportPng from '../utils/exportPng';
import { createDrawingState, attachDrawingHandlers, renderAnnotations, compositeOverlay } from '../utils/drawingPlugin';
import DrawingToolbar from './DrawingToolbar';

const CDEFAULT = {
  responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: '#1A1D1B', borderColor: '#2A2D2B', borderWidth: 1, titleColor: '#E8EAE8', bodyColor: '#888B88', padding: 12 },
  },
};

const _logoImg = new Image();
_logoImg.src = '/static/logo.png';

export default function ChartPanel({ title, source, loading, error, chartType, chartData, chartOptions, summary, children }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const chartRef = useRef(null);
  const hiddenRef = useRef({});
  const cleanupRef = useRef(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [, forceRender] = useState(0);

  const drawState = useMemo(() => createDrawingState(), [chartData]);

  const triggerUpdate = useCallback(() => {
    // Repaint overlay whenever annotations change (undo, clear, new drawing)
    if (overlayRef.current && chartRef.current) {
      renderAnnotations(chartRef.current, drawState, overlayRef.current.getContext('2d'));
    }
    forceRender(n => n + 1);
  }, [drawState]);

  // Sync overlay size with chart canvas
  const syncOverlaySize = useCallback(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    overlay.style.width = canvas.style.width;
    overlay.style.height = canvas.style.height;
  }, []);

  useEffect(() => {
    if (children || !chartData || !canvasRef.current) return;

    if (chartRef.current?.data?.datasets) {
      chartRef.current.data.datasets.forEach((ds, i) => {
        hiddenRef.current[ds.label] = !chartRef.current.isDatasetVisible(i);
      });
    }
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }

    const datasets = chartData.datasets.map(ds => ({
      ...ds, hidden: hiddenRef.current[ds.label] ?? ds.hidden ?? false,
    }));

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: chartType || 'line',
      data: { ...chartData, datasets },
      options: { ...CDEFAULT, ...chartOptions, plugins: { ...CDEFAULT.plugins, ...chartOptions?.plugins } },
    });

    // Sync overlay and attach handlers
    syncOverlaySize();
    if (overlayRef.current && chartRef.current) {
      cleanupRef.current = attachDrawingHandlers(overlayRef.current, chartRef.current, drawState, triggerUpdate);
    }

    // Re-sync overlay on chart resize
    const ro = new ResizeObserver(() => {
      syncOverlaySize();
      if (chartRef.current && overlayRef.current) {
        renderAnnotations(chartRef.current, drawState, overlayRef.current.getContext('2d'));
      }
    });
    ro.observe(canvasRef.current);

    return () => {
      ro.disconnect();
      if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    };
  }, [chartData, chartType, chartOptions, children, drawState, triggerUpdate, syncOverlaySize]);

  useEffect(() => {
    if (!dropOpen) return;
    const close = () => setDropOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [dropOpen]);

  const handleExport = useCallback((mode) => {
    if (!chartRef.current) return;
    const slug = (title || 'chart').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    exportPng(chartRef.current, {
      title: title || '', filename: slug, mode, logoImg: _logoImg,
      drawState: drawState,
      renderAnnotations: renderAnnotations,
    });
    // Re-render overlay after export restores the chart
    if (overlayRef.current && chartRef.current) {
      syncOverlaySize();
      renderAnnotations(chartRef.current, drawState, overlayRef.current.getContext('2d'));
    }
    setDropOpen(false);
  }, [title, drawState, syncOverlaySize]);

  const hasChart = !children && chartData;

  let cursor = '';
  if (drawState.enabled) cursor = drawState.tool === 'range' ? 'ns-resize' : 'crosshair';

  return (
    <div className="main">
      <div className="chart-hdr">
        <div><div className="chart-title">{title || ''}</div></div>
        {hasChart && (
          <div className="export-wrap">
            <button className="export-btn" onClick={(e) => { e.stopPropagation(); setDropOpen(v => !v); }} title="Save as PNG">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            {dropOpen && (
              <div className="export-drop">
                <button onClick={() => handleExport('raw')}>Raw chart</button>
                <button onClick={() => handleExport('branded')}>Branded (logo + title)</button>
              </div>
            )}
          </div>
        )}
      </div>

      {hasChart && <DrawingToolbar drawState={drawState} onUpdate={triggerUpdate} />}

      <div className="perf-row">{summary || null}</div>
      <div className="chart-area">
        {children ? children : (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
            <canvas ref={overlayRef} className="drawing-overlay" style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              pointerEvents: (drawState.enabled || drawState.annotations.length) ? 'auto' : 'none',
              cursor: cursor || undefined,
            }} />
          </div>
        )}
        <div className={`spinner-wrap${loading ? ' on' : ''}`}><div className="spinner" /></div>
        {error && !loading && (
          <div className="empty" style={{ display: 'flex' }}>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <p>Error: {error.message}</p>
          </div>
        )}
      </div>
      <div className="chart-src">{source || ''}</div>
    </div>
  );
}
