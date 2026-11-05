---
title: "TÍTULO DA NOTA"
disciplina: CHAVE-DA-DISCIPLINA   # igual à chave em _data/disciplinas.yml (ex.: calculo-1)
ordem: 1                          # posição da nota dentro da disciplina
date: DATA
excerpt: "Resumo de uma linha que aparece na lista de notas."
tags: []
# Opcionais:
# last_modified_at: AAAA-MM-DD    # mostra "Atualizado em"
# toc: false                      # esconde o sumário lateral
# published: false                # rascunho: não aparece no site
---

<!--
  Guia rápido de escrita (apague este comentário quando quiser)

  • Matemática em linha:   $f(x) = x^2$      ou  \(f(x) = x^2\)
  • Fórmula em destaque:   $$\int_a^b f(x)\dd x = F(b) - F(a)$$
  • Equação numerada com rótulo:

        \begin{equation}\label{eq:tfc}
          \frac{d}{dx}\int_a^x f(t)\dd t = f(x)
        \end{equation}

    e cite com \eqref{eq:tfc}.
  • Atalhos definidos: \R \N \Z \Q \C, \dd (diferencial), \abs{x}, \norm{v}
  • Dica: se uma fórmula em linha tiver "_" ou "*" e o Markdown estragar,
    use $$...$$ na mesma linha do texto (o kramdown trata como fórmula em linha).

  Caixas disponíveis (o markdown="1" é obrigatório):
    teorema, proposicao, lema, corolario, definicao, exemplo,
    exercicio, observacao, demonstracao, solucao
-->

## Introdução

Texto introdutório.

<div class="definicao" markdown="1">
**Definição 1.** Dizemos que $\lim_{x\to a} f(x) = L$ se, para todo $\varepsilon > 0$,
existe $\delta > 0$ tal que $0 < \abs{x - a} < \delta \implies \abs{f(x) - L} < \varepsilon$.
</div>

<div class="teorema" markdown="1">
**Teorema 1.** Enunciado do teorema.
</div>

<div class="demonstracao" markdown="1">
*Demonstração.* Argumento da prova.
</div>

<div class="exemplo" markdown="1">
**Exemplo 1.** Calcule $\displaystyle\lim_{x\to 0}\frac{\sin x}{x}$.
</div>

## Exercícios

<div class="exercicio" markdown="1">
**Exercício 1.** Enunciado.
</div>
