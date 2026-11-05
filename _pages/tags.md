---
title: "Conteúdo por tag"
permalink: /tags/
layout: single
classes: wide
author_profile: true
share: false
sitemap: false
---

{% comment %} Reúne as tags de posts, notas de aula, tutoriais e códigos {% endcomment %}
{% assign docs = site.documents | where_exp: "d", "d.tags.size > 0" %}
{% assign todas = "" | split: "" %}
{% for d in docs %}{% for t in d.tags %}{% assign todas = todas | push: t %}{% endfor %}{% endfor %}
{% assign todas = todas | uniq | sort_natural %}

<ul class="taxonomy__index">
{% for t in todas %}
  {% assign n = docs | where_exp: "d", "d.tags contains t" | size %}
  <li><a href="#{{ t | slugify }}"><strong>{{ t }}</strong> <span class="taxonomy__count">{{ n }}</span></a></li>
{% endfor %}
</ul>

{% for t in todas %}
<section id="{{ t | slugify }}" class="taxonomy__section">
  <h2 class="archive__subtitle">{{ t }}</h2>
  <div class="entries-list">
  {% assign itens = docs | where_exp: "d", "d.tags contains t" | sort: "date" | reverse %}
  {% for post in itens %}
    {% include archive-single.html %}
  {% endfor %}
  </div>
  <a href="#page-title" class="back-to-top">{{ site.data.ui-text[site.locale].back_to_top | default: 'Voltar ao topo' }} &uarr;</a>
</section>
{% endfor %}
