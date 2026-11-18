import { brl, clamp, health, type Econ } from '../economy/model';
import { P } from '../game/places';
import { later, type Mission, type Outcome } from './types';

// -------------------------------------------------------------
// Todas as falas e situações são FICTÍCIAS. Nenhuma frase aqui é
// citação real de qualquer autoridade.
// -------------------------------------------------------------

const workerLinesStart = (e: Econ) => [
  'Presidente! Presidente! Aqui, ó.',
  'Meu salário aumentou, mas o carrinho está cada vez mais vazio!',
  `A picanha está ${brl(e.ind.picanha)} o quilo. Eu olho pra ela, ela olha pra mim, e ninguém leva ninguém.`,
  'Vai lá no açougue ver com os próprios olhos. E depois me diz o que o senhor vai fazer.',
];

const workerLinesEnd = (e: Econ) => {
  const p = e.ind.picanha;
  const pp = e.ind.purchasingPower;
  const l: string[] = ['Ô, presidente! Lembra de mim? O do carrinho vazio.'];
  if (p < 125 && pp > 78) {
    l.push(`Picanha a ${brl(p)}! Hoje eu levo dois quilos e ainda sobra pro carvão.`);
    l.push('Não sei se foi sorte ou competência, mas o churrasco de domingo voltou.');
  } else if (p < 170) {
    l.push(`A picanha está ${brl(p)}. Melhorou em umas coisas, piorou em outras.`);
    l.push('Dá pra fazer churrasco... de linguiça. Mas pelo menos tem linguiça.');
  } else {
    l.push(`${brl(p)}?! A picanha agora vem com escritura de imóvel?`);
    l.push('O senhor prometeu, o mercado anotou, e a conta chegou pra mim.');
  }
  l.push('Vai lá no açougue ver o resultado final. O país inteiro está olhando.');
  return l;
};

export const MISSIONS: Mission[] = [
  // =========================================================
  {
    id: 'm1',
    num: 1,
    title: 'CADÊ A PICANHA?',
    tagline: 'O carrinho do trabalhador está vazio.',
    briefing: [
      'A inflação de alimentos disparou e a picanha virou artigo de luxo.',
      'Vá ao Supermercado Bom Preço (Talvez), ouça a população e veja os preços com os próprios olhos.',
    ],
    locationName: 'Supermercado Bom Preço (Talvez)',
    monthsAfter: 3,
    steps: [
      { type: 'reach', text: 'Vá ao Supermercado Bom Preço (Talvez)', target: P.superDoor, radius: 7 },
      {
        type: 'talk',
        text: 'Converse com o trabalhador indignado',
        target: P.superWorker,
        npc: 'worker',
        speaker: 'Seu Wanderley, metalúrgico',
        lines: workerLinesStart,
        label: 'Conversar com Seu Wanderley',
      },
      {
        type: 'decide',
        text: 'Examine o balcão do açougue',
        target: P.superMeat,
        radius: 3.5,
        label: 'Examinar o preço da picanha',
      },
    ],
    question: 'A picanha custa uma fortuna. O que o presidente faz?',
    options: [
      {
        id: 'A',
        title: 'Picanha Para Todos!',
        desc: 'Anunciar um grande programa de distribuição de picanha. Financiamento: "a gente vê depois".',
        hint: 'Popularidade ↑ agora · Gasto ↑ · Confiança ↓ · Demanda por carne ↑ (preço?)',
        resolve: (e): Outcome => {
          const extra = e.ind.debt > 95 ? -3 : 0;
          return {
            delta: {
              ind: { popularity: 9 },
              lev: { spending: 1.2, impulse: 1.2, meatDemand: 0.3, credibility: -6 + extra, popBoost: 4 },
            },
            delayed: [
              later(2, 'Corrida às carnes', { lev: { inflationShock: 1.0 }, picanhaMult: 1.08 }, 'O governo anunciou picanha. O supermercado anunciou o preço.'),
            ],
            messages: [
              'Parabéns! Você criou um programa social. Agora descubra como pagar.',
              'Fila de 3 km na porta do açougue. Os bois pediram asilo político.',
            ],
            headline: 'GOVERNO PROMETE PICANHA PARA TODOS; TESOURO PROCURA A NOTA FISCAL',
          };
        },
      },
      {
        id: 'B',
        title: 'Desonerar a cesta básica (com compensação)',
        desc: 'Reduzir tributos sobre alimentos essenciais e cobrir a perda revisando renúncias fiscais e gastos de baixa prioridade.',
        hint: 'Preços ↓ · Carga ↓ · Gasto ↓ (compensação) · Serviços podem cair um pouco',
        resolve: (e): Outcome => {
          const passThrough = e.ind.confidence < 30 ? 0.97 : 0.93;
          const msgs = ['Imposto menor, conta fechada. O Tesouro respirou.'];
          if (passThrough > 0.95) msgs.push('Com a economia desconfiada, parte do corte virou margem do varejo. Os preços caíram menos que o esperado.');
          return {
            delta: {
              ind: { taxBurden: -0.45, popularity: 4, services: -1.5 },
              lev: { spending: -0.4, inflationShock: -0.7, credibility: 3 },
              picanhaMult: passThrough,
            },
            messages: msgs,
            headline: 'CESTA BÁSICA FICA MAIS BARATA; GOVERNO JURA QUE FEZ AS CONTAS ANTES',
          };
        },
      },
      {
        id: 'C',
        title: 'Incentivo temporário à produção',
        desc: 'Crédito e incentivos com prazo de 12 meses para pecuária, frete e abastecimento.',
        hint: 'Oferta de carne ↑ em ~3 meses · Gasto ↑ por 1 ano · Eficácia depende da confiança',
        resolve: (e): Outcome => {
          const k = clamp(e.ind.confidence / 45, 0.5, 1.2);
          return {
            delta: { ind: { popularity: 3 }, lev: { spending: 0.45, credibility: -1 } },
            delayed: [
              later(
                3,
                'Oferta de carne',
                { lev: { foodSupply: 0.07 * k, growthBoost: 0.6 * k }, ind: { unemployment: -0.3 * k }, picanhaMult: 1 - 0.1 * k },
                k > 0.8
                  ? 'Os incentivos chegaram ao campo: mais oferta, picanha mais barata.'
                  : 'Os incentivos chegaram ao campo... devagar. Com juros altos, pouca gente investiu.',
              ),
              later(12, 'Fim do incentivo', { lev: { spending: -0.45 } }, 'O incentivo temporário acabou. E acabou mesmo — milagre administrativo!'),
            ],
            messages: ['Produtores comemoram. O boi, nem tanto.'],
            headline: 'GOVERNO APOSTA EM PRODUÇÃO; PECUARISTAS PEDEM PACIÊNCIA E CAPIM',
          };
        },
      },
      {
        id: 'D',
        title: 'Discurso: "Vai melhorar!"',
        desc: 'Um pronunciamento emocionante em rede nacional prometendo que tudo vai melhorar.',
        hint: 'Popularidade ↑ por pouco tempo · Credibilidade ↓ · Preços: nada muda',
        resolve: (): Outcome => ({
          delta: { lev: { popBoost: 7, credibility: -3 } },
          delayed: [later(2, 'Ressaca do discurso', { ind: { popularity: -4 } }, 'A inflação não aceita discurso como forma de pagamento.')],
          messages: ['Audiência recorde! A picanha assistiu e continuou cara.'],
          headline: 'PRESIDENTE PROMETE QUE VAI MELHORAR; PICANHA NÃO COMENTA',
        }),
      },
    ],
  },
  // =========================================================
  {
    id: 'm2',
    num: 2,
    title: 'A MÁQUINA DE IMPOSTOS',
    tagline: 'O governo está sem dinheiro.',
    briefing: [
      'A Ministra da Fazenda (fictícia) convocou uma reunião de emergência no Palácio do Planalto.',
      'Há uma máquina estranha na entrada. Ninguém sabe quem a ligou.',
    ],
    locationName: 'Palácio do Planalto',
    monthsAfter: 3,
    steps: [
      { type: 'reach', text: 'Vá ao Palácio do Planalto', target: P.planaltoFront, radius: 9 },
      {
        type: 'talk',
        text: 'Fale com a Ministra Sueli Planilha',
        target: P.ministra,
        npc: 'ministra',
        speaker: 'Ministra Sueli Planilha (Fazenda)',
        lines: (e) => [
          'Presidente, tenho uma notícia boa e uma ruim.',
          'A boa: a calculadora voltou a funcionar.',
          `A ruim: ela mostra déficit de ${Math.abs(e.ind.primary).toFixed(1).replace('.', ',')}% do PIB.`,
          'Precisamos equilibrar o orçamento. A Máquina de Impostos está pronta. Só falta o senhor escolher o botão.',
        ],
        label: 'Falar com a Ministra',
      },
      { type: 'decide', text: 'Opere a Máquina de Impostos', target: P.taxMachine, radius: 3.5, label: 'Operar a Máquina de Impostos' },
    ],
    question: 'Qual botão da Máquina de Impostos o presidente aperta?',
    options: [

      {
        id: 'A',
        title: 'Aumentar impostos sobre consumo',
        desc: 'Elevar alíquotas sobre bens e serviços. Arrecadação rápida, mas o preço chega na prateleira.',
        hint: 'Primário ↑ · Inflação ↑ · Atividade ↓ · Popularidade ↓',
        resolve: () => ({
          delta: { ind: { taxBurden: 1.5, popularity: -6 }, lev: { inflationShock: 0.9, credibility: 2, growthBoost: -0.4 } },
          messages: ['O caixa melhorou. O carrinho do supermercado piorou.'],
          headline: 'IMPOSTO SOBRE CONSUMO SOBE; CONSUMIDOR DESCOBRE QUE É O CONSUMO',
        }),
      },
      {
        id: 'B',
        title: '"Imposto sobre o Ar-Condicionado em Brasília"',
        desc: 'Uma taxa absurda sobre cada ar-condicionado da capital. (PIADA: este imposto é inventado e não existe.)',
        hint: 'Arrecadação ≈ zero · Credibilidade ↓↓ · O povo ri',
        joke: true,
        resolve: () => ({
          delta: { ind: { taxBurden: 0.05, popularity: 2 }, lev: { credibility: -6 } },
          messages: [
            'Arrecadação total: R$ 3,50 e um ventilador usado.',
            'Os investidores não acharam graça. Os servidores abriram as janelas.',
          ],
          headline: 'TAXA DO AR-CONDICIONADO VIRA PIADA NACIONAL — E NÃO PAGA NEM O CAFEZINHO',
        }),
      },
      {
        id: 'C',
        title: 'Revisar gastos ineficientes e privilégios',
        desc: 'Cortar mordomias, supersalários fictícios e programas que ninguém lembra para que servem.',
        hint: 'Gasto ↓ · Confiança ↑ · Popularidade ↑ · Serviços: depende de onde corta',
        resolve: (e) => {
          const fragile = e.ind.services < 40;
          return {
            delta: {
              ind: { popularity: 5, services: fragile ? -4 : -1 },
              lev: { spending: -0.9, efficiency: 1, credibility: 4 },
            },
            messages: fragile
              ? ['Com serviços já fragilizados, alguns cortes atingiram áreas sensíveis. Ajuste com cuidado.']
              : ['Descoberta: o Ministério do Cafezinho tinha 14 secretarias. Agora tem uma garrafa térmica.'],
            headline: 'GOVERNO CORTA PRIVILÉGIOS; CARROS OFICIAIS ENTRAM EM DEPRESSÃO',
          };
        },
      },
      {
        id: 'D',
        title: 'Simplificar tributos e combater desperdícios',
        desc: 'Unificar impostos, reduzir burocracia e fechar brechas. Efeito mais lento, porém duradouro.',
        hint: 'Eficiência ↑ · Crescimento ↑ (gradual) · Custo de transição no curto prazo',
        resolve: () => ({
          delta: { lev: { efficiency: 1.5, growthBoost: 0.5, credibility: 3, spending: 0.2 } },
          delayed: [
            later(6, 'Transição tributária concluída', { lev: { spending: -0.2, efficiency: 1, growthBoost: 0.5 } }, 'A simplificação tributária começou a render: menos papel, mais arrecadação.'),
          ],
          messages: ['Contadores de todo o país choram. Uns de alegria, outros de desemprego.'],
          headline: 'REFORMA SIMPLIFICA TRIBUTOS; FORMULÁRIO CAI DE 400 PARA 12 PÁGINAS',
        }),
      },
      {
        id: 'E',
        title: 'Combinar revisão de despesas e arrecadação',
        desc: 'Um pouco de corte, um pouco de receita. Ninguém fica feliz, mas a conta fecha.',
        hint: 'Primário ↑↑ · Confiança ↑ · Popularidade ↓ leve · Inflação ↑ leve',
        resolve: () => ({
          delta: {
            ind: { taxBurden: 0.7, popularity: -2 },
            lev: { spending: -0.5, inflationShock: 0.3, credibility: 6, efficiency: 0.5 },
          },
          messages: ['Ninguém gostou. Isso, em economia, costuma ser um bom sinal.'],
          headline: 'AJUSTE MISTO AGRADA A NINGUÉM E CONVENCE OS NÚMEROS',
        }),
      },
      {
        id: 'F',
        title: 'Novo Refis: perdão bilionário a grandes devedores',
        desc: 'Perdoar juros e multas de grandes empresas que devem ao Fisco, em troca de um pagamento adiantado. Quem pagou em dia não ganha nada.',
        hint: 'Caixa ↑ agora · Sonegação ↑ depois · Credibilidade ↓ · Pequeno empresário se sente bobo',
        resolve: () => ({
          delta: { ind: { popularity: -2 }, lev: { spending: -0.35, credibility: -4, efficiency: -0.4 } },
          delayed: [
            later(9, 'Ressaca do Refis', { lev: { spending: 0.35, efficiency: -0.6, credibility: -2 } }, 'O dinheiro do Refis acabou, e os grandes devedores voltaram a atrasar: todo mundo já espera o próximo perdão.'),
          ],
          messages: [
            'O caixa recebeu um adiantamento. Os juros e multas perdoados foram embora para sempre.',
            'Dado real: em dez anos (2008–2017), o Brasil perdoou R$ 176 bilhões em juros e multas em nove programas de parcelamento (Refis).',
            'Seu Arlindo, da oficina, pagou tudo em dia. Agora se pergunta por quê.',
          ],
          headline: 'GOVERNO LANÇA NOVO REFIS; GRANDES DEVEDORES COMEMORAM, QUEM PAGA EM DIA NÃO',
        }),
      },
    ],
  },
  // =========================================================
  {
    id: 'm3',
    num: 3,
    title: 'O DINHEIRO ACABOU',
    tagline: 'O cofre do Tesouro está vazio. Literalmente.',
    briefing: [
      'O Secretário do Tesouro (fictício) abriu o cofre e encontrou uma traça e um bilhete: "volto já".',
      'Vá ao Tesouro Nacional, na Esplanada dos Ministérios.',
    ],
    locationName: 'Tesouro Nacional (Esplanada)',
    monthsAfter: 3,
    steps: [
      { type: 'reach', text: 'Vá ao Tesouro Nacional na Esplanada', target: P.tesouroFront, radius: 7 },
      {
        type: 'talk',
        text: 'Fale com o Secretário Otávio Cofre',
        target: P.secretario,
        npc: 'secretario',
        speaker: 'Secretário Otávio Cofre (Tesouro)',
        lines: (e) => [
          'Presidente, a dívida está em ' + e.ind.debt.toFixed(1).replace('.', ',') + '% do PIB.',
          'A dívida subiu tanto que agora tem vista para o mar.',
          'Os juros estão comendo o orçamento. Precisamos de um plano, ou o mercado vai fazer um por nós.',
        ],
        label: 'Falar com o Secretário',
      },
      { type: 'decide', text: 'Decida diante do cofre vazio', target: P.cofre, radius: 3.5, label: 'Olhar o cofre vazio' },
    ],
    question: 'O Tesouro está em crise. Qual é o plano?',
    options: [
      {
        id: 'A',
        title: 'Mais programas, mais gastos',
        desc: 'Anunciar novos programas sem indicar de onde vem o dinheiro. Crescimento na marra!',
        hint: 'Popularidade ↑ agora · Atividade ↑ curto prazo · Confiança ↓↓ · Inflação ↑ depois',
        resolve: () => ({
          delta: { lev: { spending: 1.5, impulse: 1.5, popBoost: 8, credibility: -10 } },
          delayed: [later(3, 'Expectativas pioram', { lev: { inflationShock: 1.3 } }, 'O mercado fez as contas que o governo não fez. Juros e preços subiram.')],
          messages: ['Novo ministério criado: Ministério da Solução dos Problemas Criados Ontem.'],
          headline: 'GOVERNO LANÇA 12 PROGRAMAS EM UM DIA; ORÇAMENTO PEDE DEMISSÃO',
        }),
      },
      {
        id: 'B',
        title: 'Cortar investimentos indiscriminadamente',
        desc: 'Passar a tesoura em tudo: obras, manutenção, pesquisa. Rápido e brutal.',
        hint: 'Primário ↑↑ · Serviços ↓↓ · Crescimento ↓ · Desemprego ↑ depois',
        resolve: () => ({
          delta: {
            ind: { services: -8, popularity: -6 },
            lev: { spending: -1.5, impulse: -1.5, efficiency: -1, growthBoost: -1, credibility: 3 },
          },
          delayed: [later(6, 'Obras paradas', { ind: { unemployment: 0.8 }, lev: { growthBoost: -0.4 } }, 'Estradas sem manutenção e obras paradas: o corte cobrou seu preço.')],
          messages: ['O ajuste fiscal foi tão abrupto que até o buraco da rua ficou sem verba para crescer.'],
          headline: 'TESOURADA GERAL: CONTAS MELHORAM, PONTES PIORAM',
        }),
      },
      {
        id: 'C',
        title: 'Reforma administrativa (preservando o essencial)',
        desc: 'Reorganizar carreiras, fundir órgãos duplicados e digitalizar serviços, protegendo saúde e educação.',
        hint: 'Gasto ↓ gradual · Eficiência ↑↑ · Confiança ↑ · Protestos de servidores',
        resolve: () => ({
          delta: { ind: { popularity: -2, services: -1 }, lev: { spending: -0.4, efficiency: 2, credibility: 5 } },
          delayed: [later(6, 'Reforma madura', { lev: { spending: -0.4, efficiency: 0.5 } }, 'A reforma administrativa amadureceu: mesmo serviço, menos papelada.')],
          messages: ['Três ministérios viraram um. O cafezinho foi preservado como serviço essencial.'],
          headline: 'REFORMA ADMINISTRATIVA FUNDE ÓRGÃOS E PRESERVA ÁREAS ESSENCIAIS',
        }),
      },
      {
        id: 'D',
        title: 'Plano plurianual de ajuste fiscal',
        desc: 'Metas claras para quatro anos, com cortes graduais e transparência total.',
        hint: 'Credibilidade ↑↑ já · Gasto ↓ aos poucos · Efeito depende de cumprir',
        resolve: () => ({
          delta: { ind: { popularity: -1 }, lev: { credibility: 9, spending: -0.3 } },
          delayed: [
            later(6, 'Ajuste — fase 2', { lev: { spending: -0.4 } }, 'Fase 2 do plano fiscal cumprida. O mercado ficou desconfiado... de tão bom.'),
            later(12, 'Ajuste — fase 3', { lev: { spending: -0.4, credibility: 2 } }, 'Fase 3 do ajuste cumprida. Planilhas do Tesouro voltaram a sorrir.'),
          ],
          messages: ['Pela primeira vez, um plano de quatro anos durou mais de quatro semanas.'],
          headline: 'GOVERNO APRESENTA PLANO FISCAL PLURIANUAL; ANALISTAS PEDEM PARA VER DE NOVO',
        }),
      },
      {
        id: 'E',
        title: 'Acordo com o Congresso para reformas',
        desc: 'Negociar um pacote de reformas com o Congresso. O resultado depende do seu capital político.',
        hint: 'Se popular: reformas ↑ · Se impopular: o apoio sai caro',
        resolve: (e) =>
          e.ind.popularity >= 35
            ? {
                delta: { ind: { popularity: 1 }, lev: { credibility: 7, efficiency: 1, spending: -0.5 } },
                messages: ['Sua reforma foi aprovada. Agora é hora de explicar as consequências.'],
                headline: 'CONGRESSO APROVA REFORMAS; PRESIDENTE DESCOBRE QUE TEM BASE',
              }
            : {
                delta: { ind: { popularity: -1 }, lev: { credibility: 1, spending: 0.3 } },
                messages: ['Com popularidade baixa, o Congresso cobrou caro: emendas liberadas, reforma desidratada.'],
                headline: 'APOIO NO CONGRESSO SAI CARO; REFORMA CHEGA DE DIETA',
              },
      },
    ],
  },
  // =========================================================
  {
    id: 'm4',
    num: 4,
    title: 'A GREVE DOS CAMINHONEIROS',
    tagline: 'O diesel subiu. O país parou.',
    briefing: [
      'Caminhoneiros pararam as estradas. Supermercados começam a ficar sem produtos e os postos sem combustível.',
      'Vá ao posto de combustível e negocie com a liderança da greve.',
    ],
    locationName: 'Posto Esperança',
    monthsAfter: 3,
    onStart: { lev: { foodSupply: -0.08 } },
    onStartMessage: 'Greve dos caminhoneiros! O abastecimento caiu e as filas aumentaram.',
    steps: [
      { type: 'reach', text: 'Vá ao Posto Esperança', target: P.postoFront, radius: 8 },
      {
        type: 'talk',
        text: 'Converse com Zé do Frete',
        target: P.zeDoFrete,
        npc: 'ze',
        speaker: 'Zé do Frete, caminhoneiro',
        lines: (e) => [
          'Presidente, com todo respeito: o diesel subiu de novo.',
          'Se eu rodo, pago pra trabalhar. Se eu paro, o país para comigo.',
          'A gente não quer confusão. Quer uma solução que dure mais que a próxima eleição.',
        ],
        label: 'Conversar com Zé do Frete',
      },
      { type: 'decide', text: 'Decida na bomba de diesel', target: P.bombaDiesel, radius: 3.5, label: 'Ver o preço do diesel' },
    ],
    question: 'O abastecimento parou. Qual é a resposta?',
    options: [
      {
        id: 'A',
        title: 'Subsidiar o diesel sem prazo',
        desc: 'O Tesouro paga parte do diesel. Até quando? Até quando der.',
        hint: 'Greve acaba já · Gasto ↑ permanente · Confiança ↓',
        resolve: () => ({
          delta: { ind: { popularity: 6 }, lev: { spending: 0.8, foodSupply: 0.09, credibility: -5, dieselSubsidy: 0.8 } },
          delayed: [later(6, 'Subsídio eterno', { lev: { credibility: -2 } }, 'O subsídio "temporário" fez aniversário. O Tesouro não gostou.')],
          messages: ['Os caminhões voltaram a rodar. A conta também.'],
          headline: 'DIESEL SUBSIDIADO ENCERRA GREVE; TESOURO ASSUME O VOLANTE',
        }),
      },
      {
        id: 'B',
        title: 'Reduzir tributos temporariamente (com compensação)',
        desc: 'Cortar tributos do diesel por 6 meses, compensando com revisão de gastos.',
        hint: 'Greve acaba · Carga ↓ temporária · Primário neutro',
        resolve: () => ({
          delta: { ind: { taxBurden: -0.3, popularity: 3 }, lev: { spending: -0.25, foodSupply: 0.07, credibility: 1, dieselSubsidy: 0.4 } },
          delayed: [later(6, 'Fim da redução', { ind: { taxBurden: 0.3 }, lev: { dieselSubsidy: -0.4 } }, 'A redução temporária de tributos no diesel terminou no prazo combinado.')],
          messages: ['Alívio com data de validade. Raro, mas acontece.'],
          headline: 'GOVERNO CORTA TRIBUTO DO DIESEL POR 6 MESES E DIZ DE ONDE VEM O DINHEIRO',
        }),
      },
      {
        id: 'C',
        title: 'Investir em logística e infraestrutura',
        desc: 'Ferrovias, hidrovias e estradas para reduzir o custo do frete no longo prazo.',
        hint: 'Greve continua um tempo · Oferta ↑↑ depois · Eficácia depende da confiança',
        resolve: (e) => {
          const k = e.ind.confidence < 30 ? 0.5 : 1;
          return {
            delta: { ind: { popularity: -3 }, lev: { spending: 0.5, foodSupply: 0.02 } },
            delayed: [
              later(
                6,
                'Novas rotas',
                { lev: { foodSupply: 0.1 * k, supplyShock: -0.04 * k, growthBoost: 0.8 * k, efficiency: 1 * k } },
                k === 1 ? 'Novas ferrovias e rodovias reduziram o custo do frete.' : 'Com financiamento caro, só metade das obras saiu do papel.',
              ),
            ],
            messages: ['Os caminhoneiros gostaram do plano. Mas continuam parados até ver o primeiro trilho.'],
            headline: 'PACOTE DE LOGÍSTICA PROMETE FRETE MAIS BARATO... A PARTIR DO ANO QUE VEM',
          };
        },
      },
      {
        id: 'D',
        title: 'Alívio emergencial + reforma de longo prazo',
        desc: 'Alívio curto e focalizado agora, com um plano de logística e regras claras para o preço do combustível.',
        hint: 'Equilíbrio · Custo moderado · Resultado depende da situação fiscal',
        resolve: (e) => ({
          delta: { ind: { taxBurden: -0.15, popularity: 2 }, lev: { spending: 0.3, foodSupply: 0.06, credibility: e.ind.primary > -2 ? 2 : -1, dieselSubsidy: 0.3 } },
          delayed: [
            later(4, 'Fim do alívio', { ind: { taxBurden: 0.15 }, lev: { dieselSubsidy: -0.3, spending: -0.3 } }, 'O alívio emergencial terminou. A parte estrutural seguiu.'),
            later(8, 'Logística estrutural', { lev: { foodSupply: 0.05, growthBoost: 0.4 } }, 'As primeiras obras de logística entraram em operação.'),
          ],
          messages: ['Meio-termo: ninguém ganhou tudo, ninguém perdeu tudo. A estrada voltou a andar.'],
          headline: 'ACORDO ENCERRA GREVE COM ALÍVIO CURTO E PLANO LONGO',
        }),
      },
    ],
  },
  // =========================================================
  {
    id: 'm5',
    num: 5,
    title: 'BRASÍLIA EM CHAMAS',
    tagline: 'A Esplanada está lotada. A população quer respostas.',
    briefing: [
      'Grandes manifestações pacíficas ocupam a praça em frente ao Congresso.',
      'Atravesse a cidade, ouça três grupos de manifestantes e apresente um plano de recuperação no palanque.',
    ],
    locationName: 'Praça das Manifestações',
    monthsAfter: 3,
    steps: [
      { type: 'reach', text: 'Vá à Praça das Manifestações', target: P.praca, radius: 12 },
      {
        type: 'talk',
        text: 'Ouça a Professora Rita (1/3)',
        target: P.prot1,
        npc: 'prot1',
        speaker: 'Professora Rita',
        lines: (e) => [
          'Presidente, a escola tem quadro, giz e esperança. Só falta o resto.',
          `Serviços públicos nota ${e.ind.services.toFixed(0)} de 100. Eu daria recuperação.`,
          'Não quero milagre. Quero orçamento que dure o ano letivo inteiro.',
        ],
        label: 'Ouvir a Professora Rita',
      },
      {
        type: 'talk',
        text: 'Ouça o Motoboy Jefferson (2/3)',
        target: P.prot2,
        npc: 'prot2',
        speaker: 'Jefferson, motoboy',
        lines: (e) => [
          `Gasolina a preço de perfume importado. Eu entrego comida que não consigo comprar.`,
          `Desemprego em ${e.ind.unemployment.toFixed(1).replace('.', ',')}%. Meu primo é formado em engenharia e faz entrega comigo.`,
          'Emprego de verdade, presidente. Promessa a gente já tem de sobra.',
        ],
        label: 'Ouvir o Jefferson',
      },
      {
        type: 'talk',
        text: 'Ouça a Empresária Dona Neide (3/3)',
        target: P.prot3,
        npc: 'prot3',
        speaker: 'Dona Neide, dona de padaria',
        lines: (e) => [
          'Tenho uma padaria há 30 anos. Nunca vi o pão tão caro e o freguês tão sumido.',
          e.ind.taxBurden > 34.5 ? 'E o imposto? Eu pago tanto que já me considero sócia do governo.' : 'Imposto deu uma aliviada, mas os juros ainda me assustam.',
          'Quero previsibilidade. Plano bom é plano que não muda toda segunda-feira.',
        ],
        label: 'Ouvir a Dona Neide',
      },
      { type: 'decide', text: 'Apresente seu plano no palanque', target: P.palanque, radius: 4, label: 'Subir no palanque' },
    ],
    question: 'A praça espera. Qual plano de recuperação o presidente apresenta?',
    options: [
      {
        id: 'A',
        title: 'Plano de recuperação com metas públicas',
        desc: 'Metas mensais de inflação, emprego e serviços, publicadas num painel aberto. Ajuste gradual protegendo os vulneráveis.',
        hint: 'Credibilidade ↑ · Popularidade ↑ moderada · Gasto ↑ leve',
        resolve: () => ({
          delta: { ind: { popularity: 4 }, lev: { credibility: 5, spending: 0.2, efficiency: 0.5 } },
          messages: ['A praça aplaudiu com moderação. Em Brasília, isso é quase um carnaval.'],
          headline: 'PLANO COM METAS PÚBLICAS ACALMA A ESPLANADA',
        }),
      },
      {
        id: 'B',
        title: 'Prometer tudo para todos',
        desc: 'Escola nova, emprego garantido, pão de graça e picanha no domingo. Tudo. Agora.',
        hint: 'Aplausos ↑↑ · Credibilidade ↓↓ · Gasto ↑ · Inflação ↑ depois',
        resolve: () => ({
          delta: { lev: { popBoost: 10, credibility: -8, spending: 0.8, impulse: 0.8 } },
          delayed: [later(3, 'Promessas vencidas', { lev: { inflationShock: 1 }, ind: { popularity: -5 } }, 'As promessas venceram. A fatura chegou primeiro.')],
          messages: ['Aplausos estrondosos. Ao fundo, um economista desmaiou.'],
          headline: 'PRESIDENTE PROMETE TUDO; ORÇAMENTO PROMETE NADA',
        }),
      },
      {
        id: 'C',
        title: 'Pacote focado em emprego',
        desc: 'Qualificação profissional e obras de manutenção com prazo e orçamento definidos.',
        hint: 'Desemprego ↓ em ~3 meses · Gasto ↑ moderado · Eficácia depende da confiança',
        resolve: (e) => {
          const k = clamp(e.ind.confidence / 45, 0.5, 1.2);
          return {
            delta: { ind: { popularity: 3 }, lev: { spending: 0.5 } },
            delayed: [
              later(3, 'Vagas abertas', { ind: { unemployment: -0.7 * k }, lev: { growthBoost: 0.7 * k } }, 'Frentes de trabalho e cursos começaram a gerar vagas.'),
              later(12, 'Fim do pacote', { lev: { spending: -0.5 } }, 'O pacote de emprego terminou no prazo.'),
            ],
            messages: ['Jefferson já se inscreveu no curso de eletricista. O primo engenheiro dá as aulas.'],
            headline: 'PACOTE DE EMPREGO COM PRAZO E ORÇAMENTO DEFINIDOS',
          };
        },
      },
      {
        id: 'D',
        title: 'Culpar o governo anterior',
        desc: 'Um clássico atemporal de todos os governos de todos os universos.',
        hint: 'Bônus curtíssimo · Credibilidade ↓ · Nenhum problema resolvido',
        resolve: () => ({
          delta: { lev: { popBoost: 2, credibility: -4 } },
          delayed: [later(3, 'Prazo de validade', { ind: { popularity: -5 } }, 'A culpa do governo anterior expirou. Agora o governo anterior é você.')],
          messages: ['A multidão vaiou. Até o governo anterior vaiou.'],
          headline: 'PRESIDENTE CULPA ANTECESSOR; ANTECESSOR CULPA O DELE',
        }),
      },
    ],
  },
  // =========================================================
  {
    id: 'm6',
    num: 6,
    title: 'A GUERRA DOS PREÇOS',
    tagline: 'Uma guerra fictícia do outro lado do mundo esvaziou as prateleiras.',
    briefing: [
      'O conflito internacional fictício entre a República de Petrolândia e o Reino de Fertilizânia piorou.',
      'Combustíveis e fertilizantes sumiram do mercado. Vá à Central de Abastecimento na área industrial.',
    ],
    locationName: 'Central de Abastecimento',
    monthsAfter: 3,
    onStart: { lev: { supplyShock: 0.1, foodSupply: -0.05, inflationShock: 0.8 } },
    onStartMessage: 'Guerra fictícia piora: combustíveis e alimentos ficam escassos.',
    steps: [
      { type: 'reach', text: 'Vá à Central de Abastecimento (área industrial)', target: P.ceasaFront, radius: 9 },
      {
        type: 'talk',
        text: 'Converse com a fornecedora Dona Logística',
        target: P.fornecedora,
        npc: 'fornecedora',
        speaker: 'Dona Logística, distribuidora',
        lines: () => [
          'Presidente, meus fornecedores de fertilizante estão no meio de uma guerra que nem é nossa.',
          'Se não houver plano, em dois meses falta comida no interior.',
          'E por favor: não me venha com tabelamento. Da última vez, a prateleira foi a primeira a sumir.',
        ],
        label: 'Conversar com Dona Logística',
      },
      { type: 'decide', text: 'Decida diante dos estoques', target: P.estoque, radius: 4, label: 'Inspecionar os estoques' },
    ],
    question: 'A guerra fictícia ameaça o abastecimento. O que fazer?',
    options: [
      {
        id: 'A',
        title: 'Congelar preços por decreto',
        desc: 'Tabelar alimentos e combustíveis. Simples, rápido e... perigoso.',
        hint: 'Preços ↓ agora · Desabastecimento depois · Inflação represada volta',
        resolve: () => ({
          delta: { ind: { popularity: 6 }, lev: { inflationShock: -1.5, credibility: -4 }, picanhaMult: 0.88 },
          delayed: [
            later(3, 'Prateleiras vazias', { lev: { foodSupply: -0.1 } }, 'Preço tabelado, prateleira vazia. Ninguém vende abaixo do custo.'),
            later(6, 'Inflação represada', { lev: { inflationShock: 2.2 }, picanhaMult: 1.2 }, 'O congelamento acabou e os preços descongelaram de uma vez.'),
          ],
          messages: ['Os preços congelaram. Os fornecedores também.'],
          headline: 'GOVERNO CONGELA PREÇOS; FREEZER DO SUPERMERCADO CONTINUA VAZIO',
        }),
      },
      {
        id: 'B',
        title: 'Transferência focalizada aos vulneráveis',
        desc: 'Auxílio temporário com prazo e orçamento definidos para as famílias mais pobres.',
        hint: 'Poder de compra ↑ para quem precisa · Gasto ↑ temporário',
        resolve: () => ({
          delta: { ind: { popularity: 4, purchasingPower: 3 }, lev: { spending: 0.4 } },
          delayed: [later(9, 'Fim do auxílio', { lev: { spending: -0.4 } }, 'O auxílio emergencial terminou no prazo previsto.')],
          messages: ['Quem mais precisava recebeu. Quem não precisava reclamou no rádio.'],
          headline: 'AUXÍLIO FOCALIZADO PROTEGE FAMÍLIAS DURANTE A CRISE DE ABASTECIMENTO',
        }),
      },
      {
        id: 'C',
        title: 'Diversificar fornecedores e abrir importações',
        desc: 'Reduzir tarifas de importação temporariamente e buscar fornecedores em outros países (fictícios).',
        hint: 'Oferta ↑ em ~2 meses · Carga ↓ leve · Confiança ↑',
        resolve: () => ({
          delta: { ind: { taxBurden: -0.2 }, lev: { credibility: 2 } },
          delayed: [later(2, 'Novos fornecedores', { lev: { supplyShock: -0.07, foodSupply: 0.05 } }, 'Navios de Neutrália chegaram com fertilizante e diesel.')],
          messages: ['O Itamaraty fictício descobriu 14 países novos no mapa.'],
          headline: 'BRASIL DIVERSIFICA FORNECEDORES E REDUZ TARIFAS DE IMPORTAÇÃO',
        }),
      },
      {
        id: 'D',
        title: 'Estoques reguladores e acordo com distribuidores',
        desc: 'Liberar estoques públicos e firmar acordo de abastecimento com distribuidoras.',
        hint: 'Oferta ↑ imediata · Gasto ↑ leve · Efeito some se a guerra continuar',
        resolve: () => ({
          delta: { ind: { popularity: 2 }, lev: { spending: 0.3, foodSupply: 0.06, supplyShock: -0.02 } },
          messages: ['Dona Logística aprovou. Ela nunca aprova nada.'],
          headline: 'ESTOQUES PÚBLICOS LIBERADOS; FILAS DIMINUEM',
        }),
      },
      {
        id: 'E',
        title: 'Combinar auxílio focalizado + diversificação',
        desc: 'Proteger os vulneráveis agora enquanto se buscam novos fornecedores.',
        hint: 'Equilíbrio · Custo moderado · Oferta ↑ depois',
        resolve: () => ({
          delta: { ind: { taxBurden: -0.15, popularity: 3, purchasingPower: 2 }, lev: { spending: 0.3, credibility: 1 } },
          delayed: [
            later(2, 'Novos fornecedores', { lev: { supplyShock: -0.05, foodSupply: 0.04 } }, 'Novos fornecedores aliviaram a escassez.'),
            later(9, 'Fim do auxílio', { lev: { spending: -0.3 } }, 'O auxílio temporário terminou no prazo.'),
          ],
          messages: ['Plano combinado: nem bala de prata, nem tiro no pé.'],
          headline: 'GOVERNO COMBINA PROTEÇÃO SOCIAL E ABERTURA PARA ENFRENTAR ESCASSEZ',
        }),
      },
    ],
  },
  // =========================================================
  {
    id: 'm7',
    num: 7,
    title: 'O CONGRESSO DECIDE',
    tagline: 'O pacote de reformas precisa de 308 votos.',
    briefing: [
      'O Congresso funciona em condições precárias — mas funciona.',
      'Negocie com os blocos parlamentares (todos fictícios) para aprovar o pacote de reformas. Cada concessão tem custo.',
    ],
    locationName: 'Congresso Nacional',
    monthsAfter: 3,
    steps: [
      { type: 'reach', text: 'Vá ao Congresso Nacional', target: P.congressoFront, radius: 10 },
      {
        type: 'talk',
        text: 'Fale com o Presidente da Câmara, Dep. Arnaldo Quórum',
        target: P.quorum,
        npc: 'quorum',
        speaker: 'Dep. Arnaldo Quórum (fictício)',
        lines: (e) => [
          'Presidente! Que honra. Que surpresa. Que horas são as emendas?',
          'Para aprovar o pacote o senhor precisa de 308 votos. Sua base tem uns 150, em dia de sol.',
          e.ind.popularity >= 45
            ? 'Com essa popularidade, alguns colegas podem votar até de graça. Até.'
            : 'Com essa popularidade... vai ter que conversar bastante.',
          'A mesa de negociação está logo ali. Boa sorte. O senhor vai precisar.',
        ],
        label: 'Falar com o Dep. Quórum',
      },
      { type: 'negotiate', text: 'Negocie o pacote na mesa do plenário', target: P.plenario, radius: 3.5, label: 'Abrir a mesa de negociação' },
    ],
  },
  // =========================================================
  {
    id: 'm8',
    num: 8,
    title: 'O ÚLTIMO CHURRASCO',
    tagline: 'De volta ao supermercado. A hora da verdade.',
    briefing: [
      'Mais de um ano se passou. Volte ao Supermercado Bom Preço (Talvez) onde tudo começou.',
      'Os preços, as ruas e as pessoas mostram o resultado das suas decisões.',
    ],
    locationName: 'Supermercado Bom Preço (Talvez)',
    monthsAfter: 0,
    steps: [
      { type: 'reach', text: 'Volte ao Supermercado Bom Preço (Talvez)', target: P.superDoor, radius: 7 },
      {
        type: 'talk',
        text: 'Reencontre Seu Wanderley',
        target: P.superWorker,
        npc: 'worker',
        speaker: 'Seu Wanderley, metalúrgico',
        lines: workerLinesEnd,
        label: 'Conversar com Seu Wanderley',
      },
      { type: 'finale', text: 'Veja o preço final da picanha', target: P.superMeat, radius: 3.5, label: 'Ver o veredito no açougue' },
    ],
  },
];


// =========================================================
// JUROS NA CANETADA (personagens fictícios)
export const JUROS_MISSION: Mission = {
  id: 'mjuros',
  num: 4,
  title: 'JUROS NA CANETADA',
  tagline: 'Juros altos travam tudo. E se bastasse uma caneta?',
  briefing: [
    'Empresários e famílias reclamam: com juros tão altos, ninguém investe, ninguém compra a prazo.',
    'Um assessor sugeriu uma ideia "genial": baixar os juros por decreto, sem mexer nos gastos. Vá ao Banco Central (fictício) e decida.',
  ],
  locationName: 'Banco Central (fictício)',
  monthsAfter: 3,
  steps: [
    { type: 'reach', text: 'Vá ao Banco Central (fictício)', target: P.bcFront, radius: 7 },
    {
      type: 'talk',
      text: 'Ouça o presidente do BC, Dr. Juvenal Juros',
      target: P.juvenal,
      npc: 'juvenal',
      speaker: 'Dr. Juvenal Juros, presidente do Banco Central (fictício)',
      lines: (e) => [
        'Presidente, eu também queria juros baixos. Todo mundo quer.',
        `Mas a inflação está em ${e.ind.inflation.toFixed(1).replace('.', ',')}% e o governo gasta mais do que arrecada: déficit de ${Math.abs(e.ind.primary).toFixed(1).replace('.', ',')}% do PIB.`,
        'Juro alto é o sintoma. A febre é a conta que não fecha. Baixar juros na canetada é como baixar o termômetro com gelo: o número cai, a febre continua.',
        'Se cortarmos sem ajuste, o dinheiro fica barato hoje e caro amanhã — via inflação. A caneta está ali. A decisão é sua.',
      ],
      label: 'Falar com o Dr. Juvenal',
    },
    { type: 'decide', text: 'Decida diante da Caneta Gigante', target: P.caneta, radius: 3.5, label: 'Pegar a Caneta Gigante' },
  ],
  question: 'Como baixar os juros?',
  options: [
    {
      id: 'A',
      title: 'Baixar os juros na canetada',
      desc: 'Decreto: juros caem 4 pontos amanhã. Sem cortar um centavo de gasto. O Banco Central que se vire.',
      hint: 'Crescimento ↑ e popularidade ↑ agora · Inflação ↑↑ depois · Confiança ↓↓',
      resolve: () => ({
        delta: { ind: { popularity: 4 }, lev: { rateCut: 4, popBoost: 4, impulse: 1, credibility: -8, institutions: -2 } },
        delayed: [
          later(3, 'Dinheiro barato vira preço caro', { lev: { inflationShock: 2.4 }, picanhaMult: 1.06 }, 'A inflação voltou: crédito barato sem ajuste nas contas virou preço alto na prateleira.'),
          later(7, 'Juros sobem mais do que antes', { lev: { rateCut: -5.5, credibility: -3, growthBoost: -1 } }, 'Para conter a inflação, os juros tiveram que subir ainda mais do que antes da canetada.'),
        ],
        messages: ['As lojas lotaram e o crediário voltou. Por enquanto.', 'Economistas lembram: juro baixo sem conta em ordem é um empréstimo do futuro com juros do presente.'],
        headline: 'GOVERNO BAIXA JUROS POR DECRETO; MERCADO SOBE O DÓLAR, O POVO SOBE A ESCADA DA LOJA',
      }),
    },
    {
      id: 'B',
      title: 'Primeiro arrumar as contas',
      desc: 'Cortar gastos ineficientes e apresentar uma meta fiscal crível. Com a febre baixando, o BC corta os juros por conta própria.',
      hint: 'Popularidade ↓ agora · Confiança ↑↑ · Juros caem de verdade em ~6 meses',
      resolve: () => ({
        delta: { ind: { popularity: -3, services: -1 }, lev: { spending: -0.6, credibility: 6 } },
        delayed: [later(6, 'Juros caem com fundamento', { lev: { rateCut: 1.8, growthBoost: 0.6 } }, 'Com as contas em ordem, o BC cortou os juros sem fazer a inflação subir.')],
        messages: ['Ninguém gostou no começo. O Dr. Juvenal sorriu pela primeira vez no ano.'],
        headline: 'GOVERNO CORTA GASTOS E ABRE CAMINHO PARA JUROS MENORES',
      }),
    },
    {
      id: 'C',
      title: 'Pressionar o BC em rede nacional',
      desc: 'Sem cortar gastos, fazer um pronunciamento cobrando juros menores e insinuando trocar a diretoria.',
      hint: 'Bônus de popularidade passageiro · Credibilidade ↓ · Expectativa de inflação ↑',
      resolve: () => ({
        delta: { lev: { popBoost: 3, credibility: -5, institutions: -1 } },
        delayed: [later(2, 'Expectativas', { lev: { inflationShock: 0.8 } }, 'O mercado entendeu o recado: espera mais inflação à frente.')],
        messages: ['O BC não cortou. O mercado cortou a confiança.'],
        headline: 'PRESIDENTE COBRA O BC NA TV; JUROS FUTUROS SOBEM NA MESMA HORA',
      }),
    },
    {
      id: 'D',
      title: 'Meta fiscal + BC independente decide',
      desc: 'Uma meta de gastos moderada e respeito à autonomia do Banco Central. Corte gradual, sem susto.',
      hint: 'Equilíbrio · Confiança ↑ · Juros caem aos poucos',
      resolve: () => ({
        delta: { ind: { popularity: -1 }, lev: { spending: -0.3, credibility: 4, institutions: 1 } },
        delayed: [later(4, 'Corte gradual', { lev: { rateCut: 1, growthBoost: 0.4 } }, 'Juros começaram a cair aos poucos, sem assustar a inflação.')],
        messages: ['Nem canetada, nem tesourada. Um caminho do meio com cara de planilha.'],
        headline: 'META FISCAL E AUTONOMIA DO BC ABREM CICLO GRADUAL DE QUEDA DOS JUROS',
      }),
    },
  ],
};

// =========================================================
// O PINGUE-PONGUE DOS PODERES (personagens fictícios)
export const PINGPONG_MISSION: Mission = {
  id: 'mpp',
  num: 9,
  title: 'O PINGUE-PONGUE DOS PODERES',
  tagline: 'O presidente decide. O Congresso barra. A Corte libera. E o cidadão?',
  briefing: [
    'Você vai assinar uma medida para baratear o gás de cozinha.',
    'Prepare-se: o Congresso pode derrubá-la, a Corte pode ressuscitá-la — e o cidadão fica sem saber qual regra vale amanhã.',
  ],
  locationName: 'Praça dos Três Poderes (fictícia)',
  monthsAfter: 3,
  onStart: { lev: { institutions: -1 } },
  steps: [
    {
      type: 'talk',
      text: 'Assine a medida do gás com a Ministra Sueli Planilha',
      target: P.ministra,
      npc: 'ministra',
      speaker: 'Ministra Sueli Planilha (Fazenda)',
      lines: () => [
        'Presidente, a Medida Provisória do Gás Mais Barato está pronta.',
        'Só um detalhe: ninguém conversou com o Congresso antes.',
        '(você assina) Pronto. Agora é lei — pelo menos até o almoço.',
      ],
      label: 'Assinar a medida',
    },
    {
      type: 'talk',
      text: 'O Congresso reagiu: fale com o Dep. Arnaldo Quórum',
      target: P.quorum2,
      npc: 'quorum',
      speaker: 'Dep. Arnaldo Quórum (fictício)',
      lines: () => [
        'Presidente, derrubamos sua medida hoje de manhã. Votação relâmpago.',
        'Não foi pelo gás. Foi porque o senhor não nos consultou. Aqui ninguém gosta de ser pego de surpresa.',
        'Se quiser governar, mande projeto de lei e converse. Se não quiser, a gente também sabe não querer.',
      ],
      label: 'Falar com o Dep. Quórum',
    },
    {
      type: 'talk',
      text: 'A Corte interveio: veja a decisão do Ministro Onipotêncio Toga',
      target: P.tribunal,
      npc: 'toga',
      radius: 3.5,
      speaker: 'Ministro Onipotêncio Toga (fictício)',
      lines: () => [
        '(na cadeira do JUIZ) Por decisão individual, derrubo a derrubada do Congresso. Sua medida volta a valer.',
        'Não se anime, presidente: não foi por você. Foi porque eu decido.',
        'Amanhã, se eu acordar de outro humor, posso suspender tudo de novo. A caneta é minha.',
      ],
      label: 'Ver a decisão',
    },
    {
      type: 'talk',
      text: 'Converse com a Dra. Clara Constituição',
      target: P.professora,
      npc: 'clara',
      speaker: 'Dra. Clara Constituição, professora de Direito (fictícia)',
      lines: () => [
        'Viu o pingue-pongue? Executivo decide sem diálogo, Legislativo derruba por birra, Judiciário libera por decisão individual.',
        'Cada um ultrapassou um pouco a sua linha. O resultado: a dona de casa não sabe quanto vai pagar pelo gás amanhã.',
        'Instituições fortes não são as que vencem as outras. São as que respeitam limites e dão previsibilidade ao cidadão.',
      ],
      label: 'Conversar com a Dra. Clara',
    },
    { type: 'decide', text: 'Decida no gabinete do Planalto', target: P.planaltoFront, radius: 4, label: 'Decidir no gabinete presidencial' },
  ],
  question: 'Sua medida foi decidida, barrada e liberada. E agora?',
  options: [
    {
      id: 'A',
      title: 'Comemorar a vitória no tribunal',
      desc: '"Ganhamos!" Usar a Corte para passar por cima do Congresso sempre que der.',
      hint: 'Medida vale hoje · Congresso retalia · Instituições ↓',
      resolve: () => ({
        delta: { ind: { popularity: 2 }, lev: { institutions: -3, credibility: -4, inflationShock: -0.3 } },
        delayed: [later(3, 'Pauta-bomba', { lev: { spending: 0.5, credibility: -2 } }, 'O Congresso retaliou com uma pauta-bomba: novos gastos aprovados sem fonte de receita.')],
        messages: ['Você venceu a partida, mas a mesa de pingue-pongue quebrou.', 'Ganhar no tapetão hoje ensina o adversário a fazer o mesmo amanhã.'],
        headline: 'GOVERNO VENCE NO TRIBUNAL; CONGRESSO PROMETE O TROCO',
      }),
    },
    {
      id: 'B',
      title: 'Transformar a medida em projeto de lei e negociar',
      desc: 'Retirar a MP, mandar um projeto de lei ao Congresso e negociar com prazo e transparência.',
      hint: 'Mais lento · Instituições ↑ · Relação com o Congresso melhora',
      resolve: (e) => ({
        delta: { ind: { popularity: e.ind.popularity >= 35 ? 1 : -1 }, lev: { institutions: 3, credibility: 3 } },
        delayed: [later(3, 'Lei aprovada', { lev: { inflationShock: -0.5 } }, 'O projeto do gás foi aprovado pelo Congresso — e dessa vez ninguém derrubou.')],
        messages: ['Demorou mais. Mas agora a regra vale para todo mundo, e ninguém derruba de madrugada.'],
        headline: 'GÁS MAIS BARATO VIRA LEI APROVADA PELO CONGRESSO',
      }),
    },
    {
      id: 'C',
      title: 'Desistir e culpar os outros',
      desc: '"Eu tentei, mas o Congresso e a Corte não deixaram." Retirar tudo e fazer uma live reclamando.',
      hint: 'Nada muda · Popularidade ↓ · Credibilidade ↓',
      resolve: () => ({
        delta: { ind: { popularity: -3 }, lev: { credibility: -2 } },
        messages: ['A live teve muitas visualizações. O gás continuou caro.'],
        headline: 'PRESIDENTE DESISTE DA MEDIDA E CULPA OS OUTROS PODERES',
      }),
    },
    {
      id: 'D',
      title: 'Propor regras para acabar com o pingue-pongue',
      desc: 'Emenda constitucional: critérios para medidas provisórias, decretos legislativos só contra abusos e decisões individuais da Corte levadas ao plenário em prazo curto.',
      hint: 'Instituições ↑↑ · Previsibilidade ↑ · Depende de apoio no Congresso',
      resolve: (e) =>
        e.ind.popularity >= 35
          ? {
              delta: { lev: { institutions: 5, credibility: 5 } },
              delayed: [later(4, 'Regras claras', { lev: { growthBoost: 0.5 } }, 'Com regras claras entre os Poderes, o pingue-pongue acabou e os investimentos voltaram.')],
              messages: ['Cada Poder no seu papel, com prazos e limites. O cidadão finalmente sabe qual regra vale.'],
              headline: 'EMENDA ACABA COM O PINGUE-PONGUE ENTRE OS PODERES',
            }
          : {
              delta: { lev: { institutions: 2, credibility: 2 } },
              messages: ['Com pouca popularidade, só parte das regras passou. Um avanço tímido.'],
              headline: 'REGRAS ENTRE OS PODERES AVANÇAM, MAS PELA METADE',
            },
    },
  ],
};

MISSIONS.splice(3, 0, JUROS_MISSION);
MISSIONS.splice(MISSIONS.findIndex((m) => m.id === 'm7') + 1, 0, PINGPONG_MISSION);

// =========================================================
// O PAÍS DO FUTURO (QUE NUNCA CHEGA) — com dados reais nas placas
export const FUTURO_MISSION: Mission = {
  id: 'mfuturo',
  num: 7,
  title: 'O PAÍS DO FUTURO',
  tagline: '...que nunca chega?',
  briefing: [
    'Faz décadas que o Brasil é chamado de "o país do futuro". O presidente decidiu ver de perto onde esse futuro está parado.',
    'Visite a escola, a UPA e a periferia. Nas placas "DADO REAL", os números são do Brasil de verdade — o resto é ficção.',
  ],
  locationName: 'Escola, UPA e periferia',
  monthsAfter: 3,
  steps: [
    { type: 'reach', text: 'Vá à Escola Estadual Futuro Distante', target: P.escolaFront, radius: 7 },
    {
      type: 'talk',
      text: 'Converse com a diretora Dona Lourdes',
      target: P.diretora,
      npc: 'diretora',
      speaker: 'Dona Lourdes, diretora (fictícia)',
      lines: () => [
        'Presidente, bem-vindo. Cuidado com a goteira: ela já tem matrícula.',
        'Dado real: no PISA 2022, 73% dos alunos brasileiros ficaram abaixo do nível básico em matemática. Nos países da OCDE são 31%.',
        'Meus alunos não são menos capazes. Falta professor bem formado, falta tempo de aula, falta cobrar resultado.',
        'Sem educação de base, o futuro fica sempre para a próxima geração.',
      ],
      label: 'Conversar com Dona Lourdes',
    },
    { type: 'reach', text: 'Vá à UPA 24h', target: P.upaFront, radius: 7 },
    {
      type: 'talk',
      text: 'Converse com a enfermeira Patrícia',
      target: P.enfermeira,
      npc: 'enfermeira',
      speaker: 'Patrícia, enfermeira (fictícia)',
      lines: (e) => [
        'Presidente, aqui é 24h de atendimento e 24h de fila.',
        'Dado real: o SUS bateu recorde de cirurgias eletivas nos últimos anos — e mesmo assim a fila continua. Ela nem é unificada: não existe um número oficial exato de quem espera.',
        e.ind.services < 45 ? `No jogo, os serviços públicos estão em ${e.ind.services.toFixed(0)}/100. Aqui na UPA a gente sente cada ponto.` : 'Melhorou um pouco por aqui. Mas a fila ainda dobra a esquina.',
        'E metade dos casos que eu atendo começa lá na periferia: doença de água suja.',
      ],
      label: 'Conversar com Patrícia',
    },
    { type: 'reach', text: 'Vá à periferia, à beira do esgoto a céu aberto', target: P.periferia, radius: 9 },
    {
      type: 'talk',
      text: 'Ouça Seu Valdomiro, morador',
      target: P.morador,
      npc: 'morador',
      speaker: 'Seu Valdomiro, morador (fictício)',
      lines: () => [
        'O senhor sentiu o cheiro? É o "rio" que passa na porta da minha casa desde que eu nasci.',
        'Dado real: cerca de 90 milhões de brasileiros vivem sem coleta de esgoto e uns 33 milhões sem água potável.',
        'A placa da obra está ali desde 2009. Já trocaram de governo quatro vezes. A placa ficou.',
        'Meu neto falta na escola por diarreia. Aí não aprende, aí não arruma emprego... e o país do futuro fica no passado.',
      ],
      label: 'Conversar com Seu Valdomiro',
    },
    { type: 'decide', text: 'Decida diante da placa da obra parada', target: P.placaObra, radius: 4, label: 'Ler a placa da obra' },
  ],
  question: 'Onde o dinheiro público vai fazer o futuro chegar?',
  options: [
    {
      id: 'A',
      title: 'Inaugurar uma obra vistosa',
      desc: 'Um viaduto iluminado e um estádio com o nome de um aliado. Fita, foto e discurso.',
      hint: 'Popularidade ↑ agora · Gasto ↑ · Escola, saúde e esgoto: nada muda',
      resolve: () => ({
        delta: { lev: { popBoost: 6, spending: 0.5, credibility: -3 } },
        delayed: [later(4, 'Foto desbotou', { ind: { popularity: -4 } }, 'A foto da inauguração desbotou. O esgoto continua passando na porta de Seu Valdomiro.')],
        messages: ['Fita cortada, foto tirada. O cheiro continua o mesmo.'],
        headline: 'GOVERNO INAUGURA ESTÁDIO AO LADO DE ESGOTO A CÉU ABERTO',
      }),
    },
    {
      id: 'B',
      title: 'Plano de saneamento com metas e parcerias',
      desc: 'Concessões e parcerias com metas, multas e fiscalização pública. Obra que começa e termina.',
      hint: 'Gasto ↑ leve · Serviços ↑ e emprego ↑ em ~1 ano · Saúde melhora junto',
      resolve: () => ({
        delta: { ind: { popularity: 1 }, lev: { spending: 0.3, efficiency: 0.8, credibility: 2 } },
        delayed: [later(9, 'Esgoto chega', { ind: { services: 4, unemployment: -0.3 }, lev: { growthBoost: 0.4 } }, 'As primeiras ruas ganharam rede de esgoto. Internações por doença de água suja começaram a cair.')],
        messages: ['A placa de 2009 foi trocada por uma com data de entrega — e multa se atrasar.'],
        headline: 'PLANO DE SANEAMENTO COM METAS E MULTAS COMEÇA PELA PERIFERIA',
      }),
    },
    {
      id: 'C',
      title: 'Educação de base com metas',
      desc: 'Alfabetização na idade certa, reforço em matemática, formação de professores e avaliação pública por escola.',
      hint: 'Gasto ↑ leve · Credibilidade ↑ · Resultados lentos, mas duradouros',
      resolve: () => ({
        delta: { ind: { popularity: 1 }, lev: { spending: 0.3, credibility: 2 } },
        delayed: [later(10, 'Escola melhora', { ind: { services: 3 }, lev: { efficiency: 0.8, growthBoost: 0.3 } }, 'As avaliações das escolas melhoraram. Dona Lourdes mandou consertar a goteira — com orçamento próprio.')],
        messages: ['Dona Lourdes chorou. Depois pediu tudo por escrito.'],
        headline: 'GOVERNO LANÇA PLANO DE EDUCAÇÃO DE BASE COM METAS POR ESCOLA',
      }),
    },
    {
      id: 'D',
      title: 'Escola + saúde + saneamento, pagos com corte de privilégios',
      desc: 'Cortar supersalários, penduricalhos e isenções sem retorno, e levar o dinheiro para escola, UPA e esgoto.',
      hint: 'Servidores do topo reclamam · Gasto quase neutro · Serviços ↑↑ em ~1 ano',
      resolve: (e) => ({
        delta: { ind: { popularity: e.ind.popularity >= 35 ? 2 : -1 }, lev: { spending: -0.2, efficiency: 1.5, credibility: 4 } },
        delayed: [later(9, 'O dinheiro chegou', { ind: { services: 5, popularity: 3 }, lev: { growthBoost: 0.5 } }, 'O dinheiro que ia para privilégios chegou à escola, à UPA e ao cano de esgoto.')],
        messages: ['Alguns gabinetes ficaram em silêncio. A periferia fez barulho — de comemoração.'],
        headline: 'CORTE DE PRIVILÉGIOS PAGA ESCOLA, SAÚDE E SANEAMENTO',
      }),
    },
    {
      id: 'E',
      title: 'Prometer que o futuro chega no próximo mandato',
      desc: 'Um discurso bonito: "o Brasil é o país do futuro". De novo.',
      hint: 'Bônus curto · Credibilidade ↓ · Nada muda',
      resolve: () => ({
        delta: { lev: { popBoost: 2, credibility: -3 } },
        messages: ['O Brasil continua sendo o país do futuro. O futuro continua sem data marcada.'],
        headline: 'PRESIDENTE PROMETE O FUTURO; FUTURO PEDE PRORROGAÇÃO',
      }),
    },
  ],
};

MISSIONS.splice(MISSIONS.findIndex((m) => m.id === 'm5') + 1, 0, FUTURO_MISSION);

// =========================================================
// O SUPREMO SOU EU — crise institucional (personagens fictícios)
export const SUPREMO_MISSION: Mission = {
  id: 'msup',
  num: 8,
  title: 'O SUPREMO SOU EU',
  tagline: 'Um único ministro decide tudo. Até o que não é com ele.',
  briefing: [
    'Crise institucional! Uma decisão individual de madrugada suspendeu a lei aprovada pelo Congresso e um decreto do Executivo — ao mesmo tempo.',
    'O responsável é o Ministro Onipotêncio Toga, da Suprema Corte Fictícia. Dizem que ele julga os processos em que é réu, faz a própria defesa, a acusação e ainda dá a sentença.',
    'Ouça o Congresso, visite o tribunal e decida como devolver o equilíbrio à República.',
  ],
  locationName: 'Praça dos Três Poderes (fictícia)',
  monthsAfter: 3,
  onStart: { lev: { institutions: -6, credibility: -3 } },
  onStartMessage: 'Crise institucional: lei do Congresso e decreto do Executivo suspensos por uma única decisão individual.',
  steps: [
    {
      type: 'talk',
      text: 'Ouça o Dep. Arnaldo Quórum no Congresso',
      target: P.quorum2,
      npc: 'quorum',
      speaker: 'Dep. Arnaldo Quórum (fictício)',
      lines: () => [
        'Presidente, o Congresso votou, debateu e aprovou. Foram meses de trabalho.',
        'Às três da manhã, uma única decisão individual suspendeu tudo. Sem plenário, sem prazo, sem explicação.',
        'Agora toda lei sai daqui com um asterisco: "*sujeito à opinião do Ministro Onipotêncio".',
        'Se o voto de 513 deputados vale menos que a caneta de uma pessoa, para que serve o Parlamento?',
      ],
      label: 'Falar com o Dep. Quórum',
    },
    { type: 'reach', text: 'Vá à Suprema Corte Fictícia', target: P.supremoFront, radius: 7 },
    {
      type: 'talk',
      text: 'Assista à "sessão" do Ministro Onipotêncio Toga',
      target: P.tribunal,
      npc: 'toga',
      radius: 3.5,
      speaker: 'Ministro Onipotêncio Toga (fictício)',
      lines: () => [
        '(sentado na cadeira do RÉU) Bom dia, presidente. Hoje eu sou o réu.',
        '(muda para a cadeira do PROMOTOR) Como promotor, acuso o réu... de ter razão. Grave!',
        '(muda para a cadeira do ADVOGADO) Como advogado do réu — que sou eu —, peço a absolvição do meu cliente, que também sou eu.',
        '(muda para a cadeira do JUIZ) Como juiz, absolvo. Decisão unânime: um a zero.',
        '(ainda na cadeira do JUIZ) E de ofício, suspendo a lei do Congresso, o decreto do Executivo e o horário de verão. Sessão encerrada.',
      ],
      label: 'Assistir à sessão',
    },
    {
      type: 'talk',
      text: 'Converse com a constitucionalista Dra. Clara Constituição',
      target: P.professora,
      npc: 'clara',
      speaker: 'Dra. Clara Constituição, professora de Direito (fictícia)',
      lines: () => [
        'Presidente, o problema não é ter um Judiciário forte. É qualquer poder virar o único poder.',
        'Ninguém pode ser réu, advogado, promotor e juiz ao mesmo tempo. Isso vale para ministro, presidente ou deputado.',
        'Numa República, os Três Poderes são independentes e se limitam uns aos outros: são os freios e contrapesos.',
        'A saída não é trocar de dono do poder absoluto. É reforçar as regras — pelos caminhos da Constituição.',
      ],
      label: 'Conversar com a Dra. Clara',
    },
    { type: 'decide', text: 'Decida no monumento dos Três Poderes', target: P.monumento, radius: 4, label: 'Olhar o monumento dos Três Poderes' },
  ],
  question: 'A República está desequilibrada. O que o presidente faz?',
  options: [
    {
      id: 'A',
      title: 'Desobedecer e governar por decreto',
      desc: '"Se ele manda sozinho, eu também mando." Ignorar as decisões judiciais e governar por cima do Congresso.',
      hint: 'Aplausos de parte do público · Confiança ↓↓ · Crise institucional piora',
      resolve: () => ({
        delta: { lev: { popBoost: 5, credibility: -10, institutions: -3, growthBoost: -0.8 } },
        delayed: [later(3, 'Insegurança jurídica', { lev: { credibility: -3 } }, 'Ninguém sabe mais qual regra vale: investimentos foram adiados.')],
        messages: [
          'Você trocou um poder absoluto por outro. A República não melhorou: só mudou o dono do problema.',
          'Instituições fracas não protegem ninguém — nem quem está no poder hoje.',
        ],
        headline: 'PRESIDENTE DESAFIA A CORTE E GOVERNA POR DECRETO; CRISE INSTITUCIONAL SE APROFUNDA',
      }),
    },
    {
      id: 'B',
      title: 'Aceitar calado',
      desc: 'Evitar o conflito e deixar tudo como está. Talvez o ministro se canse.',
      hint: 'Sem confronto agora · Desequilíbrio continua · Segurança jurídica ↓',
      resolve: () => ({
        delta: { ind: { popularity: -3 }, lev: { credibility: -3, institutions: -1 } },
        delayed: [later(3, 'Paralisia', { lev: { growthBoost: -0.5, credibility: -2 } }, 'Leis aprovadas continuam suspensas. O Congresso parou de votar: "para quê?".')],
        messages: ['O silêncio também é uma decisão. O ministro entendeu como um "sim".'],
        headline: 'GOVERNO SE CALA; MINISTRO SUSPENDE MAIS TRÊS LEIS ANTES DO ALMOÇO',
      }),
    },
    {
      id: 'C',
      title: 'Reforma institucional pela Constituição',
      desc: 'Propor com o Congresso uma emenda constitucional: limites a decisões individuais, prazos para pedidos de vista, regras claras de impedimento e suspeição, transparência total.',
      hint: 'Instituições ↑↑ · Confiança ↑ · Precisa de apoio no Congresso (popularidade)',
      resolve: (e) =>
        e.ind.popularity >= 35
          ? {
              delta: { lev: { institutions: 7, credibility: 6 } },
              delayed: [later(4, 'Segurança jurídica', { lev: { growthBoost: 0.7 } }, 'Com regras claras entre os Poderes, investimentos travados voltaram a andar.')],
              messages: [
                'Emenda aprovada: decisões individuais agora precisam ir ao plenário, com prazo. Quem é parte não julga.',
                'Ninguém perdeu poder: a República ganhou equilíbrio.',
              ],
              headline: 'CONGRESSO APROVA EMENDA QUE REEQUILIBRA OS TRÊS PODERES',
            }
          : {
              delta: { lev: { institutions: 3, credibility: 2 } },
              messages: ['Com pouca popularidade, a emenda saiu pela metade. Já é um começo — o equilíbrio voltou um pouco.'],
              headline: 'EMENDA DOS TRÊS PODERES É APROVADA DESIDRATADA',
            },
    },
    {
      id: 'D',
      title: 'Aumentar a Corte e nomear aliados',
      desc: '"Se não dá para vencê-los, aumente o número deles." Criar 14 novas cadeiras e indicar amigos.',
      hint: 'Resolve seu problema hoje · Cria o mesmo problema amanhã · Credibilidade ↓↓',
      resolve: () => ({
        delta: { ind: { popularity: -2 }, lev: { institutions: -4, credibility: -8, spending: 0.05 } },
        messages: [
          'Agora são 25 ministros. O problema não diminuiu: ficou maior, mais caro e com o seu nome.',
          'Aparelhar uma instituição é enfraquecê-la — e a próxima pessoa no poder vai usar a mesma arma.',
        ],
        headline: 'GOVERNO AMPLIA A CORTE PARA 25; ANALISTAS: "TROCARAM O DONO DO DESEQUILÍBRIO"',
      }),
    },
    {
      id: 'E',
      title: 'Pacto dos Três Poderes + transparência',
      desc: 'Reunir Executivo, Congresso e Judiciário num pacto público: cada um no seu quadrado, com prazos, votações em plenário e agenda aberta.',
      hint: 'Instituições ↑ (gradual) · Confiança ↑ · Funciona mesmo com popularidade baixa',
      resolve: () => ({
        delta: { ind: { popularity: 2 }, lev: { institutions: 4, credibility: 4 } },
        delayed: [later(4, 'Pacto consolidado', { lev: { institutions: 2, growthBoost: 0.4 } }, 'O pacto dos Três Poderes se consolidou: cada um no seu papel, todos sob a Constituição.')],
        messages: ['Foi a primeira reunião em anos em que ninguém saiu suspendendo ninguém.'],
        headline: 'TRÊS PODERES ASSINAM PACTO PÚBLICO DE INDEPENDÊNCIA E LIMITES',
      }),
    },
  ],
};

MISSIONS.splice(MISSIONS.findIndex((m) => m.id === 'mpp') + 1, 0, SUPREMO_MISSION);

// =========================================================
// DESAFIO FINAL — A ELEIÇÃO
export const ELECTION_MISSION: Mission = {
  id: 'm9',
  num: 9,
  title: 'DESAFIO FINAL: A ELEIÇÃO',
  tagline: 'O mandato acabou. Agora quem decide é o povo.',
  briefing: [
    'Chegou a eleição. Seu adversário é o Dr. Teodoro Talvez, do Partido do Amanhã Talvez (personagem e partido fictícios).',
    'Faça campanha no bairro e no comércio, apresente sua proposta no debate e vá à seção eleitoral acompanhar a apuração. Se o povo aprovar, você terá um segundo mandato para melhorar a vida das pessoas.',
  ],
  locationName: 'Campanha eleitoral',
  monthsAfter: 2,
  steps: [
    { type: 'reach', text: 'Vá ao comício no Bairro Residencial', target: P.comicio, radius: 9 },
    {
      type: 'talk',
      text: 'Ouça a eleitora Dona Socorro',
      target: P.eleitora,
      npc: 'eleitora',
      speaker: 'Dona Socorro, diarista',
      lines: (e) => [
        'Presidente, voto não é presente. É contrato.',
        e.ind.purchasingPower > 74 ? 'O dinheiro está rendendo um pouco mais lá em casa. Isso eu não esqueço.' : 'O dinheiro ainda não chega no fim do mês. Isso também eu não esqueço.',
        'Quero saber o que o senhor vai fazer nos próximos quatro anos. Com que dinheiro, de preferência.',
      ],
      label: 'Conversar com Dona Socorro',
    },
    { type: 'reach', text: 'Vá ao Centro Comercial', target: P.comercioRua, radius: 7 },
    {
      type: 'talk',
      text: 'Converse com Seu Arlindo, dono de oficina',
      target: P.arlindo,
      npc: 'arlindo',
      speaker: 'Seu Arlindo, pequeno empresário',
      lines: (e) => [
        'Presidente, tenho uma oficina com seis funcionários. Quem gera emprego neste país é gente como eu.',
        `Carga tributária em ${e.ind.taxBurden.toFixed(1).replace('.', ',')}% do PIB. Eu passo mais tempo com o contador do que com os carros.`,
        'Enquanto isso, leio no jornal sobre supersalário, penduricalho e Refis perdoando bilhões de grandes devedores. Eu pago em dia; eles esperam o próximo perdão.',
        'Assim não dá para acreditar que falta dinheiro — falta é gastar direito e cobrar de quem deve.',
        'Me convença no debate.',
      ],
      label: 'Conversar com Seu Arlindo',
    },
    { type: 'decide', text: 'Suba ao palco do debate na TV', target: P.palanque, radius: 4, label: 'Entrar no debate ao vivo' },
    { type: 'election', text: 'Vá à seção eleitoral acompanhar a apuração', target: P.urna, radius: 4, label: 'Acompanhar a apuração' },
  ],
  question: 'Debate ao vivo: qual é a sua proposta para o segundo mandato?',
  options: [
    {
      id: 'A',
      title: 'Prometer o paraíso',
      desc: 'Picanha grátis, imposto zero e aumento para todo mundo. Como pagar? "Isso é detalhe."',
      hint: 'Votos ↑↑ agora · Se ganhar, a conta chega no segundo mandato',
      resolve: () => ({
        delta: { lev: { credibility: -4 } },
        messages: ['O auditório veio abaixo. Os economistas também.', 'Governar é mais difícil do que prometer — e o segundo mandato vai cobrar.'],
        headline: 'PRESIDENTE PROMETE O PARAÍSO NO DEBATE; ORÇAMENTO PEDE DIREITO DE RESPOSTA',
        campaign: { plan: 'paraiso', bonus: 6, commerceBonus: 0 },
      }),
    },
    {
      id: 'B',
      title: 'Continuidade responsável',
      desc: 'Defender o que deu certo, admitir o que deu errado e manter o rumo das reformas.',
      hint: 'Votos dependem dos resultados do seu mandato',
      resolve: (e) => {
        const b = clamp((health(e) - 0.5) * 12, -4, 5);
        return {
          delta: { lev: { credibility: 2 } },
          messages: [b > 0 ? 'Os números do mandato falaram por você.' : 'Defender os números foi difícil: eles não ajudaram.'],
          headline: 'PRESIDENTE DEFENDE O MANDATO E PROMETE MANTER O RUMO',
          campaign: { plan: 'continuidade', bonus: b, commerceBonus: 0 },
        };
      },
    },
    {
      id: 'C',
      title: 'Choque de eficiência',
      desc: 'Acabar com supersalários e penduricalhos, cortar desperdício e usar a economia para aliviar os impostos de quem produz: pequenos e médios empresários.',
      hint: 'Votos ↑ (comércio ↑↑) · Servidores divididos · Segundo mandato mais eficiente',
      resolve: () => ({
        delta: { lev: { credibility: 3 } },
        messages: ['"O Brasil não é pobre: gasta mal." A frase virou meme e cartaz.', 'Seu Arlindo aplaudiu de pé. Alguns gabinetes ficaram em silêncio.'],
        headline: 'PRESIDENTE PROMETE FIM DOS PENDURICALHOS E ALÍVIO PARA PEQUENOS EMPRESÁRIOS',
        campaign: { plan: 'eficiencia', bonus: 3, commerceBonus: 5 },
      }),
    },
    {
      id: 'D',
      title: 'Atacar o adversário',
      desc: 'Passar o debate inteiro falando do Dr. Teodoro Talvez. Proposta? Na próxima.',
      hint: 'Efeito incerto nos votos · Credibilidade ↓ · Segundo mandato sem plano',
      resolve: (e) => ({
        delta: { lev: { credibility: -3 } },
        messages: ['O debate virou bate-boca. O eleitor mudou de canal.'],
        headline: 'DEBATE TEM MAIS ACUSAÇÕES QUE PROPOSTAS; ELEITOR PEDE O CONTROLE REMOTO',
        campaign: { plan: 'ataque', bonus: e.month % 2 ? 2 : -2, commerceBonus: 0 },
      }),
    },
  ],
};

// =========================================================
// QUARTEL ABANDONADO — Forças Armadas (personagens fictícios; dados reais nas placas)
export const DEFESA_MISSION: Mission = {
  id: 'mdefesa',
  num: 12,
  title: 'QUARTEL ABANDONADO',
  tagline: 'Tanque de 1970, hélice em licitação e pensão até o fim do século.',
  briefing: [
    'O presidente foi visitar um quartel (fictício). A tropa trabalha com equipamento sucateado, enquanto a maior parte do orçamento da Defesa vai para aposentadorias e pensões.',
    'Nas placas "DADO REAL", os números são do Brasil de verdade. Ouça o sargento, a pensionista e o general — e decida.',
  ],
  locationName: 'Quartel da Guarnição Fictícia',
  monthsAfter: 3,
  steps: [
    { type: 'reach', text: 'Vá ao Quartel da Guarnição Fictícia', target: P.quartelFront, radius: 9 },
    {
      type: 'talk',
      text: 'Converse com o Sargento Pereira',
      target: P.sargento,
      npc: 'sargento',
      speaker: 'Sargento Pereira (fictício)',
      lines: () => [
        'Presidente, aquele blindado é de 1970. A peça de reposição a gente pega no ferro-velho.',
        'O caminhão quebrou em 2014. O helicóptero está sem hélice: está "em licitação".',
        'E o meu soldo não é alto, não. O dinheiro não chega aqui embaixo.',
        'Dado real: em 2025, inativos e pensões militares consumiram cerca de 47% do orçamento da Defesa. Para equipamento sobra pouco.',
      ],
      label: 'Conversar com o Sargento',
    },
    {
      type: 'talk',
      text: 'Conheça Dona Vitalícia, pensionista',
      target: P.herdeira,
      npc: 'herdeira',
      speaker: 'Dona Vitalícia, 68 anos, filha de general (fictícia)',
      lines: () => [
        'Bom dia, presidente! Vim só buscar uma documentação. Estacionei ali o carro novo.',
        'Recebo a pensão do papai desde os 21. Casar no papel? Jamais! Perderia o benefício.',
        'Dado real: a pensão vitalícia para filhas foi extinta em 2001 para quem entrou depois — mas segue valendo para quem já estava na carreira até 2000, e pode durar décadas.',
        'Equipamento velho? Ah, isso eu não sei. Eu nunca venho aqui.',
      ],
      label: 'Conversar com Dona Vitalícia',
    },
    {
      type: 'talk',
      text: 'Fale com o General Estático',
      target: P.general,
      npc: 'general',
      speaker: 'General Estático (fictício)',
      lines: () => [
        'Presidente. Estamos estudando a modernização da carreira.',
        'O estudo começou em 1998. Está na fase de formação de um grupo de trabalho para avaliar a criação de uma comissão.',
        'Mexer nos benefícios? Temos que ter cautela. Mexer no equipamento? Também. Mexer em qualquer coisa? Cautela.',
        'Enquanto isso, o país muda lá fora — e aqui dentro tudo continua exatamente igual.',
      ],
      label: 'Falar com o General',
    },
    { type: 'decide', text: 'Decida diante do mural do orçamento da Defesa', target: P.muralDefesa, radius: 4, label: 'Ler o mural do orçamento' },
  ],
  question: 'Tropa com equipamento sucateado e benefícios intocáveis. O que o presidente faz?',
  options: [
    {
      id: 'A',
      title: 'Não mexer com os militares',
      desc: 'Deixar tudo exatamente como está. Ninguém reclama, nada melhora.',
      hint: 'Sem conflito · Equipamento continua sucateado · Credibilidade ↓',
      resolve: () => ({
        delta: { lev: { credibility: -2 } },
        delayed: [later(6, 'Sucateamento', { lev: { efficiency: -0.4 } }, 'Mais um blindado foi para o ferro-velho. A pensão de Dona Vitalícia foi reajustada.')],
        messages: ['O General Estático aprovou. Ele aprova tudo que não muda nada.'],
        headline: 'GOVERNO DECIDE NÃO DECIDIR SOBRE AS FORÇAS ARMADAS',
      }),
    },
    {
      id: 'B',
      title: 'Cortar equipamento e treinamento',
      desc: 'Para fechar a conta sem mexer em benefícios, corta o que sobrou: combustível, munição de treino e manutenção.',
      hint: 'Gasto ↓ leve · Tropa ainda mais sucateada · Benefícios intactos',
      resolve: () => ({
        delta: { ind: { popularity: -1 }, lev: { spending: -0.2, efficiency: -0.8, credibility: -1 } },
        messages: ['O blindado de 1970 agora vai completar 70 anos. Sem combustível para a festa.'],
        headline: 'CORTE ATINGE TREINO E MANUTENÇÃO; PENSÕES SEGUEM INTACTAS',
      }),
    },
    {
      id: 'C',
      title: 'Reformar a proteção social militar',
      desc: 'Com o Congresso: teto real para pensões, fim de acúmulos e de privilégios residuais, regras de transição e respeito ao direito adquirido. A economia vai para equipamento e para a tropa.',
      hint: 'Gasto ↓ · Eficiência ↑ · Resistência no topo · Depende de apoio político',
      resolve: (e) =>
        e.ind.popularity >= 35
          ? {
              delta: { ind: { popularity: 2 }, lev: { spending: -0.4, efficiency: 1.2, credibility: 4 } },
              delayed: [later(8, 'Tropa equipada', { lev: { growthBoost: 0.3 } }, 'Chegaram peças, combustível e novos equipamentos. O Sargento Pereira tirou a foto do ano.')],
              messages: ['Reforma aprovada: menos privilégio no topo, mais equipamento na base.', 'Dona Vitalícia mantém o que já recebia — mas acúmulos e excessos acabaram.'],
              headline: 'REFORMA MILITAR CORTA PRIVILÉGIOS E REFORÇA EQUIPAMENTO DA TROPA',
            }
          : {
              delta: { lev: { spending: -0.15, efficiency: 0.5, credibility: 1 } },
              messages: ['Com pouca popularidade, a reforma passou pela metade. Algum avanço, muita resistência.'],
              headline: 'REFORMA MILITAR AVANÇA, MAS DESIDRATADA',
            },
    },
    {
      id: 'D',
      title: 'Aumentar o orçamento da Defesa sem reformar',
      desc: 'Mais dinheiro para a Defesa, sem mudar a distribuição.',
      hint: 'Gasto ↑ · A maior parte continua indo para inativos e pensões',
      resolve: () => ({
        delta: { lev: { spending: 0.6, credibility: -2 } },
        messages: ['Mais dinheiro, mesma proporção: o blindado ganhou uma pintura nova. Só a pintura.'],
        headline: 'DEFESA GANHA MAIS VERBA; EQUIPAMENTO CONTINUA NO FERRO-VELHO',
      }),
    },
    {
      id: 'E',
      title: 'Plano de modernização com metas',
      desc: 'Mais militares temporários, investimento em tecnologia e indústria de defesa, metas públicas e teto de pensões para os próximos anos.',
      hint: 'Gasto ↓ leve · Eficiência ↑ · Resultados graduais',
      resolve: () => ({
        delta: { lev: { spending: -0.2, efficiency: 1, credibility: 3 } },
        delayed: [later(9, 'Modernização', { lev: { growthBoost: 0.4 } }, 'A indústria de defesa contratou engenheiros e a tropa recebeu equipamento novo.')],
        messages: ['O General Estático pediu um grupo de trabalho. Desta vez, com prazo.'],
        headline: 'PLANO DE MODERNIZAÇÃO DAS FORÇAS ARMADAS TERÁ METAS PÚBLICAS',
      }),
    },
  ],
};

MISSIONS.splice(MISSIONS.findIndex((m) => m.id === 'msup') + 1, 0, DEFESA_MISSION);

MISSIONS.push(ELECTION_MISSION);
MISSIONS.forEach((m, i) => (m.num = i + 1));
export const ELECTION_INDEX = MISSIONS.length - 1;

// ---------------------------------------------------------------
// Minijogo de negociação (Missão 7)
// ---------------------------------------------------------------
export interface Bloc {
  id: string;
  name: string;
  leader: string;
  votes: number;
  demand: string;
  cost: string;
  apply: { lev?: Record<string, number>; ind?: Record<string, number>; strength?: number };
}

export const NEGOTIATION = {
  needed: 308,
  base: 150,
  blocs: [
    {
      id: 'asfalto',
      name: 'Bloco do Asfalto',
      leader: 'Dep. Emenda Farta',
      votes: 90,
      demand: 'Emendas para obras em suas bases eleitorais.',
      cost: 'Gasto +0,3% do PIB',
      apply: { lev: { spending: 0.3 } },
    },
    {
      id: 'churrasco',
      name: 'Bancada do Churrasco',
      leader: 'Dep. Brasa Viva',
      votes: 70,
      demand: 'Isenção total para carvão e farofa no pacote.',
      cost: 'Reforma 15% mais fraca · Carga −0,1',
      apply: { ind: { taxBurden: -0.1 }, strength: -0.15 },
    },
    {
      id: 'calculadora',
      name: 'Frente da Calculadora',
      leader: 'Sen. Planilha Fria',
      votes: 60,
      demand: 'Regra fiscal mais dura dentro do pacote.',
      cost: 'Popularidade −3 · Credibilidade +3',
      apply: { ind: { popularity: -3 }, lev: { credibility: 3 } },
    },
    {
      id: 'talvez',
      name: 'Partido do Talvez',
      leader: 'Dep. Muro Firme',
      votes: 80,
      demand: 'Criação do Ministério da Solução dos Problemas Criados Ontem.',
      cost: 'Gasto +0,15 · Eficiência −0,3',
      apply: { lev: { spending: 0.15, efficiency: -0.3 } },
    },
  ] as Bloc[],
};

export function resolveNegotiation(e: Econ, accepted: string[], appealed: boolean): { outcome: Outcome; votes: number; approved: boolean } {
  let votes = NEGOTIATION.base;
  let strength = 1;
  const lev: Record<string, number> = {};
  const ind: Record<string, number> = {};
  const add = (o: Record<string, number>, k: string, v: number) => (o[k] = (o[k] ?? 0) + v);
  for (const b of NEGOTIATION.blocs) {
    if (accepted.includes(b.id)) {
      votes += b.votes;
      strength += b.apply.strength ?? 0;
      for (const [k, v] of Object.entries(b.apply.lev ?? {})) add(lev, k, v);
      for (const [k, v] of Object.entries(b.apply.ind ?? {})) add(ind, k, v);
    }
  }
  // Apelo à opinião pública: rende votos de indecisos se o presidente for popular
  if (appealed) {
    const gained = Math.round(clamp((e.ind.popularity - 30) * 3, 0, 75));
    votes += gained;
    if (e.ind.popularity < 35) add(lev, 'credibility', -1);
  }
  const approved = votes >= NEGOTIATION.needed;
  if (approved) {
    add(lev, 'efficiency', 2 * strength);
    add(lev, 'credibility', 6 * strength);
    add(lev, 'spending', -0.6 * strength);
    return {
      votes,
      approved,
      outcome: {
        delta: { lev, ind },
        delayed: [later(6, 'Reformas em vigor', { lev: { growthBoost: 0.8 * strength } }, 'As reformas aprovadas começaram a destravar investimentos.')],
        messages: ['Sua reforma foi aprovada. Agora é hora de explicar as consequências.', `Placar: ${votes} votos a favor.`],
        headline: strength < 0.95 ? 'REFORMA APROVADA — COM FAROFA' : 'CONGRESSO APROVA PACOTE DE REFORMAS',
      },
    };
  }
  add(lev, 'credibility', -5);
  add(ind, 'popularity', -3);
  return {
    votes,
    approved,
    outcome: {
      delta: { lev, ind },
      messages: [`Faltaram ${NEGOTIATION.needed - votes} votos. O pacote voltou para a gaveta.`, 'As concessões feitas, porém, continuam valendo.'],
      headline: 'PACOTE DE REFORMAS É DERROTADO; GOVERNO PROMETE TENTAR DE NOVO',
    },
  };
}
