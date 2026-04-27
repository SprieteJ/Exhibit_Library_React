import SectorLineChart from './SectorLineChart';
const ALL = 'Layer 1,Layer 2,DeFi,Memecoins,DePIN,Gaming,AI';
export default function McMedian({ from, to }) {
  return <SectorLineChart url={`/api/sector-mcap-view?sectors=${ALL}&from=${from}&to=${to}&type=median`} title="Sector Median Market Cap" source="Source: CoinGecko Pro" />;
}
