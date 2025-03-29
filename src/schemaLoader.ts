import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import $RefParser from '@apidevtools/json-schema-ref-parser';
import glob from 'glob';

export interface SchemaMap {
  [schemaPath: string]: object;
}

/**
 * Recursively loads all YAML schema files from the given directory.
 */
export function loadSchemas(schemaDir: string): Promise<SchemaMap> {
  return new Promise((resolve, reject) => {
    const pattern: string = path.join(schemaDir, '**/*.yaml');
    glob(pattern, (err: Error | null, files: string[]) => {
      if (err) {
        reject(err);
        return;
      }
      const schemas: SchemaMap = {};
      files.forEach((file: string): void => {
        const content: string = fs.readFileSync(file, 'utf8');
        const loadedSchema: unknown = yaml.load(content);
        if (typeof loadedSchema === 'object' && loadedSchema !== null) {
          const relativePath: string = path.relative(schemaDir, file);
          schemas[relativePath] = loadedSchema as object;
        } else {
          reject(new Error(`Schema in file ${file} is not an object`));
          return;
        }
      });
      resolve(schemas);
    });
  });
}

/**
 * Dereferences a schema file (resolves all $ref pointers).
 */
export async function getDereferencedSchema(schemaFilePath: string): Promise<object> {
  try {
    const schema: object = (await $RefParser.dereference(schemaFilePath)) as object;
    return schema;
  } catch (error: unknown) {
    throw new Error(`Error dereferencing schema at ${schemaFilePath}: ${String(error)}`);
  }
}
