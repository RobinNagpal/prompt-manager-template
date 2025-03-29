import path from 'path';
import { loadTemplates, LoadedTemplate } from './templateLoader';
import { getDereferencedSchema } from './schemaLoader';

interface DummyAnalysisData {
  company: {
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
  };
  market: {
    sector_growth: number;
    trends: string[];
  };
  historical: {
    last_close: number;
    high: number;
    low: number;
  };
}

interface DummySummaryData {
  company: {
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
  };
  stock: {
    current_price: number;
    volume: number;
    sentiment: string;
  };
}

async function main(): Promise<void> {
  // Define directories relative to the project root.
  const templatesDir: string = path.join(__dirname, '..', 'templates');
  const schemasDir: string = path.join(__dirname, '..', 'schemas');

  let templates: LoadedTemplate[];
  try {
    templates = await loadTemplates(templatesDir);
  } catch (err: unknown) {
    console.error('Error loading templates:', err);
    return;
  }

  console.log(`Loaded ${templates.length} template(s).`);

  templates.forEach((template: LoadedTemplate) => {
    console.log(`\nTemplate File: ${template.filePath}`);
    console.log('Metadata:', template.metadata);

    let rendered: string = '';

    if (template.filePath.includes('detailed_analysis')) {
      const data: DummyAnalysisData = {
        company: {
          name: 'Acme Corp',
          industry: 'Technology',
          ceo: 'Jane Doe',
          financials: {
            revenue: 500,
            profit: 75,
            eps: 3.2,
            pe_ratio: 25,
            pb_ratio: 5
          }
        },
        market: {
          sector_growth: 8.5,
          trends: [
            'Increasing adoption of cloud services',
            'Rising competition',
            'Regulatory changes'
          ]
        },
        historical: {
          last_close: 120,
          high: 150,
          low: 95
        }
      };
      rendered = template.compiledTemplate(data);
    } else if (template.filePath.includes('concise_summary')) {
      const data: DummySummaryData = {
        company: {
          name: 'Acme Corp',
          industry: 'Technology',
          ceo: 'Jane Doe',
          financials: {
            revenue: 500,
            profit: 75,
            eps: 3.2,
            pe_ratio: 25,
            pb_ratio: 5
          }
        },
        stock: {
          current_price: 123,
          volume: 1000000,
          sentiment: 'Bullish'
        }
      };
      rendered = template.compiledTemplate(data);
    }
    console.log('Rendered Output:\n', rendered);
  });

  // Example: Dereference an output schema for detailed analysis.
  const analysisOutputPath: string = path.join(schemasDir, 'stock', 'analysis', 'output.schema.yaml');
  try {
    const dereferencedSchema: object = await getDereferencedSchema(analysisOutputPath);
    console.log(`\nDereferenced Analysis Output Schema:`);
    console.log(JSON.stringify(dereferencedSchema, null, 2));
  } catch (error: unknown) {
    console.error(error);
  }
}

main().catch((error: unknown) => {
  console.error('Error in main execution:', error);
});
