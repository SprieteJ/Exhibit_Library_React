/**
 * chartMeta.js — Persistent chart metadata (favorites + status ticks)
 * Uses localStorage for persistence across sessions.
 * 
 * Structure: { "btc-ma": { fav: true, debugged: true, logic: false, metadata: true }, ... }
 */

const STORAGE_KEY = 'wm_chart_meta';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function getMeta(chartKey) {
  const all = load();
  return all[chartKey] || { fav: false, debugged: false, logic: false, metadata: false };
}

export function setMeta(chartKey, updates) {
  const all = load();
  all[chartKey] = { ...getMeta(chartKey), ...updates };
  save(all);
  return all[chartKey];
}

export function toggleFav(chartKey) {
  const meta = getMeta(chartKey);
  return setMeta(chartKey, { fav: !meta.fav });
}

export function isFav(chartKey) {
  return getMeta(chartKey).fav;
}

export function getAllMeta() {
  return load();
}
