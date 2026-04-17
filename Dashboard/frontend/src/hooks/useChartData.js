import { useState, useEffect, useRef } from 'react';

export default function useChartData(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!url) { setData(null); setLoading(false); setError(null); return; }
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    fetch(url, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(json => { if (json.error) throw new Error(json.error); setData(json); setLoading(false); })
      .catch(err => { if (err.name === 'AbortError') return; setError(err); setLoading(false); });

    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}
