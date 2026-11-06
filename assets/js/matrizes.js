/*!
 * Matrizes, determinantes e sistemas lineares — interativos das aulas
 * marleson.github.io · JavaScript puro, sem dependências.
 *
 * A página precisa de `interativos: [matrizes]` no front matter.
 * Cada interativo é um <div class="mx" data-tipo="..."> com os atributos abaixo;
 * o conteúdo do div aparece apenas se o JavaScript estiver desligado.
 *
 *   data-tipo="lei"       Matriz pela lei de formação, diagonais e transposta
 *                         data-m, data-n, data-lei (chave de LEIS)
 *   data-tipo="produto"   Multiplicação A·B passo a passo
 *                         data-a="3,2,1;7,0,-3"  data-b="2,1;1,3;4,0"
 *   data-tipo="det"       Determinante (2×2 ou Sarrus 3×3) passo a passo
 *                         data-matriz="1,0,4;7,-2,10;1,5,6"  data-operacoes (propriedades)
 *   data-tipo="area"      det 2×2 como área do paralelogramo (arraste os vetores)
 *                         data-matriz="3,1;1,2"
 *   data-tipo="inversa"   Inversa 2×2 pela regra prática
 *                         data-matriz="2,1;3,3"
 *   data-tipo="sistema"   Sistema 2×2: retas, Cramer e classificação
 *                         data-sistema="3,-1,10;2,5,1"  data-presets="rótulo:a,b,c;d,e,f|..."
 *   data-tipo="escalona"  Escalonamento da matriz completa
 *                         data-matriz="1,1,1,6;1,2,2,9;2,1,3,11"
 *
 *   data-titulo="..."     título exibido no topo (todos)
 */
(function () {
  'use strict';

  // ================================================================ frações
  function mdc(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }

  function Q(n, d) {
    if (d === undefined) d = 1;
    if (d < 0) { n = -n; d = -d; }
    var g = mdc(n, d);
    this.n = n / g || 0; // evita -0
    this.d = d / g;
  }
  Q.prototype.add = function (o) { return new Q(this.n * o.d + o.n * this.d, this.d * o.d); };
  Q.prototype.sub = function (o) { return new Q(this.n * o.d - o.n * this.d, this.d * o.d); };
  Q.prototype.mul = function (o) { return new Q(this.n * o.n, this.d * o.d); };
  Q.prototype.div = function (o) { return new Q(this.n * o.d, this.d * o.n); };
  Q.prototype.neg = function () { return new Q(-this.n, this.d); };
  Q.prototype.zero = function () { return this.n === 0; };
  Q.prototype.eq = function (o) { return this.n === o.n && this.d === o.d; };
  Q.prototype.val = function () { return this.n / this.d; };
  Q.prototype.toString = function () {
    var s = this.d === 1 ? String(Math.abs(this.n)) : Math.abs(this.n) + '/' + this.d;
    return (this.n < 0 ? '−' : '') + s;
  };
  // entre parênteses se negativo: 2·(−3)
  Q.prototype.p = function () { return this.n < 0 ? '(' + this + ')' : String(this); };
  var ZERO = new Q(0), UM = new Q(1);

  // aceita "−3", "1/2", "0,5", "2.5"
  function lerQ(txt) {
    var s = String(txt).trim().replace(/[−–]/g, '-').replace(',', '.');
    if (s === '' || s === '-') return null;
    var m = s.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
    if (m) return +m[2] === 0 ? null : new Q(+m[1], +m[2]);
    if (!/^-?\d*\.?\d+$/.test(s)) return null;
    var casas = (s.split('.')[1] || '').length;
    if (casas > 6) return null;
    var p = Math.pow(10, casas);
    return new Q(Math.round(parseFloat(s) * p), p);
  }

  function lerMatriz(txt) {
    return String(txt).split(';').map(function (l) {
      return l.split(',').map(function (x) { return lerQ(x) || ZERO; });
    });
  }

  function copia(M) { return M.map(function (l) { return l.slice(); }); }
  function transposta(M) { return M[0].map(function (_, j) { return M.map(function (l) { return l[j]; }); }); }

  function det(M) {
    var n = M.length;
    if (n === 1) return M[0][0];
    if (n === 2) return M[0][0].mul(M[1][1]).sub(M[0][1].mul(M[1][0]));
    var s = ZERO;
    for (var j = 0; j < n; j++) {
      var menor = M.slice(1).map(function (l) { return l.filter(function (_, k) { return k !== j; }); });
      var t = M[0][j].mul(det(menor));
      s = j % 2 ? s.sub(t) : s.add(t);
    }
    return s;
  }

  var SUB = '₀₁₂₃₄₅₆₇₈₉';
  function sub(n) { return String(n).split('').map(function (c) { return SUB[+c]; }).join(''); }

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
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (pai) pai.appendChild(e);
    return e;
  }

  function botao(pai, texto, fn, classe) {
    var b = el('button', { type: 'button', class: 'mx-btn' + (classe ? ' ' + classe : '') }, pai, texto);
    b.addEventListener('click', fn);
    return b;
  }

  function seletor(pai, rotulo, opcoes, valor, fn) {
    var l = el('label', { class: 'mx-sel' }, pai);
    if (rotulo) el('span', null, l, rotulo);
    var s = el('select', null, l);
    opcoes.forEach(function (o) {
      var op = el('option', { value: o[0] }, s, o[1]);
      if (String(o[0]) === String(valor)) op.selected = true;
    });
    s.addEventListener('change', function () { fn(s.value); });
    return s;
  }

  // Tabela de matriz. opts: {editavel, aumentada, onInput(i,j,q), classe}
  function tabela(M, opts, pai) {
    opts = opts || {};
    var t = el('table', { class: 'mx-mat' + (opts.aumentada ? ' mx-mat--aum' : '') + (opts.classe ? ' ' + opts.classe : '') }, pai);
    var cel = [];
    M.forEach(function (linha, i) {
      var tr = el('tr', null, t);
      cel.push([]);
      linha.forEach(function (q, j) {
        var td = el('td', null, tr);
        if (opts.aumentada && j === linha.length - 1) td.className = 'mx-aum';
        if (opts.editavel) {
          var inp = el('input', {
            class: 'mx-in', type: 'text', inputmode: 'text', value: String(q),
            'aria-label': (opts.nome || 'a') + sub(i + 1) + sub(j + 1), size: 4, autocomplete: 'off', spellcheck: 'false'
          }, td);
          inp.addEventListener('input', function () {
            var v = lerQ(inp.value);
            inp.classList.toggle('mx-in--erro', !v);
            if (v && opts.onInput) opts.onInput(i, j, v);
          });
          inp.addEventListener('focus', function () { inp.select(); });
        } else {
          td.textContent = String(q);
        }
        cel[i].push(td);
      });
    });
    t._cel = cel;
    return t;
  }

  function limpaDestaques(raiz) {
    raiz.querySelectorAll('.hl-a,.hl-b,.hl-l,.hl-c,.hl-r').forEach(function (e) {
      e.classList.remove('hl-a', 'hl-b', 'hl-l', 'hl-c', 'hl-r');
    });
  }

  function moldura(raiz, tituloPadrao) {
    var conteudo = raiz.innerHTML;
    raiz.innerHTML = '';
    raiz.classList.add('mx--ativo');
    el('p', { class: 'mx__titulo' }, raiz, raiz.getAttribute('data-titulo') || tituloPadrao);
    var corpo = el('div', { class: 'mx__corpo' }, raiz);
    var info = el('div', { class: 'mx__info', 'aria-live': 'polite' }, raiz);
    return { corpo: corpo, info: info, original: conteudo };
  }

  // ================================================================ 1. lei de formação
  var LEIS = {
    '2i+3j': { txt: 'aᵢⱼ = 2i + 3j', f: function (i, j) { return [2 * i + 3 * j, '2·' + i + ' + 3·' + j]; } },
    'i+j': { txt: 'aᵢⱼ = i + j', f: function (i, j) { return [i + j, i + ' + ' + j]; } },
    'i-j': { txt: 'aᵢⱼ = i − j', f: function (i, j) { return [i - j, i + ' − ' + j]; } },
    'ij': { txt: 'aᵢⱼ = i · j', f: function (i, j) { return [i * j, i + '·' + j]; } },
    'i2+j2': { txt: 'aᵢⱼ = i² + j²', f: function (i, j) { return [i * i + j * j, i + '² + ' + j + '²']; } },
    '2ij-1': { txt: 'aᵢⱼ = 2ij − 1', f: function (i, j) { return [2 * i * j - 1, '2·' + i + '·' + j + ' − 1']; } },
    'id': { txt: 'aᵢⱼ = 1 se i = j; 0 se i ≠ j', f: function (i, j) { return [i === j ? 1 : 0, i === j ? 'i = j → 1' : 'i ≠ j → 0']; } },
    'maior': { txt: 'aᵢⱼ = i se i ≥ j; j se i < j', f: function (i, j) { return [i >= j ? i : j, i >= j ? 'i ≥ j → i = ' + i : 'i < j → j = ' + j]; } }
  };

  function Lei(raiz) {
    var m = +raiz.getAttribute('data-m') || 3, n = +raiz.getAttribute('data-n') || 3;
    var lei = raiz.getAttribute('data-lei') || '2i+3j';
    var mostrar = { dp: false, ds: false, t: false };
    var f = moldura(raiz, 'Monte a matriz pela lei de formação');

    var ctr = el('div', { class: 'mx__ctr' }, f.corpo);
    var tam = [[1, '1'], [2, '2'], [3, '3'], [4, '4']];
    seletor(ctr, 'Linhas (m)', tam, m, function (v) { m = +v; desenha(); });
    seletor(ctr, 'Colunas (n)', tam, n, function (v) { n = +v; desenha(); });
    seletor(ctr, 'Lei', Object.keys(LEIS).map(function (k) { return [k, LEIS[k].txt]; }), lei, function (v) { lei = v; desenha(); });
    var tg = el('div', { class: 'mx__toggles' }, f.corpo);
    function toggle(chave, txt) {
      var l = el('label', { class: 'mx-chk' }, tg);
      var c = el('input', { type: 'checkbox' }, l);
      el('span', null, l, txt);
      c.addEventListener('change', function () { mostrar[chave] = c.checked; desenha(); });
      return c;
    }
    var cDp = toggle('dp', 'Diagonal principal'), cDs = toggle('ds', 'Diagonal secundária'), cT = toggle('t', 'Mostrar a transposta');
    var area = el('div', { class: 'mx__mats' }, f.corpo);

    function desenha() {
      area.innerHTML = '';
      limpaDestaques(raiz);
      var quad = m === n;
      cDp.disabled = cDs.disabled = !quad;
      cDp.parentNode.classList.toggle('mx-chk--off', !quad);
      cDs.parentNode.classList.toggle('mx-chk--off', !quad);
      var A = [];
      for (var i = 1; i <= m; i++) {
        A.push([]);
        for (var j = 1; j <= n; j++) A[i - 1].push(new Q(LEIS[lei].f(i, j)[0]));
      }
      var bA = el('div', { class: 'mx__bloco' }, area);
      el('div', { class: 'mx__nome' }, bA, 'A (' + m + '×' + n + ')');
      var tA = tabela(A, null, bA);
      var tT = null;
      if (mostrar.t) {
        var bT = el('div', { class: 'mx__bloco' }, area);
        el('div', { class: 'mx__nome' }, bT, 'Aᵀ (' + n + '×' + m + ')');
        tT = tabela(transposta(A), null, bT);
      }
      tA._cel.forEach(function (linha, i) {
        linha.forEach(function (td, j) {
          if (quad && mostrar.dp && i === j) td.classList.add('mx-dp');
          if (quad && mostrar.ds && i + j === n - 1) td.classList.add('mx-ds');
          td.tabIndex = 0;
          var foco = function () {
            limpaDestaques(raiz);
            tA._cel[i].forEach(function (c) { c.classList.add('hl-l'); });
            tA._cel.forEach(function (l) { l[j].classList.add('hl-c'); });
            td.classList.add('hl-r');
            var r = LEIS[lei].f(i + 1, j + 1);
            var txt = 'a' + sub(i + 1) + sub(j + 1) + ': linha ' + (i + 1) + ', coluna ' + (j + 1) + ' → ' + r[1] + (/→/.test(r[1]) ? '' : ' = ' + new Q(r[0]));
            if (quad && i === j) txt += ' · está na diagonal principal (i = j)';
            else if (quad && i + j === n - 1) txt += ' · está na diagonal secundária (i + j = ' + (n + 1) + ')';
            if (tT) { tT._cel[j][i].classList.add('hl-r'); txt += ' · na transposta, vai para a posição (' + (j + 1) + ', ' + (i + 1) + ')'; }
            f.info.textContent = txt;
          };
          td.addEventListener('mouseenter', foco);
          td.addEventListener('focus', foco);
          td.addEventListener('click', foco);
        });
      });
      var tipo = m === n ? 'quadrada de ordem ' + n : (m === 1 ? 'matriz linha' : n === 1 ? 'matriz coluna' : 'retangular');
      f.info.textContent = 'A é ' + tipo + ' e tem ' + (m * n) + ' elementos. Passe o mouse (ou toque) em um elemento para ver como ele foi calculado.';
    }
    desenha();
  }

  // ================================================================ 2. produto
  function Produto(raiz) {
    var A = lerMatriz(raiz.getAttribute('data-a') || '3,2,1;7,0,-3');
    var B = lerMatriz(raiz.getAttribute('data-b') || '2,1;1,3;4,0');
    var A0 = copia(A), B0 = copia(B);
    var passo = -1;
    var f = moldura(raiz, 'Multiplicação de matrizes passo a passo');

    var ctr = el('div', { class: 'mx__ctr' }, f.corpo);
    var tam = [[1, '1'], [2, '2'], [3, '3'], [4, '4']];
    var sAm = seletor(ctr, 'A: linhas', tam, A.length, function (v) { A = redim(A, +v, A[0].length); reinicia(); });
    var sAn = seletor(ctr, 'A: colunas', tam, A[0].length, function (v) { A = redim(A, A.length, +v); reinicia(); });
    var sBm = seletor(ctr, 'B: linhas', tam, B.length, function (v) { B = redim(B, +v, B[0].length); reinicia(); });
    var sBn = seletor(ctr, 'B: colunas', tam, B[0].length, function (v) { B = redim(B, B.length, +v); reinicia(); });
    var area = el('div', { class: 'mx__mats' }, f.corpo);
    var bts = el('div', { class: 'mx__btns' }, f.corpo);
    botao(bts, '◀ Anterior', function () { ir(passo - 1); });
    botao(bts, 'Próximo ▶', function () { ir(passo + 1); }, 'mx-btn--pri');
    botao(bts, 'Calcular tudo', function () { ir(total() - 1); });
    botao(bts, '⇄ Trocar a ordem (B·A)', function () { var t = A; A = B; B = t; sinc(); reinicia(); });
    botao(bts, '↺ Recomeçar', function () { A = copia(A0); B = copia(B0); sinc(); reinicia(); });

    function sinc() { sAm.value = A.length; sAn.value = A[0].length; sBm.value = B.length; sBn.value = B[0].length; }
    function redim(M, m, n) {
      var R = [];
      for (var i = 0; i < m; i++) { R.push([]); for (var j = 0; j < n; j++) R[i].push(M[i] && M[i][j] ? M[i][j] : ZERO); }
      return R;
    }
    function ok() { return A[0].length === B.length; }
    function total() { return ok() ? A.length * B[0].length : 0; }
    function elem(i, j) {
      var s = ZERO, partes = [];
      for (var k = 0; k < B.length; k++) { s = s.add(A[i][k].mul(B[k][j])); partes.push(A[i][k].p() + '·' + B[k][j].p()); }
      return [s, partes.join(' + ')];
    }
    var tA, tB, tC;
    function reinicia() { passo = -1; desenha(); }
    function desenha() {
      area.innerHTML = '';
      var m = A.length, p = A[0].length, q = B.length, n = B[0].length;
      var bA = el('div', { class: 'mx__bloco' }, area);
      el('div', { class: 'mx__nome' }, bA, 'A (' + m + '×' + p + ')');
      tA = tabela(A, { editavel: true, nome: 'a', onInput: function (i, j, v) { A[i][j] = v; mostra(); } }, bA);
      el('div', { class: 'mx__op' }, area, '·');
      var bB = el('div', { class: 'mx__bloco' }, area);
      el('div', { class: 'mx__nome' }, bB, 'B (' + q + '×' + n + ')');
      tB = tabela(B, { editavel: true, nome: 'b', onInput: function (i, j, v) { B[i][j] = v; mostra(); } }, bB);
      el('div', { class: 'mx__op' }, area, '=');
      var bC = el('div', { class: 'mx__bloco' }, area);
      if (!ok()) {
        el('div', { class: 'mx__nome' }, bC, 'A·B');
        el('div', { class: 'mx-nao' }, bC, 'não existe');
        tC = null;
      } else {
        el('div', { class: 'mx__nome' }, bC, 'A·B (' + m + '×' + n + ')');
        var vazio = [];
        for (var i = 0; i < m; i++) { vazio.push([]); for (var j = 0; j < n; j++) vazio[i].push('?'); }
        tC = tabela(vazio, null, bC);
        tC._cel.forEach(function (l, i) {
          l.forEach(function (td, j) {
            td.tabIndex = 0;
            var vai = function () { ir(i * n + j); };
            td.addEventListener('click', vai);
            td.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); vai(); } });
          });
        });
      }
      mostra();
    }
    function ir(k) {
      if (!ok()) return;
      passo = Math.max(-1, Math.min(total() - 1, k));
      mostra();
    }
    function mostra() {
      limpaDestaques(raiz);
      var m = A.length, p = A[0].length, q = B.length, n = B[0].length;
      var regra = 'A é ' + m + '×' + p + ' e B é ' + q + '×' + n + ': ';
      if (!ok()) {
        f.info.textContent = regra + 'o número de colunas de A (' + p + ') é diferente do número de linhas de B (' + q + '), então o produto A·B não existe.';
        return;
      }
      for (var k = 0; k < total(); k++) {
        var i = Math.floor(k / n), j = k % n;
        tC._cel[i][j].textContent = k <= passo ? String(elem(i, j)[0]) : '?';
      }
      if (passo < 0) {
        f.info.textContent = regra + 'colunas de A = linhas de B = ' + p + ', então A·B existe e é ' + m + '×' + n + '. Clique em “Próximo” ou em uma casa do resultado.';
        return;
      }
      var i0 = Math.floor(passo / n), j0 = passo % n, r = elem(i0, j0);
      tA._cel[i0].forEach(function (c) { c.classList.add('hl-l'); });
      tB._cel.forEach(function (l) { l[j0].classList.add('hl-c'); });
      tC._cel[i0][j0].classList.add('hl-r');
      f.info.textContent = 'c' + sub(i0 + 1) + sub(j0 + 1) + ' = (linha ' + (i0 + 1) + ' de A) × (coluna ' + (j0 + 1) + ' de B) = ' + r[1] + ' = ' + r[0] + '   ·   passo ' + (passo + 1) + ' de ' + total();
    }
    desenha();
  }

  // ================================================================ 3. determinante (Sarrus)
  function Det(raiz) {
    var M = lerMatriz(raiz.getAttribute('data-matriz') || '1,0,4;7,-2,10;1,5,6');
    var M0 = copia(M), n = M.length;
    var comOps = raiz.hasAttribute('data-operacoes');
    var passo = -1;
    var f = moldura(raiz, n === 3 ? 'Regra de Sarrus passo a passo' : 'Determinante de ordem 2 passo a passo');

    // diagonais: [células], sinal
    var diag = n === 2
      ? [[[[0, 0], [1, 1]], 1], [[[0, 1], [1, 0]], -1]]
      : [[[[0, 0], [1, 1], [2, 2]], 1], [[[0, 1], [1, 2], [2, 3]], 1], [[[0, 2], [1, 3], [2, 4]], 1],
         [[[0, 2], [1, 1], [2, 0]], -1], [[[0, 3], [1, 2], [2, 1]], -1], [[[0, 4], [1, 3], [2, 2]], -1]];

    var area = el('div', { class: 'mx__mats' }, f.corpo);
    var bts = el('div', { class: 'mx__btns' }, f.corpo);
    botao(bts, '◀ Anterior', function () { ir(passo - 1); });
    botao(bts, 'Próximo ▶', function () { ir(passo + 1); }, 'mx-btn--pri');
    botao(bts, 'Mostrar tudo', function () { ir(diag.length - 1); });
    botao(bts, '↺ Recomeçar', function () { M = copia(M0); log.innerHTML = ''; desenha(); });
    var termos = el('ol', { class: 'mx-termos' }, f.corpo);

    var opsSel, log;
    if (comOps) {
      var ops = el('div', { class: 'mx__ops' }, f.corpo);
      el('p', { class: 'mx__ops-tit' }, ops, 'Teste as propriedades: aplique uma operação e veja o que acontece com o determinante.');
      var lin = []; for (var r = 1; r <= n; r++) lin.push([r - 1, 'L' + sub(r)]);
      var linha = el('div', { class: 'mx__ctr' }, ops);
      var tipo = 'troca', li = 0, lj = 1;
      opsSel = seletor(linha, 'Operação', [['troca', 'Trocar duas linhas'], ['mult', 'Multiplicar uma linha por k'], ['soma', 'Somar a uma linha k vezes outra'], ['transp', 'Transpor a matriz']], tipo, function (v) { tipo = v; atualizaOps(); });
      var sI = seletor(linha, 'linha', lin, 0, function (v) { li = +v; });
      var sJ = seletor(linha, 'outra linha', lin, 1, function (v) { lj = +v; });
      var lk = el('label', { class: 'mx-sel' }, linha);
      el('span', null, lk, 'k =');
      var inK = el('input', { class: 'mx-in', type: 'text', value: '2', size: 3, 'aria-label': 'valor de k' }, lk);
      botao(linha, 'Aplicar', function () {
        var k = lerQ(inK.value);
        var antes = det(M), nome;
        if (tipo === 'troca') {
          if (li === lj) { aviso('Escolha duas linhas diferentes.'); return; }
          var t = M[li]; M[li] = M[lj]; M[lj] = t; nome = 'L' + sub(li + 1) + ' ↔ L' + sub(lj + 1);
        } else if (tipo === 'mult') {
          if (!k) { aviso('Digite um valor válido para k.'); return; }
          M[li] = M[li].map(function (x) { return x.mul(k); }); nome = 'L' + sub(li + 1) + ' ← ' + k + '·L' + sub(li + 1);
        } else if (tipo === 'soma') {
          if (!k || li === lj) { aviso(li === lj ? 'Escolha duas linhas diferentes.' : 'Digite um valor válido para k.'); return; }
          M[li] = M[li].map(function (x, c) { return x.add(k.mul(M[lj][c])); }); nome = 'L' + sub(li + 1) + ' ← L' + sub(li + 1) + ' + ' + k.p() + '·L' + sub(lj + 1);
        } else {
          M = transposta(M); nome = 'A → Aᵀ';
        }
        var depois = det(M), efeito;
        if (depois.eq(antes)) efeito = 'o determinante não mudou';
        else if (!antes.zero() && depois.eq(antes.neg())) efeito = 'o determinante trocou de sinal';
        else if (!antes.zero()) efeito = 'o determinante foi multiplicado por ' + depois.div(antes);
        else efeito = 'o determinante mudou';
        var it = el('li', null, null, nome + ':  det ' + antes + ' → ' + depois + '  (' + efeito + ')');
        log.insertBefore(it, log.firstChild);
        passo = -1; desenha();
      }, 'mx-btn--pri');
      function atualizaOps() {
        sI.parentNode.style.display = tipo === 'transp' ? 'none' : '';
        sJ.parentNode.style.display = tipo === 'troca' || tipo === 'soma' ? '' : 'none';
        lk.style.display = tipo === 'mult' || tipo === 'soma' ? '' : 'none';
      }
      atualizaOps();
      log = el('ul', { class: 'mx-log' }, ops);
    } else {
      log = el('ul', { class: 'mx-log' });
    }
    function aviso(t) { f.info.textContent = t; }

    var tE;
    function estendida() {
      return M.map(function (l) { return n === 3 ? l.concat([l[0], l[1]]) : l.slice(); });
    }
    function desenha() {
      area.innerHTML = '';
      var b = el('div', { class: 'mx__bloco' }, area);
      el('div', { class: 'mx__nome' }, b, n === 3 ? 'A com a 1ª e a 2ª colunas repetidas' : 'A');
      tE = tabela(estendida(), {
        editavel: true, nome: 'a', classe: n === 3 ? 'mx-mat--sarrus' : '',
        onInput: function (i, j, v) {
          M[i][j % n] = v;
          // mantém as colunas repetidas iguais às originais
          tE._cel.forEach(function (l, r) {
            l.forEach(function (td, c) {
              if (c % n === j % n && r === i && c !== j) td.querySelector('input').value = String(v);
            });
          });
          mostra();
        }
      }, b);
      if (n === 3) tE._cel.forEach(function (l) { l[3].classList.add('mx-rep'); l[4].classList.add('mx-rep'); });
      mostra();
    }
    function ir(k) { passo = Math.max(-1, Math.min(diag.length - 1, k)); mostra(); }
    function termo(d) {
      var cels = d[0], v = UM, txt = [];
      cels.forEach(function (c) { var x = M[c[0]][c[1] % n]; v = v.mul(x); txt.push(x.p()); });
      return { v: d[1] > 0 ? v : v.neg(), txt: txt.join('·'), bruto: v, sinal: d[1] };
    }
    function mostra() {
      limpaDestaques(raiz);
      termos.innerHTML = '';
      var soma = ZERO;
      for (var k = 0; k <= passo; k++) {
        var t = termo(diag[k]);
        soma = soma.add(t.v);
        var li = el('li', { class: t.sinal > 0 ? 'mx-t--pos' : 'mx-t--neg' }, termos);
        var res = t.sinal > 0 || t.bruto.zero() ? String(t.v)
          : (t.bruto.n < 0 ? '−' + t.bruto.p() + ' = ' + t.v : String(t.v));
        li.textContent = (t.sinal > 0 ? 'Mantém o sinal:  +' : 'Troca o sinal:  −') + '(' + t.txt + ') = ' + res;
      }
      if (passo >= 0) {
        diag[passo][0].forEach(function (c) { tE._cel[c[0]][c[1]].classList.add(diag[passo][1] > 0 ? 'hl-a' : 'hl-b'); });
        var fim = passo === diag.length - 1;
        f.info.textContent = (fim ? 'det A = ' : 'Soma parcial = ') + soma + (fim ? (soma.zero() ? '  →  det A = 0: A não tem inversa.' : '  →  det A ≠ 0: A tem inversa.') : '   ·   produto ' + (passo + 1) + ' de ' + diag.length);
      } else {
        f.info.textContent = (n === 3 ? 'Diagonais azuis (sentido da diagonal principal) mantêm o sinal; vermelhas (sentido da secundária) trocam o sinal. ' : 'Diagonal principal (azul) mantém o sinal; a secundária (vermelha) troca. ') + 'Clique em “Próximo” ou edite os números.';
      }
    }
    desenha();
  }

  // ================================================================ 4. área (det 2×2)
  function Area(raiz) {
    var M = lerMatriz(raiz.getAttribute('data-matriz') || '3,1;1,2');
    var u = [M[0][0].val(), M[1][0].val()], v = [M[0][1].val(), M[1][1].val()];
    var u0 = u.slice(), v0 = v.slice();
    var X0 = -2, X1 = 7, Y0 = -2, Y1 = 7, W = 360, H = 360;
    var f = moldura(raiz, 'O determinante como área');
    var grade = el('div', { class: 'mx__duas' }, f.corpo);
    var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'mx-svg', role: 'img', 'aria-label': 'Paralelogramo formado pelas colunas da matriz' }, grade);
    var lado = el('div', { class: 'mx__lado' }, grade);
    function px(x) { return (x - X0) / (X1 - X0) * W; }
    function py(y) { return H - (y - Y0) / (Y1 - Y0) * H; }
    var g = svg('g', { class: 'g-grade' }, s);
    for (var x = X0; x <= X1; x++) svg('line', { x1: px(x), y1: 0, x2: px(x), y2: H }, g);
    for (var y = Y0; y <= Y1; y++) svg('line', { x1: 0, y1: py(y), x2: W, y2: py(y) }, g);
    var e = svg('g', { class: 'g-eixo' }, s);
    svg('line', { x1: 0, y1: py(0), x2: W, y2: py(0) }, e);
    svg('line', { x1: px(0), y1: 0, x2: px(0), y2: H }, e);
    var pol = svg('polygon', { class: 'mx-par' }, s);
    var lu = svg('line', { class: 'mx-vet mx-vet--u' }, s), lv = svg('line', { class: 'mx-vet mx-vet--v' }, s);
    function alca(cl, rot) {
      var gg = svg('g', { class: 'g-ponto g-ponto--arrastar ' + cl, tabindex: 0, role: 'slider', 'aria-label': rot }, s);
      svg('circle', { r: 16, class: 'g-alvo' }, gg); svg('circle', { r: 6.5 }, gg);
      var t = svg('text', { dx: 10, dy: -10 }, gg);
      return { g: gg, t: t };
    }
    var hu = alca('mx-h--u', 'Vetor u (1ª coluna)'), hv = alca('mx-h--v', 'Vetor v (2ª coluna)');
    var mat = el('div', { class: 'mx__bloco' }, lado);
    var calc = el('div', { class: 'mx-calc' }, lado);
    botao(lado, '↺ Recomeçar', function () { u = u0.slice(); v = v0.slice(); desenha(); });
    el('p', { class: 'mx__dica' }, lado, 'Arraste as pontas dos vetores (ou use as setas do teclado). As colunas de A são os vetores u e v; a área do paralelogramo é |det A|.');

    function arrastar(h, alvo) {
      var ativo = false;
      function pos(ev) {
        var r = s.getBoundingClientRect();
        var x = X0 + (ev.clientX - r.left) / r.width * (X1 - X0);
        var y = Y0 + (1 - (ev.clientY - r.top) / r.height) * (Y1 - Y0);
        alvo[0] = Math.max(X0, Math.min(X1, Math.round(x)));
        alvo[1] = Math.max(Y0, Math.min(Y1, Math.round(y)));
        desenha();
      }
      h.g.addEventListener('pointerdown', function (ev) { ativo = true; h.g.setPointerCapture(ev.pointerId); ev.preventDefault(); });
      h.g.addEventListener('pointermove', function (ev) { if (ativo) pos(ev); });
      h.g.addEventListener('pointerup', function () { ativo = false; });
      h.g.addEventListener('keydown', function (ev) {
        var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[ev.key];
        if (!d) return;
        ev.preventDefault();
        alvo[0] = Math.max(X0, Math.min(X1, alvo[0] + d[0]));
        alvo[1] = Math.max(Y0, Math.min(Y1, alvo[1] + d[1]));
        desenha();
      });
    }
    arrastar(hu, u); arrastar(hv, v);

    function desenha() {
      var a = u[0], c = u[1], b = v[0], d = v[1], D = a * d - b * c;
      pol.setAttribute('points', [[0, 0], u, [u[0] + v[0], u[1] + v[1]], v].map(function (p) { return px(p[0]) + ',' + py(p[1]); }).join(' '));
      pol.setAttribute('class', 'mx-par ' + (D > 0 ? 'mx-par--pos' : D < 0 ? 'mx-par--neg' : ''));
      [[lu, u], [lv, v]].forEach(function (p) { p[0].setAttribute('x1', px(0)); p[0].setAttribute('y1', py(0)); p[0].setAttribute('x2', px(p[1][0])); p[0].setAttribute('y2', py(p[1][1])); });
      hu.g.setAttribute('transform', 'translate(' + px(a) + ',' + py(c) + ')'); hu.t.textContent = 'u = (' + a + '; ' + c + ')';
      hv.g.setAttribute('transform', 'translate(' + px(b) + ',' + py(d) + ')'); hv.t.textContent = 'v = (' + b + '; ' + d + ')';
      mat.innerHTML = '';
      el('div', { class: 'mx__nome' }, mat, 'A = [ u  v ]');
      var t = tabela([[new Q(a), new Q(b)], [new Q(c), new Q(d)]], null, mat);
      t._cel[0][0].classList.add('mx-col-u'); t._cel[1][0].classList.add('mx-col-u');
      t._cel[0][1].classList.add('mx-col-v'); t._cel[1][1].classList.add('mx-col-v');
      var qa = new Q(a), qb = new Q(b), qc = new Q(c), qd = new Q(d);
      calc.textContent = 'det A = ' + qa.p() + '·' + qd.p() + ' − ' + qb.p() + '·' + qc.p() + ' = ' + new Q(D);
      f.info.textContent = D === 0
        ? 'det A = 0: os vetores estão alinhados e o “paralelogramo” achatou (área 0). Essa matriz não tem inversa.'
        : 'Área do paralelogramo = |det A| = ' + Math.abs(D) + (D > 0 ? '. det > 0: de u para v giramos no sentido anti-horário.' : '. det < 0: de u para v giramos no sentido horário (o sinal indica a orientação).');
    }
    desenha();
  }

  // ================================================================ 5. inversa 2×2
  function Inversa(raiz) {
    var M = lerMatriz(raiz.getAttribute('data-matriz') || '2,1;3,3');
    var M0 = copia(M);
    var f = moldura(raiz, 'Inversa de uma matriz 2×2');
    var area = el('div', { class: 'mx__mats' }, f.corpo);
    var passos = el('ol', { class: 'mx-termos mx-termos--passos' }, f.corpo);
    var bts = el('div', { class: 'mx__btns' }, f.corpo);
    botao(bts, '↺ Recomeçar', function () { M = copia(M0); desenha(); });
    var tR, tP;
    function desenha() {
      area.innerHTML = '';
      var b = el('div', { class: 'mx__bloco' }, area);
      el('div', { class: 'mx__nome' }, b, 'A');
      tabela(M, { editavel: true, nome: 'a', onInput: function (i, j, v) { M[i][j] = v; calcula(); } }, b);
      el('div', { class: 'mx__op' }, area, '→');
      var c = el('div', { class: 'mx__bloco' }, area);
      el('div', { class: 'mx__nome' }, c, 'A⁻¹');
      tR = el('div', null, c);
      el('div', { class: 'mx__op' }, area, '');
      var p = el('div', { class: 'mx__bloco' }, area);
      el('div', { class: 'mx__nome' }, p, 'Conferindo: A·A⁻¹');
      tP = el('div', null, p);
      calcula();
    }
    function calcula() {
      var a = M[0][0], b = M[0][1], c = M[1][0], d = M[1][1], D = det(M);
      passos.innerHTML = '';
      tR.innerHTML = ''; tP.innerHTML = '';
      el('li', null, passos, 'Calcule o determinante: det A = ' + a.p() + '·' + d.p() + ' − ' + b.p() + '·' + c.p() + ' = ' + D + '.');
      if (D.zero()) {
        el('li', null, passos, 'Como det A = 0, a matriz A não tem inversa (não é invertível).');
        el('div', { class: 'mx-nao' }, tR, 'não existe');
        el('div', { class: 'mx-nao' }, tP, '—');
        f.info.textContent = 'det A = 0 → não existe A⁻¹.';
        return;
      }
      el('li', null, passos, 'Troque de posição os elementos da diagonal principal (' + a + ' e ' + d + ') e troque o sinal dos elementos da diagonal secundária (' + b + ' e ' + c + '): [ ' + d + '  ' + b.neg() + ' ; ' + c.neg() + '  ' + a + ' ].');
      el('li', null, passos, 'Divida todos os elementos por det A = ' + D + '.');
      var I = [[d.div(D), b.neg().div(D)], [c.neg().div(D), a.div(D)]];
      tabela(I, null, tR);
      var P = [[0, 1].map(function (j) { return M[0][0].mul(I[0][j]).add(M[0][1].mul(I[1][j])); }),
               [0, 1].map(function (j) { return M[1][0].mul(I[0][j]).add(M[1][1].mul(I[1][j])); })];
      tabela(P, null, tP);
      f.info.textContent = 'A⁻¹ = (1/' + D + ')·[ ' + d + '  ' + b.neg() + ' ; ' + c.neg() + '  ' + a + ' ]. Como A·A⁻¹ = I₂, a conta está certa. Também vale det A⁻¹ = 1/det A = ' + UM.div(D) + '.';
    }
    desenha();
  }

  // ================================================================ 6. sistema 2×2
  function Sistema(raiz) {
    var S = lerMatriz(raiz.getAttribute('data-sistema') || '3,-1,10;2,5,1');
    var S0 = copia(S);
    var jan = (raiz.getAttribute('data-janela') || '-6,6,-6,6').split(',').map(Number);
    var X0 = jan[0], X1 = jan[1], Y0 = jan[2], Y1 = jan[3];
    var W = 400, H = W * (Y1 - Y0) / (X1 - X0);
    var f = moldura(raiz, 'Sistema 2×2: duas retas no plano');
    var presets = (raiz.getAttribute('data-presets') || '').split('|').filter(Boolean).map(function (p) {
      var k = p.indexOf(':'); return { rot: p.slice(0, k), m: lerMatriz(p.slice(k + 1)) };
    });

    var grade = el('div', { class: 'mx__duas' }, f.corpo);
    var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'mx-svg', role: 'img', 'aria-label': 'Gráfico das duas retas do sistema' }, grade);
    var lado = el('div', { class: 'mx__lado' }, grade);
    function px(x) { return (x - X0) / (X1 - X0) * W; }
    function py(y) { return H - (y - Y0) / (Y1 - Y0) * H; }
    svg('clipPath', { id: 'mxclip' + (++cont) }, s).appendChild(svg('rect', { x: 0, y: 0, width: W, height: H }));
    var clip = 'url(#mxclip' + cont + ')';
    var g = svg('g', { class: 'g-grade' }, s);
    for (var x = X0; x <= X1; x++) svg('line', { x1: px(x), y1: 0, x2: px(x), y2: H }, g);
    for (var y = Y0; y <= Y1; y++) svg('line', { x1: 0, y1: py(y), x2: W, y2: py(y) }, g);
    var e = svg('g', { class: 'g-eixo' }, s);
    svg('line', { x1: 0, y1: py(0), x2: W, y2: py(0) }, e);
    svg('line', { x1: px(0), y1: 0, x2: px(0), y2: H }, e);
    var rot = svg('g', { class: 'g-rotulo' }, s);
    for (x = X0 + 1; x < X1; x++) if (x) { var tx = svg('text', { x: px(x), y: py(0) + 13, 'text-anchor': 'middle' }, rot); tx.textContent = String(x).replace('-', '−'); }
    for (y = Y0 + 1; y < Y1; y++) if (y) { var ty = svg('text', { x: px(0) - 5, y: py(y) + 4, 'text-anchor': 'end' }, rot); ty.textContent = String(y).replace('-', '−'); }
    var r1 = svg('line', { class: 'mx-reta mx-reta--1', 'clip-path': clip }, s);
    var r2 = svg('line', { class: 'mx-reta mx-reta--2', 'clip-path': clip }, s);
    var pt = svg('g', { class: 'g-ponto mx-sol' }, s);
    svg('circle', { r: 6 }, pt);
    var ptT = svg('text', { dx: 9, dy: -9 }, pt);

    var eqs = el('div', { class: 'mx-eqs' }, lado);
    var inps = [];
    [0, 1].forEach(function (i) {
      var linha = el('div', { class: 'mx-eq mx-eq--' + (i + 1) }, eqs);
      el('span', { class: 'mx-eq__n' }, linha, i ? '(II)' : '(I)');
      inps.push([]);
      [['x', 0], ['y', 1], ['', 2]].forEach(function (par, k) {
        var inp = el('input', { class: 'mx-in', type: 'text', value: String(S[i][k]), size: 3, 'aria-label': (i ? 'equação II, ' : 'equação I, ') + (k === 2 ? 'termo independente' : 'coeficiente de ' + par[0]) }, linha);
        inp.addEventListener('input', function () {
          var v = lerQ(inp.value); inp.classList.toggle('mx-in--erro', !v);
          if (v) { S[i][k] = v; desenha(); }
        });
        inp.addEventListener('focus', function () { inp.select(); });
        inps[i].push(inp);
        if (k === 0) el('span', null, linha, 'x +');
        if (k === 1) el('span', null, linha, 'y =');
      });
    });
    var calc = el('div', { class: 'mx-calc' }, lado);
    var bts = el('div', { class: 'mx__btns' }, lado);
    presets.forEach(function (p) { botao(bts, p.rot, function () { S = copia(p.m); sinc(); desenha(); }); });
    botao(bts, '↺ Recomeçar', function () { S = copia(S0); sinc(); desenha(); });
    function sinc() { inps.forEach(function (l, i) { l.forEach(function (inp, k) { inp.value = String(S[i][k]); inp.classList.remove('mx-in--erro'); }); }); }

    function reta(linha, a, b, c) {
      // ax + by = c
      a = a.val(); b = b.val(); c = c.val();
      linha.style.display = '';
      if (b !== 0) {
        linha.setAttribute('x1', px(X0 - 1)); linha.setAttribute('y1', py((c - a * (X0 - 1)) / b));
        linha.setAttribute('x2', px(X1 + 1)); linha.setAttribute('y2', py((c - a * (X1 + 1)) / b));
      } else if (a !== 0) {
        linha.setAttribute('x1', px(c / a)); linha.setAttribute('y1', py(Y0 - 1));
        linha.setAttribute('x2', px(c / a)); linha.setAttribute('y2', py(Y1 + 1));
      } else {
        linha.style.display = 'none';
      }
    }
    function eqTxt(l) {
      var a = l[0], b = l[1], c = l[2], t = '';
      if (!a.zero()) t += (a.eq(UM) ? '' : a.eq(UM.neg()) ? '−' : String(a)) + 'x';
      if (!b.zero()) {
        var bb = b.n < 0 ? b.neg() : b;
        t += (t ? (b.n < 0 ? ' − ' : ' + ') : (b.n < 0 ? '−' : '')) + (bb.eq(UM) ? '' : String(bb)) + 'y';
      }
      return (t || '0') + ' = ' + c;
    }
    function desenha() {
      var a = S[0][0], b = S[0][1], c = S[0][2], d = S[1][0], e2 = S[1][1], f2 = S[1][2];
      reta(r1, a, b, c); reta(r2, d, e2, f2);
      var D = a.mul(e2).sub(b.mul(d)), Dx = c.mul(e2).sub(b.mul(f2)), Dy = a.mul(f2).sub(c.mul(d));
      calc.innerHTML = '';
      el('div', null, calc, '(I) ' + eqTxt(S[0]) + '     (II) ' + eqTxt(S[1]));
      el('div', null, calc, 'D = ' + a.p() + '·' + e2.p() + ' − ' + b.p() + '·' + d.p() + ' = ' + D);
      el('div', { html: 'D<sub>x</sub> = ' + c.p() + '·' + e2.p() + ' − ' + b.p() + '·' + f2.p() + ' = ' + Dx }, calc);
      el('div', { html: 'D<sub>y</sub> = ' + a.p() + '·' + f2.p() + ' − ' + c.p() + '·' + d.p() + ' = ' + Dy }, calc);
      var degenerada = (a.zero() && b.zero()) || (d.zero() && e2.zero());
      raiz.classList.remove('mx--spd', 'mx--spi', 'mx--si');
      pt.style.display = 'none';
      if (degenerada) {
        f.info.textContent = 'Uma das equações tem os dois coeficientes iguais a zero: ela não representa uma reta. Escolha outros valores.';
        return;
      }
      if (!D.zero()) {
        var xs = Dx.div(D), ys = Dy.div(D);
        raiz.classList.add('mx--spd');
        pt.style.display = '';
        pt.setAttribute('transform', 'translate(' + px(xs.val()) + ',' + py(ys.val()) + ')');
        ptT.textContent = '(' + xs + '; ' + ys + ')';
        var fora = xs.val() < X0 || xs.val() > X1 || ys.val() < Y0 || ys.val() > Y1;
        f.info.innerHTML = 'D ≠ 0 → retas concorrentes → Sistema Possível e Determinado (SPD). Solução única: x = D<sub>x</sub>/D = ' + xs + ' e y = D<sub>y</sub>/D = ' + ys + '.' + (fora ? ' (O ponto está fora da janela do gráfico.)' : '');
      } else if (Dx.zero() && Dy.zero()) {
        raiz.classList.add('mx--spi');
        f.info.innerHTML = 'D = D<sub>x</sub> = D<sub>y</sub> = 0 → as duas equações representam a mesma reta (retas coincidentes) → Sistema Possível e Indeterminado (SPI): infinitas soluções.';
      } else {
        raiz.classList.add('mx--si');
        f.info.innerHTML = 'D = 0, mas D<sub>x</sub> ou D<sub>y</sub> ≠ 0 → retas paralelas distintas, sem ponto em comum → Sistema Impossível (SI): S = ∅.';
      }
    }
    desenha();
  }

  // ================================================================ 7. escalonamento
  function Escalona(raiz) {
    var M = lerMatriz(raiz.getAttribute('data-matriz') || '1,1,1,6;1,2,2,9;2,1,3,11');
    var M0 = copia(M), hist = [];
    var m = M.length, nc = M[0].length, nv = nc - 1;
    var VARS = nv <= 3 ? ['x', 'y', 'z'] : ['x₁', 'x₂', 'x₃', 'x₄'];
    var f = moldura(raiz, 'Escalonamento passo a passo');

    var atual = el('div', { class: 'mx__mats' }, f.corpo);
    var ctr = el('div', { class: 'mx__ctr' }, f.corpo);
    var lin = []; for (var r = 0; r < m; r++) lin.push([r, 'L' + sub(r + 1)]);
    var tipo = 'soma', li = 1, lj = 0;
    var sT = seletor(ctr, 'Operação', [['soma', 'Lᵢ ← Lᵢ + k·Lⱼ'], ['troca', 'Lᵢ ↔ Lⱼ'], ['mult', 'Lᵢ ← k·Lᵢ']], tipo, function (v) { tipo = v; vis(); });
    var sI = seletor(ctr, 'i', lin, li, function (v) { li = +v; });
    var sJ = seletor(ctr, 'j', lin, lj, function (v) { lj = +v; });
    var lk = el('label', { class: 'mx-sel' }, ctr);
    el('span', null, lk, 'k =');
    var inK = el('input', { class: 'mx-in', type: 'text', value: '-1', size: 3, 'aria-label': 'valor de k' }, lk);
    botao(ctr, 'Aplicar', function () {
      var k = lerQ(inK.value);
      if (tipo !== 'troca' && (!k || k.zero())) { f.info.textContent = 'Digite um número k diferente de zero.'; return; }
      if (tipo !== 'mult' && li === lj) { f.info.textContent = 'Escolha duas linhas diferentes.'; return; }
      aplica(tipo, li, lj, k);
    }, 'mx-btn--pri');
    function vis() {
      sJ.parentNode.style.display = tipo === 'mult' ? 'none' : '';
      lk.style.display = tipo === 'troca' ? 'none' : '';
    }
    vis();
    var bts = el('div', { class: 'mx__btns' }, f.corpo);
    botao(bts, '✦ Sugerir e aplicar o próximo passo', function () {
      var p = sugestao();
      if (!p) { resolve(); return; }
      aplica(p[0], p[1], p[2], p[3]);
    }, 'mx-btn--pri');
    botao(bts, '↶ Desfazer', function () { if (hist.length) { M = hist.pop().antes; desenha(); } });
    botao(bts, '↺ Recomeçar', function () { M = copia(M0); hist = []; desenha(); });
    var historico = el('ol', { class: 'mx-hist' }, f.corpo);
    var resultado = el('div', { class: 'mx-calc' }, f.corpo);

    function aplica(t, i, j, k) {
      var antes = copia(M), nome;
      if (t === 'troca') { var x = M[i]; M[i] = M[j]; M[j] = x; nome = 'L' + sub(i + 1) + ' ↔ L' + sub(j + 1); }
      else if (t === 'mult') { M[i] = M[i].map(function (v) { return v.mul(k); }); nome = 'L' + sub(i + 1) + ' ← ' + k.p() + '·L' + sub(i + 1); }
      else {
        M[i] = M[i].map(function (v, c) { return v.add(k.mul(M[j][c])); });
        nome = 'L' + sub(i + 1) + ' ← L' + sub(i + 1) + (k.n < 0 ? ' − ' + (k.eq(UM.neg()) ? '' : k.neg() + '·') : ' + ' + (k.eq(UM) ? '' : k + '·')) + 'L' + sub(j + 1);
      }
      hist.push({ antes: antes, nome: nome });
      desenha();
    }

    // próximo passo da eliminação de Gauss (ou null se já escalonada)
    function sugestao() {
      var r = 0;
      for (var c = 0; c < nv && r < m; c++) {
        var p = -1;
        for (var i = r; i < m; i++) if (!M[i][c].zero()) { p = i; break; }
        if (p < 0) continue;
        // prefere um pivô 1 ou −1 (evita frações), trocando linhas se preciso
        if (Math.abs(M[p][c].val()) !== 1) {
          for (i = r; i < m; i++) if (Math.abs(M[i][c].val()) === 1) { p = i; break; }
        }
        if (p !== r) return ['troca', r, p];
        for (i = r + 1; i < m; i++) if (!M[i][c].zero()) return ['soma', i, r, M[i][c].div(M[r][c]).neg()];
        r++;
      }
      return null;
    }

    function escalonada() {
      var ult = -1;
      for (var i = 0; i < m; i++) {
        var p = -1;
        for (var c = 0; c < nc; c++) if (!M[i][c].zero()) { p = c; break; }
        if (p < 0) { ult = nc; continue; }
        if (p <= ult) return false;
        ult = p;
      }
      return true;
    }

    function desenha() {
      atual.innerHTML = '';
      var b = el('div', { class: 'mx__bloco' }, atual);
      el('div', { class: 'mx__nome' }, b, 'Matriz completa');
      tabela(M, {
        aumentada: true, editavel: hist.length === 0, nome: 'm',
        onInput: function (i, j, v) { M[i][j] = v; M0 = copia(M); resolve(); }
      }, b);
      historico.innerHTML = '';
      hist.forEach(function (h) { el('li', null, historico, h.nome); });
      resolve();
    }

    function resolve() {
      resultado.innerHTML = '';
      raiz.classList.remove('mx--si');
      if (!escalonada()) {
        f.info.textContent = (hist.length ? 'Ainda não está escalonada. ' : 'Objetivo: zerar os elementos abaixo de cada pivô (o primeiro número não nulo de cada linha). ') +
          'Escolha uma operação ou use “Sugerir”. ' + (hist.length === 0 ? 'Você também pode editar os números antes de começar.' : '');
        return;
      }
      // linha 0 = k (k ≠ 0)?
      for (var i = 0; i < m; i++) {
        var nul = M[i].slice(0, nv).every(function (q) { return q.zero(); });
        if (nul && !M[i][nv].zero()) {
          f.info.textContent = 'Escalonada! A linha ' + (i + 1) + ' diz 0 = ' + M[i][nv] + ', o que é impossível → Sistema Impossível (SI): S = ∅.';
          raiz.classList.add('mx--si');
          return;
        }
      }
      var piv = [];
      for (i = 0; i < m; i++) {
        for (var c = 0; c < nv; c++) if (!M[i][c].zero()) { piv.push([i, c]); break; }
      }
      if (piv.length < nv) {
        f.info.textContent = 'Escalonada! Há ' + piv.length + ' equação(ões) com pivô para ' + nv + ' incógnitas: sobra(m) incógnita(s) livre(s) → Sistema Possível e Indeterminado (SPI): infinitas soluções.';
        return;
      }
      // substituição de trás para frente
      var sol = [], linhas = [];
      for (var k = piv.length - 1; k >= 0; k--) {
        i = piv[k][0]; c = piv[k][1];
        var s = M[i][nv], conta = [];
        for (var j = c + 1; j < nv; j++) if (!M[i][j].zero()) { s = s.sub(M[i][j].mul(sol[j])); conta.push(M[i][j].p() + '·' + sol[j].p()); }
        sol[c] = s.div(M[i][c]);
        linhas.unshift('Linha ' + (i + 1) + ': ' + M[i][c].p() + VARS[c] + (conta.length ? ' + ' + conta.join(' + ') : '') + ' = ' + M[i][nv] + '  ⇒  ' + VARS[c] + ' = ' + sol[c]);
      }
      linhas.forEach(function (t) { el('div', null, resultado, t); });
      f.info.textContent = 'Escalonada! Resolvendo de baixo para cima: ' + sol.map(function (q, c) { return VARS[c] + ' = ' + q; }).join(', ') + ' → Sistema Possível e Determinado (SPD).';
    }
    desenha();
  }

  // ================================================================ inicialização
  var cont = 0;
  var TIPOS = { lei: Lei, produto: Produto, det: Det, area: Area, inversa: Inversa, sistema: Sistema, escalona: Escalona };
  function iniciar() {
    document.querySelectorAll('.mx[data-tipo]').forEach(function (r) {
      var F = TIPOS[r.getAttribute('data-tipo')];
      if (!F || r.classList.contains('mx--ativo')) return;
      try { F(r); } catch (e) { if (window.console) console.error('[matrizes]', e); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
