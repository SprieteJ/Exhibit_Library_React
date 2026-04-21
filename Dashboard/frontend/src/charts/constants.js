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
 * Compute date span in months from a sorted labels array of "YYYY-MM-DD" strings.
 */
function spanMonths(labels) {
  if (!labels || labels.length < 2) return 0;
  const first = labels[0], last = labels[labels.length - 1];
  const y1 = parseInt(first.slice(0, 4), 10), m1 = parseInt(first.slice(5, 7), 10);
  const y2 = parseInt(last.slice(0, 4), 10), m2 = parseInt(last.slice(5, 7), 10);
  return (y2 - y1) * 12 + (m2 - m1);
}

/**
 * Parse a "YYYY-MM-DD" string into a Date object (UTC).
 */
function parseDate(s) {
  return new Date(s + 'T00:00:00Z');
}

/**
 * Format a date label based on span:
 *   <= 1 month:   "dd MMM YY"   (e.g. "05 Jan 25")
 *   <= 6 months:  "dd MMM YY"   (e.g. "05 Jan 25")
 *   <= 36 months: "MMM-YY"      (e.g. "Jan-25")
 *   > 36 months:  "YYYY"        (e.g. "2025")
 */
function fmtDateLabel(dateStr, span) {
  if (!dateStr || dateStr.length < 10) return dateStr || '';
  if (span > 36) return dateStr.slice(0, 4); // YYYY
  const d = parseInt(dateStr.slice(8, 10), 10);
  const m = parseInt(dateStr.slice(5, 7), 10) - 1;
  const y = dateStr.slice(2, 4);
  if (span <= 6) return d + ' ' + MONTHS_SHORT[m] + ' ' + y; // dd MMM YY
  return MONTHS_SHORT[m] + '-' + y; // MMM-YY
}

/**
 * Determine which date indices to show as ticks:
 *   <= 1 month  → every ~7 days (weekly)         format: dd MMM YY
 *   <= 3 months → every ~14 days (biweekly)      format: dd MMM YY
 *   <= 6 months → every ~30 days (monthly)       format: dd MMM YY
 *   <= 12 months → every 3 months                format: MMM-YY
 *   <= 36 months → every 6 months                format: MMM-YY
 *   > 36 months  → every January                 format: YYYY
 */
function pickTickIndices(labels, span) {
  const shown = new Set();
  if (!labels || labels.length === 0) return shown;

  if (span <= 6) {
    // Day-level spacing: 7d for 1m, 14d for 3m, 30d for 6m
    const dayStep = span <= 1 ? 7 : span <= 3 ? 14 : 30;
    let lastTs = null;
    for (let i = 0; i < labels.length; i++) {
      const d = labels[i];
      if (!d || d.length < 10) continue;
      const ts = parseDate(d).getTime();
      if (lastTs === null || (ts - lastTs) >= dayStep * 86400000 * 0.9) {
        shown.add(i);
        lastTs = ts;
      }
    }
  } else if (span <= 36) {
    // Month-level spacing: every 3 months for 1y, every 6 months for 2-3y
    const step = span <= 12 ? 3 : 6;
    let lastShown = null;
    for (let i = 0; i < labels.length; i++) {
      const d = labels[i];
      if (!d || d.length < 7) continue;
      const y = parseInt(d.slice(0, 4), 10);
      const m = parseInt(d.slice(5, 7), 10);
      const monthKey = y * 12 + m;
      if (lastShown === null || monthKey - lastShown >= step) {
        if ((m - 1) % step === 0) {
          shown.add(i);
          lastShown = monthKey;
        }
      }
    }
  } else {
    // Year-level: show only January
    let lastYear = null;
    for (let i = 0; i < labels.length; i++) {
      const d = labels[i];
      if (!d || d.length < 7) continue;
      const y = parseInt(d.slice(0, 4), 10);
      const m = parseInt(d.slice(5, 7), 10);
      if (m === 1 && (lastYear === null || y !== lastYear)) {
        shown.add(i);
        lastYear = y;
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
        return fmtDateLabel(label, span);
      },
      ...overrides.ticks,
    },
    grid: { ...XGRID, ...overrides.grid },
    ...(overrides.display === false ? { ticks: { display: false }, grid: XGRID } : {}),
  };
}
