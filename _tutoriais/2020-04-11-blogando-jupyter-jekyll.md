---
title: "Blogando com os jupyter notebooks e jekyll"
date: 2020-04-11
tags: [jupyter, jekyll]
excerpt: "Como fazer posts usando Jupyter e jekyll"

collection: notas # collection name
entries_layout: # list (default), grid
show_excerpts: # true (default), false
sort_by: # date (default) title
sort_order: # forward (default), reverse
---


Uma das últimas partes antes da minha transição completa para páginas do github foi descobrir como postar cadernos jupyter bem formatados. Na verdade, esse foi o motivo pelo qual eu queria mudar, mas não foi tão simples quanto eu esperava! Acho que encontrei uma maneira aceitável, embora imperfeita, de fazer isso: eis o processo geral em que me estabeleci.

1. Escreva o bloco de notas jupyter na pasta `_jupyter`
2. Quando terminar, `jupyter nbconvert <nb> --to markdown`
3. Mova-o para a pasta `_posts`
4. Mova as imagens para a pasta  `imagens`
5. Adicione `/images/` a todos os caminhos de imagem no arquivo de markdown



<br /> <br /> <br /> <br />




**(em construção...)**

