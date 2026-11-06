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

### Disciplinas

As disciplinas ficam em `_data/disciplinas.yml`, separadas em Ensino Médio e Ensino Superior.
Lá você edita nome, turma, descrição, livro-texto e o **conteúdo previsto** (ementa por unidade),
que aparece na página da disciplina mesmo antes de haver aulas publicadas.

| Disciplina | Página | Pasta das aulas |
|---|---|---|
| Matemática 1 | `/notas-de-aula/matematica-1/` | `_notas-de-aula/matematica-1/` |
| Matemática 2 | `/notas-de-aula/matematica-2/` | `_notas-de-aula/matematica-2/` |
| Matemática 3 | `/notas-de-aula/matematica-3/` | `_notas-de-aula/matematica-3/` |
| Introdução ao Cálculo | `/notas-de-aula/introducao-ao-calculo/` | `_notas-de-aula/introducao-ao-calculo/` |
| Cálculo 1 | `/notas-de-aula/calculo-1/` | `_notas-de-aula/calculo-1/` |
| Teoria dos Números | `/notas-de-aula/teoria-dos-numeros/` | `_notas-de-aula/teoria-dos-numeros/` |

Para criar uma disciplina nova: adicione-a em `_data/disciplinas.yml` e copie um dos arquivos de
`_pages/disciplinas/` trocando a chave.

### Importar uma aula pronta em HTML

Para aulas no formato "caderno" (como a Aula 01 de Teoria dos Números), use:

```bash
bin/importar-aula ~/Downloads/aula-02-algoritmo-divisao-mdc.html teoria-dos-numeros
```

O script copia o conteúdo e as fórmulas, cria o cabeçalho da aula, adiciona o sumário lateral e
grava em `_notas-de-aula/teoria-dos-numeros/aula-02-....html`. A ordem é tirada do título
("Aula 02 — ..."); para definir outra, use `--ordem 2`. Para substituir uma aula já importada,
acrescente `--forcar`. Depois é só fazer commit e push.

A navegação "Anterior / Próxima" e a lista de aulas na barra lateral são geradas sozinhas,
dentro da mesma disciplina.

### Gráficos interativos (função afim)

Qualquer aula pode ter gráficos interativos de função afim. Coloque `graficos: true` no front
matter e, onde quiser o gráfico:

```html
<div class="grafico-afim" data-titulo="Interativo · explore a e b"
     data-a="1" data-b="2" data-janela="-6,6,-6,6"
     data-controles="a,b" data-mostrar="raiz,intercepto,inclinacao">
  <p>Gráfico interativo: ative o JavaScript do navegador para usar.</p>
</div>
```

| Atributo | O que faz |
|---|---|
| `data-a`, `data-b` | valores iniciais da função \(f(x) = ax + b\) |
| `data-janela` | região visível: `xmin,xmax,ymin,ymax` (mesma escala nos dois eixos) |
| `data-controles` | controles exibidos: `a`, `b`, `x` (ponto que percorre a reta), `dominio` |
| `data-mostrar` | marcadores: `raiz`, `intercepto`, `inclinacao`, `sinal` |
| `data-modo="dois-pontos"` | o aluno arrasta dois pontos e o gráfico calcula `a` e `b` (`data-pontos="x1,y1,x2,y2"`) |
| `data-x`, `data-dominio` | valor inicial do ponto móvel / intervalo inicial do domínio |

O código está em `assets/js/grafico-afim.js` (JavaScript puro, sem bibliotecas externas), e
funciona com mouse, toque e teclado. Exemplo completo: `_notas-de-aula/matematica-1/funcao-afim.html`.

### Interativos de matrizes, determinantes e sistemas

Coloque `interativos: [matrizes]` no front matter (carrega `assets/js/matrizes.js`) e, onde
quiser o interativo, um `<div class="mx">` com o tipo e os dados. Matrizes são escritas por
linhas separadas por `;`, com elementos separados por `,` (aceita frações como `1/2`):

```html
<div class="mx" data-tipo="det" data-matriz="1,0,4;7,-2,10;1,5,6" data-titulo="Explore: a regra de Sarrus">
  <p>(Ative o JavaScript para usar este interativo.)</p>
</div>
```

| `data-tipo` | O que mostra | Atributos |
|---|---|---|
| `lei` | matriz pela lei de formação, diagonais e transposta | `data-m`, `data-n`, `data-lei` (`2i+3j`, `i+j`, `i-j`, `ij`, `i2+j2`, `2ij-1`, `id`, `maior`) |
| `produto` | multiplicação \(A \cdot B\) passo a passo (linha × coluna) | `data-a`, `data-b` |
| `det` | determinante 2×2 ou Sarrus 3×3 passo a passo | `data-matriz`; `data-operacoes` mostra as operações das propriedades |
| `area` | determinante 2×2 como área do paralelogramo (vetores arrastáveis) | `data-matriz` |
| `inversa` | inversa 2×2 pela regra prática, com a conferência \(A \cdot A^{-1} = I\) | `data-matriz` |
| `sistema` | sistema 2×2 como duas retas, com \(D\), \(D_x\), \(D_y\) e a classificação | `data-sistema="a,b,c;d,e,f"` (\(ax + by = c\)), `data-presets="rótulo:a,b,c;d,e,f\|…"`, `data-janela` |
| `escalona` | escalonamento da matriz completa, com histórico e sugestão do próximo passo | `data-matriz` (última coluna = termos independentes) |

As contas são feitas com frações exatas. Exemplos completos nas aulas de `_notas-de-aula/matematica-3/`.

### Nova nota de aula em Markdown

```bash
bin/novo nota calculo-1 "Limites e continuidade"
```

Isso cria `_notas-de-aula/calculo-1/01-limites-e-continuidade.md` já com o modelo.

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

**Nas notas de aula**, fórmula em linha é só `\( ... \)` (o `$` simples fica desligado para que
"R$ 4,00" apareça como texto). Destaque continua com `$$ ... $$` ou `\[ ... \]`.

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
