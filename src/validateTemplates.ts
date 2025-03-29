import fs from 'fs';
import { glob } from 'glob';
import matter, { GrayMatterFile } from 'gray-matter';
import Handlebars from 'handlebars';
import path from 'path';

interface TemplateMetadata {
  input_schema: string;
  output_schema: string;
  inputExampleFile: string;
  [key: string]: string;
}

interface LoadedTemplate {
  filePath: string;
  metadata: TemplateMetadata;
  templateContent: string;
  compiledTemplate: Handlebars.TemplateDelegate;
}

/**
 * Loads all .prompt.hbs files from a given directory.
 */
function loadTemplates(templateDir: string): Promise<LoadedTemplate[]> {
  return new Promise((resolve, reject) => {
    const pattern = path.join(templateDir, '**/*.prompt.hbs');
    const files: string[] = glob.sync(pattern);

    const templates: LoadedTemplate[] = files.map((file: string): LoadedTemplate => {
      const content = fs.readFileSync(file, 'utf8');
      const parsed: GrayMatterFile<string> = matter(content) as matter.GrayMatterFile<string>;
      const metadata = parsed.data as TemplateMetadata;
      const templateContent = parsed.content;
      const compiledTemplate = Handlebars.compile(templateContent, { strict: true });
      return { filePath: file, metadata, templateContent, compiledTemplate };
    });
    resolve(templates);
  });
}

/**
 * Validates templates by compiling them with their input example.
 */
async function validateTemplates(): Promise<void> {
  const templatesDir = path.join(__dirname, '..', 'templates');
  try {
    const templates = await loadTemplates(templatesDir);
    for (const template of templates) {
      console.log(`\nValidating template: ${template.filePath}`);
      const inputExampleFile = template.metadata.inputExampleFile;
      if (!inputExampleFile) {
        console.warn(`No inputExampleFile defined in ${template.filePath}`);
        continue;
      }
      // Resolve the input example file path relative to the templates folder.
      const examplePath = path.join(templatesDir, inputExampleFile);
      if (!fs.existsSync(examplePath)) {
        console.error(`Input example file not found: ${examplePath}`);
        continue;
      }
      const inputExampleData = JSON.parse(fs.readFileSync(examplePath, 'utf8'));
      // Compile the template with the example data.
      try {
        const output = template.compiledTemplate(inputExampleData);
        console.log(`Template rendered successfully. Output:\n${output}`);
      } catch (err) {
        console.error(`Error compiling template ${template.filePath} with input example:`, err);
      }
    }
  } catch (err) {
    console.error('Error loading templates:', err);
  }
}

validateTemplates().catch((err) => {
  console.error('Validation script error:', err);
});
