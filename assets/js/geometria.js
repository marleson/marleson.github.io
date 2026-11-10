/*!
 * Geometria plana: polígonos e áreas — figuras interativas das aulas
 * marleson.github.io · JavaScript puro, sem dependências.
 *
 * A página precisa de `interativos: [geometria]` no front matter.
 * Cada figura é um <div class="mx" data-figura="..."> com os atributos abaixo;
 * o conteúdo do div aparece apenas se o JavaScript estiver desligado.
 *
 *   data-figura="convexo"      Polígono convexo × não convexo, com o segmento AB
 *                              data-inicio="seta" | "hexagono"
 *   data-figura="poligono"     É ou não é polígono? (segmentos, fechado, sem cruzamentos)
 *                              data-inicio="aberta" | "cruzada" | "curva" | "poligono"
 *   data-figura="elementos"    Lados, vértices, diagonais e ângulos de um polígono de n lados
 *                              data-n="7"  data-diagonais="nenhuma|vertice|todas"
 *                              data-mostrar="interno,externo,triangulos,nomes"
 *   data-figura="triangulo"    Área do triângulo
 *                              data-modo="livre|retangulo|equilatero|isosceles|seno|heron"
 *   data-figura="quadrilatero" Área e perímetro
 *                              data-forma="quadrado|retangulo|trapezio|losango"
 *   data-figura="circulo"      Raio, diâmetro, comprimento e área (com os setores)
 *
 *   data-titulo="..."          título exibido no topo (todos)
 *
 * As medidas estão em "unidades" da malha (1 quadradinho = 1 × 1). Os pontos
 * andam de 0,5 em 0,5, então as áreas calculadas pela malha são exatas.
 */
(function () {
  'use strict';

  var PI = Math.PI, PI_ESCOLA = 3.14;

  // ================================================================ DOM
  function el(tag, attrs, pai, texto) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (texto != null) e.textContent = texto;
    if (pai) pai.appendChild(e);
    return e;
  }
  var NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs, pai) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (pai) pai.appendChild(e);
    return e;
  }
  function esvazia(e) { while (e.firstChild) e.removeChild(e.firstChild); }
  function botao(pai, texto, fn) {
    var b = el('button', { type: 'button', class: 'mx-btn' }, pai, texto);
    b.addEventListener('click', fn);
    return b;
  }
  function seletor(pai, rotulo, opcoes, valor, fn) {
    var l = el('label', { class: 'mx-sel' }, pai);
    el('span', null, l, rotulo);
    var s = el('select', null, l);
    opcoes.forEach(function (o) {
      var op = el('option', { value: o[0] }, s, o[1]);
      if (String(o[0]) === String(valor)) op.selected = true;
    });
    s.addEventListener('change', function () { fn(s.value); });
    return s;
  }
  function caixa(pai, texto, marcado, fn) {
    var l = el('label', { class: 'mx-chk' }, pai);
    var c = el('input', { type: 'checkbox' }, l);
    c.checked = !!marcado;
    el('span', null, l, texto);
    c.addEventListener('change', function () { fn(c.checked); });
    return c;
  }
  function moldura(raiz, tituloPadrao) {
    raiz.innerHTML = '';
    raiz.classList.add('mx--ativo', 'geo');
    el('p', { class: 'mx__titulo' }, raiz, raiz.getAttribute('data-titulo') || tituloPadrao);
    var corpo = el('div', { class: 'mx__corpo' }, raiz);
    var info = el('div', { class: 'mx__info', 'aria-live': 'polite' }, raiz);
    return { corpo: corpo, info: info };
  }
  // Painel de informações: uma linha por item; '**texto**' vira negrito
  function escreve(info, linhas) {
    esvazia(info);
    linhas.forEach(function (l) {
      if (!l) return;
      var d = el('div', null, info);
      String(l).split('**').forEach(function (parte, i) {
        if (i % 2) el('strong', null, d, parte); else d.appendChild(document.createTextNode(parte));
      });
    });
  }

  // ================================================================ números
  function fmt(x, casas) {
    if (casas == null) casas = 2;
    var m = Math.pow(10, casas), v = Math.round(x * m) / m;
    if (v === 0) v = 0; // tira o −0
    return String(v).replace('.', ',');
  }
  function grau(rad, casas) { return fmt(rad * 180 / PI, casas == null ? 1 : casas) + '°'; }
  function inteiro(x) { return Math.abs(x - Math.round(x)) < 1e-9; }
  // √q (q ≥ 0): "5", "3√2 ≈ 4,24", ou "≈ 1,8" quando q não é inteiro
  function rq(q) {
    if (q < 1e-12) return '0';
    var r = Math.sqrt(q);
    if (inteiro(r)) return fmt(r);
    if (!inteiro(q)) return '≈ ' + fmt(r);
    var n = Math.round(q), k = 1;
    for (var i = 2; i * i <= n; i++) while (n % (i * i) === 0) { n /= i * i; k *= i; }
    return (k > 1 ? k : '') + '√' + n + ' ≈ ' + fmt(r);
  }
  // "= 5", "= 3√2 ≈ 4,24" ou "≈ 1,8": o sinal certo antes de √q
  function ig(q) { var t = rq(q); return t.charAt(0) === '≈' ? t : '= ' + t; }
  // valor de √q para usar dentro de outra conta: exato se der, senão aproximado
  function raizCurta(q) { var t = rq(q); return t.indexOf('≈') >= 0 ? t.split('≈ ')[1] : t; }

  // ================================================================ geometria
  function d2(p, q) { var dx = p[0] - q[0], dy = p[1] - q[1]; return dx * dx + dy * dy; }
  function dist(p, q) { return Math.sqrt(d2(p, q)); }
  function medio(p, q) { return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; }
  function cruz(o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
  function prodEsc(o, a, b) { return (a[0] - o[0]) * (b[0] - o[0]) + (a[1] - o[1]) * (b[1] - o[1]); }
  function areaSinal(pts) {
    var s = 0;
    for (var i = 0; i < pts.length; i++) { var p = pts[i], q = pts[(i + 1) % pts.length]; s += p[0] * q[1] - q[0] * p[1]; }
    return s / 2;
  }
  function angulo(p) { return Math.atan2(p[1], p[0]); }
  function dir(a, b) { return angulo([b[0] - a[0], b[1] - a[1]]); }
  function unit(a, b) { var d = dist(a, b) || 1; return [(b[0] - a[0]) / d, (b[1] - a[1]) / d]; }
  // ângulo (0 a π) no vértice V entre VP e VQ
  function anguloEm(V, P, Q) {
    var a = Math.abs(dir(V, P) - dir(V, Q));
    return a > PI ? 2 * PI - a : a;
  }
  function projecao(V, A, B) {
    var t = prodEsc(A, V, B) / d2(A, B);
    return { p: [A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])], t: t };
  }
  function dentro(p, pts) {
    var c = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var a = pts[i], b = pts[j];
      if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }
  function sinal(x) { return x > 1e-9 ? 1 : x < -1e-9 ? -1 : 0; }
  function noSeg(p, a, b) {
    return Math.min(a[0], b[0]) - 1e-9 <= p[0] && p[0] <= Math.max(a[0], b[0]) + 1e-9 &&
      Math.min(a[1], b[1]) - 1e-9 <= p[1] && p[1] <= Math.max(a[1], b[1]) + 1e-9;
  }
  // os segmentos pq e rs se tocam?
  function cruzam(p, q, r, s) {
    var d1 = sinal(cruz(p, q, r)), d2_ = sinal(cruz(p, q, s)), d3 = sinal(cruz(r, s, p)), d4 = sinal(cruz(r, s, q));
    if (d1 * d2_ < 0 && d3 * d4 < 0) return true;
    return (d1 === 0 && noSeg(r, p, q)) || (d2_ === 0 && noSeg(s, p, q)) ||
      (d3 === 0 && noSeg(p, r, s)) || (d4 === 0 && noSeg(q, r, s));
  }
  function pontoCruzamento(p, q, r, s) {
    var den = (p[0] - q[0]) * (r[1] - s[1]) - (p[1] - q[1]) * (r[0] - s[0]);
    if (Math.abs(den) < 1e-12) return medio(p, q);
    var t = ((p[0] - r[0]) * (r[1] - s[1]) - (p[1] - r[1]) * (r[0] - s[0])) / den;
    return [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])];
  }
  // cruzamentos entre lados não vizinhos; vazio = figura sem lados se cruzando
  function cruzamentos(pts, fechado) {
    var n = pts.length, m = fechado ? n : n - 1, res = [];
    for (var i = 0; i < m; i++) for (var j = i + 1; j < m; j++) {
      var viz = j === i + 1 || (fechado && i === 0 && j === n - 1);
      var a = pts[i], b = pts[(i + 1) % n], c = pts[j], d = pts[(j + 1) % n];
      if (viz) {
        // vizinhos só podem se tocar no vértice comum (senão um lado "volta" sobre o outro)
        var comum = j === i + 1 ? b : a, outroA = j === i + 1 ? a : b, outroB = j === i + 1 ? d : c;
        if (sinal(cruz(comum, outroA, outroB)) === 0 && prodEsc(comum, outroA, outroB) > 0) res.push(comum);
        continue;
      }
      if (cruzam(a, b, c, d)) res.push(pontoCruzamento(a, b, c, d));
    }
    // vértices repetidos também estragam o polígono
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) if (d2(pts[i], pts[j]) < 1e-12) res.push(pts[i]);
    return res;
  }
  // ângulo interno no vértice i (polígono simples): {a1, a2, med} com a1 → a2 no sentido anti-horário
  function angInterno(pts, i, orient) {
    var n = pts.length, V = pts[i], ant = pts[(i - 1 + n) % n], prox = pts[(i + 1) % n];
    var a1 = orient > 0 ? dir(V, prox) : dir(V, ant), a2 = orient > 0 ? dir(V, ant) : dir(V, prox);
    while (a2 <= a1) a2 += 2 * PI;
    return { a1: a1, a2: a2, med: a2 - a1 };
  }

  // ================================================================ plano com malha
  function Plano(pai, o) {
    var X0 = o.x0, X1 = o.x1, Y0 = o.y0, Y1 = o.y1, W = o.largura || 420;
    var H = Math.round(W * (Y1 - Y0) / (X1 - X0)), esc = W / (X1 - X0);
    var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'mx-svg geo-svg', role: 'img', 'aria-label': o.rotulo || 'Figura' }, pai);
    function px(x) { return (x - X0) * esc; }
    function py(y) { return H - (y - Y0) * esc; }
    if (o.grade !== false) {
      var g = svg('g', { class: 'g-grade' }, s);
      for (var x = Math.ceil(X0); x <= X1; x++) svg('line', { x1: px(x), y1: 0, x2: px(x), y2: H }, g);
      for (var y = Math.ceil(Y0); y <= Y1; y++) svg('line', { x1: 0, y1: py(y), x2: W, y2: py(y) }, g);
    }
    var fig = svg('g', null, s), txt = svg('g', null, s), alc = svg('g', null, s);
    var P = { s: s, px: px, py: py, esc: esc, alc: alc, passo: o.passo || 0.5, X0: X0, X1: X1, Y0: Y0, Y1: Y1 };
    P.pt = function (p) { return px(p[0]).toFixed(2) + ',' + py(p[1]).toFixed(2); };
    P.limpa = function () { esvazia(fig); esvazia(txt); };
    P.linha = function (p, q, cl) { return svg('line', { x1: px(p[0]), y1: py(p[1]), x2: px(q[0]), y2: py(q[1]), class: cl }, fig); };
    P.poli = function (pts, cl, aberto) { return svg(aberto ? 'polyline' : 'polygon', { points: pts.map(P.pt).join(' '), class: cl }, fig); };
    P.caminho = function (pts, cl, fechado) {
      return svg('path', { d: 'M' + pts.map(P.pt).join(' L') + (fechado ? ' Z' : ''), class: cl }, fig);
    };
    P.circ = function (c, r, cl) { return svg('circle', { cx: px(c[0]), cy: py(c[1]), r: r * esc, class: cl }, fig); };
    P.ponto = function (c, cl) { return svg('circle', { cx: px(c[0]), cy: py(c[1]), r: 4.5, class: 'geo-pto ' + (cl || '') }, fig); };
    // pontos de um arco de centro C e raio r, de a1 até a2 (radianos, anti-horário se a2 > a1)
    P.arcoPts = function (C, r, a1, a2) {
      var n = Math.max(8, Math.ceil(Math.abs(a2 - a1) / (PI / 48))), res = [];
      for (var i = 0; i <= n; i++) { var a = a1 + (a2 - a1) * i / n; res.push([C[0] + r * Math.cos(a), C[1] + r * Math.sin(a)]); }
      return res;
    };
    P.setor = function (V, a1, a2, r, cl) { return P.caminho([V].concat(P.arcoPts(V, r, a1, a2)), cl, true); };
    // marca de ângulo reto em V, com os lados nas direções unitárias u e w; t em pixels
    P.reto = function (V, u, w, t) {
      t = (t || 11) / esc;
      var a = [V[0] + u[0] * t, V[1] + u[1] * t], b = [a[0] + w[0] * t, a[1] + w[1] * t], c = [V[0] + w[0] * t, V[1] + w[1] * t];
      return P.caminho([a, b, c], 'geo-reto');
    };
    // texto; dx/dy em pixels
    P.texto = function (p, t, cl, dx, dy, anc) {
      var x = px(p[0]) + (dx || 0), y = py(p[1]) + (dy || 0), mx = anc === 'start' || anc === 'end' ? 6 : 28;
      if (anc !== 'start') x = Math.min(W - mx, x);
      if (anc !== 'end') x = Math.max(mx, x);
      y = Math.max(10, Math.min(H - 10, y));
      var e = svg('text', {
        x: x, y: y, class: 'geo-txt ' + (cl || ''),
        'text-anchor': anc || 'middle', 'dominant-baseline': 'central'
      }, txt);
      e.textContent = t;
      return e;
    };
    // texto afastado de um ponto de referência (por ex. o centro da figura)
    P.textoFora = function (p, ref, t, cl, dist_) {
      var u = unit(ref, p); dist_ = dist_ || 15;
      if (!isFinite(u[0]) || (u[0] === 0 && u[1] === 0)) u = [0, 1];
      return P.texto(p, t, cl, u[0] * dist_, -u[1] * dist_);
    };
    P.mundo = function (ev) {
      var r = s.getBoundingClientRect();
      return [X0 + (ev.clientX - r.left) / r.width * (X1 - X0), Y0 + (1 - (ev.clientY - r.top) / r.height) * (Y1 - Y0)];
    };
    // ponto arrastável. o: {rotulo, classe, pos(), mover(xArred, yArred, x, y), texto(), foco(), depois()}
    P.alca = function (o2) {
      var gg = svg('g', { class: 'g-ponto g-ponto--arrastar ' + (o2.classe || ''), tabindex: 0, role: 'slider', 'aria-label': o2.rotulo }, alc);
      svg('circle', { r: 16, class: 'g-alvo' }, gg);
      svg('circle', { r: 6.5 }, gg);
      var t = svg('text', { dx: 10, dy: -10 }, gg);
      var ativo = false;
      function aplica(x, y) {
        var m = P.passo;
        var xa = Math.max(X0 + m, Math.min(X1 - m, Math.round(x / m) * m));
        var ya = Math.max(Y0 + m, Math.min(Y1 - m, Math.round(y / m) * m));
        o2.mover(xa, ya, x, y);
        o2.depois();
      }
      gg.addEventListener('pointerdown', function (ev) {
        ativo = true; gg.setPointerCapture(ev.pointerId); ev.preventDefault();
        if (o2.foco) { o2.foco(); o2.depois(); }
      });
      gg.addEventListener('pointermove', function (ev) { if (ativo) { var m = P.mundo(ev); aplica(m[0], m[1]); } });
      gg.addEventListener('pointerup', function () { ativo = false; });
      gg.addEventListener('pointercancel', function () { ativo = false; });
      gg.addEventListener('focus', function () { if (o2.foco) { o2.foco(); o2.depois(); } });
      gg.addEventListener('keydown', function (ev) {
        var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[ev.key];
        if (!d) return;
        ev.preventDefault();
        var p = o2.pos();
        aplica(p[0] + d[0] * P.passo, p[1] + d[1] * P.passo);
      });
      return {
        g: gg,
        posiciona: function () {
          var p = o2.pos();
          gg.setAttribute('transform', 'translate(' + px(p[0]).toFixed(2) + ',' + py(p[1]).toFixed(2) + ')');
          t.textContent = o2.texto ? o2.texto() : '';
          gg.setAttribute('aria-valuetext', o2.rotulo + ' em (' + fmt(p[0]) + '; ' + fmt(p[1]) + ')');
        },
        marca: function (cl, liga) { gg.classList.toggle(cl, !!liga); }
      };
    };
    return P;
  }

  function painel(f) {
    var grade = el('div', { class: 'mx__duas' }, f.corpo);
    var area = el('div', null, grade);
    var lado = el('div', { class: 'mx__lado' }, grade);
    return { area: area, lado: lado };
  }
  function dica(pai, txt) { el('p', { class: 'mx__dica' }, pai, txt); }
  function copia(pts) { return pts.map(function (p) { return p.slice(); }); }

  // ================================================================ 1. convexo × não convexo
  function Convexo(raiz) {
    var PRE = {
      seta: { nome: 'Polígono com reentrâncias', pts: [[0, 0], [5, 0], [2.5, 2.5], [5, 5], [0, 5], [2, 2.5]], A: [3.5, 4], B: [3.5, 1] },
      hexagono: { nome: 'Hexágono', pts: [[1, 1], [3, 0], [5, 1], [5, 4], [3, 5], [1, 4]], A: [1.5, 2.5], B: [4.5, 2.5] }
    };
    var chave = PRE[raiz.getAttribute('data-inicio')] ? raiz.getAttribute('data-inicio') : 'seta';
    var f = moldura(raiz, 'Convexo ou não convexo?');
    var pn = painel(f);
    var P = Plano(pn.area, { x0: -1, x1: 7, y0: -1, y1: 6, rotulo: 'Polígono com os pontos A e B e o segmento AB' });
    seletor(pn.lado, 'Figura', [['seta', PRE.seta.nome], ['hexagono', PRE.hexagono.nome]], chave, function (v) { chave = v; carrega(); desenha(); });
    botao(pn.lado, '↺ Recomeçar', function () { carrega(); desenha(); });
    dica(pn.lado, 'Arraste os vértices (azuis) para deformar o polígono e os pontos A e B (verdes) para testar segmentos. Também dá para usar as setas do teclado.');
    var pts, A, B;
    function carrega() { pts = copia(PRE[chave].pts); A = PRE[chave].A.slice(); B = PRE[chave].B.slice(); }
    carrega();
    var hv = pts.map(function (_, i) {
      return P.alca({ rotulo: 'Vértice ' + (i + 1), pos: function () { return pts[i]; }, mover: function (x, y) { pts[i] = [x, y]; }, depois: desenha });
    });
    function alcaAB(nome, get, set) {
      return P.alca({ rotulo: 'Ponto ' + nome, classe: 'geo-h--ab', pos: get, mover: function (x, y) { set([x, y]); }, texto: function () { return nome; }, depois: desenha });
    }
    var hA = alcaAB('A', function () { return A; }, function (p) { A = p; });
    var hB = alcaAB('B', function () { return B; }, function (p) { B = p; });

    function desenha() {
      P.limpa();
      var cr = cruzamentos(pts, true), simples = cr.length === 0;
      var orient = sinal(areaSinal(pts)), reflexos = [];
      if (simples) pts.forEach(function (_, i) { var a = angInterno(pts, i, orient); if (a.med > PI + 1e-9) reflexos.push([i, a]); });
      P.poli(pts, 'geo-fig' + (simples ? '' : ' geo-fig--ruim'));
      reflexos.forEach(function (r) { P.setor(pts[r[0]], r[1].a1, r[1].a2, 0.4, 'geo-ang geo-ang--reflexo'); });
      cr.forEach(function (c) { P.ponto(c, 'geo-pto--erro'); });
      // segmento AB: trechos dentro (verde) e fora (vermelho)
      var N = 160, partes = [], atual = null;
      for (var k = 0; k <= N; k++) {
        var t = k / N, p = [A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])], d = dentro(p, pts);
        if (!atual || atual.dentro !== d) { if (atual) { atual.b = p; partes.push(atual); } atual = { dentro: d, a: p, b: p }; }
        else atual.b = p;
      }
      partes.push(atual);
      partes.forEach(function (pa) { P.linha(pa.a, pa.b, 'geo-seg' + (pa.dentro ? '' : ' geo-seg--fora')); });
      hv.forEach(function (h) { h.posiciona(); });
      hA.posiciona(); hB.posiciona();

      var sai = partes.some(function (pa) { return !pa.dentro; });
      var dA = dentro(A, pts), dB = dentro(B, pts), linhas = [];
      if (!simples) {
        linhas.push('Os lados se cruzaram (pontos vermelhos): essa figura nem é mais um polígono. Arraste os vértices de volta.');
      } else {
        linhas.push(reflexos.length
          ? 'Polígono **não convexo**: o ângulo interno marcado em vermelho mede ' + grau(reflexos[0][1].med) + ', mais de 180°.'
          : 'Polígono **convexo**: todos os ângulos internos medem menos de 180°.');
        if (!dA || !dB) linhas.push('Coloque A e B no interior do polígono para fazer o teste.');
        else if (sai) linhas.push('O segmento AB **sai do polígono** (trecho vermelho). Basta um segmento assim para o polígono ser não convexo.');
        else linhas.push('O segmento AB ficou inteiro dentro do polígono.' + (reflexos.length ? ' Mas há outras posições de A e B em que ele sai: procure uma!' : ' Num polígono convexo isso acontece para quaisquer A e B no interior.'));
      }
      escreve(f.info, linhas);
    }
    desenha();
  }

  // ================================================================ 2. é ou não é polígono?
  function EhPoligono(raiz) {
    var PRE = {
      aberta: { nome: 'Linha aberta', pts: [[0.5, 4.5], [1.5, 1], [5.5, 1], [6.5, 4.5]], fechado: false, curvo: false },
      cruzada: { nome: 'Lados que se cruzam', pts: [[1, 1], [5, 5], [5, 1], [1, 5]], fechado: true, curvo: false },
      curva: { nome: 'Com um lado curvo', pts: [[1.5, 1], [5.5, 1], [5.5, 3], [1.5, 3]], fechado: true, curvo: true },
      poligono: { nome: 'Pentágono', pts: [[1, 1], [5, 1], [6, 3.5], [3.5, 5], [0.5, 3.5]], fechado: true, curvo: false }
    };
    var chave = PRE[raiz.getAttribute('data-inicio')] ? raiz.getAttribute('data-inicio') : 'aberta';
    var f = moldura(raiz, 'É ou não é polígono?');
    var pn = painel(f);
    var P = Plano(pn.area, { x0: -0.5, x1: 7.5, y0: -0.5, y1: 6.5, rotulo: 'Figura formada por segmentos (ou não)' });
    seletor(pn.lado, 'Figura', Object.keys(PRE).map(function (k) { return [k, PRE[k].nome]; }), chave, function (v) { chave = v; carrega(); });
    var cF = caixa(pn.lado, 'Fechar a figura', false, function (v) { fechado = v; desenha(); });
    var cC = caixa(pn.lado, 'Um dos lados é curvo', false, function (v) { curvo = v; desenha(); });
    var lista = el('ul', { class: 'geo-lista' }, pn.lado);
    dica(pn.lado, 'Arraste os vértices e ligue ou desligue as opções para ver quando a figura passa a ser (ou deixa de ser) um polígono.');
    var pts, fechado, curvo, hv = [];
    function carrega() {
      var pr = PRE[chave];
      pts = copia(pr.pts); fechado = pr.fechado; curvo = pr.curvo;
      cF.checked = fechado; cC.checked = curvo;
      esvazia(P.alc);
      hv = pts.map(function (_, i) {
        return P.alca({ rotulo: 'Vértice ' + (i + 1), pos: function () { return pts[i]; }, mover: function (x, y) { pts[i] = [x, y]; }, depois: desenha });
      });
      desenha();
    }
    function desenha() {
      P.limpa();
      var n = pts.length;
      // o lado curvo é o último lado (do penúltimo ao último vértice), trocado por uma semicircunferência
      var contorno = [], k;
      for (k = 0; k < n; k++) {
        contorno.push(pts[k]);
        if (curvo && k === n - 2) {
          var p = pts[n - 2], q = pts[n - 1], m = medio(p, q), r = dist(p, q) / 2, a = dir(m, p);
          var cent = [0, 0];
          pts.forEach(function (v) { cent[0] += v[0] / n; cent[1] += v[1] / n; });
          // bojo para fora: o arco anti-horário a partir de p fica à direita do vetor pq,
          // então ele é usado quando o centro da figura está à esquerda
          var sent = cruz(p, q, cent) > 0 ? 1 : -1;
          contorno = contorno.concat(P.arcoPts(m, r, a, a + sent * PI).slice(1, -1));
        }
      }
      var cr = cruzamentos(pts, fechado);
      var ok = { seg: !curvo, fech: fechado, cruz: cr.length === 0 };
      var eh = ok.seg && ok.fech && ok.cruz;
      P.caminho(contorno, 'geo-fig' + (eh ? '' : ' geo-fig--ruim') + (fechado ? '' : ' geo-fig--aberta'), fechado);
      cr.forEach(function (c) { P.ponto(c, 'geo-pto--erro'); });
      hv.forEach(function (h) { h.posiciona(); });

      esvazia(lista);
      [[ok.seg, 'Formada apenas por segmentos de reta'], [ok.fech, 'É fechada'], [ok.cruz, 'Os lados não se cruzam']].forEach(function (it) {
        el('li', { class: it[0] ? 'geo-ok' : 'geo-nao' }, lista, it[1]);
      });
      var linhas = [];
      if (eh) linhas.push('**É um polígono** de ' + n + ' lados e ' + n + ' vértices.');
      else {
        var mot = [];
        if (!ok.seg) mot.push('tem um lado curvo');
        if (!ok.fech) mot.push('não é fechada');
        if (!ok.cruz) mot.push('tem lados que se cruzam (pontos vermelhos)');
        linhas.push('**Não é um polígono**: a figura ' + mot.join(', ') + '.');
      }
      escreve(f.info, linhas);
    }
    carrega();
  }

  // ================================================================ 3. elementos de um polígono
  var NOMES = { 3: 'triângulo', 4: 'quadrilátero', 5: 'pentágono', 6: 'hexágono', 7: 'heptágono', 8: 'octógono', 9: 'eneágono', 10: 'decágono', 11: 'undecágono', 12: 'dodecágono' };
  function Elementos(raiz) {
    var n = Math.max(3, Math.min(12, +raiz.getAttribute('data-n') || 7));
    var diag = raiz.getAttribute('data-diagonais') || 'vertice';
    var m = (raiz.hasAttribute('data-mostrar') ? raiz.getAttribute('data-mostrar') : 'interno,externo,nomes').split(',');
    var mostra = { interno: m.indexOf('interno') >= 0, externo: m.indexOf('externo') >= 0, triangulos: m.indexOf('triangulos') >= 0, nomes: m.indexOf('nomes') >= 0 };
    var R = 3, sel = 0, regular = true, pts, hv = [];
    var f = moldura(raiz, 'Os elementos de um polígono');
    var pn = painel(f);
    var P = Plano(pn.area, { x0: -4.2, x1: 4.2, y0: -4, y1: 4.2, rotulo: 'Polígono com lados, vértices, diagonais e ângulos', passo: 0.25 });
    var opN = []; for (var k = 3; k <= 12; k++) opN.push([k, k + ' lados (' + NOMES[k] + ')']);
    seletor(pn.lado, 'Número de lados (n)', opN, n, function (v) { n = +v; sel = 0; monta(); });
    seletor(pn.lado, 'Diagonais', [['nenhuma', 'nenhuma'], ['vertice', 'só as do vértice destacado'], ['todas', 'todas']], diag, function (v) { diag = v; desenha(); });
    var tg = el('div', { class: 'mx__toggles' }, pn.lado);
    caixa(tg, 'Ângulo interno', mostra.interno, function (v) { mostra.interno = v; desenha(); });
    caixa(tg, 'Ângulo externo', mostra.externo, function (v) { mostra.externo = v; desenha(); });
    caixa(tg, 'Triângulos a partir do vértice', mostra.triangulos, function (v) { mostra.triangulos = v; desenha(); });
    caixa(tg, 'Nomes dos elementos', mostra.nomes, function (v) { mostra.nomes = v; desenha(); });
    botao(pn.lado, '↺ Polígono regular', function () { monta(); });
    dica(pn.lado, 'Clique em um vértice para destacá-lo (laranja). Arraste os vértices para deformar o polígono: a soma dos ângulos internos não muda!');

    function monta() {
      regular = true;
      pts = [];
      for (var i = 0; i < n; i++) { var a = PI / 2 + i * 2 * PI / n; pts.push([R * Math.cos(a), R * Math.sin(a)]); }
      esvazia(P.alc);
      hv = pts.map(function (_, i) {
        return P.alca({
          rotulo: 'Vértice ' + (i + 1), pos: function () { return pts[i]; },
          mover: function (x, y) { pts[i] = [x, y]; regular = false; sel = i; },
          foco: function () { sel = i; }, depois: desenha
        });
      });
      desenha();
    }
    function desenha() {
      P.limpa();
      var cr = cruzamentos(pts, true), simples = cr.length === 0, orient = sinal(areaSinal(pts)) || 1;
      var V = pts[sel], ant = pts[(sel - 1 + n) % n], prox = pts[(sel + 1) % n];
      var cent = [0, 0]; pts.forEach(function (p) { cent[0] += p[0] / n; cent[1] += p[1] / n; });
      var i, j;
      if (mostra.triangulos && simples) for (i = 1; i < n - 1; i++) P.poli([V, pts[(sel + i) % n], pts[(sel + i + 1) % n]], 'geo-tri geo-tri--' + (i % 2));
      P.poli(pts, 'geo-fig' + (mostra.triangulos ? ' geo-fig--sem' : '') + (simples ? '' : ' geo-fig--ruim'));
      if (diag !== 'nenhuma') for (i = 0; i < n; i++) for (j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        var doSel = i === sel || j === sel;
        if (diag === 'vertice' && !doSel) continue;
        P.linha(pts[i], pts[j], 'geo-diag' + (diag === 'todas' && !doSel ? ' geo-diag--fraca' : ''));
      }
      var ai = simples ? angInterno(pts, sel, orient) : null;
      if (mostra.interno && ai) {
        P.setor(V, ai.a1, ai.a2, 0.6, 'geo-ang');
        var bis = (ai.a1 + ai.a2) / 2;
        P.texto([V[0] + 1.05 * Math.cos(bis), V[1] + 1.05 * Math.sin(bis)], grau(ai.med), 'geo-txt--ang');
      }
      var ext = null;
      if (mostra.externo && ai && ai.med < PI - 1e-9) {
        // prolongamento do lado (anterior → V) além de V
        var u = unit(ant, V), fim = [V[0] + 1.6 * u[0], V[1] + 1.6 * u[1]];
        P.linha(V, fim, 'geo-aux');
        var e1 = angulo(u), e2 = dir(V, prox);
        if (orient < 0) { var tmp = e1; e1 = e2; e2 = tmp; }
        while (e2 <= e1) e2 += 2 * PI;
        ext = e2 - e1;
        P.setor(V, e1, e2, 0.85, 'geo-ang geo-ang--ext');
        var be = (e1 + e2) / 2;
        P.texto([V[0] + 1.3 * Math.cos(be), V[1] + 1.3 * Math.sin(be)], grau(ext), 'geo-txt--ext');
      }
      if (mostra.nomes) {
        var kl = (sel + Math.floor(n / 2)) % n, ml = medio(pts[kl], pts[(kl + 1) % n]);
        P.textoFora(ml, cent, 'lado', 'geo-txt--nome', 16);
        P.textoFora(V, cent, 'vértice', 'geo-txt--nome geo-txt--sel', 36);
        if (n > 3 && diag !== 'nenhuma') P.texto(medio(V, pts[(sel + 2) % n]), 'diagonal', 'geo-txt--diag');
      }
      cr.forEach(function (c) { P.ponto(c, 'geo-pto--erro'); });
      hv.forEach(function (h, i2) { h.posiciona(); h.marca('geo-sel', i2 === sel); });

      var S = (n - 2) * 180, d = n * (n - 3) / 2, linhas = [];
      linhas.push('**' + NOMES[n] + '** (n = ' + n + '): ' + n + ' lados, ' + n + ' vértices, ' + n + ' ângulos internos e ' + n + ' externos.');
      if (!simples) {
        linhas.push('Os lados se cruzaram (pontos vermelhos): a figura deixou de ser um polígono. Clique em “Polígono regular” para recomeçar.');
        escreve(f.info, linhas); return;
      }
      var soma = 0, convexo = true;
      for (i = 0; i < n; i++) { var a = angInterno(pts, i, orient).med; soma += a; if (a > PI + 1e-9) convexo = false; }
      linhas.push('Soma dos ângulos internos: S = (n − 2)·180° = ' + (n - 2) + '·180° = **' + S + '°**' + (regular ? '' : ' (medindo na figura: ' + grau(soma) + ')'));
      linhas.push(regular
        ? 'Polígono regular: cada ângulo interno mede ' + S + '° ÷ ' + n + ' = ' + fmt(S / n, 2) + '° e cada externo, 360° ÷ ' + n + ' = ' + fmt(360 / n, 2) + '°.'
        : 'Ângulo interno no vértice destacado: ' + grau(ai.med) + (ext != null ? '; ângulo externo: ' + grau(ext) + ' (interno + externo = 180°)' : '') + '.');
      linhas.push('Diagonais: d = n(n − 3)/2 = ' + n + '·' + (n - 3) + '/2 = **' + d + '**. De cada vértice saem n − 3 = ' + (n - 3) + '.');
      if (mostra.triangulos) linhas.push('As diagonais de um vértice dividem o polígono em n − 2 = ' + (n - 2) + ' triângulos: por isso S = (n − 2)·180°.');
      linhas.push(convexo ? 'Soma dos ângulos externos: **360°**, qualquer que seja n.' : 'O polígono ficou **não convexo**: S = (n − 2)·180° continua valendo, mas a soma 360° dos externos é só para polígonos convexos.');
      escreve(f.info, linhas);
    }
    monta();
  }

  // ================================================================ 4. triângulos
  function Triangulo(raiz) {
    var modo = raiz.getAttribute('data-modo') || 'livre';
    var TIT = {
      livre: 'Área do triângulo: base × altura ÷ 2', retangulo: 'Área do triângulo retângulo', equilatero: 'Área do triângulo equilátero',
      isosceles: 'Área do triângulo isósceles', seno: 'Área com dois lados e o ângulo entre eles', heron: 'Fórmula de Heron'
    };
    var f = moldura(raiz, TIT[modo] || TIT.livre);
    var pn = painel(f);
    var JAN = { equilatero: [-1, 8, -0.8, 6.8] }, j = JAN[modo] || [-1, 9, -1, 6.5];
    var P = Plano(pn.area, { x0: j[0], x1: j[1], y0: j[2], y1: j[3], rotulo: 'Triângulo na malha quadriculada' });
    var A, B, C, base = 'AB', op = { angulos: true, altura: true, extra: false }, hs = [];
    var INI = {
      livre: [[1, 1], [7, 1], [3, 5]], heron: [[1, 1], [5, 1], [5, 4]], seno: [[6, 0], [2, 4], [0, 0]],
      retangulo: [[0, 0], [0, 4], [3, 0]], isosceles: [[1, 1], [7, 1], [4, 5]], equilatero: [[0, 0], [5, 0], null]
    };
    function carrega() {
      var ini = INI[modo] || INI.livre;
      A = ini[0].slice(); B = ini[1].slice(); C = ini[2] ? ini[2].slice() : null;
      if (modo === 'equilatero') C = [B[0] / 2, B[0] * Math.sqrt(3) / 2];
    }
    carrega();

    // controles por modo
    if (modo === 'livre') {
      seletor(pn.lado, 'Base', [['AB', 'lado AB'], ['BC', 'lado BC'], ['CA', 'lado CA']], base, function (v) { base = v; desenha(); });
      caixa(pn.lado, 'Mostrar os ângulos', op.angulos, function (v) { op.angulos = v; desenha(); });
    }
    if (modo === 'retangulo') caixa(pn.lado, 'Altura relativa à hipotenusa', false, function (v) { op.extra = v; desenha(); });
    if (modo === 'equilatero') {
      op.extra = true;
      caixa(pn.lado, 'Destacar metade do triângulo (Pitágoras)', true, function (v) { op.extra = v; desenha(); });
    }
    if (modo === 'seno') caixa(pn.lado, 'Mostrar a altura', true, function (v) { op.altura = v; desenha(); });
    if (modo === 'heron') {
      var bh = el('div', { class: 'mx__btns' }, pn.lado);
      [['3, 4 e 5', [[1, 1], [5, 1], [5, 4]]], ['5, 5 e 6', [[1, 1], [7, 1], [4, 5]]], ['4, 5 e √17', [[1, 1], [5, 1], [2, 5]]]].forEach(function (pr) {
        botao(bh, 'Lados ' + pr[0], function () { A = pr[1][0].slice(); B = pr[1][1].slice(); C = pr[1][2].slice(); desenha(); });
      });
    }
    botao(pn.lado, '↺ Recomeçar', function () { carrega(); desenha(); });
    var DICAS = {
      livre: 'Arraste os vértices. A altura é o segmento que sai do vértice oposto e encontra a reta da base formando 90° (às vezes fora do triângulo).',
      retangulo: 'Arraste B (para cima e para baixo) e C (para os lados). O ângulo em A continua reto.',
      equilatero: 'Arraste B para mudar o lado L. O vértice C acompanha, mantendo os três lados iguais.',
      isosceles: 'Arraste B para mudar a base e C para mudar a altura. C fica sempre sobre a mediatriz da base, então AC = BC.',
      seno: 'Arraste A (muda o lado b) e B (muda o lado c e o ângulo α).',
      heron: 'Arraste os vértices ou escolha um dos triângulos prontos. A fórmula de Heron usa só as medidas dos lados.'
    };
    dica(pn.lado, DICAS[modo] || DICAS.livre);

    function alca(nome, get, set, cl) {
      return P.alca({ rotulo: 'Vértice ' + nome, classe: cl, pos: get, mover: set, texto: function () { return ''; }, depois: desenha });
    }
    var X = function (v) { return function () { return v === 'A' ? A : v === 'B' ? B : C; }; };
    if (modo === 'livre' || modo === 'heron') {
      hs.push(alca('A', X('A'), function (x, y) { A = [x, y]; }));
      hs.push(alca('B', X('B'), function (x, y) { B = [x, y]; }));
      hs.push(alca('C', X('C'), function (x, y) { C = [x, y]; }));
    } else if (modo === 'retangulo') {
      hs.push(alca('B', X('B'), function (x, y) { B = [0, Math.max(0.5, y)]; }));
      hs.push(alca('C', X('C'), function (x) { C = [Math.max(0.5, x), 0]; }));
    } else if (modo === 'equilatero') {
      hs.push(alca('B', X('B'), function (x) { var L = Math.max(1, Math.min(7, x)); B = [L, 0]; C = [L / 2, L * Math.sqrt(3) / 2]; }));
    } else if (modo === 'isosceles') {
      hs.push(alca('B', X('B'), function (x) { var b = Math.max(1, Math.min(8, Math.round((x - 1)))); B = [1 + b, 1]; C = [1 + b / 2, C[1]]; }));
      hs.push(alca('C', X('C'), function (x, y) { C = [(A[0] + B[0]) / 2, Math.max(1.5, y)]; }));
    } else if (modo === 'seno') {
      hs.push(alca('A', X('A'), function (x) { A = [Math.max(1, x), 0]; }));
      hs.push(alca('B', X('B'), function (x, y) { B = [x, Math.max(0.5, y)]; }));
    }

    // desenho comum: triângulo, nomes dos vértices, medidas dos lados
    function nomes(rot) {
      var G = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
      [[A, 'A'], [B, 'B'], [C, 'C']].forEach(function (v) { P.textoFora(v[0], G, v[1], 'geo-txt--vert', 17); });
      return G;
    }
    function rotLado(p, q, G, txt, cl) { P.textoFora(medio(p, q), G, txt, cl || 'geo-txt--lado', 15); }
    function marcaAng(V, p, q, txt, cl) {
      var a1 = dir(V, p), a2 = dir(V, q), med = anguloEm(V, p, q);
      // abre de a1 para a2 pelo lado menor
      var x = a2 - a1; while (x <= -PI) x += 2 * PI; while (x > PI) x -= 2 * PI;
      if (Math.abs(med - PI / 2) < 1e-6) { P.reto(V, unit(V, p), unit(V, q)); return; }
      var r = 0.55;
      P.setor(V, a1, a1 + x, r, 'geo-ang ' + (cl || ''));
      if (txt) { var b = a1 + x / 2; P.texto([V[0] + (r + 0.45) * Math.cos(b), V[1] + (r + 0.45) * Math.sin(b)], txt, 'geo-txt--ang'); }
    }
    // altura do vértice V até a reta pq; desenha e devolve {h, pe, fora}
    function altura(V, p, q) {
      var pr = projecao(V, p, q), pe = pr.p, fora = pr.t < -1e-9 || pr.t > 1 + 1e-9;
      if (fora) P.linha(pr.t < 0 ? p : q, pe, 'geo-aux');
      P.linha(V, pe, 'geo-altura');
      if (dist(V, pe) > 1e-9) P.reto(pe, unit(pe, pr.t < 0.5 ? q : p), unit(pe, V));
      return { h: dist(V, pe), pe: pe, fora: fora };
    }
    function areaMalha() { return Math.abs(areaSinal([A, B, C])); }
    function classifica() {
      var a2 = d2(B, C), b2 = d2(C, A), c2 = d2(A, B), eps = 1e-6;
      var iguais = (Math.abs(a2 - b2) < eps) + (Math.abs(b2 - c2) < eps) + (Math.abs(c2 - a2) < eps);
      var lados = iguais === 3 ? 'equilátero' : iguais === 1 ? 'isósceles' : 'escaleno';
      var m = Math.min(prodEsc(A, B, C), prodEsc(B, C, A), prodEsc(C, A, B));
      var angs = Math.abs(m) < eps ? 'retângulo' : m < 0 ? 'obtusângulo' : 'acutângulo';
      return 'Classificação: **' + lados + '** (pelos lados) e **' + angs + '** (pelos ângulos).';
    }

    function desenha() {
      P.limpa();
      var linhas = [];
      if (Math.abs(areaSinal([A, B, C])) < 1e-9) {
        P.poli([A, B, C], 'geo-fig geo-fig--ruim');
        nomes();
        hs.forEach(function (h) { h.posiciona(); });
        escreve(f.info, ['Os três vértices estão alinhados: não existe triângulo. Mova um deles.']);
        return;
      }
      var G, a2 = d2(B, C), b2 = d2(C, A), c2 = d2(A, B), S = areaMalha();
      if (modo === 'livre') {
        var lad = { AB: [A, B, C, 'AB', 'C'], BC: [B, C, A, 'BC', 'A'], CA: [C, A, B, 'CA', 'B'] }[base];
        P.poli([A, B, C], 'geo-fig');
        P.linha(lad[0], lad[1], 'geo-base');
        var al = altura(lad[2], lad[0], lad[1]);
        G = nomes();
        if (op.angulos) { marcaAng(A, B, C, grau(anguloEm(A, B, C), 0)); marcaAng(B, C, A, grau(anguloEm(B, C, A), 0)); marcaAng(C, A, B, grau(anguloEm(C, A, B), 0)); }
        P.texto(medio(lad[2], al.pe), 'h', 'geo-txt--alt', -10, 0);
        var bl = dist(lad[0], lad[1]);
        linhas.push('Base ' + lad[3] + ' ' + ig(d2(lad[0], lad[1])) + ' · altura h ' + ig(al.h * al.h) + (al.fora ? ' (o pé da altura caiu fora da base: prolongamos a base, tracejado)' : ''));
        linhas.push('Área = base · h ÷ 2 = ' + fmt(bl) + ' · ' + fmt(al.h) + ' ÷ 2 = **' + fmt(S, 3) + '**');
        linhas.push('Troque a base: a altura muda, mas a área continua ' + fmt(S, 3) + '.');
        linhas.push(classifica());
      } else if (modo === 'retangulo') {
        P.poli([A, B, C], 'geo-fig');
        G = nomes();
        P.reto(A, [1, 0], [0, 1]);
        var b = C[0], c = B[1], hip2 = b * b + c * c;
        rotLado(A, C, G, 'b = ' + fmt(b)); rotLado(A, B, G, 'c = ' + fmt(c)); rotLado(B, C, G, 'a = ' + raizCurta(hip2));
        linhas.push('Catetos b = ' + fmt(b) + ' e c = ' + fmt(c) + '. Um cateto é a base e o outro, a altura.');
        linhas.push('Área = b · c ÷ 2 = ' + fmt(b) + ' · ' + fmt(c) + ' ÷ 2 = **' + fmt(b * c / 2, 3) + '**');
        linhas.push('Hipotenusa (Pitágoras): a² = b² + c² = ' + fmt(b * b) + ' + ' + fmt(c * c) + ' = ' + fmt(hip2) + ' ⇒ a ' + ig(hip2));
        if (op.extra) {
          var alh = altura(A, B, C);
          P.texto(medio(A, alh.pe), 'h', 'geo-txt--alt', 10, 0);
          linhas.push('Altura relativa à hipotenusa: h = b · c ÷ a ≈ ' + fmt(alh.h) + '. Conferindo: a · h ÷ 2 ≈ ' + fmt(Math.sqrt(hip2)) + ' · ' + fmt(alh.h) + ' ÷ 2 = ' + fmt(Math.sqrt(hip2) * alh.h / 2) + ', a mesma área.');
        }
      } else if (modo === 'equilatero') {
        var L = B[0], M = [L / 2, 0];
        if (op.extra) P.poli([M, B, C], 'geo-meia');
        P.poli([A, B, C], 'geo-fig' + (op.extra ? ' geo-fig--sem' : ''));
        P.linha(C, M, 'geo-altura geo-altura--trac');
        P.reto(M, [1, 0], [0, 1]);
        G = nomes();
        rotLado(A, C, G, 'L'); rotLado(B, C, G, 'L');
        P.texto([L / 2, 0], 'L = ' + fmt(L), 'geo-txt--lado', 0, 16);
        P.texto(medio(C, M), 'h', 'geo-txt--alt', -11, 0);
        if (op.extra) P.texto([3 * L / 4, 0], 'L/2', 'geo-txt--lado', 0, -11);
        var coefA = L * L / 4, coefH = L / 2;
        linhas.push('Lado L = ' + fmt(L) + '. A altura divide o triângulo em dois triângulos retângulos de lados L, h e L/2.');
        linhas.push('Pitágoras: L² = h² + (L/2)² ⇒ h = L√3/2 = ' + (coefH === 1 ? '' : fmt(coefH)) + '√3 ≈ ' + fmt(coefH * Math.sqrt(3)));
        linhas.push('Área = L²√3/4 = ' + fmt(L * L) + '√3/4 = ' + (coefA === 1 ? '' : fmt(coefA, 4)) + '√3 ≈ **' + fmt(coefA * Math.sqrt(3)) + '**');
      } else if (modo === 'isosceles') {
        var Mb = medio(A, B), bas = B[0] - A[0], h = C[1] - A[1], l2 = (bas / 2) * (bas / 2) + h * h;
        P.poli([A, B, C], 'geo-fig');
        P.linha(C, Mb, 'geo-altura');
        P.reto(Mb, [1, 0], [0, 1]);
        G = nomes();
        rotLado(A, C, G, raizCurta(l2)); rotLado(B, C, G, raizCurta(l2));
        P.texto(Mb, 'base = ' + fmt(bas), 'geo-txt--lado', 0, 16);
        P.texto(medio(C, Mb), 'h = ' + fmt(h), 'geo-txt--alt', 26, 0);
        marcaAng(A, B, C, grau(anguloEm(A, B, C))); marcaAng(B, A, C, grau(anguloEm(B, A, C)));
        linhas.push('AC = BC ' + ig(l2) + ' (os dois lados iguais) e os ângulos da base também são iguais.');
        linhas.push('A altura cai no ponto médio da base. Pitágoras: lado² = (base/2)² + h² = ' + fmt(bas * bas / 4) + ' + ' + fmt(h * h) + ' = ' + fmt(l2));
        linhas.push('Área = base · h ÷ 2 = ' + fmt(bas) + ' · ' + fmt(h) + ' ÷ 2 = **' + fmt(bas * h / 2, 3) + '**');
      } else if (modo === 'seno') {
        // C na origem, A no eixo x: b = CA, c = AB, α = ângulo em A
        P.poli([A, B, C], 'geo-fig');
        var hh = null;
        if (op.altura) hh = altura(B, C, A);
        G = nomes();
        var alfa = anguloEm(A, C, B), bb = A[0], cc2 = d2(A, B);
        marcaAng(A, C, B, 'α');
        rotLado(C, A, G, 'b = ' + fmt(bb)); rotLado(A, B, G, 'c = ' + raizCurta(cc2)); rotLado(C, B, G, 'a', 'geo-txt--fraco');
        if (hh) P.texto(medio(B, hh.pe), 'h', 'geo-txt--alt', -10, 0);
        var Sseno = bb * Math.sqrt(cc2) * Math.sin(alfa) / 2;
        linhas.push('b = ' + fmt(bb) + ', c ' + ig(cc2) + ' e α ≈ ' + grau(alfa) + ' (sen α ≈ ' + fmt(Math.sin(alfa), 3) + ')');
        linhas.push('S = ½ · b · c · sen α ≈ ½ · ' + fmt(bb) + ' · ' + fmt(Math.sqrt(cc2)) + ' · ' + fmt(Math.sin(alfa), 3) + ' ≈ **' + fmt(Sseno) + '**');
        linhas.push('Conferindo com base e altura: h = c · sen α = ' + fmt(B[1]) + ', então S = b · h ÷ 2 = ' + fmt(bb) + ' · ' + fmt(B[1]) + ' ÷ 2 = ' + fmt(S, 3) + '.');
        if (alfa > PI / 2 + 1e-9) linhas.push('α é obtuso, e mesmo assim sen α é positivo: a fórmula continua valendo.');
      } else if (modo === 'heron') {
        P.poli([A, B, C], 'geo-fig');
        G = nomes();
        rotLado(B, C, G, 'a = ' + raizCurta(a2)); rotLado(C, A, G, 'b = ' + raizCurta(b2)); rotLado(A, B, G, 'c = ' + raizCurta(c2));
        var a = Math.sqrt(a2), b_ = Math.sqrt(b2), c_ = Math.sqrt(c2), p = (a + b_ + c_) / 2;
        var prod = p * (p - a) * (p - b_) * (p - c_);
        var todosInt = inteiro(a) && inteiro(b_) && inteiro(c_);
        linhas.push('Lados: a ' + ig(a2) + ', b ' + ig(b2) + ', c ' + ig(c2));
        linhas.push('Semiperímetro: p = (a + b + c) ÷ 2 ' + (todosInt ? '= ' : '≈ ') + fmt(p));
        linhas.push(todosInt
          ? 'S = √(p(p − a)(p − b)(p − c)) = √(' + fmt(p) + ' · ' + fmt(p - a) + ' · ' + fmt(p - b_) + ' · ' + fmt(p - c_) + ') = √' + fmt(prod) + ' = **' + fmt(Math.sqrt(prod)) + '**'
          : 'S = √(p(p − a)(p − b)(p − c)) ≈ √' + fmt(prod) + ' ≈ **' + fmt(Math.sqrt(prod)) + '**');
        linhas.push('Contando pela malha, a área é ' + fmt(S, 3) + ': as duas contas batem.');
      }
      hs.forEach(function (h2) { h2.posiciona(); });
      escreve(f.info, linhas);
    }
    desenha();
  }

  // ================================================================ 5. quadriláteros
  function Quadrilatero(raiz) {
    var forma = raiz.getAttribute('data-forma') || 'quadrado';
    var TIT = { quadrado: 'Área e perímetro do quadrado', retangulo: 'Área, perímetro e diagonal do retângulo', trapezio: 'Área do trapézio', losango: 'Área do losango' };
    var f = moldura(raiz, TIT[forma] || TIT.quadrado);
    var pn = painel(f);
    var JAN = { quadrado: [-0.8, 7, -0.8, 7], retangulo: [-0.8, 9, -0.8, 6], trapezio: [-0.8, 12.6, -1.4, 5.2], losango: [-0.5, 9.5, -0.8, 6.8] }[forma];
    var P = Plano(pn.area, { x0: JAN[0], x1: JAN[1], y0: JAN[2], y1: JAN[3], rotulo: 'Quadrilátero na malha quadriculada' });
    var op = { unid: false, diag: forma === 'losango', extra: false, alt: true }, hs = [];
    var L, b, h, Bm, x1, x2, D, dm, cx = 4.5, cy = 3;
    function carrega() { L = 4; b = 6; h = 3.5; Bm = 6; x1 = 1; x2 = 4; D = 7; dm = 4; if (forma === 'retangulo') h = 3; if (forma === 'trapezio') h = 3.5; }
    carrega();
    var tg = el('div', { class: 'mx__toggles' }, pn.lado);
    if (forma === 'quadrado' || forma === 'retangulo') {
      caixa(tg, 'Quadradinhos de 1 × 1', false, function (v) { op.unid = v; desenha(); });
      caixa(tg, 'Diagonal', false, function (v) { op.diag = v; desenha(); });
    }
    if (forma === 'trapezio') {
      caixa(tg, 'Altura', true, function (v) { op.alt = v; desenha(); });
      caixa(tg, 'Por que (B + b)·h ÷ 2? Juntar uma cópia girada', false, function (v) { op.extra = v; desenha(); });
    }
    if (forma === 'losango') {
      caixa(tg, 'Diagonais', true, function (v) { op.diag = v; desenha(); });
      caixa(tg, 'Retângulo D × d em volta', false, function (v) { op.extra = v; desenha(); });
    }
    botao(pn.lado, '↺ Recomeçar', function () { carrega(); desenha(); });
    dica(pn.lado, {
      quadrado: 'Arraste o vértice destacado para mudar o lado L.',
      retangulo: 'Arraste o vértice destacado para mudar a base b e a altura h.',
      trapezio: 'Arraste o vértice da direita (base maior) e os dois vértices de cima (base menor e altura). O tipo do trapézio aparece abaixo.',
      losango: 'Arraste o vértice da direita (diagonal maior D) e o de cima (diagonal menor d).'
    }[forma]);

    function al(rot, pos, mover) { hs.push(P.alca({ rotulo: rot, pos: pos, mover: mover, depois: desenha })); }
    // o lado acompanha a coordenada que mais mudou (funciona com o mouse e com as setas)
    if (forma === 'quadrado') al('Vértice oposto à origem', function () { return [L, L]; }, function (x, y) { L = Math.max(0.5, Math.min(6, Math.abs(x - L) >= Math.abs(y - L) ? x : y)); });
    if (forma === 'retangulo') al('Vértice oposto à origem', function () { return [b, h]; }, function (x, y) { b = Math.max(0.5, Math.min(8, x)); h = Math.max(0.5, Math.min(5, y)); });
    if (forma === 'trapezio') {
      al('Extremo da base maior', function () { return [Bm, 0]; }, function (x) { Bm = Math.max(1, Math.min(6.5, x)); });
      al('Vértice de cima à esquerda', function () { return [x1, h]; }, function (x, y) { x1 = Math.max(0, Math.min(x2 - 0.5, x)); h = Math.max(0.5, Math.min(4.5, y)); });
      al('Vértice de cima à direita', function () { return [x2, h]; }, function (x, y) { x2 = Math.max(x1 + 0.5, Math.min(5.5, x)); h = Math.max(0.5, Math.min(4.5, y)); });
    }
    if (forma === 'losango') {
      al('Vértice da direita (diagonal maior)', function () { return [cx + D / 2, cy]; }, function (x) { D = Math.max(1, Math.min(9, 2 * (x - cx))); });
      al('Vértice de cima (diagonal menor)', function () { return [cx, cy + dm / 2]; }, function (x, y) { dm = Math.max(1, Math.min(7, 2 * (y - cy))); });
    }

    function unidades(w, ht) {
      for (var i = 1; i < w; i++) P.linha([i, 0], [i, ht], 'geo-unid');
      for (var k = 1; k < ht; k++) P.linha([0, k], [w, k], 'geo-unid');
    }
    function cantosRetos(pts) {
      pts.forEach(function (V, i) { P.reto(V, unit(V, pts[(i + 1) % pts.length]), unit(V, pts[(i + pts.length - 1) % pts.length])); });
    }
    function tracinho(p, q, n) {
      var m = medio(p, q), u = unit(p, q), nn = [-u[1], u[0]], t = 6 / P.esc;
      for (var k = 0; k < (n || 1); k++) {
        var c = [m[0] + u[0] * (k - (n - 1) / 2) * 0.12, m[1] + u[1] * (k - (n - 1) / 2) * 0.12];
        P.linha([c[0] - nn[0] * t, c[1] - nn[1] * t], [c[0] + nn[0] * t, c[1] + nn[1] * t], 'geo-tracinho');
      }
    }

    function desenha() {
      P.limpa();
      var linhas = [], O = [0, 0], cent;
      if (forma === 'quadrado' || forma === 'retangulo') {
        var w = forma === 'quadrado' ? L : b, ht = forma === 'quadrado' ? L : h;
        var pts = [[0, 0], [w, 0], [w, ht], [0, ht]];
        cent = [w / 2, ht / 2];
        if (op.diag) P.poli([[0, 0], [w, 0], [w, ht]], 'geo-meia');
        P.poli(pts, 'geo-fig');
        if (op.unid) unidades(w, ht);
        cantosRetos(pts);
        if (forma === 'quadrado') { [[0, 1], [1, 2], [2, 3], [3, 0]].forEach(function (s) { tracinho(pts[s[0]], pts[s[1]], 1); P.textoFora(medio(pts[s[0]], pts[s[1]]), cent, 'L', 'geo-txt--lado', 14); }); }
        else { P.texto([w / 2, 0], 'b = ' + fmt(w), 'geo-txt--lado', 0, 15); P.texto([w, ht / 2], 'h = ' + fmt(ht), 'geo-txt--lado', 8, 0, 'start'); }
        var dd2 = w * w + ht * ht;
        if (op.diag) { P.linha([0, 0], [w, ht], 'geo-altura'); P.texto(medio([0, 0], [w, ht]), 'd', 'geo-txt--alt', -9, -9); }
        if (forma === 'quadrado') {
          linhas.push('Lado L = ' + fmt(L) + '. Área = L² = ' + fmt(L) + '² = **' + fmt(L * L) + '** · Perímetro = 4L = ' + fmt(4 * L));
          if (op.unid) linhas.push(inteiro(L) ? 'Conte os quadradinhos: ' + L + ' fileiras de ' + L + ' = ' + (L * L) + '.' : 'Com lado ' + fmt(L) + ', sobram pedaços de quadradinho: a fórmula L² dá a conta certa (' + fmt(L * L) + ').');
          if (op.diag) linhas.push('Diagonal (Pitágoras): d² = L² + L² ⇒ d = L√2 ' + (inteiro(L) ? '= ' + (L === 1 ? '' : L) + '√2 ' : '') + '≈ ' + fmt(L * Math.SQRT2));
        } else {
          linhas.push('Base b = ' + fmt(b) + ', altura h = ' + fmt(h) + '. Área = b · h = ' + fmt(b) + ' · ' + fmt(h) + ' = **' + fmt(b * h) + '**');
          linhas.push('Perímetro = 2 · (b + h) = 2 · ' + fmt(b + h) + ' = ' + fmt(2 * (b + h)));
          if (op.unid) linhas.push(inteiro(b) && inteiro(h) ? 'Conte os quadradinhos: ' + h + ' fileiras de ' + b + ' = ' + (b * h) + '.' : 'Com medidas não inteiras, sobram pedaços de quadradinho; a fórmula b · h dá a conta certa.');
          if (op.diag) linhas.push('A diagonal divide o retângulo em dois triângulos retângulos. Pitágoras: d² = b² + h² = ' + fmt(b * b) + ' + ' + fmt(h * h) + ' = ' + fmt(dd2) + ' ⇒ d ' + ig(dd2));
          if (b === h) linhas.push('Com b = h, este retângulo é também um quadrado.');
        }
      } else if (forma === 'trapezio') {
        var T = [[0, 0], [Bm, 0], [x2, h], [x1, h]], bm = x2 - x1;
        cent = [(Bm + x1 + x2) / 4, h / 2];
        if (op.extra) {
          var M = medio(T[1], T[2]), cp = T.map(function (p) { return [2 * M[0] - p[0], 2 * M[1] - p[1]]; });
          P.poli(cp, 'geo-fig geo-fig--copia');
          P.texto([(Bm + x2 - x1) / 2, 0], 'B + b = ' + fmt(Bm + bm), 'geo-txt--lado', 0, 30);
        }
        P.poli(T, 'geo-fig');
        if (op.alt) {
          var pe = [Math.min(x1, Bm), 0], topo = [pe[0], h];
          P.linha(topo, pe, 'geo-altura');
          P.reto(pe, [1, 0], [0, 1]);
          P.texto(medio(topo, pe), 'h', 'geo-txt--alt', 15, 0);
        }
        var B2 = Math.max(Bm, bm), b2 = Math.min(Bm, bm), igual = Math.abs(Bm - bm) < 1e-9;
        P.texto([Bm / 2, 0], (Bm >= bm ? 'B' : 'b') + ' = ' + fmt(Bm), 'geo-txt--lado', 0, 15);
        P.texto([(x1 + x2) / 2, h], (Bm >= bm ? 'b' : 'B') + ' = ' + fmt(bm), 'geo-txt--lado', 0, -14);
        var L1 = d2(T[0], T[3]), L2 = d2(T[1], T[2]);
        P.textoFora(medio(T[0], T[3]), cent, 'L₁', 'geo-txt--fraco', 14);
        P.textoFora(medio(T[1], T[2]), cent, 'L₂', 'geo-txt--fraco', 14);
        var tipo;
        if (igual) tipo = 'as duas “bases” ficaram iguais: os lados opostos são paralelos dois a dois e a figura é um **paralelogramo**, não um trapézio.';
        else if (Math.abs(x1) < 1e-9 || Math.abs(x2 - Bm) < 1e-9) tipo = 'trapézio **retângulo** (um lado perpendicular às bases, com dois ângulos de 90°).';
        else if (Math.abs(L1 - L2) < 1e-9) tipo = 'trapézio **isósceles** (lados não paralelos iguais: L₁ = L₂).';
        else tipo = 'trapézio **escaleno** (lados não paralelos diferentes).';
        if (!igual && Math.abs(x1) < 1e-9) P.reto([0, h], [1, 0], [0, -1]);
        if (!igual && Math.abs(x2 - Bm) < 1e-9) P.reto([Bm, h], [-1, 0], [0, -1]);
        if (!igual && Math.abs(L1 - L2) < 1e-9) { tracinho(T[0], T[3], 2); tracinho(T[1], T[2], 2); }
        linhas.push('Tipo: ' + tipo);
        linhas.push('Área = (B + b) · h ÷ 2 = (' + fmt(B2) + ' + ' + fmt(b2) + ') · ' + fmt(h) + ' ÷ 2 = **' + fmt((B2 + b2) * h / 2, 3) + '**');
        linhas.push('L₁ ' + ig(L1) + ', L₂ ' + ig(L2) + ' · Perímetro = B + b + L₁ + L₂ ≈ ' + fmt(Bm + bm + Math.sqrt(L1) + Math.sqrt(L2)));
        if (op.extra) linhas.push('O trapézio e a cópia girada formam um paralelogramo de base B + b e altura h. O trapézio é a metade dele: (B + b) · h ÷ 2.');
      } else if (forma === 'losango') {
        var E = [cx - D / 2, cy], Dr = [cx + D / 2, cy], Tp = [cx, cy + dm / 2], Bx = [cx, cy - dm / 2], Q = [E, Bx, Dr, Tp];
        cent = [cx, cy];
        if (op.extra) {
          P.poli([[E[0], Bx[1]], [Dr[0], Bx[1]], [Dr[0], Tp[1]], [E[0], Tp[1]]], 'geo-fig geo-fig--copia');
        }
        P.poli(Q, 'geo-fig');
        if (op.diag) {
          P.linha(E, Dr, 'geo-diag'); P.linha(Tp, Bx, 'geo-diag');
          P.reto([cx, cy], [1, 0], [0, 1], 9);
        }
        for (var k = 0; k < 4; k++) tracinho(Q[k], Q[(k + 1) % 4], 1);
        P.texto([cx + D / 4, cy], 'D = ' + fmt(D), 'geo-txt--diag', 0, 12);
        P.texto([cx, cy + dm / 4], 'd = ' + fmt(dm), 'geo-txt--diag', -8, 0, 'end');
        var l2 = (D / 2) * (D / 2) + (dm / 2) * (dm / 2);
        var agudo = 2 * Math.atan(Math.min(dm, D) / Math.max(dm, D));
        linhas.push('Diagonal maior D = ' + fmt(Math.max(D, dm)) + ' e menor d = ' + fmt(Math.min(D, dm)) + '. Área = D · d ÷ 2 = ' + fmt(D) + ' · ' + fmt(dm) + ' ÷ 2 = **' + fmt(D * dm / 2) + '**');
        linhas.push('As diagonais se cortam ao meio formando 90°. Lado (Pitágoras): L² = (D/2)² + (d/2)² = ' + fmt(l2) + ' ⇒ L ' + ig(l2) + ' · Perímetro = 4L ≈ ' + fmt(4 * Math.sqrt(l2)));
        linhas.push(Math.abs(D - dm) < 1e-9 ? 'Com D = d, os quatro ângulos são retos: este losango é um quadrado.' : 'Ângulos: dois agudos de ' + grau(agudo) + ' e dois obtusos de ' + grau(PI - agudo) + '.');
        if (op.extra) linhas.push('O losango ocupa exatamente a metade do retângulo D × d em volta dele (cada triângulo de fora é igual a um de dentro).');
      }
      hs.forEach(function (h2) { h2.posiciona(); });
      escreve(f.info, linhas);
    }
    desenha();
  }

  // ================================================================ 6. círculo
  function Circulo(raiz) {
    var r = +raiz.getAttribute('data-raio') || 2.5, th = -PI / 6, op = { diam: true, setores: false }, n = 12;
    var f = moldura(raiz, 'Raio, diâmetro, comprimento e área do círculo');
    var pn = painel(f);
    var P = Plano(pn.area, { x0: -4, x1: 4, y0: -4, y1: 4, rotulo: 'Círculo com raio e diâmetro' });
    var tg = el('div', { class: 'mx__toggles' }, pn.lado);
    caixa(tg, 'Diâmetro', true, function (v) { op.diam = v; desenha(); });
    caixa(tg, 'Por que A = π · r²? Cortar em setores', false, function (v) { op.setores = v; caixaSet.hidden = !v; desenha(); });
    var caixaSet = el('div', { class: 'geo-setores' }, f.corpo);
    caixaSet.hidden = true;
    var ctrS = el('div', { class: 'mx__ctr' }, caixaSet);
    seletor(ctrS, 'Número de setores', [4, 8, 12, 16, 24, 36, 48].map(function (k) { return [k, k + ' setores']; }), n, function (v) { n = +v; desenha(); });
    var P2 = Plano(caixaSet, { x0: -0.6, x1: PI * 3.5 * 1.25 + 1.5, y0: -0.9, y1: 4.3, grade: false, largura: 560, rotulo: 'Setores do círculo rearrumados lado a lado' });
    botao(pn.lado, '↺ Recomeçar', function () { r = 2.5; th = -PI / 6; desenha(); });
    dica(pn.lado, 'Arraste o ponto sobre a circunferência para mudar o raio.');
    var h = P.alca({
      rotulo: 'Ponto da circunferência', pos: function () { return [r * Math.cos(th), r * Math.sin(th)]; },
      mover: function (x, y, xr, yr) { var rr = Math.hypot(xr, yr); r = Math.max(0.5, Math.min(3.5, Math.round(rr * 2) / 2)); if (rr > 0.1) th = Math.atan2(yr, xr); },
      depois: desenha
    });
    function desenha() {
      P.limpa(); P2.limpa();
      var O = [0, 0], Pc = [r * Math.cos(th), r * Math.sin(th)];
      if (op.setores) {
        for (var i = 0; i < n; i++) P.setor(O, th + i * 2 * PI / n, th + (i + 1) * 2 * PI / n, r, 'geo-setor geo-setor--' + (i % 2));
      } else P.circ(O, r, 'geo-fig');
      P.circ(O, r, 'geo-borda');
      if (op.diam) {
        var td = th + 1.1, D1 = [r * Math.cos(td), r * Math.sin(td)], D2 = [-D1[0], -D1[1]];
        P.linha(D1, D2, 'geo-diam');
        P.texto(medio(O, D2), 'd', 'geo-txt--diam', 0, -11);
      }
      P.linha(O, Pc, 'geo-altura');
      P.ponto(O, '');
      P.texto(medio(O, Pc), 'r', 'geo-txt--alt', 0, -11);
      h.posiciona();
      var C = 2 * PI_ESCOLA * r, A = PI_ESCOLA * r * r, r2 = r * r;
      var linhas = [
        'Raio r = ' + fmt(r) + ' · diâmetro d = 2r = ' + fmt(2 * r),
        'Comprimento da circunferência: C = 2πr = ' + fmt(2 * r) + 'π ≈ ' + fmt(C) + ' (usando π ≈ 3,14)',
        'Área do círculo: A = πr² = ' + fmt(r2) + 'π ≈ **' + fmt(A) + '**'
      ];
      if (op.setores) {
        // setores alternados: pares com a ponta para baixo, ímpares com a ponta para cima
        var s = PI * r / (n / 2), ang = 2 * PI / n;
        for (var k = 0; k < n; k++) {
          var j = Math.floor(k / 2);
          if (k % 2 === 0) P2.setor([j * s + s / 2, 0], PI / 2 - ang / 2, PI / 2 + ang / 2, r, 'geo-setor geo-setor--0');
          else P2.setor([(j + 1) * s, r], -PI / 2 - ang / 2, -PI / 2 + ang / 2, r, 'geo-setor geo-setor--1');
        }
        var larg = (n / 2) * s + s / 2;
        P2.linha([s / 2, -0.35], [s / 2 + PI * r, -0.35], 'geo-cota');
        P2.texto([s / 2 + PI * r / 2, -0.35], '≈ metade da circunferência = π · r ≈ ' + fmt(PI_ESCOLA * r), 'geo-txt--lado', 0, 13);
        P2.linha([larg + 0.3, 0], [larg + 0.3, r], 'geo-cota');
        P2.texto([larg + 0.3, r / 2], 'r', 'geo-txt--alt', 10, 0, 'start');
        linhas.push('Rearrumados, os ' + n + ' setores quase formam um retângulo de base π · r e altura r. Área ≈ π · r · r = π · r². Quanto mais setores, mais perfeito o “retângulo”.');
      }
      escreve(f.info, linhas);
    }
    desenha();
  }

  // ================================================================ inicialização
  var TIPOS = { convexo: Convexo, poligono: EhPoligono, elementos: Elementos, triangulo: Triangulo, quadrilatero: Quadrilatero, circulo: Circulo };
  function iniciar() {
    document.querySelectorAll('.mx[data-figura]').forEach(function (r) {
      var F = TIPOS[r.getAttribute('data-figura')];
      if (!F || r.classList.contains('mx--ativo')) return;
      try { F(r); } catch (e) { if (window.console) console.error('[geometria]', e); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
