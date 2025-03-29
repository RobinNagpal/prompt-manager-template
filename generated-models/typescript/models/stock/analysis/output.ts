export interface Output {
  analysis: ResultSchema;
  comments?: string;
}
export interface ResultSchema {
  valuation: string;
  risk_assessment: string;
  recommendations: string[];
}
