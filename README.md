# BRASIL — MISSÃO IMPOSSÍVEL
### Como o Presidente vai salvar o Brasil?

Jogo 3D de mundo aberto para navegador — sátira política e econômica ambientada num Brasil fictício do ano 203X.

> Obra de ficção e sátira política. Indicadores simulados, sem caráter de previsão econômica.
> Todos os personagens, ministérios, partidos e falas são inventados.

## Publicar na internet (GitHub Pages — grátis)
1. Crie um repositório público no GitHub (ex.: `brasil-missao-impossivel`) e envie este projeto para a branch `main`.
2. No repositório: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. O workflow `.github/workflows/deploy.yml` compila e publica sozinho a cada push.
   Endereço: `https://SEU-USUARIO.github.io/brasil-missao-impossivel/`
4. Domínio próprio (opcional): em **Settings → Pages → Custom domain**, informe por exemplo `jogo.cademeuimposto.com`
   e crie no seu provedor de DNS um registro **CNAME** `jogo` → `SEU-USUARIO.github.io`. Depois marque **Enforce HTTPS**.

## Celular
Detecta toque automaticamente (ou force com `?mobile`): joystick virtual, botões de ação, câmera por arraste,
HUD compacto, sem sombras, menos pedestres/carros e resolução reduzida para rodar bem em celulares.

## Rodar
```bash
npm install
npm run dev          # desenvolvimento (http://localhost:5173)
npm run build        # build de produção em dist/
SINGLEFILE=1 npx vite build   # gera um único dist/index.html autocontido
```
Abra com `?debug` para expor `window.__BRASIL__` (runtime + store) no console.

## Controles
WASD/setas mover · Shift correr · Mouse câmera (clique para travar ou arraste) · Roda zoom ·
E interagir · F entrar/sair do carro · Espaço freio de mão · Q rádio · Tab painel · H histórico · Esc pausa

## Missões
Abertura: o Presidente (fictício) volta de mais uma viagem à Europa; a Primeira-Dama desembarca com 14 sacolas de compras.

1 Cadê a Picanha? · 2 A Máquina de Impostos · 3 O Dinheiro Acabou · 4 Juros na Canetada ·
5 A Greve dos Caminhoneiros · 6 Brasília em Chamas · 7 O País do Futuro · 8 A Guerra dos Preços ·
9 O Congresso Decide · 10 O Pingue-Pongue dos Poderes · 11 O Supremo Sou Eu · 12 O Último Churrasco ·
**13 Desafio Final: A Eleição**

- *O País do Futuro*: escola, UPA e periferia com esgoto a céu aberto. As placas "DADO REAL" trazem números do Brasil real
  (PISA 2022/OCDE-Inep; Sinisa 2024/Trata Brasil; SUS) — o restante é ficção.
- *Juros na Canetada*: baixar juros por decreto sem cortar gastos dá crescimento imediato e cobra depois em inflação e juros ainda maiores.
- *O Pingue-Pongue dos Poderes*: o presidente decide, o Congresso barra e a Corte libera — e o cidadão não sabe qual regra vale.
- *O Supremo Sou Eu*: um ministro fictício é réu, advogado, promotor e juiz. A alavanca `institutions` mede o equilíbrio
  entre os Três Poderes e afeta confiança e crescimento (segurança jurídica). O monumento dos Três Poderes mostra isso no mapa.

## Do jogo para a vida real
O jogo divulga o **Cadê Meu Imposto?** (https://www.cademeuimposto.com) no menu, na pausa, nos outdoors, no rádio,
no jornal de cada decisão, no impostômetro (simulado) da Esplanada e na Reflexão Final. A URL fica em `src/game/config.ts` (`SITE`).

## Estrutura
```
src/
  economy/model.ts      Modelo econômico (10 indicadores, alavancas, passo mensal, finais)
  economy/election.ts   Eleição por regiões e simulação do segundo mandato
  missions/types.ts     Tipos de missão/etapa/opção
  missions/data.ts      As 8 missões + minijogo de negociação (Missão 7)
  missions/citizens.ts  Falas de NPCs que reagem à economia
  game/store.ts         Estado global (Zustand): missões, decisões, salvar/carregar
  game/runtime.ts       Estado de alta frequência (posição, câmera, veículos)
  game/input.ts         Teclado, mouse, pointer lock
  game/sfx.ts           Sons sintetizados (WebAudio)
  game/textures.ts      Texturas de texto/janelas geradas em canvas
  world/layout.ts       Mapa de Brasília fictícia + colisões + rotas de trânsito
  world/*.tsx           Cidade, marcos, supermercado, consequências visuais, trânsito, pedestres, NPCs
  ui/*.tsx              Menu, HUD, minimapa, painel, decisões, jornal, negociação, finais
```

## Modelo econômico (resumo)
A cada mês: dívida += (−primário + (juros reais − PIB) × dívida)/12; a inflação converge para um alvo que
depende de déficit, confiança, oferta de alimentos e aquecimento; desemprego segue o PIB (Okun);
poder de compra = salário − inflação; serviços = gasto + eficiência; confiança = fiscal, dívida,
inflação e credibilidade; popularidade reage a tudo; picanha segue nível de preços e oferta × demanda.
As decisões mexem em indicadores e alavancas, com efeitos imediatos e defasados, e várias opções
dependem do contexto (confiança, popularidade, serviços, déficit).

## Expansões sugeridas
Física com Rapier, modelos GLTF originais, ciclo dia/noite, mais cidades (Rio, SP), eventos aleatórios,
trilha sonora original, missões secundárias e um sistema de eleição ao fim do mandato.
