---
title: "Criando um atalho no Desktop para o Anaconda - Linux Mint"
date: 2020-04-16
tags: [Anaconda, Linux, Atalhos, Linux Mint]
excerpt: "Uma forma rápida para criar atalho do anaconda no desktop."
toc: true
toc_label: "Sumário"
---


# Criando um atalho no Desktop para o Anaconda

Após sua instalação do [Anaconda](https://www.anaconda.com/distribution/) no linux, provavelmente terá que executá-lo pelo terminal nas primeiras vezes. Isso às vezes atrapalha o fluxo de trabalho e para não precisar abrir o terminal todas as vezes e vou deixar aqui os passos que fiz para ter um ícone disponível na sua área de trabalho.

## Criando o ícone

Todos os ícones na área de trabalho possuem a extensão `.desktop` que é oculta. Desse modo, precisamos criar um arquivo com essa extensão. Você pode criar o arquivo clicando diretamente na área de trabalho, clicando com o botão direito, depois *criar novo documento -> documento em branco*. Nomeie o arquivo como: ´Anaconda-Navigator.desktop´.

Pelo terminal, entre na pasta desktop e depois pode criar o arquivo em branco com o comando `touch`.
```console
foo@bar:~$ cd ~/Desktop
foo@bar:~$ touch Anaconda-Navigator.desktop
```		

Após isso, abra o arquivo com seu editor de texto preferido e inclua o seguinte conteúdo:
```console
[Desktop Entry]
Version=1.0
Type=Application
Name=Anaconda-Navigator
GenericName=Anaconda
Exec=bash -c 'export PATH="/home/$USER/anaconda3/bin:$PATH" && /home/$USER/anaconda3/bin/anaconda-navigator'
Icon=/home/$USER/anaconda3/lib/python3.7/site-packages/anaconda_navigator/static/images/anaconda-icon-256x256.png
Terminal=false
StartupNotify=true
```

Pronto! Agora você tem um ícone disponível na área de trabalho.

> **Dica Pro:** Se a imagem do ícone anaconda não aparecer na sua desktop substitua o comando `$USER` pelo se nome de usuário.

## Colocando o ícone no menu

Além de criar o ícone, um boa escolha é colocar o ícone disponível também no seu menu de aplicativos. Para isso, copie o ícone criado para a pasta do sistema: `/usr/share/applications/`. Você precisará de privilégios de super usuário (root) para isso. 

Pelo terminal, isso pode ser feito como:
```console
sudo cp Anaconda.desktop /usr/share/applications/		
```

Após isso é só buscar o aplicativo no seu menu.