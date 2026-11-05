# [Márleson Ferreira — site pessoal](https://marleson.github.io/)

[![Build do site](https://github.com/marleson/marleson.github.io/actions/workflows/build.yml/badge.svg)](https://github.com/marleson/marleson.github.io/actions/workflows/build.yml)

Notas de aula de matemática, blog, tutoriais e códigos. Feito com [Jekyll](https://jekyllrb.com/)
e o tema [Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/), publicado pelo GitHub Pages.

## Como o site funciona

| O quê | Onde |
|---|---|
| Configuração geral (título, redes sociais, comentários, analytics) | `_config.yml` |
| Menu superior | `_data/navigation.yml` |
| Disciplinas das notas de aula | `_data/disciplinas.yml` |
| Notas de aula | `_notas-de-aula/<disciplina>/NN-titulo.md` |
| Posts do blog | `_posts/AAAA-MM-DD-titulo.md` |
| Tutoriais | `_tutoriais/` |
| Páginas avulsas (Sobre, Agenda, ...) | `_pages/` |
| Imagens | `images/` |
| Estilos personalizados (inclusive caixas de teorema) | `assets/css/main.scss` |
| MathJax e scripts extras no `<head>` | `_includes/head/custom.html` |
| Modelos de post e de nota | `_modelos/` |

O tema é carregado pelo `remote_theme` (versão fixa em `_config.yml`), então **não há arquivos do
tema no repositório**. Para atualizar o tema, troque o número da versão em `remote_theme`.
Para sobrescrever algum arquivo do tema, copie-o para o mesmo caminho neste repositório
(foi o que se fez com `_includes/breadcrumbs.html` e `_includes/social-share.html`).

## Publicando conteúdo

### Nova nota de aula

```bash
bin/novo nota calculo-1 "Limites e continuidade"
```

Isso cria `_notas-de-aula/calculo-1/01-limites-e-continuidade.md` já com o modelo.
Na primeira nota de uma disciplina, cadastre o nome dela em `_data/disciplinas.yml`:

```yaml
calculo-1:
  nome: "Cálculo I"
  descricao: "Limites, derivadas e integrais de funções de uma variável."
```

A página [/notas-de-aula/](https://marleson.github.io/notas-de-aula/) agrupa as notas por
disciplina automaticamente, na ordem do campo `ordem:`.

### Novo post

```bash
bin/novo post "Título do post"
```

Para deixar algo como rascunho (não aparece no site), use `published: false` no front matter.

## Escrevendo matemática

O MathJax 4 está ligado por padrão em notas, posts e tutoriais (`mathjax: true`).

```markdown
Em linha: $f(x) = x^2$  ·  Destaque: $$\int_a^b f(x)\dd x$$

\begin{equation}\label{eq:euler}
  e^{i\pi} + 1 = 0
\end{equation}
A equação \eqref{eq:euler} ...
```

Atalhos: `\R \N \Z \Q \C`, `\dd` (diferencial), `\abs{x}`, `\norm{v}` — para criar outros,
edite `macros` em `_includes/head/custom.html`.

Caixas para teoremas etc. (o `markdown="1"` é obrigatório):

```markdown
<div class="teorema" markdown="1">
**Teorema 1 (Valor Médio).** Se $f$ é contínua em $[a,b]$ e derivável em $(a,b)$, ...
</div>

<div class="demonstracao" markdown="1">
*Demonstração.* ...
</div>
```

Classes disponíveis: `teorema`, `proposicao`, `lema`, `corolario`, `definicao`, `exemplo`,
`exercicio`, `observacao`, `demonstracao`, `solucao`.

> Dica: se uma fórmula em linha contém `_` ou `*` e o Markdown a estraga, escreva-a com
> `$$...$$` no meio do texto — o kramdown trata isso como fórmula em linha.

## Rodando localmente

Requer Ruby 3.x e Bundler.

```bash
bundle install
```

```bash
bundle exec jekyll serve --livereload
```

Abra <http://localhost:4000>. Alterações no `_config.yml` exigem reiniciar o servidor.

## Automação

- **Build no GitHub Actions** (`.github/workflows/build.yml`): a cada push/PR o site é compilado e
  os links internos são verificados. Se algo quebrar, o erro aparece na aba *Actions* antes de ir ao ar.
- **Dependabot** (`.github/dependabot.yml`): abre PRs mensais atualizando gems, actions e pacotes Python.

## Pendências que dependem de você

- **Analytics**: o Google Analytics Universal (`UA-...`) foi desligado pelo Google. Crie uma
  propriedade GA4 e coloque o ID `G-...` em `analytics` no `_config.yml`.
- **Comentários**: estão desligados (o Facebook Comments exigia um `appid` que nunca foi configurado).
  Siga os passos comentados em `comments` no `_config.yml` para ativar o giscus.

## Notebooks (Binder)

Os notebooks em `_jupyter/` podem ser abertos online pelo
[Binder](https://mybinder.org/v2/gh/marleson/marleson.github.io/master); as dependências estão em
`requirements.txt`.

## Créditos

Tema [Minimal Mistakes](https://github.com/mmistakes/minimal-mistakes) por Michael Rose (MIT).
Imagens de demonstração do [Unsplash](https://unsplash.com/).
