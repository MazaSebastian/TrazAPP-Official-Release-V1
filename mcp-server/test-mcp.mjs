// Smoke test for TrazAPP MCP Server tool registration
import { TOOLS_DEFINITIONS } from './dist/tools/index.js';
import { RESOURCES_DEFINITIONS } from './dist/resources/index.js';
import { PROMPTS_DEFINITIONS } from './dist/prompts/index.js';

console.log('--- TRAZAPP MCP SMOKE TEST ---');
console.log(`Tools registradas: ${TOOLS_DEFINITIONS.length}`);
TOOLS_DEFINITIONS.forEach(t => console.log(`  ✓ Tool: ${t.name}`));

console.log(`\nRecursos registrados: ${RESOURCES_DEFINITIONS.length}`);
RESOURCES_DEFINITIONS.forEach(r => console.log(`  ✓ Resource: ${r.uri}`));

console.log(`\nPrompts registrados: ${PROMPTS_DEFINITIONS.length}`);
PROMPTS_DEFINITIONS.forEach(p => console.log(`  ✓ Prompt: ${p.name}`));

console.log('\n¡Verificación de TrazAPP MCP completada con éxito!');
