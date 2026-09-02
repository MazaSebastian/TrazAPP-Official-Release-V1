#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { TOOLS_DEFINITIONS, executeTool } from './tools/index.js';
import { RESOURCES_DEFINITIONS, handleReadResource } from './resources/index.js';
import { PROMPTS_DEFINITIONS, handleGetPrompt } from './prompts/index.js';
import { getConfig } from './config.js';

async function main() {
  const config = getConfig();

  const server = new Server(
    {
      name: 'trazapp-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // ─── TOOLS ───
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOLS_DEFINITIONS,
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      return await executeTool(name, args);
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `[Error en TrazAPP MCP Tool "${name}"]: ${error?.message || error}`,
          },
        ],
        isError: true,
      };
    }
  });

  // ─── RESOURCES ───
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: RESOURCES_DEFINITIONS,
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    try {
      return await handleReadResource(uri);
    } catch (error: any) {
      throw new Error(`Error al leer recurso TrazAPP: ${error?.message || error}`);
    }
  });

  // ─── PROMPTS ───
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: PROMPTS_DEFINITIONS,
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      return await handleGetPrompt(name, args);
    } catch (error: any) {
      throw new Error(`Error al obtener prompt TrazAPP: ${error?.message || error}`);
    }
  });

  // ─── START TRANSPORT ───
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[TrazAPP MCP Server] Servidor MCP conectado exitosamente vía Stdio.');
}

main().catch((err) => {
  console.error('[TrazAPP MCP Server Fatal Error]:', err);
  process.exit(1);
});
