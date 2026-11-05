---
title: "Notas de aula"
permalink: /notas-de-aula/
excerpt: "Notas de aula organizadas por disciplina. Escolha a sua turma para ver as aulas publicadas e o conteúdo planejado."
classes: wide
comments: false
share: false
---

Escolha a disciplina para ver as aulas já publicadas e o conteúdo previsto para o semestre.
Você também pode usar a busca (ícone de lupa no menu) para encontrar um assunto específico.

{% assign notas = site["notas-de-aula"] %}
{% for nv in site.data.disciplinas.niveis %}
{% assign nivel_chave = nv[0] %}
<section class="nivel" id="{{ nivel_chave }}">
  <h2>{{ nv[1].nome }}</h2>
  <div class="disciplina-grid">
  {% for d in site.data.disciplinas %}
    {% if d[1].nivel == nivel_chave %}
      {% assign aulas = notas | where: "disciplina", d[0] %}
    <a class="disciplina-card" href="{{ '/notas-de-aula/' | append: d[0] | append: '/' | relative_url }}">
      <span class="disciplina-card__nome">{{ d[1].nome }}</span>
      {% if d[1].curso %}<span class="disciplina-card__curso">{{ d[1].curso }}</span>{% endif %}
      <span class="disciplina-card__desc">{{ d[1].descricao }}</span>
      <span class="disciplina-card__status{% if aulas.size == 0 %} vazio{% endif %}">
        {% if aulas.size == 0 %}Em breve{% elsif aulas.size == 1 %}1 aula publicada{% else %}{{ aulas.size }} aulas publicadas{% endif %}
      </span>
    </a>
    {% endif %}
  {% endfor %}
  </div>
</section>
{% endfor %}
