// DB Terminal — expanded sector universe
// 11 SPDR sector ETFs, top ~20 large-cap holdings each (Yahoo ticker format).
// Direct port of the local reference lib/sectors-data.mjs.

export interface SectorInfo {
  name: string;
  holdings: string[];
}

export const SECTORS: Record<string, SectorInfo> = {
  XLK: {
    name: 'Technology',
    holdings: [
      'AAPL', 'MSFT', 'NVDA', 'AVGO', 'CRM', 'ORCL', 'AMD', 'ADBE', 'CSCO', 'ACN',
      'NOW', 'IBM', 'INTU', 'TXN', 'QCOM', 'AMAT', 'PLTR', 'PANW', 'ANET', 'MU',
    ],
  },
  XLF: {
    name: 'Financials',
    holdings: [
      'BRK-B', 'JPM', 'V', 'MA', 'BAC', 'WFC', 'GS', 'MS', 'SPGI', 'AXP',
      'C', 'BLK', 'SCHW', 'PGR', 'CB', 'MMC', 'KKR', 'BX', 'CME', 'ICE',
    ],
  },
  XLV: {
    name: 'Health Care',
    holdings: [
      'LLY', 'UNH', 'JNJ', 'ABBV', 'MRK', 'TMO', 'ABT', 'AMGN', 'PFE', 'ISRG',
      'DHR', 'SYK', 'BSX', 'VRTX', 'GILD', 'MDT', 'BMY', 'CI', 'ELV', 'REGN',
    ],
  },
  XLY: {
    name: 'Cons Discret',
    holdings: [
      'AMZN', 'TSLA', 'HD', 'MCD', 'BKNG', 'LOW', 'TJX', 'SBUX', 'NKE', 'CMG',
      'ORLY', 'MAR', 'HLT', 'GM', 'AZO', 'RCL', 'YUM', 'DHI', 'ROST', 'EBAY',
    ],
  },
  XLP: {
    name: 'Cons Staples',
    holdings: [
      'PG', 'COST', 'WMT', 'KO', 'PEP', 'PM', 'MDLZ', 'MO', 'CL', 'KMB',
      'TGT', 'STZ', 'SYY', 'GIS', 'KDP', 'KR', 'KHC', 'HSY', 'ADM', 'CHD',
    ],
  },
  XLE: {
    name: 'Energy',
    holdings: [
      'XOM', 'CVX', 'COP', 'WMB', 'EOG', 'SLB', 'PSX', 'MPC', 'OKE', 'KMI',
      'HES', 'BKR', 'FANG', 'HAL', 'VLO', 'DVN', 'TRGP', 'CTRA', 'EQT', 'APA',
    ],
  },
  XLI: {
    name: 'Industrials',
    holdings: [
      'GE', 'CAT', 'RTX', 'UBER', 'HON', 'UNP', 'ETN', 'ADP', 'DE', 'LMT',
      'BA', 'UPS', 'TT', 'PH', 'TDG', 'MMM', 'GD', 'ITW', 'NOC', 'WM',
    ],
  },
  XLB: {
    name: 'Materials',
    holdings: [
      'LIN', 'SHW', 'APD', 'ECL', 'FCX', 'NEM', 'CTVA', 'DD', 'MLM', 'VMC',
      'PPG', 'NUE', 'IFF', 'DOW', 'STLD', 'BALL', 'IP', 'AVY', 'CF', 'LYB',
    ],
  },
  XLRE: {
    name: 'Real Estate',
    holdings: [
      'PLD', 'AMT', 'EQIX', 'WELL', 'SPG', 'O', 'PSA', 'CCI', 'DLR', 'CBRE',
      'EXR', 'AVB', 'VICI', 'IRM', 'VTR', 'EQR', 'SBAC', 'INVH', 'ESS', 'MAA',
    ],
  },
  XLU: {
    name: 'Utilities',
    holdings: [
      'NEE', 'SO', 'DUK', 'CEG', 'AEP', 'SRE', 'D', 'PEG', 'EXC', 'XEL',
      'ED', 'VST', 'WEC', 'AWK', 'DTE', 'PPL', 'ETR', 'AEE', 'ES', 'FE',
    ],
  },
  XLC: {
    name: 'Communication',
    holdings: [
      'META', 'GOOGL', 'NFLX', 'DIS', 'CMCSA', 'T', 'VZ', 'TMUS', 'CHTR', 'EA',
      'GOOG', 'WBD', 'TTWO', 'OMC', 'LYV', 'FOXA', 'NWSA', 'IPG', 'MTCH', 'TKO',
    ],
  },
};
