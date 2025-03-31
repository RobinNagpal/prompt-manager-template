// src/lambda.ts

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Handlebars from 'handlebars';
import Ajv, { ErrorObject } from 'ajv';
import { ChatOpenAI, OpenAI } from '@langchain/openai';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import yaml from 'js-yaml';
import $RefParser from '@apidevtools/json-schema-ref-parser';

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
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Request body is missing' }),
      };
    }
    const request = JSON.parse(event.body);
    const { input, templateId, llmProvider, model } = request;

    // Ensure required fields are present.
    if (!input || !templateId || !llmProvider || !model) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing required fields: input, templateId, llmProvider, or model',
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
    const inputSchema = await $RefParser.dereference(inputSchemaPath);

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
    let llm: ChatOpenAI | undefined;
    if (llmProvider.toLowerCase() === 'openai') {
      llm = new ChatOpenAI({ model: model });
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: `Unsupported llmProvider: ${llmProvider}` }),
      };
    }

    // Process output schema if provided.
    const outputSchemaRelative = frontmatter.output_schema;
    if (outputSchemaRelative) {
      const outputSchemaPath = path.join(__dirname, '..', 'schemas', outputSchemaRelative);
      if (!fs.existsSync(outputSchemaPath)) {
        return {
          statusCode: 500,
          body: JSON.stringify({ message: `Output schema file ${outputSchemaRelative} not found` }),
        };
      }
      // Dereference the output schema with an explicit basePath.
      const outputSchema = await $RefParser.dereference(outputSchemaPath);

      // Use the LLM with structured output.
      const modelWithStructure = llm!.withStructuredOutput(outputSchema);
      const result = await modelWithStructure.invoke(prompt);
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
      return {
        statusCode: 200,
        body: JSON.stringify({
          request: input,
          prompt,
          response: result,
        }),
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Output schema not defined in template metadata',
          errors: [],
        }),
      };
    }
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
