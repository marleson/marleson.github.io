---
title: "O modelo SIR "
excerpt: 'Sobre o SIR'
tagline: "Uma abordagem sobre dados da Covid-19 no estado do Amapá"
date: 2020-05-09
tags: [covid19, coronavirus, amapá]
layout: single
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

# sidebar:
#   - title: "Fernando Rodrigues"
#     image: images/fernando.png
#     image_alt: "fernando"
#     text: "Professor do IFRS -  Campus Osório"
#   - title: "Márleson Ferreira"
#     image: images/marleson-icon1.png
#     image_alt: "marleson"
#     text: "Doutor em Engenharia"
    
    

---


O modelo SIR para estudo de epidemias
==========

O novo coronavírus (Covid-19) vem causando bastante preocupação no mundo pela sua acelerada disseminação. No Brasil, até a presente data, o
número de casos confirmados passam de 145 mil e de mortos se aproxima de 10 mil.

Ao mesmo tempo que essa doença se propaga rapidamente, estou interessado em compreender como a propagação de doenças infecciosas podem acontecer.
Existe algum modelo que pode descrever com alguma simplicidade esse contágio?

Descobri que sim. Existe um modelo matemático relativamente simples,
chamado SIR, que descreve a estrutura dessa disseminação. A afirmação do
modelo é tão interessante que resolvi implementar e avaliar como se
comporta na minha realidade local.

Este post tem como objetivo fornecer uma visão geral do modelo SIR e o
resultado da minha simulação usando um conjunto de dados do Covid-19,
fornecidos pelo portal do Governo do Estado do Amapá.[^1]

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

![image](/images/SIR_statement.svg)

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
\dfrac{dI}{dt} &=&  \beta \dfrac{I}{N}S\\[10pt]
\dfrac{dR}{dt} &=& \gamma I(t)
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
recuperar da infecção, temos que 

$$D = \frac{1}{\gamma}$$

Além disso, podemos estimar a natureza da doença em termos do poder da
infecção. 

$$R_0 = \frac{\beta}{\gamma}$$

É chamado de número básico de reprodução. $R_0$ é o número médio de
pessoas infectadas por outra pessoa. Se for alto, a probabilidade de
pandemia também é maior. O número também é usado para estimar o nível de
imunidade do rebanho (HIL, sigla em inglês), isto é, quando uma porção
crítica da população se torna imune e a doença pode não persistir mais
na população, se tornando endêmica[^2]. Se o número básico de reprodução
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

A fonte de dados que usei neste experimento foram coletados no Portal do
Governo do Amapá. É possível fazer o download **aqui**. Esse arquivo
inclui a data de quando os dados foram coletados e está organizado em:

-   *Confirmados*

-   *Mortes*

-   *Recuperados*

O que vamos fazer é estimar o $\beta$ e $\gamma$ para ajustar o modelo
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
dados = pd.read_csv('ap-covid-19 - SIR2.csv')

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

# Total population, N.
N = 845731
# N = 1465430 # POA

# Initial number of infected and removed individuals, I_start and R_start.
I_start, R_start = Infected[0], Removed[0]

# Everyone else, S_start, is susceptible to infection initially.
S_start = N - I_start - R_start


# A grid of time points (in days)
t = np.arange(0, 150, 1)

# Dias     
ddays = pd.date_range(start='4/4/2020', periods=len(t))

```

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
    alpha = 0.5
    return alpha * l1 + (1 - alpha) * l2
```

### Cálculo do parâmetros

Os paramêtros $\beta$ (taxa contaminação) e $\gamma$ (taxa de recuperação), necessários para a construção da solução, são computados em cada intervalo de integração até a mais recente data. Os valores de $R_0$ (número básico de reprodução) e $I_{max}$ (número máximo de infectados) também são calculados, a cada passo, para comparação.

A rotina `minimize` é utilizada para encontrar os parametros  $\beta$ e $\gamma$.


```python
beta, gamma, R0 = [], [], []

num_frames = 10

for k in range(num_frames):
#     print(k)
    optimal = minimize(loss, [0.001, 0.001], args=(Infected[:19+k], Removed[:19+k], S_start, I_start, R_start, N), method='L-BFGS-B', bounds=[(0.00000001, 0.7), (0.00000001, 0.7)])
#     print(optimal)
    beta.append(optimal.x[0])
    gamma.append(optimal.x[1])

# print('R0 = ', beta/gamma
```

### As equações do modelo SIR
Abaixo estão definidas o conjunto das 3 equações acopladas que descrevem o comportamento epidemiológico.

\begin{equation}
S'(t) = -\beta \dfrac{I(t)}{N(t)}S(t); \quad I'(t) = \beta \dfrac{I(t)}{N(t)}S(t) - \gamma I(t) \quad \mbox{e}\quad
R'(t) = \gamma I(t)
\end{equation}


```python
# The SIR model differential equations.
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

# ttt = [0,200,300,500]

for i in range(num_frames):
    sol = solve_ivp(deriv, [0, len(t)], y0, vectorized=True, args=(N, beta[i], gamma[i]), t_eval=t)
    # Integrate the SIR equations over the time grid, t.
    #ret = odeint(deriv, y0, t, args=(N, beta[i], gamma[i]))
    # ret = odeint(deriv, y0, t, args=(N, beta[i], gamma[i]))
    S.append(sol.y[0])
    I.append(sol.y[1])
    R.append(sol.y[2])
    
    Imax.append(max(I[i]))
    Ixmax.append(np.argmax(I[i]))
    #Imax = max(I[i])
    #Ixmax = np.argmax(I[i])
    
#     #print(max_infetados)
#     fig, ax = plt.subplots()
#     ax.plot_date(ddays, I[-1], ls='-')
#     ax.plot_date([ddays[0],ddays[Ixmax[-1]],ddays[Ixmax[-1]],ddays[Ixmax[-1]]],[Imax[-1],Imax[-1], Imax[-1],0], ls='--')
#     # #ax.set_xlim([ddays[30], ddays[35]])
#     # # ax.set_ylim([0, 300])
#     plt.show()

# plt.xlim(ddays[0], ddays[10])
# plt.ylim(0, 10)

# fig, ax = plt.subplots()

# ax.plot(sol.t, I[0],  label='Infectados')
# ax.plot(sol.t,R[0], label='Removidos')

# ax.plot(np.arange(0, len(Infected[:19]), 1), Infected[:19].to_numpy(), label='I_dados')
# ax.plot(np.arange(0, len(Removed[:19]), 1),Recovered[:19].to_numpy(), label='R_dados')

# plt.yscale('log')

# ax.legend()

# ddays[Ixmax[-1]]
# # Ixmax[-1]

```




### Criar frames
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
#     print(ddays[35+frame], Imax[frame])
    
```

### Criar Figura
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
        # "plot_bgcolor": 'rgba(10,10,10,0)',
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
                "args": [None, {'frame': {'duration': 500, 'redraw': False}, "fromcurrent": True, 'transition': {'duration': 500, 'easing': 'linear'}}]
            },
            {
                'label': 'Pause',
                'args': [[None], {'frame': {'duration': 0, 'redraw': False}, 'mode': 'immediate',
                'transition': {'duration': 0}}],
                'method': 'animate'
            }],
        }],
        "xaxis": {"range": [ddays[0],ddays[-1]], "showspikes": True, "spikemode": "toaxis+marker"},
        "yaxis": {"range": [0,N], "title": "População", "side":"right"}
    },
    frames = frames
)

figure.show()   
```

{% include_relative sir.html %}



Agradecimentos
--------------

-   Um agradecimento especial ao **Prof. Dr. Fernando Rodrigues Oliveira
    (IFRS-Osório)**, um amigo e colega de trabalho, que me apresentou
    este modelo[^3] e possibilitou ricas discussões a respeito do tema.

## Referências
1. [The SIR epidemic model in python](https://scipython.com/book/chapter-8-scipy/additional-examples/the-sir-epidemic-model/)
2. [The SIR model - Wikipedia](https://en.wikipedia.org/wiki/Compartmental_models_in_epidemiology#The_SIR_model)
3. [COVID-19 dynamics with SIR model](https://www.lewuathe.com/covid-19-dynamics-with-sir-model.html)
4. [Plotly](https://plotly.com/)


[^1]: <https://www.portal.ap.gov.br/>

[^2]: <https://en.wikipedia.org/wiki/Endemic_(epidemiology)>

[^3]: <https://www.youtube.com/watch?v=1sySX-rGKWs>
