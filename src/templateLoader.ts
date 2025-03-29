import fs from 'fs';
import path from 'path';
import matter, { GrayMatterFile } from 'gray-matter';
import Handlebars from 'handlebars';
import glob from 'glob';

export interface TemplateMetadata {
  input_schema: string;
  output_schema: string;
  [key: string]: string;
}

export interface LoadedTemplate {
  filePath: string;
  metadata: TemplateMetadata;
  templateContent: string;
  compiledTemplate: Handlebars.TemplateDelegate;
}

/**
 * Recursively loads all .prompt.hbs files from the given directory.
 */
export function loadTemplates(templateDir: string): Promise<LoadedTemplate[]> {
  return new Promise((resolve, reject) => {
    const pattern: string = path.join(templateDir, '**/*.prompt.hbs');
    glob(pattern, (err: Error | null, files: string[]) => {
      if (err) {
        reject(err);
        return;
      }
      const templates: LoadedTemplate[] = files.map((file: string): LoadedTemplate => {
        const content: string = fs.readFileSync(file, 'utf8');
        const parsed: GrayMatterFile<TemplateMetadata> = matter(content) as GrayMatterFile<TemplateMetadata>;
        const metadata: TemplateMetadata = parsed.data;
        const templateContent: string = parsed.content;
        const compiledTemplate: Handlebars.TemplateDelegate = Handlebars.compile(templateContent);
        return { filePath: file, metadata, templateContent, compiledTemplate };
      });
      resolve(templates);
    });
  });
}
