# Psicólogo Homem — código do site

Site estático de [psicologohomem.com.br](https://psicologohomem.com.br), organizado pela [Arranjos Psicologia](https://arranjospsicologia.com.br/). Feito com [Astro](https://astro.build), design mobile-first e publicado no GitHub Pages.

## Comandos

Requer Node 22.23.4 ou mais novo (o arquivo `.nvmrc` indica a versão 24).

| Comando | O que faz |
|---|---|
| `npm install` | Instala as dependências |
| `npm run dev` | Prévia com atualização automática em `http://localhost:4321` |
| `npm run build` | Gera o site em `dist/` e roda a verificação da saída |
| `npm run preview` | Serve o `dist/` gerado |
| `npm run check` | Verifica tipos e componentes |
| `npm run deploy` | Confere, gera, registra e envia para o GitHub, que publica o site |

Para testar o endereço do GitHub Pages de projeto, gere com a base da subpasta:

```bash
PUBLIC_SITE_URL=https://USUARIO.github.io PUBLIC_BASE_PATH=/REPOSITORIO/ npm run build
```

## Onde editar

O código lê os textos e dados do projeto. Na maior parte das mudanças, não é preciso tocar em `src/`.

| O que mudar | Onde |
|---|---|
| Texto das páginas | `conteudo/*.md` |
| Cards e microtextos da lista | `conteudo/componentes/cards-profissionais.md` |
| Rodapé | `conteudo/componentes/rodape.md` |
| Artigos | arquivos `.md` da raiz, ligados às rotas em `data/paginas.json` |
| Profissionais, serviços, menu, filtros | `data/site.json` |
| Números e mensagens de WhatsApp | `data/contatos.json` |
| Título e descrição de busca | `data/seo.json` |
| Retratos | `public/imagens/profissionais/` (trocar o arquivo mantendo o nome) |

Convenções dos textos:

- O frontmatter e os comentários `<!-- ... -->` são internos e nunca aparecem no site.
- Um parágrafo formado só por **negrito** é o rótulo de um botão. Ele precisa ter um controle definido na página; caso contrário, o build avisa.
- `{{pendente: descrição}}` mostra um placeholder com o aviso **Informação pendente**.

## Informação pendente

Todo dado que ainda falta aparece na tela como placeholder, com o aviso "Informação pendente" ao lado. Contatos sem número aparecem como botão desativado, nunca com o número de outra pessoa. Ao final de cada build, a lista de pendências é impressa. Com `PUBLIC_INDEXABLE=true`, o build **falha** enquanto houver alguma.

Para resolver uma pendência, preencha o dado no lugar indicado: por exemplo, `numero_internacional` em `data/contatos.json`, `endereco_presencial` ou `redes` em `data/site.json`. O aviso some sozinho.

## Novo artigo

1. Crie o `.md` na raiz, com `# Título` na primeira linha.
2. Em `data/paginas.json`, aponte a `fonte` da página para o arquivo e troque o `conteudo_status` (o que começa com `briefing` mostra o placeholder).
3. Inclua o artigo no submenu (`data/site.json` → `menu`), em `data/seo.json` e a mensagem em `data/contatos.json`.

## Novo profissional ou cidade

1. Cadastre o profissional em `data/site.json` → `profissionais`, com serviços e modalidades confirmados, e coloque o retrato em `public/imagens/profissionais/`.
2. Em `data/contatos.json`, inclua o destinatário e a regra do card em `paginas.remoto.cards`.
3. Inclua a descrição do card em `conteudo/componentes/cards-profissionais.md` (seção com o nome de exibição).
4. Só se houver atendimento presencial real: crie `conteudo/<cidade-uf>.md` e as entradas em `data/paginas.json` (tipo `local`), `data/contatos.json` e `data/seo.json`. A rota é criada automaticamente.

As opções de localização e de serviço do filtro vêm dos cadastros. Sem JavaScript, a lista mostra todos em ordem alfabética. Com JavaScript, a ordem é sorteada uma vez por visita.

## Publicação (GitHub Pages)

1. Crie o repositório público e envie este projeto. O `.gitignore` libera apenas os arquivos do site.
2. Em **Settings → Pages**, escolha **GitHub Actions** como fonte.
3. Opcional: em **Settings → Secrets and variables → Actions → Variables**, defina as variáveis descritas em `.github/workflows/publicar.yml`. Sem elas, o site usa `https://USUARIO.github.io/REPOSITORIO/`.
4. Cada push na branch `main` gera, verifica e publica o site. Pushes que só mudam `.github/README.md` ou `.env.example` não republicam.

Se o repositório se chamar `USUARIO.github.io`, defina `PUBLIC_BASE_PATH=/`.

### Publicar uma atualização

```bash
npm run deploy                          # mensagem automática com data e hora
npm run deploy -- "Corrige o rodapé"    # mensagem própria
npm run deploy -- --rapido              # pula a verificação local
```

O comando ([scripts/deploy.mjs](../scripts/deploy.mjs)) só age na branch `main`. Se não houver mudança, avisa e não faz nada. Antes de enviar, roda `npm run check` e `npm run build`; se algo falhar, nada é enviado. Depois registra o commit, traz o que tiver sido mudado direto no GitHub e faz o push. A publicação leva 1–2 minutos e pode ser acompanhada na aba **Actions**.

### Domínio definitivo

1. Em **Settings → Pages → Custom domain**, informe `psicologohomem.com.br` e siga os valores de DNS indicados na [documentação do GitHub](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site). Com a publicação por GitHub Actions, não é preciso arquivo `CNAME`.
2. Defina as variáveis `PUBLIC_SITE_URL=https://psicologohomem.com.br`, `PUBLIC_BASE_PATH=/` e `PUBLIC_DEPLOY_TARGET=dominio`, e rode o workflow de novo.
3. Ative o HTTPS quando o certificado estiver disponível.
4. Quando tudo estiver conferido e sem pendências, defina `PUBLIC_INDEXABLE=true` e envie o sitemap (`/sitemap-index.xml`) no Search Console.

## Google Analytics 4

- Defina `PUBLIC_GA_MEASUREMENT_ID` (formato `G-…`) e `PUBLIC_ANALYTICS_ENABLED=true`.
- Nada é carregado antes de o visitante escolher **Permitir estatísticas** (Consent Mode básico). Em `localhost`, nunca há envio.
- Eventos do projeto: `contact_click` (`page_id`, `page_type`, `placement`, `professional_id`, `recipient_id`), `professional_filter_change` (`region_id`, `service_id`) e `social_click` (`page_id`, `professional_id`, `network_id`). Cadastre esses parâmetros como dimensões personalizadas no GA4.
- No GA4, em **Fluxo de dados → Medição otimizada**, desative **Cliques de saída** para não registrar as URLs do WhatsApp. Os cliques de contato já são medidos pelo evento `contact_click`, sem número nem mensagem.
- Um `contact_click` indica intenção de contato, não um agendamento.

## Estrutura

```text
src/
  components/   cabeçalho, rodapé, cards, filtros, botões de contato, FAQ…
  layouts/      layout base (metadados, consentimento, flutuante)
  lib/          caminhos (base), dados, contatos, leitura dos textos
  pages/        rotas (páginas locais e artigos vêm de data/paginas.json)
  scripts/      menu, lista/filtros, Analytics, flutuante
  styles/       estilos globais e fontes
scripts/        verificação da saída e integração de build
```

Os caminhos internos passam por `src/lib/caminhos.ts`, que aplica a base (`/` ou `/REPOSITORIO/`) uma única vez. Os retratos são servidos em AVIF/WebP/JPEG responsivos; os PNGs mestres não vão para a saída.
