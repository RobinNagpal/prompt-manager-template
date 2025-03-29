// src/lambda.ts

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Handlebars from 'handlebars';
import Ajv, { ErrorObject } from 'ajv';
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { OpenAI } from 'langchain/llms/openai';
import { LLMChain } from 'langchain/chains';
import yaml from 'js-yaml';

/**
 * Helper function to read a file synchronously.
 */
function loadFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Validate data against a JSON schema using Ajv.
 */
function validateData(schema: object, data: unknown): { valid: boolean; errors?: ErrorObject[] } {
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const valid = validate(data);
  return { valid: !!valid, errors: validate.errors || [] };
}

/**
 * Lambda Handler.
 */
export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Request body is missing' }),
      };
    }
    const request = JSON.parse(event.body);
    const { input, "template-id": templateId, llmProvider, model } = request;

    // Ensure required fields are present.
    if (!input || !templateId || !llmProvider || !model) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing required fields: input, template-id, llmProvider, or model',
        }),
      };
    }

    // Load the template file.
    const templatePath = path.join(__dirname, '..', 'templates', templateId);
    if (!fs.existsSync(templatePath)) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: `Template ${templateId} not found` }),
      };
    }
    const fileContent = loadFile(templatePath);
    const parsed = matter(fileContent);
    const frontmatter = parsed.data as { input_schema?: string; output_schema?: string };
    const templateContent = parsed.content;

    // Load and parse the input schema.
    const inputSchemaRelative = frontmatter.input_schema;
    if (!inputSchemaRelative) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Input schema not defined in template metadata' }),
      };
    }
    const inputSchemaPath = path.join(__dirname, '..', 'schemas', inputSchemaRelative);
    if (!fs.existsSync(inputSchemaPath)) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: `Input schema file ${inputSchemaRelative} not found` }),
      };
    }
    const inputSchemaContent = loadFile(inputSchemaPath);
    const inputSchema = yaml.load(inputSchemaContent) as object;

    // Validate the provided input against the input schema.
    const { valid, errors } = validateData(inputSchema, input);
    if (!valid) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Input validation failed',
          errors,
        }),
      };
    }

    // Compile the Handlebars template with the provided input.
    const compiledTemplate = Handlebars.compile(templateContent);
    const prompt = compiledTemplate(input);

    // Choose LLM based on llmProvider. Currently, only "openai" is supported.
    let llm;
    if (llmProvider.toLowerCase() === 'openai') {
      llm = new OpenAI({ modelName: model });
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: `Unsupported llmProvider: ${llmProvider}` }),
      };
    }

    // Create a LangChain LLMChain and call the model.
    const chain = new LLMChain({ llm, prompt });
    const result = await chain.call({ input: prompt });

    // Optionally validate the output if an output schema is provided.
    const outputSchemaRelative = frontmatter.output_schema;
    if (outputSchemaRelative) {
      const outputSchemaPath = path.join(__dirname, '..', 'schemas', outputSchemaRelative);
      if (!fs.existsSync(outputSchemaPath)) {
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: `Output schema file ${outputSchemaRelative} not found`,
          }),
        };
      }
      const outputSchemaContent = loadFile(outputSchemaPath);
      const outputSchema = yaml.load(outputSchemaContent) as object;

      const { valid: validOutput, errors: outputErrors } = validateData(outputSchema, result);
      if (!validOutput) {
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: 'Output validation failed',
            errors: outputErrors,
          }),
        };
      }
    }

    // Return the generated prompt and the result from the LLM.
    return {
      statusCode: 200,
      body: JSON.stringify({
        prompt,
        result,
      }),
    };
  } catch (error: unknown) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : error,
      }),
    };
  }
};
