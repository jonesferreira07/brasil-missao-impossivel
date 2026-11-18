import { brl, fuelPrices, type Econ } from '../economy/model';

const NAMES = ['Dona Cida', 'Seu Juarez', 'Kelly, estudante', 'Marcão, pedreiro', 'Tia Lurdes', 'Wesley, entregador', 'Dona Fátima', 'Seu Osvaldo, aposentado', 'Bruna, enfermeira', 'Gilson, taxista', 'Raimunda, feirante', 'Pedro, programador'];

/** Falas fictícias de cidadãos, reagindo ao estado da economia. */
export function citizenLine(e: Econ, seed: number): { speaker: string; lines: string[] } {
  const i = e.ind;
  const pool: string[] = [];
  if (i.inflation > 9) {
    pool.push('Fui ao mercado com cem reais. Voltei com uma sacola e uma lição de humildade.');
    pool.push('O preço muda tão rápido que o supermercado contratou um DJ pra remixar as etiquetas.');
    pool.push('Presidente, a inflação não aceita discurso como forma de pagamento. Eu tentei.');
  } else if (i.inflation < 5.5) {
    pool.push('Pela primeira vez em anos o preço do pão é o mesmo da semana passada. Fiquei até desconfiado.');
    pool.push('A inflação baixou. Agora só falta meu salário perceber.');
  }
  if (i.unemployment > 11) {
    pool.push('Mandei currículo pra 80 empresas. Três responderam: "fechamos".');
    pool.push('Meu filho é formado, pós-graduado e faz entrega de bicicleta. A bicicleta também é formada.');
  } else if (i.unemployment < 9) {
    pool.push('Consegui emprego com carteira assinada! Minha mãe emoldurou a carteira.');
  }
  if (i.services < 40) {
    pool.push('O posto de saúde marcou minha consulta para 203X+3. Disse que é pra eu não ficar doente até lá.');
    pool.push('Na escola do meu filho, o ventilador é ele mesmo abanando o caderno.');
  } else if (i.services > 55) {
    pool.push('O hospital atendeu rápido. Achei que tinha errado de país.');
  }
  if (i.confidence < 30) pool.push('Meu primo do mercado financeiro disse que o Brasil está "lateralizando pra baixo". Não sei o que é, mas parece ruim.');
  if (i.confidence > 60) pool.push('Abriram uma fábrica nova ali perto. Dizem que os investidores voltaram a acreditar em Papai Noel.');
  if (i.taxBurden > 35) pool.push('Pago tanto imposto que já me considero sócio do governo. Quero minha parte nos lucros.');
  if (i.picanha > 150) pool.push(`Picanha a ${brl(i.picanha)}? Lá em casa, churrasco agora é de foto.`);
  if (i.picanha < 120) pool.push(`Picanha a ${brl(i.picanha)}! Domingo tem churrasco e o vizinho vai sentir o cheiro.`);
  if (e.lev.foodSupply < 0.86) pool.push('Fui comprar feijão e encontrei só a etiqueta. Bonita, a etiqueta.');
  const { gas } = fuelPrices(e);
  if (gas > 8) pool.push(`Gasolina a ${brl(gas)}. Agora eu empurro o carro e chamo de academia.`);
  if (i.popularity < 30) pool.push('Presidente, com todo respeito: a gente quer menos anúncio e mais resultado.');
  if (i.popularity > 55) pool.push('O senhor tá indo bem, viu? Mas não sobe à cabeça, que a eleição é logo ali.');
  if (i.primary < -3) pool.push('Ouvi dizer que o governo gasta mais do que arrecada. Igual lá em casa, só que com mais zeros.');
  pool.push('Ministério novo de novo? Daqui a pouco tem Ministério dos Ministérios.');
  pool.push('Eu só queria um país onde o plano dure mais que a novela.');
  const line = pool[seed % pool.length];
  return { speaker: NAMES[seed % NAMES.length], lines: [line] };
}
