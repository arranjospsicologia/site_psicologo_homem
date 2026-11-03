/**
 * Menu principal e submenu de artigos: toque, teclado, Escape e clique fora.
 * O foco volta ao controle que abriu o painel.
 */
export function iniciarMenu(): void {
  const cabecalho = document.querySelector<HTMLElement>('[data-cabecalho]');
  if (!cabecalho) return;
  const alternarMenu = cabecalho.querySelector<HTMLButtonElement>('[data-alternar-menu]');
  const menu = cabecalho.querySelector<HTMLElement>('[data-menu]');
  const itemSub = cabecalho.querySelector<HTMLElement>('[data-submenu]');
  const alternarSub = cabecalho.querySelector<HTMLButtonElement>('[data-alternar-submenu]');
  if (!alternarMenu || !menu) return;

  alternarMenu.hidden = false;
  const telaLarga = window.matchMedia('(min-width: 900px)');

  const definirMenu = (aberto: boolean, devolverFoco = false) => {
    alternarMenu.setAttribute('aria-expanded', String(aberto));
    menu.toggleAttribute('data-aberto', aberto);
    if (!aberto && devolverFoco) alternarMenu.focus();
  };
  const definirSub = (aberto: boolean, devolverFoco = false) => {
    if (!alternarSub || !itemSub) return;
    alternarSub.setAttribute('aria-expanded', String(aberto));
    itemSub.toggleAttribute('data-aberto', aberto);
    if (!aberto && devolverFoco) alternarSub.focus();
  };

  // Na página de um artigo, o submenu começa aberto no celular para orientar.
  if (alternarSub?.hasAttribute('data-ativo') && !telaLarga.matches) definirSub(true);

  alternarMenu.addEventListener('click', () => {
    definirMenu(alternarMenu.getAttribute('aria-expanded') !== 'true');
  });
  alternarSub?.addEventListener('click', () => {
    definirSub(alternarSub.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (itemSub?.hasAttribute('data-aberto') && (telaLarga.matches || itemSub.contains(document.activeElement))) {
      definirSub(false, true);
      return;
    }
    if (menu.hasAttribute('data-aberto')) definirMenu(false, true);
  });

  document.addEventListener('click', (e) => {
    const alvo = e.target as Node;
    if (telaLarga.matches && itemSub?.hasAttribute('data-aberto') && !itemSub.contains(alvo)) definirSub(false);
    if (!telaLarga.matches && menu.hasAttribute('data-aberto') && !cabecalho.contains(alvo)) definirMenu(false);
  });

  // Em tela larga, o submenu fecha quando o foco sai dele.
  itemSub?.addEventListener('focusout', (e) => {
    if (telaLarga.matches && !itemSub.contains(e.relatedTarget as Node)) definirSub(false);
  });

  telaLarga.addEventListener('change', () => { definirMenu(false); definirSub(false); });
}
