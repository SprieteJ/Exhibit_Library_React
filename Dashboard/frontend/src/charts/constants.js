export const PAL = ['#00D64A','#2471CC','#746BE6','#DB33CB','#EC5B5B','#F7931A','#26A17B','#FFB800'];

export const MACRO_COLORS = {
  'BTC':'#F7931A','ETH':'#627EEA','ALTS':'#00D64A',
  'SPY':'#7Fb2F1','QQQ':'#2471CC','IWM':'#AEA9EA',
  'TLT':'#ED9B9B','GLD':'#E1C87E','BNO':'#9EA4A0',
};

export const XTICK = { color: '#888', font: { family: 'monospace', size: 11 } };
export const YTICK = { color: '#888', font: { family: 'monospace', size: 11 } };
export const XGRID = { color: 'rgba(255,255,255,0.04)' };
export const YGRID = { color: 'rgba(255,255,255,0.04)' };

export function fmtBig(v) {
  if (v == null) return '\u2014';
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(0) + 'M';
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(0) + 'K';
  return v.toFixed(0);
}

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/**
 * Format a date string (YYYY-MM-DD) based on span.
 * <= 2 years:  "MMM-YY"  (e.g. "Jan-25")
 * > 2 years:   "YYYY"    (e.g. "2025")
 */
function fmtDateLabel(dateStr, useYearOnly) {
  if (!dateStr || dateStr.length < 7) return dateStr || '';
  if (useYearOnly) return dateStr.slice(0, 4);
  const m = parseInt(dateStr.slice(5, 7), 10) - 1;
  const y = dateStr.slice(2, 4);
  return MONTHS_SHORT[m] + '-' + y;
}

/**
 * Compute the date span in months from a labels array of "YYYY-MM-DD" strings.
 */
function spanMonths(labels) {
  if (!labels || labels.length < 2) return 0;
  const first = labels[0], last = labels[labels.length - 1];
  const y1 = parseInt(first.slice(0, 4), 10), m1 = parseInt(first.slice(5, 7), 10);
  const y2 = parseInt(last.slice(0, 4), 10), m2 = parseInt(last.slice(5, 7), 10);
  return (y2 - y1) * 12 + (m2 - m1);
}

/**
 * Determine which dates to show as ticks based on span:
 *   <= 12 months  → every 3 months
 *   <= 36 months  → every 6 months
 *   > 36 months   → every 12 months (Jan only)
 *
 * Returns a Set of indices that should be shown.
 */
function pickTickIndices(labels, span) {
  const step = span <= 12 ? 3 : span <= 36 ? 6 : 12;
  const useYearOnly = span > 36;
  const shown = new Set();
  let lastShown = null;

  for (let i = 0; i < labels.length; i++) {
    const d = labels[i];
    if (!d || d.length < 7) continue;
    const y = parseInt(d.slice(0, 4), 10);
    const m = parseInt(d.slice(5, 7), 10);

    if (useYearOnly) {
      // Show only January of each year
      if (m === 1 && (lastShown === null || y !== lastShown)) {
        shown.add(i);
        lastShown = y;
      }
    } else {
      // Show every N months: Jan, Apr, Jul, Oct for 3-month; Jan, Jul for 6-month
      const monthKey = y * 12 + m;
      if (lastShown === null || monthKey - lastShown >= step) {
        // Snap to a clean month boundary
        if ((m - 1) % step === 0) {
          shown.add(i);
          lastShown = monthKey;
        }
      }
    }
  }
  return shown;
}

/**
 * Build a Chart.js x-axis scale config with smart date formatting.
 * Use this for ALL date-based charts to get consistent formatting.
 *
 * Usage:
 *   import { xAxisConfig } from '../constants';
 *   scales: { x: xAxisConfig(labels), y: { ... } }
 *
 * For charts where x-axis labels should be hidden (e.g. top panel of combined):
 *   x: xAxisConfig(labels, { display: false })
 */
export function xAxisConfig(labels, overrides = {}) {
  const span = spanMonths(labels || []);
  const useYearOnly = span > 36;
  const tickIndices = labels ? pickTickIndices(labels, span) : new Set();

  return {
    type: 'category',
    ticks: {
      ...XTICK,
      maxRotation: 0,
      autoSkip: false,
      callback: function(val, index) {
        if (!tickIndices.has(index)) return null;
        const label = this.getLabelForValue(val);
        return fmtDateLabel(label, useYearOnly);
      },
      ...overrides.ticks,
    },
    grid: { ...XGRID, ...overrides.grid },
    ...(overrides.display === false ? { ticks: { display: false }, grid: XGRID } : {}),
  };
}
