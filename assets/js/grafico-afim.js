/*!
 * Gráficos interativos de função afim — marleson.github.io
 * JavaScript puro + SVG, sem dependências.
 *
 * Uso numa aula (a página precisa de `graficos: true` no front matter):
 *
 *   <div class="grafico-afim"
 *        data-a="2" data-b="-1"                 valores iniciais
 *        data-janela="-6,6,-6,6"                xmin,xmax,ymin,ymax
 *        data-controles="a,b"                   a, b, x, dominio
 *        data-mostrar="raiz,intercepto"         raiz, intercepto, inclinacao, sinal
 *        data-modo="dois-pontos"                (opcional) arrastar dois pontos
 *        data-pontos="1,3,3,7"                  (dois-pontos) x1,y1,x2,y2
 *        data-x="1"                             (controle x) valor inicial
 *        data-dominio="-1,3"                    (controle dominio) intervalo inicial
 *        data-titulo="Explore a e b">
 *     <p>Texto exibido se o JavaScript estiver desligado.</p>
 *   </div>
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var contador = 0;

  // ---------------------------------------------------------------- utilidades
  function svg(tag, attrs, pai) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (pai) pai.appendChild(e);
    return e;
  }

  function html(tag, attrs, pai, texto) {
    var e = document.createElement(tag);
    for (var k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (texto != null) e.textContent = texto;
    if (pai) pai.appendChild(e);
    return e;
  }

  function arred(v) {
    var r = Math.round(v * 100) / 100;
    return r === 0 ? 0 : r; // evita "-0"
  }

  // número no formato brasileiro, com sinal de menos tipográfico
  function fmt(v) {
    if (!isFinite(v)) return '—';
    return arred(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 }).replace('-', '−');
  }

  // número entre parênteses se for negativo (para substituições: 2·(−3))
  function fmtP(v) {
    return arred(v) < 0 ? '(' + fmt(v) + ')' : fmt(v);
  }

  // par ordenado; com decimais usa ";" para não confundir com a vírgula decimal
  function par(x, y) {
    var sep = (arred(x) % 1 !== 0 || arred(y) % 1 !== 0) ? '; ' : ', ';
    return '(' + fmt(x) + sep + fmt(y) + ')';
  }

  function lei(a, b) {
    a = arred(a); b = arred(b);
    if (a === 0) return 'f(x) = ' + fmt(b);
    var s = a === 1 ? 'x' : a === -1 ? '−x' : fmt(a) + 'x';
    if (b > 0) s += ' + ' + fmt(b);
    else if (b < 0) s += ' − ' + fmt(-b);
    return 'f(x) = ' + s;
  }

  function intervalo(m, M) {
    m = arred(m); M = arred(M);
    if (m === M) return '{' + fmt(m) + '}';
    var sep = (m % 1 !== 0 || M % 1 !== 0) ? '; ' : ', ';
    return '[' + fmt(m) + sep + fmt(M) + ']';
  }

  function lerLista(txt, padrao) {
    return (txt != null ? txt : padrao).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function lerNums(txt, padrao) {
    return lerLista(txt, padrao).map(Number);
  }

  // ------------------------------------------------------------------- gráfico
  function Grafico(raiz) {
    var d = raiz.dataset;
    var id = 'ga' + (++contador);
    var modo = d.modo || 'explorar';
    var controles = lerLista(d.controles, modo === 'dois-pontos' ? '' : 'a,b');
    var mostrar = lerLista(d.mostrar, 'raiz,intercepto');
    var jan = lerNums(d.janela, '-6,6,-6,6');
    var X0 = jan[0], X1 = jan[1], Y0 = jan[2], Y1 = jan[3];

    var inicial = {
      a: d.a != null ? Number(d.a) : 1,
      b: d.b != null ? Number(d.b) : 0,
      x: d.x != null ? Number(d.x) : 1,
      dom: lerNums(d.dominio, '-1,3'),
      pts: lerNums(d.pontos, '1,3,3,7')
    };
    var est = {};

    function reiniciar() {
      est.a = inicial.a;
      est.b = inicial.b;
      est.x = inicial.x;
      est.dmin = inicial.dom[0];
      est.dmax = inicial.dom[1];
      est.p = [{ x: inicial.pts[0], y: inicial.pts[1] }, { x: inicial.pts[2], y: inicial.pts[3] }];
    }
    reiniciar();

    // escala: unidades iguais nos dois eixos (a inclinação aparece de verdade)
    var W = 400;
    var H = Math.round(W * (Y1 - Y0) / (X1 - X0));
    function px(x) { return (x - X0) / (X1 - X0) * W; }
    function py(y) { return H - (y - Y0) / (Y1 - Y0) * H; }

    // ---------------------------------------------------------------- estrutura
    raiz.innerHTML = '';
    raiz.classList.add('grafico-afim--ativo');
    if (d.titulo) html('p', { class: 'grafico-afim__titulo' }, raiz, d.titulo);

    var corpo = html('div', { class: 'grafico-afim__corpo' }, raiz);
    var tela = svg('svg', {
      viewBox: '-14 -6 ' + (W + 28) + ' ' + (H + 26),
      class: 'grafico-afim__svg',
      role: 'img',
      'aria-labelledby': id + '-info'
    }, html('div', { class: 'grafico-afim__tela' }, corpo));

    var defs = svg('defs', {}, tela);
    var clip = svg('clipPath', { id: id + '-clip' }, defs);
    svg('rect', { x: 0, y: 0, width: W, height: H }, clip);

    // grade e eixos
    var passo = (X1 - X0) > 14 ? 2 : 1;
    var grade = svg('g', { class: 'g-grade' }, tela);
    var x, y;
    for (x = Math.ceil(X0); x <= X1; x++) svg('line', { x1: px(x), y1: 0, x2: px(x), y2: H }, grade);
    for (y = Math.ceil(Y0); y <= Y1; y++) svg('line', { x1: 0, y1: py(y), x2: W, y2: py(y) }, grade);

    var eixos = svg('g', { class: 'g-eixo' }, tela);
    var ex = Math.min(Math.max(0, Y0), Y1), ey = Math.min(Math.max(0, X0), X1);
    svg('line', { x1: 0, y1: py(ex), x2: W, y2: py(ex) }, eixos);
    svg('line', { x1: px(ey), y1: 0, x2: px(ey), y2: H }, eixos);
    svg('text', { x: W - 4, y: py(ex) - 6, class: 'g-nome-eixo', 'text-anchor': 'end' }, eixos).textContent = 'x';
    svg('text', { x: px(ey) + 7, y: 12, class: 'g-nome-eixo' }, eixos).textContent = 'y';

    var rotulos = svg('g', { class: 'g-rotulo' }, tela);
    for (x = Math.ceil(X0 / passo) * passo; x <= X1; x += passo) {
      if (x === 0 || x === X0 || x === X1) continue;
      svg('text', { x: px(x), y: py(ex) + 13, 'text-anchor': 'middle' }, rotulos).textContent = fmt(x);
    }
    for (y = Math.ceil(Y0 / passo) * passo; y <= Y1; y += passo) {
      if (y === 0 || y === Y0 || y === Y1) continue;
      svg('text', { x: px(ey) - 5, y: py(y) + 4, 'text-anchor': 'end' }, rotulos).textContent = fmt(y);
    }
    svg('text', { x: px(ey) - 5, y: py(ex) + 13, 'text-anchor': 'end' }, rotulos).textContent = '0';

    var camada = svg('g', { 'clip-path': 'url(#' + id + '-clip)' }, tela);
    var camadaPontos = svg('g', {}, tela); // pontos arrastáveis ficam fora do recorte

    // painel lateral: controles + informações
    var painel = html('div', { class: 'grafico-afim__painel' }, corpo);
    var ctl = html('div', { class: 'grafico-afim__controles' }, painel);
    var info = html('div', { class: 'grafico-afim__info', id: id + '-info', 'aria-live': 'polite' }, painel);

    var saidas = {};
    function slider(chave, rotulo, min, max, step, obter, definir) {
      var lab = html('label', { class: 'grafico-afim__slider' }, ctl);
      var topo = html('span', { class: 'grafico-afim__slider-topo' }, lab);
      html('span', {}, topo, rotulo + ' = ');
      var out = html('output', {}, topo, fmt(obter()));
      var inp = html('input', {
        type: 'range', min: min, max: max, step: step, value: obter(),
        'aria-label': rotulo
      }, lab);
      inp.addEventListener('input', function () {
        definir(Number(inp.value));
        desenhar();
      });
      saidas[chave] = { out: out, inp: inp, obter: obter };
    }

    var amax = Number(d.amax || 5), bmax = Number(d.bmax || Math.max(6, Math.floor(Y1)));
    controles.forEach(function (c) {
      if (c === 'a') slider('a', 'a', -amax, amax, 0.5, function () { return est.a; }, function (v) { est.a = v; });
      if (c === 'b') slider('b', 'b', -bmax, bmax, 0.5, function () { return est.b; }, function (v) { est.b = v; });
      if (c === 'x') slider('x', 'x', X0, X1, 0.5, function () { return est.x; }, function (v) { est.x = v; });
      if (c === 'dominio') {
        slider('dmin', 'início do domínio', X0, X1, 0.5, function () { return est.dmin; },
          function (v) { est.dmin = v; if (est.dmax < v) { est.dmax = v; } });
        slider('dmax', 'fim do domínio', X0, X1, 0.5, function () { return est.dmax; },
          function (v) { est.dmax = v; if (est.dmin > v) { est.dmin = v; } });
      }
    });

    var botao = html('button', { type: 'button', class: 'grafico-afim__reset' }, ctl, '↺ Recomeçar');
    botao.addEventListener('click', function () { reiniciar(); desenhar(); });

    if (modo === 'dois-pontos') {
      html('p', { class: 'grafico-afim__dica' }, ctl,
        'Arraste os pontos A e B (ou selecione um deles com Tab e use as setas do teclado).');
    }

    // ------------------------------------------------------------- desenho
    function linhaInfo(rotulo, valor, classe) {
      var p = html('p', classe ? { class: classe } : {}, info);
      if (rotulo) html('strong', {}, p, rotulo + ' ');
      p.appendChild(document.createTextNode(valor));
      return p;
    }

    // lado: posição do rótulo — 'acima' (padrão), 'abaixo' ou 'esquerda'
    function ponto(x, y, classe, rotulo, pai, lado) {
      var g = svg('g', { class: 'g-ponto ' + classe }, pai || camada);
      svg('circle', { cx: px(x), cy: py(y), r: 5 }, g);
      if (rotulo) {
        var t = svg('text', { x: px(x) + 8, y: py(y) - 8 }, g);
        t.textContent = rotulo;
        if (lado === 'abaixo') { t.setAttribute('x', px(x)); t.setAttribute('y', py(y) + 26); t.setAttribute('text-anchor', 'middle'); }
        if (lado === 'esquerda' || px(x) > W - 90) { t.setAttribute('x', px(x) - 9); t.setAttribute('text-anchor', 'end'); }
        // rótulo não sai da tela
        if (px(x) < 40 && t.getAttribute('text-anchor') !== 'start') { t.setAttribute('x', px(x) + 8); t.setAttribute('text-anchor', 'start'); }
        if (py(y) < 16) t.setAttribute('y', py(y) + 18);
        if (py(y) > H - 30 && lado === 'abaixo') t.setAttribute('y', py(y) - 10);
      }
      return g;
    }

    function tracejado(x1, y1, x2, y2, classe) {
      svg('line', { x1: px(x1), y1: py(y1), x2: px(x2), y2: py(y2), class: 'g-tracejado ' + (classe || '') }, camada);
    }

    function f(x) { return est.a * x + est.b; }

    function desenhar() {
      if (modo === 'dois-pontos') {
        var A = est.p[0], B = est.p[1];
        if (A.x !== B.x) {
          est.a = (B.y - A.y) / (B.x - A.x);
          est.b = A.y - est.a * A.x;
        }
      }
      var a = est.a, b = est.b;
      var temReta = !(modo === 'dois-pontos' && est.p[0].x === est.p[1].x);

      while (camada.firstChild) camada.removeChild(camada.firstChild);
      while (camadaPontos.firstChild) camadaPontos.removeChild(camadaPontos.firstChild);
      info.innerHTML = '';
      Object.keys(saidas).forEach(function (k) {
        saidas[k].out.textContent = fmt(saidas[k].obter());
        saidas[k].inp.value = saidas[k].obter();
      });

      var temDominio = controles.indexOf('dominio') >= 0;
      var temSinal = mostrar.indexOf('sinal') >= 0;
      var r = a !== 0 ? -b / a : null;

      // reta
      if (temReta) {
        var classeReta = temDominio ? 'g-reta g-reta--fraca' : 'g-reta';
        if (temSinal && a !== 0) {
          // parte positiva (acima do eixo x) e negativa
          var xpos = a > 0 ? [r, X1 + 1] : [X0 - 1, r];
          var xneg = a > 0 ? [X0 - 1, r] : [r, X1 + 1];
          svg('line', { x1: px(xpos[0]), y1: py(f(xpos[0])), x2: px(xpos[1]), y2: py(f(xpos[1])), class: 'g-reta g-reta--pos' }, camada);
          svg('line', { x1: px(xneg[0]), y1: py(f(xneg[0])), x2: px(xneg[1]), y2: py(f(xneg[1])), class: 'g-reta g-reta--neg' }, camada);
        } else {
          svg('line', { x1: px(X0 - 1), y1: py(f(X0 - 1)), x2: px(X1 + 1), y2: py(f(X1 + 1)), class: classeReta }, camada);
        }
      }

      // domínio restrito e imagem
      if (temDominio) {
        var m = est.dmin, M = est.dmax, fm = f(m), fM = f(M);
        var imin = Math.min(fm, fM), imax = Math.max(fm, fM);
        svg('line', { x1: px(m), y1: py(ex), x2: px(M), y2: py(ex), class: 'g-faixa g-faixa--dom' }, camada);
        svg('line', { x1: px(ey), y1: py(imin), x2: px(ey), y2: py(imax), class: 'g-faixa g-faixa--img' }, camada);
        tracejado(m, 0, m, fm); tracejado(M, 0, M, fM);
        tracejado(0, fm, m, fm); tracejado(0, fM, M, fM);
        svg('line', { x1: px(m), y1: py(fm), x2: px(M), y2: py(fM), class: 'g-reta' }, camada);
        ponto(m, fm, 'g-ponto--dom', par(m, fm));
        ponto(M, fM, 'g-ponto--dom', par(M, fM));
      }

      // triângulo de inclinação: anda 1 em x, sobe/desce a em y
      if (mostrar.indexOf('inclinacao') >= 0 && temReta) {
        var x0 = 0, y0 = b;
        svg('path', {
          d: 'M' + px(x0) + ',' + py(y0) + ' H' + px(x0 + 1) + ' V' + py(y0 + a),
          class: 'g-inclinacao'
        }, camada);
        var t1 = svg('text', { x: px(x0 + 0.5), y: py(y0) + (a >= 0 ? 14 : -6), 'text-anchor': 'middle', class: 'g-inclinacao-txt' }, camada);
        t1.textContent = '1';
        var t2 = svg('text', { x: px(x0 + 1) + 6, y: py(y0 + a / 2) + 4, class: 'g-inclinacao-txt' }, camada);
        t2.textContent = (a >= 0 ? '+' : '') + fmt(a);
      }

      // intercepto e zero
      if (mostrar.indexOf('intercepto') >= 0 && temReta) ponto(0, b, 'g-ponto--b', par(0, b), null, mostrar.indexOf('inclinacao') >= 0 ? 'esquerda' : null);
      if ((mostrar.indexOf('raiz') >= 0 || temSinal) && r !== null && temReta) ponto(r, 0, 'g-ponto--raiz', 'x = ' + fmt(r), null, 'abaixo');

      // ponto móvel: valor numérico
      if (controles.indexOf('x') >= 0) {
        var fx = f(est.x);
        tracejado(est.x, 0, est.x, fx, 'g-tracejado--x');
        tracejado(0, fx, est.x, fx, 'g-tracejado--x');
        ponto(est.x, fx, 'g-ponto--x', par(est.x, fx));
      }

      // pontos arrastáveis
      if (modo === 'dois-pontos') {
        est.p.forEach(function (P, i) {
          var g = ponto(P.x, P.y, 'g-ponto--arrastar', (i ? 'B' : 'A') + ' ' + par(P.x, P.y), camadaPontos);
          g.setAttribute('tabindex', '0');
          g.setAttribute('role', 'button');
          g.setAttribute('aria-label', 'Ponto ' + (i ? 'B' : 'A') + ' em ' + par(P.x, P.y) + '. Use as setas para mover.');
          svg('circle', { cx: px(P.x), cy: py(P.y), r: 16, class: 'g-alvo' }, g); // área de toque maior
          ligarArraste(g, i);
        });
      }

      // ------------------------------------------------------- informações
      if (modo === 'dois-pontos') {
        var A2 = est.p[0], B2 = est.p[1];
        if (A2.x === B2.x) {
          linhaInfo('', 'Os dois pontos têm o mesmo x: a reta seria vertical e não é gráfico de função. Mova um deles.', 'grafico-afim__alerta');
          return;
        }
        linhaInfo('a =', '(' + fmt(B2.y) + ' − ' + fmtP(A2.y) + ') ÷ (' + fmt(B2.x) + ' − ' + fmtP(A2.x) + ') = ' + fmt(a));
        linhaInfo('b =', fmt(A2.y) + ' − ' + fmtP(a) + '·' + fmtP(A2.x) + ' = ' + fmt(b));
      }

      linhaInfo('', lei(a, b), 'grafico-afim__lei');

      var tipo = a > 0 ? 'crescente (a > 0)' : a < 0 ? 'decrescente (a < 0)' : 'constante (a = 0)';
      linhaInfo('Função', tipo, a > 0 ? 'g-cresce' : a < 0 ? 'g-decresce' : 'g-constante');

      if (mostrar.indexOf('intercepto') >= 0) linhaInfo('Corta o eixo y em', par(0, b));
      if (mostrar.indexOf('raiz') >= 0 || temSinal) {
        if (r !== null) linhaInfo('Zero da função:', 'x = −b ÷ a = ' + fmt(r));
        else linhaInfo('Zero da função:', arred(b) === 0 ? 'todo x é zero (f(x) = 0)' : 'não existe (a reta não toca o eixo x)');
      }
      if (temSinal && r !== null) {
        var maior = a > 0 ? 'x > ' + fmt(r) : 'x < ' + fmt(r);
        var menor = a > 0 ? 'x < ' + fmt(r) : 'x > ' + fmt(r);
        linhaInfo('f(x) > 0 para', maior, 'g-pos');
        linhaInfo('f(x) < 0 para', menor, 'g-neg');
      }
      if (controles.indexOf('x') >= 0) {
        linhaInfo('Valor numérico:', 'f(' + fmt(est.x) + ') = ' + fmtP(a) + '·' + fmtP(est.x) + (b < 0 ? ' − ' + fmt(-b) : ' + ' + fmt(b)) + ' = ' + fmt(f(est.x)), 'g-valor');
      }
      if (temDominio) {
        var im1 = Math.min(f(est.dmin), f(est.dmax)), im2 = Math.max(f(est.dmin), f(est.dmax));
        linhaInfo('Domínio:', 'D = ' + intervalo(est.dmin, est.dmax), 'g-dom');
        linhaInfo('Imagem:', 'Im = ' + intervalo(im1, im2), 'g-img');
      }
    }

    // --------------------------------------------------- arrastar pontos
    function paraCoordenadas(evt) {
      var pt = tela.createSVGPoint();
      pt.x = evt.clientX; pt.y = evt.clientY;
      var p = pt.matrixTransform(tela.getScreenCTM().inverse());
      var xx = X0 + p.x / W * (X1 - X0);
      var yy = Y0 + (H - p.y) / H * (Y1 - Y0);
      return {
        x: Math.min(X1, Math.max(X0, Math.round(xx * 2) / 2)),
        y: Math.min(Y1, Math.max(Y0, Math.round(yy * 2) / 2))
      };
    }

    var arrastando = null;
    function ligarArraste(g, i) {
      g.addEventListener('pointerdown', function (e) {
        arrastando = i;
        tela.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      g.addEventListener('keydown', function (e) {
        var P = est.p[i], dx = 0, dy = 0;
        if (e.key === 'ArrowLeft') dx = -0.5;
        else if (e.key === 'ArrowRight') dx = 0.5;
        else if (e.key === 'ArrowUp') dy = 0.5;
        else if (e.key === 'ArrowDown') dy = -0.5;
        else return;
        e.preventDefault();
        P.x = Math.min(X1, Math.max(X0, P.x + dx));
        P.y = Math.min(Y1, Math.max(Y0, P.y + dy));
        desenhar();
        // devolve o foco ao ponto redesenhado
        var novo = camadaPontos.querySelectorAll('.g-ponto--arrastar')[i];
        if (novo) novo.focus();
      });
    }
    tela.addEventListener('pointermove', function (e) {
      if (arrastando === null) return;
      var c = paraCoordenadas(e), P = est.p[arrastando];
      if (c.x !== P.x || c.y !== P.y) { P.x = c.x; P.y = c.y; desenhar(); }
    });
    function soltar() { arrastando = null; }
    tela.addEventListener('pointerup', soltar);
    tela.addEventListener('pointercancel', soltar);

    desenhar();
  }

  function iniciar() {
    var todos = document.querySelectorAll('.grafico-afim');
    for (var i = 0; i < todos.length; i++) {
      try { Grafico(todos[i]); } catch (err) { if (window.console) console.error('grafico-afim:', err); }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
