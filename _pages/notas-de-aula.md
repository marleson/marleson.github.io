---
title: "Notas de aula"
permalink: /notas-de-aula/
excerpt: "Notas de aula de matemática organizadas por disciplina."
classes: wide
comments: false
share: false
---

{% assign notas = site["notas-de-aula"] | where_exp: "n", "n.published != false" %}
{% assign grupos = notas | group_by: "disciplina" %}

{% if notas.size == 0 %}
<p class="notice--info">As primeiras notas de aula serão publicadas em breve.</p>
{% else %}

{% comment %} Disciplinas cadastradas em _data/disciplinas.yml, na ordem do arquivo {% endcomment %}
{% assign listadas = "" | split: "" %}
{% for d in site.data.disciplinas %}
  {% assign chave = d[0] %}
  {% assign info = d[1] %}
  {% assign grupo = grupos | where: "name", chave | first %}
  {% if grupo %}
    {% assign listadas = listadas | push: chave %}
<section class="disciplina" id="{{ chave }}">
  <h2>{{ info.nome | default: chave }}</h2>
  {% if info.descricao %}<p class="disciplina__desc">{{ info.descricao }}</p>{% endif %}
  <ol>
  {% assign itens = grupo.items | sort: "ordem" %}
  {% for nota in itens %}
    <li><a href="{{ nota.url | relative_url }}">{{ nota.title }}</a>{% if nota.excerpt and nota.excerpt != "" %} — <small>{{ nota.excerpt | strip_html | truncate: 120 }}</small>{% endif %}</li>
  {% endfor %}
  </ol>
</section>
  {% endif %}
{% endfor %}

{% comment %} Disciplinas usadas nas notas mas não cadastradas no arquivo de dados {% endcomment %}
{% for grupo in grupos %}
  {% unless listadas contains grupo.name %}
<section class="disciplina">
  <h2>{% if grupo.name == "" or grupo.name == nil %}Outras notas{% else %}{{ grupo.name }}{% endif %}</h2>
  <ol>
  {% assign itens = grupo.items | sort: "ordem" %}
  {% for nota in itens %}
    <li><a href="{{ nota.url | relative_url }}">{{ nota.title }}</a></li>
  {% endfor %}
  </ol>
</section>
  {% endunless %}
{% endfor %}

{% endif %}
