import SectorLineChart from './SectorLineChart';
const ALL = 'Layer 1,Layer 2,DeFi,Memecoins,DePIN,Gaming,AI';
export default function SecDrawdown({ from, to }) {
  return <SectorLineChart url={`/api/sector-drawdown?sectors=${ALL}&from=${from}&to=${to}`} title="Sector Drawdown from Peak" source="Source: CoinGecko Pro" yFormat="%" yMax={0} />;
}
