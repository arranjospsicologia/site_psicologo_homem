/**
 * O WhatsApp flutuante aparece só quando não há outro contato visível na tela:
 * some enquanto o rodapé ou um botão de contato da página estiverem à vista,
 * para não encobri-los nem repetir a mesma ação.
 */
export function iniciarFlutuante(): void {
  const botao = document.querySelector<HTMLElement>('[data-flutuante]');
  if (!botao || !('IntersectionObserver' in window)) return;
  const alvos = [
    ...document.querySelectorAll<HTMLElement>('[data-rodape], main [data-evento="contact_click"], main .acao-pendente'),
  ];
  const visiveis = new Set<Element>();
  const obs = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (e.isIntersecting) visiveis.add(e.target);
      else visiveis.delete(e.target);
    }
    botao.toggleAttribute('data-oculto', visiveis.size > 0);
  });
  alvos.forEach((a) => obs.observe(a));
}
