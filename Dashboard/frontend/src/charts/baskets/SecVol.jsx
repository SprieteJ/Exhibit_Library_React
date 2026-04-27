import SectorLineChart from './SectorLineChart';
const ALL = 'Layer 1,Layer 2,DeFi,Memecoins,DePIN,Gaming,AI';
export default function SecVol({ from, to, window: win }) {
  return <SectorLineChart url={`/api/sector-vol?sectors=${ALL}&from=${from}&to=${to}&window=${win||'30'}`} title={`Sector Realized Volatility (${win||30}d)`} source="Source: CoinGecko Pro · annualized" yFormat="%" />;
}
