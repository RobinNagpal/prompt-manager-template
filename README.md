# Table of Contents

1. [About "Prompt Manager Template"](##about-prompt-manager-template)  
   1.1. [Key Features](##key-features)  
   1.2. [Why .prompt.hbs is Used](##why-prompthbs-is-used)

2. [Project Explanation](##project-explanation)  
   2.1. [Code Structure & Flow](##code-structure--flow)  
   2.2. [How It All Works Together](##how-it-all-works-together)

3. [Example Explanation](##example-explanation)  
   3.1. [Detailed Analysis Prompt Example](##detailed-analysis-prompt-example)  
   3.2. [Concise Summary Prompt Example](##concise-summary-prompt-example)  
   3.3. [Overall Example Workflow](##overall-example-workflow)

# Prompt Manager Template


## 1) About "Prompt Manager Template"

### Key Features
- **Collaboration & Updates:**  
  The template manager provides a simple way for teams to collaborate and update prompt templates. All changes are tracked using GitHub for version control and permissioning.
- **Strict Types:**  
  Input and output types are strictly defined using JSON Schema. This ensures that data passed to and from the prompts is validated and error-free.
- **Versioning:**  
  Templates are versioned, so you can keep track of updates and revert changes if needed.
- **Schema-based Validation:**  
  The system uses schemas to validate both inputs and outputs, as well as the structure of the prompt templates.
- **Handlebars Engine:**  
  Handlebars is used to compile the prompt templates. The `.prompt.hbs` extension makes it clear that the file contains both metadata (via YAML frontmatter) and a Handlebars template.
- **Integrated Workflow:**  
  The project compiles the templates, validates inputs and outputs, and is managed entirely on GitHub.

### Why .prompt.hbs is Used
- **Dual Content:**  
  The `.prompt.hbs` extension indicates that the file includes a Handlebars template. Additionally, it allows YAML frontmatter to be embedded at the top for metadata (like input and output schema names).
- **Editor-Friendly:**  
  Combining YAML metadata with Handlebars syntax in one file makes it easier for developers to read, maintain, and version the prompt together.
- **Single Source of Truth:**  
  By keeping metadata and the template in one file, there is no risk of mismatched versions or lost context when updates are made.

---

## 2) Project Explanation

### Code Structure & Flow
- **templateLoader.ts:**  
  This file is responsible for loading all `.prompt.hbs` files from the designated templates folder. It uses a glob pattern to find the files and the `gray-matter` library to parse the YAML frontmatter and separate it from the Handlebars template content.  
  _Essential Code Example:_
  ```ts
  const compiledTemplate: Handlebars.TemplateDelegate = Handlebars.compile(templateContent);
  ```
  This compiles the template so it can later be rendered with dynamic data.

- **schemaLoader.ts:**  
  This file loads YAML schema files from multiple folders. It uses the `js-yaml` library to convert YAML into JavaScript objects and `$RefParser` to resolve any `$ref` pointers across schema files.  
  _Essential Code Example:_
  ```ts
  const schema: object = await $RefParser.dereference(schemaFilePath);
  ```
  This ensures that all nested schema references are properly resolved.

- **index.ts:**  
  The main file integrates the template and schema loaders. It demonstrates how to render the templates with dummy data and how to validate the output by dereferencing the output schemas.  
  _Essential Code Example:_
  ```ts
  const rendered = template.compiledTemplate(data);
  ```
  This shows how dynamic data is injected into the template to produce the final prompt.

### How It All Works Together
- The template loader finds and compiles all `.prompt.hbs` files.
- The schema loader reads and resolves complex, nested schemas that are spread over multiple folders.
- The main file (index.ts) ties everything together by rendering the templates with sample data and validating the results against the specified output schemas.

---

## 3) Example Explanation

```shell
prompt-manager-template/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts            // Main runner code
│   ├── templateLoader.ts   // Loads .prompt.hbs files
│   └── schemaLoader.ts     // Loads and dereferences YAML schemas
├── templates/
│   └── stock/
│       ├── detailed_analysis.prompt.hbs
│       └── concise_summary.prompt.hbs
└── schemas/
    └── stock/
        ├── entities/
        │     ├── company.schema.yaml
        │     ├── market.schema.yaml
        │     ├── historical.schema.yaml
        │     └── stock.schema.yaml
        ├── analysis/
        │     ├── input.schema.yaml
        │     ├── result.schema.yaml
        │     └── output.schema.yaml
        └── summary/
              ├── input.schema.yaml
              ├── result.schema.yaml
              └── output.schema.yaml
```

### Detailed Analysis Prompt Example
- **Input Schema:**  
  Stored in `schemas/stock/analysis/input.schema.yaml`, this schema references common entity schemas (company, market, historical) located in the `entities/` folder.
- **Output Schema:**  
  Stored in `schemas/stock/analysis/output.schema.yaml`, it wraps an analysis result schema that defines the structure of the LLM's response.
- **Prompt Template:**  
  The file `templates/stock/detailed_analysis.prompt.hbs` uses the above input and output schemas. It includes dynamic placeholders such as `{{company.name}}`, `{{market.trends}}`, and `{{historical.high}}` for generating a comprehensive stock analysis.
- **Key Idea:**  
  This prompt is designed for a detailed analysis where a lot of data is required. The structure ensures that every piece of information (company details, market trends, historical data) is validated before the prompt is sent to the LLM.

### Concise Summary Prompt Example
- **Input Schema:**  
  Defined in `schemas/stock/summary/input.schema.yaml`, this schema references the company and stock data schemas from the `entities/` folder.
- **Output Schema:**  
  Located at `schemas/stock/summary/output.schema.yaml`, it wraps a summary result schema detailing the key financial ratios and market sentiment.
- **Prompt Template:**  
  The file `templates/stock/concise_summary.prompt.hbs` uses these schemas and includes placeholders like `{{company.name}}`, `{{stock.current_price}}`, and `{{stock.sentiment}}` to create a brief summary.
- **Key Idea:**  
  This prompt is meant for a quick overview. The schema division ensures that only the necessary data is validated and used, making the prompt concise and to the point.

### Overall Example Workflow
- **File Organization:**  
  Schemas are divided into multiple folders:
    - **Entities:** Contains common reusable schemas (company, market, historical, stock).
    - **Analysis:** Contains input and output schemas specific to detailed analysis prompts.
    - **Summary:** Contains input and output schemas specific to concise summary prompts.
- **Versioning & Maintenance:**  
  Since all templates and schemas are stored in GitHub, it is easy to track changes and collaborate with team members.
- **Template Compilation & Validation:**  
  The project compiles the Handlebars templates, injects dummy data, and validates the output against the resolved schemas. This ensures that any prompt sent to the LLM adheres to the defined structure.


--
## Generated Code Explanation

- **TypeScript Model Generator:**  
  Generates TypeScript interfaces from YAML schemas using `json-schema-to-typescript`.  
  **Key Code:**  
  ```ts
  const tsCode = await compileFromFile(file, { bannerComment: '' });
  ```  
Output is saved under `generated-models/typescript/models/stock` with the same folder structure as the schemas.

- **Python Pydantic Model Generator:**  
  Uses `datamodel-code-generator` to produce Pydantic models from the YAML schemas.  
  **Key Code:**
  ```python
  command = ['datamodel-codegen', '--input', input_path, '--output', output_path, '--input-file-type', 'yaml']
  ```  
  Models are saved under `generated-models/python/models/stock` following the schema folder hierarchy.

## 2) Lambda Explanation

- **Background & Purpose:**  
  This Serverless Lambda function is built in TypeScript and uses LangChain JS to call an LLM (e.g. OpenAI). It validates input using JSON Schemas and compiles Handlebars templates to generate a dynamic prompt. The Lambda ensures the prompt is valid and returns structured output according to an output schema.

- **Process Overview:**
  1. **Input Validation:**  
     The Lambda expects an event with `input`, `template-id`, `llmProvider`, and `model`. It loads the template (a `.prompt.hbs` file with YAML frontmatter) and validates the input against the specified input schema using Ajv.
     ```ts
     const { valid, errors } = validateData(inputSchema, input);
     ```

  2. **Template Compilation:**  
     After successful validation, the Handlebars template is compiled with the input data to generate the final prompt.
     ```ts
     const prompt = compiledTemplate(input);
     ```

  3. **LLM Call:**  
     The Lambda then uses LangChain JS (currently supports OpenAI) to send the generated prompt to the model.
     ```ts
     const chain = new LLMChain({ llm, prompt });
     const result = await chain.call({ input: prompt });
     ```

  4. **Output Validation & Error Handling:**  
     If an output schema is provided in the template metadata, the response from the LLM is validated. The function returns appropriate HTTP error codes (400, 404, 500) if any step fails.

- **What It Does:**
  - **Validates:** Ensures the incoming request data meets strict schema requirements.
  - **Generates:** Creates a prompt by merging dynamic data with a pre-defined Handlebars template.
  - **Calls:** Invokes the LLM using LangChain JS.
  - **Validates Output:** Checks that the LLM's response follows the output schema.
  - **Returns:** Provides structured results or error messages accordingly.
```
