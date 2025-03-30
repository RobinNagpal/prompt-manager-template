import fs from 'fs-extra';
import { globSync } from 'glob';
import { compileFromFile } from 'json-schema-to-typescript';
import path from 'path';

const SCHEMAS_DIR = path.join(__dirname, '..', 'schemas', 'stock');
const OUTPUT_DIR = path.join(__dirname, '..', 'generated-models', 'typescript', 'models', 'stock');

async function generateEntitiesTSModels(): Promise<void> {
  const entityFiles = globSync(`${SCHEMAS_DIR}/entities/**/*.schema.yaml`);
  for (const file of entityFiles) {
    try {
      const relativePath = path.relative(SCHEMAS_DIR, file);
      const outputPath = path.join(OUTPUT_DIR, relativePath).replace(/\.schema\.yaml$/, '.ts');
      await fs.ensureDir(path.dirname(outputPath));
      const tsCode = await compileFromFile(file, {
        additionalProperties: false,
        inferStringEnumKeysFromValues: true,
        strictIndexSignatures: true,
        bannerComment: '',
        declareExternallyReferenced: false,
      });
      await fs.writeFile(outputPath, tsCode);
      console.log(`Generated Entity TypeScript model: ${outputPath}`);
    } catch (error) {
      console.error(`Error processing entity file ${file}:`, error);
    }
  }
}

async function generateOtherTSModels(): Promise<void> {
  const otherFiles = globSync(`${SCHEMAS_DIR}/**/*.schema.yaml`, { ignore: [`${SCHEMAS_DIR}/entities/**/*.schema.yaml`] });
  for (const file of otherFiles) {
    try {
      const relativePath = path.relative(SCHEMAS_DIR, file);
      const outputPath = path.join(OUTPUT_DIR, relativePath).replace(/\.schema\.yaml$/, '.ts');
      await fs.ensureDir(path.dirname(outputPath));
      const tsCode = await compileFromFile(file, {
        additionalProperties: false,
        inferStringEnumKeysFromValues: true,
        strictIndexSignatures: true,
        bannerComment: '',
        declareExternallyReferenced: true,
      });
      await fs.writeFile(outputPath, tsCode);
      console.log(`Generated TypeScript model: ${outputPath}`);
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }
}

async function generateTSModels(): Promise<void> {
  await generateEntitiesTSModels();
  await generateOtherTSModels();
}

generateTSModels().catch((error) => {
  console.error('Error generating TypeScript models:', error);
});
