---
title: "Como adicionar suporte ao latex no minimal mistakes"

date: 2020-05-07
tags: [minimal mistakes, jekyll, latex, mathjax]
excerpt: "Suporte latex ao tema minimal mistakes"

toc: true
toc_label: "Sumário"
toc_sticky: true

entries_layout: # list (default), grid
show_excerpts: # true (default), false
sort_by: # date (default) title
sort_order: # forward (default), reverse
mathjax: true
render_with_liquid: false
---

# Como adicionar suporte ao latex no minimal mistakes

Uma das minhas dificuldades em postar blogs com textos matemáticos foi encontrar um suporte adequado para textos em [Latex](https://www.latex-project.org/). 

Neste post eu mostro como adicionar o suporte ao latex para o seu blog baseado no tema [Minimal Mistakes Jekyll](https://mmistakes.github.io/minimal-mistakes/).

## Passo 1: Defina o mecanismo de remarcação para kramdown

No seu `_config.yml` certifique-se que o mecanismo de marcação para markdown esteja configurado para kramdown. Caso contrário, coloque a configuração abaixo.
```ruby
# Conversion
markdown: kramdown
```

## Passo 2: Modificar o scripts.html

Os próximos passo podem ser um pouco mais complicado, mas vamos aos poucos. 

Este blog foi configurado a partir da clonagem do tema Minimal Mistakes no repositório do [github](https://github.com/mmistakes/minimal-mistakes) para o meu diretório local. Para conseguir o suporte ao latex, é preciso acessar a pasta local (para onde foi clonado) e acessar o arquivo em `_includes/scripts.html`.

Vamos modificar esse arquivo **adicionando** ao final as seguintes linhas:
```javascript
<script type="text/javascript" async
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-MML-AM_CHTML">
</script>

<script type="text/x-mathjax-config">
MathJax.Hub.Config({
tex2jax: {
inlineMath: [['$','$'], ['\\(','\\)']],
processEscapes: true},
jax: ["input/TeX","input/MathML","input/AsciiMath","output/CommonHTML"],
extensions: ["tex2jax.js","mml2jax.js","asciimath2jax.js","MathMenu.js","MathZoom.js","AssistiveMML.js"],
TeX: {
extensions: ["AMSmath.js","AMSsymbols.js","noErrors.js","noUndefined.js"],
equationNumbers: {
autoNumber: "AMS"
}
}
});
</script>
```
O suporte a texto em latex é adicionado basicamente pelo primeiro script, mas um problema dessa configuração básica é que, todas as fórmulas precisam estar em duplo cifrão ($$) para serem visualizadas. Assim, fórmulas em linhas de texto, com um único cifrão não são renderizadas. Para corrigir esse problema é necessário adicionar o segundo bloco de script. 

Para selecionar qual página ou post terá suporte ao MathJax, você pode inserir o código acima entre as seguinte tags:
	{% raw %}
	{% if page.mathjax %}

	{% endif %}
	{% endraw %}	

Fique atento se surgirem determinados "bugs" na formatação das fórmulas. Eles podem surgir se outra versão do tema em Jekyll for utilizada.

## Passo 3: Ativar o mathjax no post

Agora que o suporte ao mathjax está configurado é preciso ativar esse suporte a cada post que será feito usando latex.

Isso é feito incluindo no cabeçalho da página (front matter) a seguinte linha:
```ruby
mathjax: true
```
## Passo 4: Pronto!

Se você conseguiu realizar todos passos até aqui, você já pode utilizar fórmulas em latex a vontade.

* Fórmulas em destaque:

$$e^{i\pi} = 1$$


* Fórmulas numeradas:
\begin{equation}\label{eq:1}
E = mc^2
\end{equation}
> Talvez este seja o caso mais interessante. Onde é possível adicionar um rótulo na fórmula `\label{eq:einstein}` e citá-la em seguida com o comando `\eqref{eq:einstein}`.  
**Exemplo:** A equação \eqref{eq:1} é a equação de Einstein.

* Fórmulas em linha:  
Esta é relação de Euler: $V-A+F = 2$.





