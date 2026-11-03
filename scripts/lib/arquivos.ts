import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Lista os .json de data/ (recursivo), ignorando data/brutos/. */
export function listarJson(dir: string): string[] {
  const out: string[] = [];
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) {
      if (nome === 'brutos') continue;
      out.push(...listarJson(p));
    } else if (nome.endsWith('.json')) out.push(p);
  }
  return out;
}
