import SectorLineChart from './SectorLineChart';
export default function SecDominance({ from, to }) {
  return <SectorLineChart url={`/api/sector-dominance?from=${from}&to=${to}`} title="Sector Dominance Over Time" source="Source: CoinGecko Pro · % of total" yFormat="%" />;
}
