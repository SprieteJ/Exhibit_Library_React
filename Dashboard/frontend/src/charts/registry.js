const TABS = {
  control_center: { label: 'Control Center', groups: [
    { label: 'Overview', charts: [
      { key: 'cc-matrix', label: 'Signal matrix', sub: 'Flagged control center rules.' },
      { key: 'cc-regime', label: 'Regime panel', sub: 'Macro regime indicators.' },
    ]},
  ]},
  bitcoin: { label: 'Bitcoin', groups: [
    { label: 'Moving Averages', charts: [
      { key: 'btc-ma', label: 'Moving averages', sub: 'BTC with 50d, 100d, 200d MAs.', src: 'CoinGecko Pro' },
      { key: 'btc-ma-gap', label: '50d / 200d MA gap', sub: 'Spread between 50d and 200d MA.', src: 'CoinGecko Pro' },
      { key: 'btc-200w-floor', label: '200-week floor', sub: 'BTC vs 200-week MA.', src: 'CoinGecko Pro' },
      { key: 'btc-200d-dev', label: '200d MA deviation', sub: 'Deviation from 200d MA.', src: 'CoinGecko Pro' },
      { key: 'btc-pi-cycle', label: 'Pi Cycle', sub: '111d vs 2x 350d MA.', src: 'CoinGecko Pro' },
    ]},
    { label: 'Volatility', charts: [
      { key: 'btc-realvol', label: 'Realized volatility', sub: '30d, 90d, 180d rolling vol.', src: 'CoinGecko Pro' },
      { key: 'btc-rv-iv', label: 'IV vs RV', sub: 'DVOL vs 30d realized vol.', src: 'Deribit + CoinGecko' },
    ]},
    { label: 'Drawdown', charts: [
      { key: 'btc-drawdown', label: 'Drawdown from ATH', sub: 'Rolling drawdown.', src: 'CoinGecko Pro' },
    ]},
    { label: 'Market Cap', charts: [
      { key: 'btc-mcap', label: 'Market cap', sub: 'BTC mcap with MAs.', src: 'CoinGecko Pro' },
      { key: 'btc-dominance', label: 'Dominance', sub: 'BTC as % of total crypto.', src: 'CoinGecko Pro' },
    ]},
    { label: 'Derivatives', charts: [
      { key: 'btc-funding', label: 'Funding rate', sub: 'Annualized 8h funding.', src: 'Binance/Bybit' },
      { key: 'btc-oi', label: 'Open interest', sub: 'BTC OI in USD.', src: 'Binance/Bybit' },
      { key: 'btc-funding-delta', label: 'Funding delta', sub: 'Binance vs Bybit spread.', src: 'Binance/Bybit' },
    ]},
    { label: 'Cycles', charts: [
      { key: 'btc-epochs', label: 'Halving epochs', sub: 'X-fold from halving price.', src: 'CoinGecko Pro' },
      { key: 'btc-cycles', label: 'Bear cycles', sub: 'Indexed to peak.', src: 'CoinGecko Pro' },
      { key: 'btc-bull', label: 'Bull cycles', sub: 'Indexed to trough.', src: 'CoinGecko Pro' },
    ]},
    { label: 'Gold', charts: [
      { key: 'btc-gold', label: 'Bitcoin vs Gold', sub: 'BTC overlaid with GLD.', src: 'CoinGecko + yfinance' },
      { key: 'btc-gold-ratio', label: 'BTC / Gold ratio', sub: 'BTC in ounces of gold.', src: 'CoinGecko + yfinance' },
    ]},
  ]},
  ethereum: { label: 'Ethereum', groups: [
    { label: 'Moving Averages', charts: [
      { key: 'eth-ma', label: 'Moving averages', sub: 'ETH with 50d, 100d, 200d MAs.', src: 'CoinGecko Pro' },
      { key: 'eth-ma-gap', label: '50d / 200d MA gap', sub: 'MA spread.', src: 'CoinGecko Pro' },
      { key: 'eth-200d-dev', label: '200d MA deviation', sub: 'Deviation from 200d MA.', src: 'CoinGecko Pro' },
    ]},
    { label: 'Drawdown', charts: [{ key: 'eth-drawdown', label: 'Drawdown from ATH', sub: 'Rolling drawdown.', src: 'CoinGecko Pro' }] },
    { label: 'Market Cap', charts: [{ key: 'eth-mcap', label: 'Market cap', sub: 'ETH mcap.', src: 'CoinGecko Pro' }] },
    { label: 'Relative', charts: [{ key: 'eth-btc-ratio', label: 'ETH / BTC ratio', sub: 'ETH priced in BTC.', src: 'CoinGecko Pro' }] },
  ]},
  macro: { label: 'Macro', groups: [
    { label: 'Price Action', charts: [
      { key: 'mac-price', label: 'Price comparison', sub: 'Macro assets rebased to 100.', src: 'Yahoo Finance' },
    ]},
    { label: 'Risk-Adjusted', charts: [
      { key: 'mac-sharpe', label: 'Rolling Sharpe ratio', sub: 'Rolling Sharpe across crypto and macro.', src: 'CoinGecko + Yahoo Finance' },
    ]},
    { label: 'Correlation', charts: [
      { key: 'mac-btc-corr', label: 'Correlation vs BTC', sub: 'Rolling correlation of macro vs BTC.', src: 'CoinGecko + Yahoo Finance' },
      { key: 'mac-matrix', label: 'Macro vs crypto', sub: '30d correlation heatmap.', src: 'Yahoo Finance + CoinGecko' },
      { key: 'mac-dxy-btc', label: 'DXY vs BTC', sub: 'DXY and BTC with correlation.', src: 'Yahoo Finance + CoinGecko' },
      { key: 'mac-igv-btc', label: 'US Software vs BTC', sub: 'IGV vs BTC with correlation.', src: 'Yahoo Finance + CoinGecko' },
    ]},
    { label: 'Risk Regime', charts: [
      { key: 'mac-risk', label: 'Risk-on / Risk-off', sub: 'Composite VIX + DXY + credit.', src: 'Yahoo Finance' },
    ]},
    { label: 'Rates', charts: [
      { key: 'mac-real-yields', label: 'Real yields vs BTC', sub: '10Y yield vs BTC.', src: 'Yahoo Finance + CoinGecko' },
    ]},
    { label: 'Flows', charts: [
      { key: 'mac-stablecoin', label: 'Stablecoin supply', sub: 'Total stablecoin mcap.', src: 'CoinGecko Pro' },
    ]},
  ]},
  data: { label: 'Data', groups: [
    { label: 'Database', charts: [
      { key: 'data-status', label: 'Database status', sub: 'Row counts and freshness.', src: 'Internal' },
    ]},
  ]},
};

export function getChartConfig(key) {
  for (const [tabKey, tab] of Object.entries(TABS)) {
    for (const group of tab.groups) {
      for (const chart of group.charts) {
        if (chart.key === key) return { ...chart, tab: tabKey };
      }
    }
  }
  return null;
}

export default TABS;
