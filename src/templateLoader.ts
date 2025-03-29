import fs from 'fs';
import { glob } from 'glob';
import matter, { GrayMatterFile } from 'gray-matter';
import Handlebars from 'handlebars';
import path from 'path';

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
    const files: string[] = glob.sync(pattern);

    const templates: LoadedTemplate[] = files.map((file: string): LoadedTemplate => {
      const content: string = fs.readFileSync(file, 'utf8');
      const parsed: GrayMatterFile<string> = matter(content) as matter.GrayMatterFile<string>;
      const metadata: TemplateMetadata = parsed.data as TemplateMetadata;
      const templateContent: string = parsed.content;
      const compiledTemplate: Handlebars.TemplateDelegate = Handlebars.compile(templateContent, { strict: true });
      return { filePath: file, metadata, templateContent, compiledTemplate };
    });
    resolve(templates);
  });
}
