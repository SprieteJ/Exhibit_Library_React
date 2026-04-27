import SectorLineChart from './SectorLineChart';
const ALL = 'Layer 1,Layer 2,DeFi,Memecoins,DePIN,Gaming,AI';
export default function SecEqual({ from, to }) {
  return <SectorLineChart url={`/api/sector-price?sectors=${ALL}&from=${from}&to=${to}`} title="Equal-Weighted Sector Index" source="Source: CoinGecko Pro · rebased to 100" />;
}
