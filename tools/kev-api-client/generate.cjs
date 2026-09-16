#!/usr/bin/env node
// Pure-Node OpenAPI -> TypeScript client generator for the KEV backend.
// Replaces the Java openapi-generator-cli dependency (T1 of
// docs/KEV_TOOLS_ROADMAP.md): deterministic, zero-install, and scoped so the
// generated code always type-checks inside kev/tsconfig.json (strict).
//
// Usage:
//   node generate.cjs [--spec ../../src/generated/api/openapi.json] [--scope /xr]
//
// Output (in the KEV frontend root):
//   src/generated/api/types.ts    named schemas referenced by the scope
//   src/generated/api/client.ts   createKevXrClient() - one typed method per
//                                 operation: path/query params + request body
//
// Responses are typed `unknown` unless the route declares a response schema -
// FastAPI dict returns do not, and inventing types the backend never promised
// is exactly the drift this tool exists to prevent.

const fs = require('fs');
const path = require('path');

const KEV_ROOT = path.join(__dirname, '..', '..');

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const SPEC_PATH = path.resolve(KEV_ROOT, arg('--spec', 'src/generated/api/openapi.json'));
const SCOPE = arg('--scope', '/xr');
const OUT_DIR = path.join(KEV_ROOT, 'src', 'generated', 'api');

// --- schema -> TS -----------------------------------------------------------

function sanitize(name) {
  const cleaned = String(name).replace(/[^A-Za-z0-9_$]/g, '_');
  return /^[0-9]/.test(cleaned) ? `_${cleaned}` : cleaned;
}

function pascal(name) {
  const s = sanitize(name);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function tsLiteral(value) {
  if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return 'unknown';
}

class TypeEmitter {
  constructor(spec) {
    this.spec = spec;
    this.referenced = new Map(); // schema name -> emitted interface text
    this.emitting = new Set();
  }

  schemaName(ref) {
    // '#/components/schemas/Foo' -> 'Foo'
    return ref.split('/').pop();
  }

  ensureSchema(name) {
    if (this.referenced.has(name) || this.emitting.has(name)) return pascal(name);
    const schema = (this.spec.components?.schemas || {})[name];
    if (!schema) {
      this.referenced.set(name, `export type ${pascal(name)} = unknown; // schema missing from spec`);
      return pascal(name);
    }
    this.emitting.add(name);
    const body = this.objectish(schema, pascal(name));
    this.emitting.delete(name);
    this.referenced.set(name, body);
    return pascal(name);
  }

  typeOf(schema, inlineDepth = 0) {
    if (!schema) return 'unknown';
    if (schema.$ref) return this.ensureSchema(this.schemaName(schema.$ref));
    if (Array.isArray(schema.anyOf)) {
      const parts = schema.anyOf.map((s) => this.typeOf(s, inlineDepth + 1));
      return [...new Set(parts)].join(' | ');
    }
    if (Array.isArray(schema.oneOf)) {
      const parts = schema.oneOf.map((s) => this.typeOf(s, inlineDepth + 1));
      return [...new Set(parts)].join(' | ');
    }
    if (Array.isArray(schema.allOf) && schema.allOf.length === 1) {
      return this.typeOf(schema.allOf[0], inlineDepth + 1);
    }
    if (Array.isArray(schema.enum)) return schema.enum.map(tsLiteral).join(' | ');
    const nullable = schema.nullable ? ' | null' : '';
    switch (schema.type) {
      case 'string':
        return `string${nullable}`;
      case 'integer':
      case 'number':
        return `number${nullable}`;
      case 'boolean':
        return `boolean${nullable}`;
      case 'array':
        return `(${this.typeOf(schema.items, inlineDepth + 1)})[]${nullable}`;
      case 'object':
        if (inlineDepth > 1) return `Record<string, unknown>${nullable}`;
        if (schema.properties && Object.keys(schema.properties).length) {
          const required = new Set(schema.required || []);
          const lines = Object.entries(schema.properties).map(([key, prop]) => {
            const safeKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : `'${key}'`;
            return `  ${safeKey}${required.has(key) ? '' : '?'}: ${this.typeOf(prop, inlineDepth + 1)};`;
          });
          return `{\n${lines.join('\n')}\n}${nullable}`;
        }
        if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
          return `Record<string, ${this.typeOf(schema.additionalProperties, inlineDepth + 1)}>${nullable}`;
        }
        return `Record<string, unknown>${nullable}`;
      default:
        if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
          return `Record<string, ${this.typeOf(schema.additionalProperties, inlineDepth + 1)}>${nullable}`;
        }
        return 'unknown';
    }
  }

  objectish(schema, name) {
    if (schema.$ref || schema.type === 'object' || schema.properties || schema.allOf || schema.anyOf) {
      // Inheritance-free emit: FastAPI pydantic models flatten into properties.
      if (schema.properties && Object.keys(schema.properties).length) {
        const required = new Set(schema.required || []);
        const lines = Object.entries(schema.properties).map(([key, prop]) => {
          const safeKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : `'${key}'`;
          const doc = prop.title || prop.description ? `  /** ${String(prop.title || prop.description).replace(/\*\//g, '')} */\n` : '';
          return `${doc}  ${safeKey}${required.has(key) ? '' : '?'}: ${this.typeOf(prop, 1)};`;
        });
        return `export interface ${name} {\n${lines.join('\n')}\n}`;
      }
      return `export type ${name} = ${this.typeOf(schema, 1)};`;
    }
    return `export type ${name} = ${this.typeOf(schema, 1)};`;
  }
}

// --- operations -------------------------------------------------------------

function methodName(method, routePath, taken) {
  const tail = routePath
    .replace(/^\/xr\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((seg) => seg.replace(/[{}]/g, ''));
  let base = tail.join('_') || 'root';
  base = base.replace(/[^A-Za-z0-9_]/g, '_').replace(/_+/g, '_');
  let name = base.charAt(0).toLowerCase() + base.slice(1);
  if (method !== 'get') name += `_${method}`;
  name = sanitize(name).replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
  let unique = name;
  let n = 2;
  while (taken.has(unique)) unique = `${name}${n++}`;
  taken.add(unique);
  return unique;
}

function main() {
  const spec = JSON.parse(fs.readFileSync(SPEC_PATH, 'utf8'));
  const emitter = new TypeEmitter(spec);
  const taken = new Set();
  const methods = [];

  const routes = Object.entries(spec.paths || {})
    .filter(([p]) => p.startsWith(SCOPE))
    .sort(([a], [b]) => a.localeCompare(b));

  for (const [routePath, item] of routes) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      const op = item[method];
      if (!op) continue;
      const name = methodName(method, routePath, taken);

      const params = op.parameters || [];
      const pathParams = params.filter((p) => p.in === 'path');
      const queryParams = params.filter((p) => p.in === 'query');
      const argsParts = [];
      const argsType = [];
      for (const p of pathParams) {
        argsType.push(`'${sanitize(p.name)}': ${emitter.typeOf(p.schema, 2)}`);
      }
      for (const p of queryParams) {
        argsType.push(`'${sanitize(p.name)}'${p.required ? '' : '?'}: ${emitter.typeOf(p.schema, 2)}`);
      }
      if (argsType.length) argsParts.push(`args: { ${argsType.join('; ')} }`);

      let bodyType = null;
      const bodySchema = op.requestBody?.content?.['application/json']?.schema;
      if (bodySchema) {
        bodyType = emitter.typeOf(bodySchema, 0);
        argsParts.push(`body: ${bodyType}`);
      }

      const ok = op.responses?.['200'] || op.responses?.['201'] || op.responses?.['202'];
      const responseType = emitter.typeOf(ok?.content?.['application/json']?.schema, 0) || 'unknown';

      const urlExpr = pathParams.length
        ? `\`${routePath.replace(/{([^}]+)}/g, (_, p) => `\${encodeURIComponent(String(args['${sanitize(p)}']))}`)}\``
        : `'${routePath}'`;
      const optsParts = [];
      if (queryParams.length) {
        optsParts.push(`query: { ${queryParams.map((p) => `'${sanitize(p.name)}': args['${sanitize(p.name)}']`).join(', ')} }`);
      }
      if (bodyType) optsParts.push('body');
      const optsExpr = optsParts.length ? `, { ${optsParts.join(', ')} }` : '';
      const doc = `${method.toUpperCase()} ${routePath}${op.summary ? ` - ${String(op.summary).replace(/\*\//g, '')}` : ''}`;

      methods.push(
        `  /** ${doc} */\n  ${name}: (${argsParts.join(', ')}) =>\n    request<${responseType}>(${JSON.stringify(method.toUpperCase())}, ${urlExpr}${optsExpr}),`
      );
    }
  }

  const header = `/* eslint-disable */
// GENERATED CODE - do not edit by hand.
// Generator: tools/kev-api-client/generate.cjs (pure Node, no Java).
// Spec: src/generated/api/openapi.json | Scope: ${SCOPE}/*
// Regenerate: npm run api:client  |  Drift gate: npm run api:drift
`;

  const typesTs = `${header}
${[...emitter.referenced.values()].sort().join('\n\n')}
`;

  const schemaNames = [...new Set([...emitter.referenced.keys()].map(pascal))].sort();
  const typeImport = schemaNames.length
    ? `import type {\n  ${schemaNames.join(',\n  ')},\n} from './types';`
    : `// No named schemas referenced by this scope.`;

  const clientTs = `${header}
${typeImport}

export interface KevClientConfig {
  /** API base, e.g. '/api' behind the Vite proxy or 'http://localhost:8000'. */
  basePath: string;
  /** Auth headers (Auth0 bearer + dev-bypass role headers), called per request. */
  headers?: () => Record<string, string>;
  /** Injectable fetch for tests. */
  fetchImpl?: typeof fetch;
}

async function send<T>(
  config: KevClientConfig,
  method: string,
  path: string,
  opts?: { query?: Record<string, unknown>; body?: unknown }
): Promise<T> {
  const impl = config.fetchImpl || fetch;
  const url = new URL(path.replace(/^\\//, ''), config.basePath.replace(/\\/$/, '') + '/');
  for (const [key, value] of Object.entries(opts?.query || {})) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  const headers: Record<string, string> = { ...(config.headers ? config.headers() : {}) };
  const init: RequestInit = { method, headers };
  if (opts?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(opts.body);
  }
  const response = await impl(url.toString(), init);
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const parsed = (await response.json()) as { detail?: string };
      if (parsed?.detail) detail = parsed.detail;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(\`KEV API \${method} \${path} failed: \${response.status} \${detail}\`);
  }
  return (await response.json()) as T;
}

export function createKevXrClient(config: KevClientConfig) {
  const request = <T>(method: string, path: string, opts?: { query?: Record<string, unknown>; body?: unknown }) =>
    send<T>(config, method, path, opts);

  return {
${methods.join('\n\n')}
  };
}

export type KevXrClient = ReturnType<typeof createKevXrClient>;
`;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'types.ts'), typesTs);
  fs.writeFileSync(path.join(OUT_DIR, 'client.ts'), clientTs);
  console.log(
    `Generated ${methods.length} client methods over ${routes.length} ${SCOPE}/* routes ` +
      `and ${emitter.referenced.size} schemas -> src/generated/api/`
  );
}

main();
