/**
 * Filtros da listagem (lógica E), contagem acessível, estado sem resultados
 * e ordem aleatória por visita (sessionStorage, sem cookie).
 */
import { enviarEvento } from './analytics';

const CHAVE_ORDEM = 'ph-ordem-profissionais';

function embaralhar<T>(lista: T[]): T[] {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ordemDaVisita(ids: string[]): string[] {
  try {
    const salva = JSON.parse(sessionStorage.getItem(CHAVE_ORDEM) ?? 'null') as string[] | null;
    // Reaproveita o sorteio se ele cobrir exatamente os mesmos profissionais.
    if (salva && salva.length === ids.length && ids.every((id) => salva.includes(id))) return salva;
  } catch { /* armazenamento indisponível */ }
  const nova = embaralhar(ids);
  try { sessionStorage.setItem(CHAVE_ORDEM, JSON.stringify(nova)); } catch { /* ignora */ }
  return nova;
}

export function iniciarLista(): void {
  const raiz = document.querySelector<HTMLElement>('[data-lista]');
  if (!raiz) return;
  const form = raiz.querySelector<HTMLFormElement>('[data-filtros]')!;
  const selLocal = raiz.querySelector<HTMLSelectElement>('[data-filtro="localizacao"]')!;
  const selServico = raiz.querySelector<HTMLSelectElement>('[data-filtro="servico"]')!;
  const lista = raiz.querySelector<HTMLElement>('[data-cards]')!;
  const contagem = raiz.querySelector<HTMLElement>('[data-contagem]')!;
  const vazio = raiz.querySelector<HTMLElement>('[data-vazio]')!;
  const cards = [...raiz.querySelectorAll<HTMLElement>('[data-card]')];

  // Ordem aleatória da visita.
  const porId = new Map(cards.map((c) => [c.dataset.id!, c]));
  for (const id of ordemDaVisita([...porId.keys()])) lista.appendChild(porId.get(id)!);

  form.hidden = false;
  const tUm = contagem.dataset.textoUm ?? '1 profissional encontrado.';
  const tVarios = contagem.dataset.textoVarios ?? '{quantidade} profissionais encontrados.';

  const aplicar = (anunciar: boolean) => {
    const local = selLocal.value;
    const servico = selServico.value;
    let visiveis = 0;
    for (const c of cards) {
      const okLocal = local === 'todos' || c.dataset.localizacao === local;
      const okServico = servico === 'todos' || (c.dataset.servicosOnline ?? '').split(' ').includes(servico);
      const mostrar = okLocal && okServico;
      c.hidden = !mostrar;
      if (mostrar) visiveis++;
    }
    vazio.hidden = visiveis > 0;
    const texto = visiveis === 0 ? '' : visiveis === 1 ? tUm : tVarios.replace('{quantidade}', String(visiveis));
    // Sem resultado: o aviso do estado vazio é anunciado pela própria região de status.
    contagem.textContent = visiveis === 0 ? (vazio.querySelector('p')?.textContent ?? '') : texto;
    contagem.classList.toggle('visualmente-oculto', visiveis === 0);
    if (!anunciar) contagem.setAttribute('data-inicial', '');
  };

  const aoMudar = () => {
    aplicar(true);
    enviarEvento('professional_filter_change', { region_id: selLocal.value, service_id: selServico.value });
  };
  selLocal.addEventListener('change', aoMudar);
  selServico.addEventListener('change', aoMudar);

  raiz.querySelectorAll<HTMLButtonElement>('[data-limpar]').forEach((b) =>
    b.addEventListener('click', () => {
      const mudou = selLocal.value !== 'todos' || selServico.value !== 'todos';
      selLocal.value = 'todos';
      selServico.value = 'todos';
      aplicar(true);
      if (mudou) enviarEvento('professional_filter_change', { region_id: 'todos', service_id: 'todos' });
      selLocal.focus();
    }));

  aplicar(false);
}
