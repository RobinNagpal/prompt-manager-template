export interface Result {
  summary_text: string;
  key_metrics: {
    pe_ratio: number;
    pb_ratio: number;
  };
}
