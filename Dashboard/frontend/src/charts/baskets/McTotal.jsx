import SectorLineChart from './SectorLineChart';
const ALL = 'Layer 1,Layer 2,DeFi,Memecoins,DePIN,Gaming,AI';
export default function McTotal({ from, to }) {
  return <SectorLineChart url={`/api/sector-mcap-view?sectors=${ALL}&from=${from}&to=${to}&type=total`} title="Sector Total Market Cap" source="Source: CoinGecko Pro" />;
}
