import SectorLineChart from './SectorLineChart';
const ALL = 'Layer 1,Layer 2,DeFi,Memecoins,DePIN,Gaming,AI';
export default function SecMom({ from, to, window: win }) {
  return <SectorLineChart url={`/api/sector-momentum?sectors=${ALL}&from=${from}&to=${to}&window=${win||'30'}`} title={`Sector Rolling Return (${win||30}d)`} source="Source: CoinGecko Pro" yFormat="%" />;
}
