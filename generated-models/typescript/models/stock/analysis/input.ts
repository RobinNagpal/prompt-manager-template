export interface Input {
  company: CompanySchema;
  market: MarketSchema;
  historical: HistoricalSchema;
}
export interface CompanySchema {
  name: string;
  industry: string;
  ceo: string;
  financials: {
    revenue: number;
    profit: number;
    eps: number;
    pe_ratio: number;
    pb_ratio: number;
  };
}
export interface MarketSchema {
  sector_growth: number;
  trends: string[];
}
export interface HistoricalSchema {
  last_close: number;
  high: number;
  low: number;
}
