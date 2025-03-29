export interface Company {
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
