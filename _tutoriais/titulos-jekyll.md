---
title: "Title Strip Test Post"
excerpt: 'Incluir o título da página a partir do cabeçalho em markdown'
tags: [jekyll, markdown]
toc: true
toc_label: "Sumário"
---

# Títulos de Jekyll a partir do cabeçalho
Como configurar para o título da página e no markdown do corpo do texto não se repitam.

## Instação

1. Adicione o seguinte ao arquivo `Gemfile` do seu site:

        gem 'jekyll-titles-from-headings'

2. Execute a atualização do pacote para instalá-lo:

        bundle update

3. Adicione o seguinte ao arquivo de configuração do seu site (`_config.yml`):

        plugins:
            - jekyll-titles-from-headings

## Configuração
As opções de configuração são opcionais e colocadas em `_config.yml` sob a chave `title_from_headings`. Abaixo a configuração padrão:

        titles_from_headings:
          enabled:     true
          strip_title: false
          collections: false


## Retirando títulos
Se o seu tema renderizar títulos com base em `page.title`, você poderá remover o título do conteúdo configurando `strip_title: true` para impedir a renderização duas vezes.

## Processando coleções
Se você deseja ativar esse plug-in para itens de coleção, defina a opção `collections` como `true`.

Como os itens da coleção (incluindo postagens) já têm um título inferido de seu nome de arquivo, essa opção altera o comportamento deste plug-in para substituir o título inferido. O título inferido é usado apenas como substituto, caso o documento não comece com um título.

## Referências
Consulte a documentação completa no link abaixo:

* [Jekyll Titles from Headings](https://github.com/benbalter/jekyll-titles-from-headings)
