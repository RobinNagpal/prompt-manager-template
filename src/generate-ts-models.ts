import path from 'path';
import fs from 'fs-extra';
import glob from 'glob';
import { compileFromFile } from 'json-schema-to-typescript';

// Define source and output directories for schemas.
const SCHEMAS_DIR = path.join(__dirname, '..', 'schemas', 'stock');
const OUTPUT_DIR = path.join(__dirname, '..', 'generated-models', 'typescript', 'models', 'stock');

async function generateTSModels(): Promise<void> {
  // Find all schema files matching "*.schema.yaml" recursively.
  glob(`${SCHEMAS_DIR}/**/*.schema.yaml`, async (err: Error | null, files: string[]) => {
    if (err) {
      console.error("Error reading schema files:", err);
      return;
    }
    for (const file of files) {
      try {
        // Determine the relative path to recreate folder structure.
        const relativePath = path.relative(SCHEMAS_DIR, file);
        const outputPath = path.join(OUTPUT_DIR, relativePath).replace(/\.schema\.yaml$/, '.ts');
        // Ensure the output directory exists.
        await fs.ensureDir(path.dirname(outputPath));
        // Generate the TypeScript interface from the schema file.
        const tsCode = await compileFromFile(file, {
          bannerComment: '', // Remove auto-generated banner if desired.
        });
        await fs.writeFile(outputPath, tsCode);
        console.log(`Generated TypeScript model: ${outputPath}`);
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }
  });
}

generateTSModels().catch((error) => {
  console.error('Error generating TypeScript models:', error);
});
