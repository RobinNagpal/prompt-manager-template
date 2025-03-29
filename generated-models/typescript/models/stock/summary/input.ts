export interface Input {
  company: CompanySchema;
  stock: StockSchema;
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
export interface StockSchema {
  current_price: number;
  volume: number;
  sentiment: string;
}
