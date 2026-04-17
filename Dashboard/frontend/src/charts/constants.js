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
