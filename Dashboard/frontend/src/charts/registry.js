const TABS = {
  control_center: { label: 'Control Center', groups: [
    { label: 'Overview', charts: [
      { key: 'cc-matrix', label: 'Signal matrix', sub: 'Flagged control center rules.' },
      { key: 'cc-regime', label: 'Regime panel', sub: 'Macro regime indicators.' },
    ]},
    { label: 'Questions', charts: [
      { key: 'cc-questions', label: 'Market questions', sub: 'Core questions scored 0-100.' },
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
    { label: 'Price Performance', charts: [
      { key: 'btc-drawdown', label: 'Drawdown from ATH', sub: 'Rolling drawdown.', src: 'CoinGecko Pro' },
    ]},
    { label: 'Market Cap', charts: [
      { key: 'btc-mcap', label: 'Market cap', sub: 'BTC mcap with milestones.', src: 'CoinGecko Pro' },
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
    { label: 'Price Performance', charts: [{ key: 'eth-drawdown', label: 'Drawdown from ATH', sub: 'Rolling drawdown.', src: 'CoinGecko Pro' }] },
    { label: 'Market Cap', charts: [{ key: 'eth-mcap', label: 'Market cap', sub: 'ETH mcap.', src: 'CoinGecko Pro' }] },
    { label: 'Relative', charts: [{ key: 'eth-btc-ratio', label: 'ETH / BTC ratio', sub: 'ETH priced in BTC.', src: 'CoinGecko Pro' }] },
  ]},
  altcoins: { label: 'Altcoins', groups: [
    { label: 'Moving Averages', charts: [
      { key: 'am-mcap', label: 'Altcoin mcap with MAs', sub: 'Total altcoin mcap (ex-BTC, ex-ETH) with 50d and 200d MA.', src: 'CoinGecko Pro' },
      { key: 'am-mcap-gap', label: '50d and 200d gap', sub: 'Altcoin mcap 50d/200d MA gap.', src: 'CoinGecko Pro' },
      { key: 'am-mcap-dev', label: '200d MA deviation', sub: '% deviation of alt mcap from its 200d MA.', src: 'CoinGecko Pro' },
    ]},
    { label: 'Market Cap', charts: [
      { key: 'am-dominance', label: 'Dominance shares', sub: 'BTC, ETH, and altcoin share of total crypto mcap.', src: 'CoinGecko Pro' },
      { key: 'am-rel-share', label: 'Altcoin relative share', sub: 'Altcoin mcap as % of total, vs BTC, vs ETH.', src: 'CoinGecko Pro' },
      { key: 'am-btc-ratio', label: 'BTC/Altcoin mcap ratio', sub: 'BTC mcap / altcoin mcap. Rising = BTC dominance.', src: 'CoinGecko Pro' },
    ]},
    { label: 'Relative Performance', charts: [
      { key: 'alt-scatter', label: 'Performance vs BTC', sub: 'Scatter: % vs BTC, volatility vs BTC.', src: 'CoinGecko Pro' },
      { key: 'alt-altseason', label: 'Altseason indicator', sub: '% of top-50 alts outperforming BTC over 90d.', src: 'CoinGecko Pro' },
      { key: 'alt-beta', label: 'Beta to BTC', sub: '60d beta to BTC vs 60d alpha.', src: 'CoinGecko Pro' },
    ]},
    { label: 'Correlation', charts: [
      { key: 'alt-heatmap', label: 'Correlation heatmap', sub: 'Rolling 30d pairwise Pearson correlations.', src: 'CoinGecko Pro' },
      { key: 'am-intracorr', label: 'Altcoin intracorrelation', sub: 'Avg pairwise correlation within top 10/25/50/100/250 alts.', src: 'CoinGecko Pro' },
    ]},
    { label: 'Drawdown', charts: [
      { key: 'alt-ath-drawdown', label: 'Distance from ATH', sub: 'Current drawdown from ATH, sorted worst-first.', src: 'CoinGecko Pro' },
      { key: 'alt-drawdown-ts', label: 'Drawdown over time', sub: 'Drawdown from running ATH over time.', src: 'CoinGecko Pro' },
    ]},
    { label: 'Derivatives', charts: [
      { key: 'alt-funding-heatmap', label: 'Funding rate heatmap', sub: 'Funding rates by asset over time.', src: 'CoinGecko Pro + Derivatives' },
    ]},
  ]},
  baskets: { label: 'Baskets', groups: [
    { label: 'Price Action', charts: [
      { key: 'sec-equal', label: 'Equal-weighted', sub: 'Equal-weighted sector index. Rebased to 100.', src: 'CoinGecko Pro' },
      { key: 'sec-mcap', label: 'Marketcap-weighted', sub: 'Marketcap-weighted sector index. Rebased to 100.', src: 'CoinGecko Pro' },
    ]},
    { label: 'Market Cap', charts: [
      { key: 'mc-total', label: 'Total market cap', sub: 'Sum of constituent market caps per sector.', src: 'CoinGecko Pro' },
      { key: 'mc-median', label: 'Median market cap', sub: 'Median constituent market cap per sector.', src: 'CoinGecko Pro' },
      { key: 'sec-dominance', label: 'Dominance over time', sub: 'Each sector mcap as % of total, stacked area.', src: 'CoinGecko Pro' },
    ]},
    { label: 'Correlation', charts: [
      { key: 'sec-intra', label: 'Intracorrelation', sub: 'Rolling pairwise correlation between sectors.', src: 'CoinGecko Pro' },
      { key: 'sec-vs', label: 'vs BTC / ETH / Alts', sub: 'Rolling correlation of sectors vs reference asset.', src: 'CoinGecko Pro' },
      { key: 'sec-xheatmap', label: 'Cross-sector heatmap', sub: '30d pairwise Pearson between all sector indices.', src: 'CoinGecko Pro' },
    ]},
    { label: 'Momentum', charts: [
      { key: 'sec-mom', label: '30d Rolling return', sub: 'Rolling N-day return of EW sector index.', src: 'CoinGecko Pro' },
      { key: 'sec-zscore', label: 'Z-score of returns', sub: 'Z-score of daily returns vs rolling window.', src: 'CoinGecko Pro' },
      { key: 'sec-cumulative', label: 'Cumulative returns ranking', sub: 'Total return over period, sorted.', src: 'CoinGecko Pro' },
    ]},
    { label: 'Volatility', charts: [
      { key: 'sec-vol', label: 'Realized volatility', sub: '30d rolling annualized vol of EW log returns.', src: 'CoinGecko Pro' },
      { key: 'sec-drawdown', label: 'Drawdown from peak', sub: 'Rolling drawdown from peak of EW index.', src: 'CoinGecko Pro' },
    ]},
    { label: 'Breadth', charts: [
      { key: 'sec-breadth', label: 'Breadth indicator', sub: '% of constituents above their 50d SMA.', src: 'CoinGecko Pro' },
    ]},
    { label: 'Derivatives', charts: [
      { key: 'sec-funding', label: 'Sector funding rate', sub: 'Avg 8h funding rate by sector.', src: 'CoinGecko Pro + Derivatives' },
      { key: 'sec-oi', label: 'Sector open interest', sub: 'Sum of OI across constituents.', src: 'CoinGecko Pro + Derivatives' },
    ]},
    { label: 'Rotation', charts: [
      { key: 'sec-rrg', label: 'RRG scatter', sub: 'Which sectors are leading, catching up, losing steam, or lagging.', src: 'CoinGecko Pro' },
    ]},
    { label: 'Analysis', charts: [
      { key: 'ana-bubble', label: 'Momentum vs correlation', sub: 'Bubble: Y=momentum, X=autocorrelation, Size=mcap.', src: 'CoinGecko Pro' },
      { key: 'sec-sharpe', label: 'Risk-adjusted returns', sub: 'Scatter: x=30d vol, y=30d return.', src: 'CoinGecko Pro' },
    ]},
  ]},
  crypto_market: { label: 'Crypto Market', groups: [
    { label: 'Market Cap', charts: [
      { key: 'cm-total-mcap', label: 'Total market cap', sub: 'Total crypto market cap with 50d and 200d MAs.', src: 'CoinGecko Pro' },
    ]},
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
    { label: 'Macro Sensitivity', charts: [
      { key: 'mac-sensitivity', label: 'Macro regime', sub: 'Historical percentile of macro sensitivity. Is macro driving crypto?', src: 'CoinGecko + Yahoo Finance' },
      { key: 'mac-btc-dxy-corr', label: 'BTC vs DXY correlation', sub: '30d rolling correlation of BTC vs US Dollar.', src: 'CoinGecko + Yahoo Finance' },
      { key: 'mac-btc-vix-corr', label: 'BTC vs VIX correlation', sub: '30d rolling correlation of BTC vs volatility index.', src: 'CoinGecko + Yahoo Finance' },
      { key: 'mac-btc-spy-corr', label: 'BTC vs SPY correlation', sub: '30d rolling correlation of BTC vs S&P 500.', src: 'CoinGecko + Yahoo Finance' },
    ]},
    { label: 'Rates', charts: [
      { key: 'mac-real-yields', label: 'Real yields vs BTC', sub: '10Y yield vs BTC.', src: 'Yahoo Finance + CoinGecko' },
    ]},
    { label: 'Flows', charts: [
      { key: 'mac-stablecoin', label: 'Stablecoin supply', sub: 'Total stablecoin mcap.', src: 'CoinGecko Pro' },
    ]},
  ]},
  etf: { label: 'ETF', groups: [
    { label: 'Flows', charts: [
      { key: 'etf-net-flows', label: 'Trailing — spot ETF flows', sub: 'Trailing net flows for BTC and ETH spot ETFs.', src: 'Farside Investors' },
      { key: 'etf-daily-bar', label: 'Daily — spot ETF flows', sub: 'Daily net inflows/outflows. Stacked bar chart.', src: 'Farside Investors' },
      { key: 'etf-weekly-bar', label: 'Weekly — spot ETF flows', sub: 'Weekly aggregated net flows. Stacked bar chart.', src: 'Farside Investors' },
    ]},
    { label: 'Assets Under Management', charts: [
      { key: 'etf-total-aum', label: 'Total AuM', sub: 'Cumulative AuM for BTC and ETH spot ETFs.', src: 'Farside Investors' },
    ]},
  ]},
  predictions: { label: 'Predictions', groups: [
    { label: 'Live Markets', charts: [
      { key: 'pm-discovery', label: 'Discovery', sub: 'All active markets by category and volume.' },
      { key: 'pm-movers', label: '24h Movers', sub: 'Biggest probability shifts in the last 24 hours.' },
    ]},
    { label: 'Personal', charts: [
      { key: 'pm-watchlist', label: 'Watchlist', sub: 'Your saved markets with live probabilities.' },
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
