---
title: "Estudo da Covid-19 pelo modelo SIR"
excerpt: 'Sobre o SIR'
tagline: "Uma abordagem com os dados do estado do Amapá"
date: 2020-05-10
tags: [modelo SIR, covid19, coronavirus, amapá]

# classes: wide
#collection: notas # collection name
# entries_layout: # list (default), grid
# show_excerpts: # true (default), false
# sort_by: # date (default) title
# sort_order: # forward (default), reverse
toc: true
toc_label: "Sumário"
toc_sticky: true
mathjax: true
header: 
  overlay_color: "#000"
  overlay_filter: "0.5"
  overlay_image: images/covid-19.jpg
  caption: "[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/marleson/marleson.github.io/master?filepath=_jupyter%2Fcovid-19-SIR-model-ap.ipynb)"
  actions:
  - label: "Jupyter Notebook"
    url: "https://mybinder.org/v2/gh/marleson/marleson.github.io/master?filepath=_jupyter%2Fcovid-19-SIR-model-ap.ipynb"
    btn_class: "btn--primary"

---




Estudo da Covid-19 pelo modelo SIR
==========

A Covid-19 é uma doença respiratória causada pelo novo coronavírus (SARS-CoV-2). Esse vírus vem causando bastante preocupação no mundo pela sua acelerada disseminação. No Brasil, até a presente data, o
número de casos confirmados passam de 145 mil e de mortos ultrapassa os 10 mil.

Ao mesmo tempo que essa doença se propaga rapidamente, estou interessado em compreender como a propagação de doenças infecciosas podem acontecer.
Existe algum modelo que pode descrever com alguma simplicidade esse contágio?

Descobri que sim. Existe um modelo matemático relativamente simples,
chamado SIR, que descreve a estrutura dessa disseminação. A afirmação do
modelo é tão interessante que resolvi implementar e avaliar como se
comporta na minha realidade local.

Este post tem como objetivo fornecer uma visão geral do modelo SIR e o
resultado da minha simulação usando um conjunto de dados do Covid-19,
fornecidos pelo [portal do Governo do Estado do Amapá](https://www.portal.ap.gov.br/coronavirus).

O que é o modelo SIR
--------------------

O modelo SIR é um tipo de modelo que descreve a dinâmica de doenças infecciosas. O modelo divide a população em três compartimentos e
espera-se que cada compartimento tenhas as mesmas características. Assim, o modelo SIR é segmentado em:

-   **S**uscetíveis
-   **I**nfectados
-   **R**emovidos

Os **Suscetíveis** representam a população total que ainda não tem
imunidade e está vulnerável a exposição da doença. Os **Infectados**
representam a população atual de infectados. Elas podem espalhar a
doença para as pessoas suscetíveis e podem ser removidas desse grupo no
caso de atingirem recuperação (imunidade) ou morte. Já os **Removidos**
representam a população que já adquiriu imunidade e não estão mais
suscetíveis a doença. Nesse caso incluem-se também os mortos (que não
podem disseminar a doença).

![image](/images/SIR_statement.svg){: .align-center}

O modelo SIR permite descrever o número de pessoas em cada compartimento
com uma equação diferencial ordinária. O parâmetro $\beta$ é a taxa que
controla o quanto a doença pode ser transmitida através da exposição. É
determinado pela chance de contato e pela probabilidade de transmissão
da doença. O parâmetro $\gamma$ expressa a taxa de recuperação da doença
em um período específico. Uma vez que as pessoas são curadas, elas obtêm
imunidade. Não há chance de eles voltarem suscetíveis novamente.

$$
\begin{array}{rcl}
\dfrac{dS}{dt} &=& -\beta \dfrac{I}{N}S\\[10pt]
\dfrac{dI}{dt} &=&  \beta \dfrac{I}{N}S - \gamma I\\[10pt]
\dfrac{dR}{dt} &=& \gamma I
\end{array}
$$ 

onde $N$ é a população total. E assim, é importante notar
que: $$S + I + R = N$$

Isso mostra uma limitação do modelo. Não consideramos o efeito da taxa
natural de morte ou nascimento, porque o modelo pressupõe que o período
pendente da doença seja muito menor que o tempo de vida do ser humano.
Isso nos permite saber a importância de conhecer dois parâmetros,
$\beta$ e $\gamma$. Quando podemos estimar os dois valores, há várias
ideias derivadas deles. Se consideramos $D$ a média de dias para se
recuperar da infecção, temos que $$D = \frac{1}{\gamma}$$

Além disso, podemos estimar a natureza da doença em termos do poder da
infecção. $$R_0 = \frac{\beta}{\gamma}$$

É chamado de número básico de reprodução. $R_0$ é o número médio de
pessoas infectadas por outra pessoa. Se for alto, a probabilidade de
pandemia também é maior. O número também é usado para estimar o nível de
imunidade do rebanho (HIL, sigla em inglês), isto é, quando uma porção
crítica da população se torna imune e a doença pode não persistir mais
na população, se tornando [endêmica](https://en.wikipedia.org/wiki/Endemic_(epidemiology)). Se o número básico de reprodução
multiplicado pela porcentagem de pessoas não imunes (suscetíveis) for
igual a 1, isso indica o estado equilibrado. O número de pessoas
infecciosas é constante. Suponha que a proporção de pessoas imunes seja
$p$, o estado estável pode ser formulado da seguinte maneira.

$$R_0(1-p) = 1 \rightarrow 1-p = \frac{1}{R_0} \rightarrow p_c = 1-  \frac{1}{R_0}$$

Portanto, $p_c$ é o HIT para parar a propagação da doença infecciosa.
Podemos parar o surto vacinando a população para aumentar a imunidade do
rebanho. O vídeo fornecido pelo **3Blue1Brown** também é um ótimo
recurso para aprender visualmente o modelo SIR.

{% include video id="gxAaO2rsdIs" provider="youtube" %}

Agora que sabemos o básico sobre o modelo e sobre as principais métricas, vamos partir para a implementação do código.

Simulação com dados do Covid-19 no Amapá
----------------------------------------

A fonte de dados que usei neste experimento foram coletados até dia 09 de Maio de 2020, no Portal do
Governo do Amapá. É possível fazer o download [**aqui**]({{ site.baseurl }}{% link /src/ap-covid-19-SIR-09-05-20.csv %}). Nesse arquivo os dados coletados iniciam no dia 04 de Maio, quando começa a apresentar indivíduos removidos, e está organizado em:

-   *Dia*
-   *Confirmados*
-   *Mortes*
-   *Recuperados*

Nessas simulações se considera a população estimada do Amapá ($N=845.731$), pelo [IBGE em 2019](https://www.ibge.gov.br/cidades-e-estados/ap.html). O que vamos fazer é estimar o $\beta$ e $\gamma$ para ajustar o modelo
SIR aos casos confirmados reais (o número de pessoas infectadas). Para
resolver a equação diferencial ordinária como o modelo SIR, podemos usar
a função `solve_ivp` no módulo `scipy`.


### Importandos as principais bibliotecas


```python
# Library
import numpy as np
from scipy.integrate import odeint
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import pandas as pd
from scipy.integrate import solve_ivp
from scipy.optimize import minimize
from datetime import date, timedelta
```

### Importando os dados


```python
# import data frame
dados = pd.read_csv('ap-covid-19-SIR-09-05-20.csv')

# Amostra dos dias
Dias = dados['Dias']
# Amostra de casos Confirmados
Confirmed = dados['Confirmados']
# Amostra de casos Recuperados
Recovered = dados['Recuperados']
# Amostra do num. de mortos
Deaths = dados['Mortos']

# Quant. de infectados
Infected = Confirmed - Recovered - Deaths

# Quant. de Removidos
Removed = Recovered + Deaths

# Populacao do Amapa, N.
N = 845731

# Número inicial de indivíduos infectados e removidos, I_start e R_start.
I_start, R_start = Infected[0], Removed[0]

# Os demais, S_start, são os indivíduos inicialmente suscetíveis.
S_start = N - I_start - R_start

# Malha de pontos no tempo (em dias)
t = np.arange(0, 150, 1)

# Dias (data de início da simulação: 04 de Abril de 2020)
# este dia foi escolhido, pois nele começam a surgir casos removidos
ddays = pd.date_range(start='4/4/2020', periods=len(t))

dados.tail()
```

A tabela abaixo mostra os cinco últimos dados coletados:

<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>Dias</th>
      <th>Confirmados</th>
      <th>Recuperados</th>
      <th>Mortos</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>31</th>
      <td>05/05/20</td>
      <td>1931</td>
      <td>557</td>
      <td>55</td>
    </tr>
    <tr>
      <th>32</th>
      <td>06/05/20</td>
      <td>2046</td>
      <td>596</td>
      <td>56</td>
    </tr>
    <tr>
      <th>33</th>
      <td>07/05/20</td>
      <td>2199</td>
      <td>612</td>
      <td>61</td>
    </tr>
    <tr>
      <th>34</th>
      <td>08/05/20</td>
      <td>2322</td>
      <td>640</td>
      <td>66</td>
    </tr>
    <tr>
      <th>35</th>
      <td>09/05/20</td>
      <td>2493</td>
      <td>665</td>
      <td>69</td>
    </tr>
  </tbody>
</table>
</div>



### Função para minização
Esta função `loss` é utilizada para fazer a minimização do problema de valor inicial e posteriormente encontrar os parâmetros que melhor ajustam os dados importados.


```python
def loss(point, data, removed, s_0, i_0, r_0, N):
    size = len(data)
    beta, gamma = point
    def SIR(t, y):
        S = y[0]
        I = y[1]
        R = y[2]
        return [-beta*S*I/N, beta*S*I/N-gamma*I, gamma*I]
    solution = solve_ivp(SIR, [0, size], [s_0,i_0,r_0], t_eval=np.arange(0, size, 1), vectorized=True)
    # the root mean squared error (RMSE) - a raiz do erro quadrado médio
    l1 = np.sqrt(np.mean((solution.y[1] - data)**2))
    l2 = np.sqrt(np.mean((solution.y[2] - removed)**2))
    alpha = 0.7 # ponderamento dos dados
    return alpha * l1 + (1 - alpha) * l2
```

### Cálculo do parâmetros

Os paramêtros $\beta$ (taxa contaminação) e $\gamma$ (taxa de recuperação), necessários para a construção da solução, são computados em cada intervalo de integração até a mais recente data. Os valores de $R_0$ (número básico de reprodução) e $p_{c}$ (índice de imunidade de rebanho) também serão calculados, a cada passo, para comparação.

A rotina `minimize` é utilizada para encontrar os parametros  $\beta$ e $\gamma$.


```python
beta, gamma = [], []

num_frames = 20 # num. de frames

for k in range(num_frames):
    optimal = minimize(loss, [0.001, 0.001], args=(Infected[:17+k], Removed[:17+k], S_start, I_start, R_start, N), method='L-BFGS-B', bounds=[(0.00000001, 0.7), (0.00000001, 0.7)])
    beta.append(optimal.x[0])
    gamma.append(optimal.x[1])

obj = {'Dia (Integração)': Dias[16:], 'beta': beta, 'gamma': gamma}
output = pd.DataFrame(data=obj)
output['R0'] = output['beta']/output['gamma']
output['Pc'] = 1-1/output['R0']
```

### As equações do modelo SIR
Abaixo estão definidas o conjunto das 3 equações acopladas que descrevem o comportamento epidemiológico.

$$ S' = -\beta \dfrac{I}{N}S; \quad I' = \beta \dfrac{I}{N}S - \gamma I \quad \mbox{e}\quad
R' = \gamma I $$


```python
# As equações diferenciais do modelo SIR
def deriv(t, y, N, beta, gamma):
    S, I, R = y
    dSdt = -beta * S * I / N
    dIdt = beta * S * I / N - gamma * I
    dRdt = gamma * I
    return dSdt, dIdt, dRdt
```

### Solução numérica do modelo
A solução numérica do modelo é aprensentada em seguida, utilizando a biblioteca voltada para equações diferenciais `solve_ivp` em problemas de valor inicial. A cada passo de tempo, as soluções são gravadas nas linhas das matrizes `S`, `I` e `R`.


```python
# Initial conditions vector
y0 = S_start, I_start, R_start

# Set init values
S, I, R = [], [], []
Imax, Ixmax = [], []

for i in range(num_frames):
    sol = solve_ivp(deriv, [0, len(t)], y0, vectorized=True, args=(N, beta[i], gamma[i]), t_eval=t)
    # Integrate the SIR equations over the time grid, t.
    S.append(sol.y[0])
    I.append(sol.y[1])
    R.append(sol.y[2])
    
    Imax.append(max(I[i]))
    Ixmax.append(np.argmax(I[i]))

# Month abbreviation, day and year
d1 = ddays[Ixmax[-1]].strftime("%d %b %Y")
print('No dia ', d1, 'é atingido o número máximo de infectados: ', int(Imax[-1]))
```

    No dia  02 Jul 2020 é atingido o número máximo de infectados:  241112



### Criando frames
Nesta seção são criados os frames para cada uma das soluções


```python
frames = []
for frame in range(num_frames):
    x_axis_frame = ddays
    y_axis_frameS = S[frame]
    y_axis_frameI = I[frame]
    y_axis_frameR = R[frame]
    curr_frame = go.Frame(data = [go.Scatter(x = x_axis_frame, y = y_axis_frameS, mode = 'lines' ),
                                  go.Scatter(x = x_axis_frame, y = y_axis_frameI, mode = 'lines' ),                                   
                                  go.Scatter(x = x_axis_frame, y = y_axis_frameR, mode = 'lines' )])
    frames.append(curr_frame)   
```

### Criando Figura
Este é o último passo para a visualização das soluções. A figura é criada colocando a solução inicial, de onde partem as demais soluções. Os frames criados anteriormente são acrescentados, a fim de vizualizar as soluções a cada passo de tempo.


```python
figure = go.Figure(
    data = [go.Scatter(x = ddays, y = S[0], mode = 'lines', name = "Sucetíveis", line = dict(color='rgb(20, 158, 217)')),
            go.Scatter(x = ddays, y = I[0], mode = 'lines', name = "Infectados", line = dict(color='rgb(227, 50, 88)')),            
            go.Scatter(x = ddays, y = R[0], mode = 'lines', name = "Removidos", line = dict(color='rgb(0, 153, 137)'))], # list of traces
    layout = {
        # "title": "Simulação do modelo Epidêmico SIR",
        "hovermode":"x",
        "legend": {"x":0.2, "y":1.1},
        "legend_orientation": "h",
        "plot_bgcolor": 'rgba(10,10,10,0)',
        "margin":{"t":50, "b":0, "l":0, "r":0},
        "updatemenus":[{
            "type":"buttons",
            "direction": "left",
            "pad":{"b":10, "t":10,  "l":0},
            "x":0.0,
            "xanchor":"left",
            "y":-0.2,
            "yanchor":"bottom", 
            "buttons":[{
                "label": "Play",
                "method": "animate",
                "args": [None, {'frame': {'duration': 1000, 'redraw': True}, "fromcurrent": True, 'transition': {'duration': 10, 'easing': 'linear'}}]
            },
            {
                'label': 'Pause',
                'args': [[None], {'frame': {'duration': 0, 'redraw': False}, 'mode': 'immediate',
                'transition': {'duration': 0}}],
                'method': 'animate'
            }],
        }],
        "xaxis": {"range": [ddays[0],ddays[-1]], "showspikes": True, "spikemode": "toaxis+marker"},
        "yaxis": {"range": [0,N], "title": "População", "side":"right", "showgrid": True, "gridwidth": 1, "gridcolor":"#B6B6B6"}
    },
    frames = frames
)

figure.show()   
```

{% include_relative sir.html %}



No gráfico animado acima é possível ter uma noção de como a doença pode evoluir nos próximos meses. A animação aprensenta o comportamento das curvas de infectados, removidos (mortos + recuperados) e suscetíveis, levando em conta os últimos 20 dias até o dia 09 de maio.

O gráfico mostra que o pico de infectados pode ser atingido no início do mês de **Julho (02/07)** com mais de **241 mil pessoas infectadas**. Além disso, nota-se que o pico de infectados aumenta, apesar de se afastar ligeiramente.

Os valores de $\alpha$, $\beta$ e, consequentemente, $R_0$ e $p_c$ obtidos até a presente data são mostradas na tabela abaixo:


<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>Dia (Integração)</th>
      <th>$\beta$</th>
      <th>$\gamma$</th>
      <th>$R_0$</th>
      <th>$p_c$</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>28</th>
      <td>02/05/20</td>
      <td>0.237738</td>
      <td>0.114810</td>
      <td>2.070705</td>
      <td>0.517073</td>
    </tr>
    <tr>
      <th>29</th>
      <td>03/05/20</td>
      <td>0.229750</td>
      <td>0.106051</td>
      <td>2.166411</td>
      <td>0.538407</td>
    </tr>
    <tr>
      <th>30</th>
      <td>04/05/20</td>
      <td>0.220946</td>
      <td>0.095678</td>
      <td>2.309278</td>
      <td>0.566964</td>
    </tr>
    <tr>
      <th>31</th>
      <td>05/05/20</td>
      <td>0.213241</td>
      <td>0.086808</td>
      <td>2.456458</td>
      <td>0.592910</td>
    </tr>
    <tr>
      <th>32</th>
      <td>06/05/20</td>
      <td>0.207125</td>
      <td>0.080530</td>
      <td>2.572029</td>
      <td>0.611202</td>
    </tr>
    <tr>
      <th>33</th>
      <td>07/05/20</td>
      <td>0.201409</td>
      <td>0.074996</td>
      <td>2.685581</td>
      <td>0.627641</td>
    </tr>
    <tr>
      <th>34</th>
      <td>08/05/20</td>
      <td>0.196418</td>
      <td>0.070668</td>
      <td>2.779459</td>
      <td>0.640218</td>
    </tr>
    <tr>
      <th>35</th>
      <td>09/05/20</td>
      <td>0.191712</td>
      <td>0.066728</td>
      <td>2.873033</td>
      <td>0.651936</td>
    </tr>
  </tbody>
</table>
</div>



Olhando os valores do número de reprodução ($R_0$) na tabela acima, o que mais chama atenção é o seu aumento. O $R_0$ chega a atingir $2.87$, na data mais recente. Isso significa que uma única pessoa pode infectar por volta de $3$ outros indivíduos. Para que a doença seja controlada esse número precisa estar abaixo de $1$.

Com o aumento do número de reprodução, pode-se notar também que para atingir a imunidade de rebanho pelo menos $65\%$ ($p_c=0.65$ ) da população deve passar pela doença.

## Conclusões
Resolvi explicar um pouco do modelo, pois sua compreensão mostra a importância do distanciamento social. Como a Covid-19 ainda não possui vacina para achatar de vez a curva de infectados, a única forma de garantir que mais pessoas possam ter acesso a leitos em hospitais é reduzindo a taxa de transmissão ($\beta$) e isso só pode ser feito com o isolamento e distanciamento social.

As simulações realizadas coletando os dados do estado do Amapá mostram um cenário preocupante para os próximos meses. Apesar de apresentar um leve achatamento da curva no início da simulação, o aumento do pico da curva mostra um relaxamento nas medidas de isolamento pela população. Se o cenário apresentado se confirmar, o estado pode sofrer não somente um colapso de todo o sistema de saúde, mas um colapso do sistema funerário causado pelo alto número de mortes.

Apesar de o modelo mostrar um alto número de infectados, vale lembrar que nem todos os indivíduos manifestam  sintomas, mas mesmo assim podem espalhar a doença e acelerar o contágio, caso não realizem o autoisolemento. Além disso, nem todos os infectados precisarão de leitos clínicos ou de UTI. Pela última estimativa que realizei por meio do [Boletim de 09/04](https://www.portal.ap.gov.br/noticia/0905/boletim-informativo-covid-19-amapa-9-de-maio-de-2020), cerca $6,6\%$ dos infectados precisam de algum leito (clínico ou de UTI). Se este número se mantém, no pico da curva de infectados (cerca de 241.112 pessoas), seria necessário por volta de **15.900** leitos em todo o estado.

Pelo relatório divulado pela [*Imperial College London (report 21)*](https://www.imperial.ac.uk/mrc-global-infectious-disease-analysis/covid-19/report-21-brazil/) sobre o Brasil, no dia 08 de maio, a taxa de mortalidade por infecção do novo Coronavírus está entre $0.7\%$ e $1.2\%$. Se olharmos novamente para o pico de infectados da doença no Amapá esse número de óbitos pode chegar, por baixo, a **1.687** no estado (mesmo que não seja notificado), o que trás também o colapso funerário. Isso sem contar os mortos até que esse pico seja alcançado, que são incluídos como removidos nas simulações. Para minimizar o quantidade de pessoas sem atendimento médico e, consequentemente, o caos de mortos, a solução é "achatar a curva" de infectados e isso, repito, só será alcançado com um forte isolamento e distanciamento social.

Na presente data, o índice de isolamento social no Amapá, estimado pelo [Inloco](https://www.inloco.com.br/pt/), está próximo de $48\%$. O taxa ideal de isolamento é $70\%$, mas em todo país tem-se observado esse baixo índice. Com o pico da curva de infectados se aproximando de forma acelerada e os sistemas de saúde municipais e estadual a beira do colapso o cenário mais provável para as próximas semanas é a adoção, pelo governo e prefeituras, de decretos mais rigorosos em relação a circulação de pessoas.


## Aviso
A estimativa do modelo é bem simplificada, pois, pela própria construção, se considera uma população distribuida de forma homogênea (ideal) e sabe-se que isso não é o que ocorre. As pessoas estão agrupadas por cidades, bairros, comunidades, etc. Existem [modelos mais complexos](https://en.wikipedia.org/wiki/Compartmental_models_in_epidemiology) que podem considerar esse fatores.

Além disso, o modelo depende da correta notificação de casos infectados e isso não tem ocorrido. O estado do Amapá, assim como outros estados, sofre pela subnotificação e falta de exames. O Amapá ainda tem um agravante em relação aos demais estados, pois depende de exames realizados no [Instituto Evandro Chagas, em Belém-PA](https://www.portal.ap.gov.br/noticia/2403/governo-do-amapa-envia-4-ordf-remessa-de-casos-suspeitos-do-novo-coronavirus), que quando retornam (alguns dias depois) aumentam o notificação de casos Covid-19 naquele dia. Ou seja, não significa que os casos se confirmaram naquele dia, mas que foram notificados naquele dia. O mesmo acontece quando o estado recebe uma remessa grande de testes rápidos (IgG e IgM) e tira da fila os muitos casos suspeitos em um curto período.

Os boletins do governo apenas notificam a quantidade de casos acumulados naquele dia e não atualiza os dados pelo dia em que o exame foi coletado. Isso fica evidente quando o próprio [portal de estatísticas do governo](http://painel.corona.ap.gov.br/) usa os dados acumulados fornecidos pelos boletins diários. No quesito de precisão de dados, a contagem de mortos por Covid-19 talvez sejam mais precisos, mesmo que hajam casos de óbitos que não foram testados e óbitos em residências, que não entram nas estatísticas.

Mesmo que os dados da simulação não sejam os mais precisos e o modelo seja simplificado, a previsão do aumento do pico da curva é real e é provocado pela falta de cumprimentos das medidas de isolamento.

Agradecimentos
--------------

-   Um agradecimento especial ao **Prof. Dr. Fernando Rodrigues Oliveira
    (IFRS-Osório)**, um amigo e colega de trabalho, que me apresentou [este modelo](https://www.youtube.com/watch?v=1sySX-rGKWs) e possibilitou ricas discussões a respeito do tema.
    

## Demais referências
1. [The SIR epidemic model in python](https://scipython.com/book/chapter-8-scipy/additional-examples/the-sir-epidemic-model/)
2. [The SIR model - Wikipedia](https://en.wikipedia.org/wiki/Compartmental_models_in_epidemiology#The_SIR_model)
3. [Plotly](https://plotly.com/)


