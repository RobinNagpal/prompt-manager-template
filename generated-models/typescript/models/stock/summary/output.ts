export interface Output {
  summary: ResultSchema;
  additional_notes?: string;
}
export interface ResultSchema {
  summary_text: string;
  key_metrics: {
    pe_ratio: number;
    pb_ratio: number;
  };
}
