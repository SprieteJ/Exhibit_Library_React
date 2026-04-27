import SectorLineChart from './SectorLineChart';
const ALL = 'Layer 1,Layer 2,DeFi,Memecoins,DePIN,Gaming,AI';
export default function SecBreadth({ from, to }) {
  return <SectorLineChart url={`/api/sector-breadth?sectors=${ALL}&from=${from}&to=${to}`} title="Sector Breadth (% above 50d SMA)" source="Source: CoinGecko Pro" yFormat="%" yMin={0} yMax={100} />;
}
