// Integração de build: a saída pública não deve conter os retratos mestres
// (PNGs de vários MB). Eles permanecem em public/imagens/profissionais/ como
// fonte; o site usa apenas os derivados otimizados gerados pelo Astro.
import { rm, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export function removerMestres() {
  return {
    name: 'psicologo-homem:remover-mestres',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const pasta = path.join(fileURLToPath(dir), 'imagens', 'profissionais');
        try {
          const arquivos = await readdir(pasta);
          await rm(pasta, { recursive: true, force: true });
          logger.info(`Retratos mestres removidos da saída: ${arquivos.length}`);
        } catch {
          /* pasta inexistente: nada a remover */
        }
      },
    },
  };
}
