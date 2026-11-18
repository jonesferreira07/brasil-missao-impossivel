import { useState } from 'react';
import { brl, IND_META, IND_ORDER, monthLabel, type EndingId } from '../economy/model';
import { GAME, SITE } from '../game/config';
import { isMuted, setMuted, sfx } from '../game/sfx';
import { useGame } from '../game/store';
import { MISSIONS } from '../missions/data';
import { DISCLAIMER } from './HUD';

// ------------------------------------------------------------ Menu principal
export function MainMenu() {
  const s = useGame();
  return (
    <div className="menu">
      <div className="kicker">UNIVERSO ALTERNATIVO · ANO 203X</div>
      <h1>
        BRASIL <span className="dash">—</span>
        <br />
        <span className="b">MISSÃO IMPOSSÍVEL</span>
      </h1>
      <h2>{GAME.subtitle}</h2>
      <div className="tag">{GAME.tagline}</div>
      <div className="buttons">
        <button
          className="btn primary"
          onClick={() => {
            sfx('good');
            s.newGame();
          }}
        >
          ▶ Iniciar governo
        </button>
        <button className="btn" disabled={!s.hasSave} onClick={() => s.continueGame()}>
          Continuar {s.hasSave ? '' : '(sem jogo salvo)'}
        </button>
        <button className="btn" onClick={() => s.set({ showHowTo: true })}>
          Como jogar
        </button>
      </div>
      <a className="site-card" href={SITE.url} target="_blank" rel="noopener noreferrer">
        <b>{SITE.name}</b>
        <span>No jogo os números são simulados. Os reais — quanto você paga, como cada Poder gasta, quanto custa cada parlamentar — estão em</span>
        <em>{SITE.label} ↗</em>
      </a>
      <div className="credits">{DISCLAIMER} Todos os personagens, ministérios, partidos e falas são inventados.</div>
      <div className="stripe" />
    </div>
  );
}

// ------------------------------------------------------------ Pausa
export function PauseMenu() {
  const s = useGame();
  const [m, setM] = useState(isMuted());
  if (!s.paused || s.screen !== 'playing') return null;
  return (
    <div className="overlay">
      <div className="panel pause" style={{ maxWidth: 420 }}>
        <h3>Governo em pausa</h3>
        <div className="sub">{monthLabel(s.econ.month)} · Missão {Math.min(s.missionIndex + 1, MISSIONS.length)} de {MISSIONS.length}</div>
        <button className="btn primary" onClick={() => s.set({ paused: false })}>
          Continuar
        </button>
        <button className="btn" onClick={() => s.save()}>
          Salvar progresso
        </button>
        <button className="btn" onClick={() => s.set({ showHistory: true })}>
          Histórico de decisões
        </button>
        <button className="btn" onClick={() => s.set({ showHowTo: true })}>
          Como jogar
        </button>
        <button
          className="btn"
          onClick={() => {
            setMuted(!m);
            setM(!m);
          }}
        >
          Som: {m ? 'desligado' : 'ligado'}
        </button>
        <button className="btn" onClick={() => s.toMenu()}>
          Salvar e voltar ao menu
        </button>
        <a className="btn site-btn" href={SITE.url} target="_blank" rel="noopener noreferrer">
          {SITE.name} — veja os números reais ↗
        </a>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Como jogar
export function HowToPlay() {
  const show = useGame((s) => s.showHowTo);
  const set = useGame((s) => s.set);
  if (!show) return null;
  return (
    <div className="overlay">
      <div className="panel howto" style={{ maxWidth: 820 }}>
        <h3>Como jogar</h3>
        <p>
          Você é o Presidente de um Brasil fictício em crise. Explore Brasília, converse com a população e complete as 13 missões (a última é a eleição). Cada decisão mexe nos
          indicadores do painel econômico — alguns efeitos são imediatos, outros chegam meses depois. Não existe opção que funcione sempre: o resultado
          depende do contexto.
        </p>
        <h4>Controles</h4>
        <table>
          <tbody>
            <tr><td><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd></td><td>Andar / dirigir (setas também funcionam)</td></tr>
            <tr><td><kbd>Shift</kbd></td><td>Correr</td></tr>
            <tr><td>Mouse</td><td>Clique na tela para travar o mouse e girar a câmera (ou clique e arraste). Roda do mouse: zoom</td></tr>
            <tr><td><kbd>E</kbd></td><td>Interagir, conversar, avançar diálogos</td></tr>
            <tr><td><kbd>F</kbd></td><td>Entrar / sair do veículo</td></tr>
            <tr><td><kbd>Espaço</kbd></td><td>Freio de mão</td></tr>
            <tr><td><kbd>Q</kbd></td><td>Trocar estação de rádio (no carro)</td></tr>
            <tr><td><kbd>Tab</kbd></td><td>Detalhar o painel econômico</td></tr>
            <tr><td><kbd>H</kbd></td><td>Histórico de decisões</td></tr>
            <tr><td><kbd>Esc</kbd> / <kbd>P</kbd></td><td>Pausa (salvar, menu)</td></tr>
          </tbody>
        </table>
        <h4>No celular</h4>
        <p>Joystick à esquerda para andar/dirigir (empurre até o fim para correr), arraste o dedo na tela para girar a câmera e use os botões à direita: E (interagir), Carro, Correr/Freio e Rádio. "Economia" abre o painel; ☰ abre a pausa. Deite o celular para jogar melhor.</p>
        <h4>O modelo econômico (simplificado e transparente)</h4>
        <table>
          <tbody>
            {IND_ORDER.map((k) => (
              <tr key={k}>
                <td style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>{IND_META[k].short}</td>
                <td>{IND_META[k].desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h4>A cidade reage</h4>
        <p>
          Inflação alta enche a praça de manifestantes e esvazia prateleiras. Desemprego fecha lojas. Serviços ruins acumulam lixo. Recuperação reabre o
          comércio, restaura prédios e traz mais carros e pedestres. O tempo também passa enquanto você explora (1 mês a cada ~80 s).
        </p>
        <h4>Finais</h4>
        <p>Colapso, Sobrevivência, Recuperação — e um final secreto para quem conseguir uma combinação improvável de acertos.</p>
        <h4>Do jogo para a vida real</h4>
        <p>
          Os indicadores do jogo são simulados. Para acompanhar os números de verdade — impostos pagos, gastos de cada Poder, cota dos parlamentares,
          emendas — e cobrar seus representantes, visite{' '}
          <a href={SITE.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--yellow)' }}>
            {SITE.label}
          </a>
          . {SITE.line}
        </p>
        <p style={{ fontSize: 12, opacity: 0.7 }}>{DISCLAIMER}</p>
        <button className="btn primary small" onClick={() => set({ showHowTo: false })}>
          Entendi, presidente
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Histórico
export function History() {
  const show = useGame((s) => s.showHistory);
  const hist = useGame((s) => s.history);
  const set = useGame((s) => s.set);
  if (!show) return null;
  return (
    <div className="overlay">
      <div className="panel hist" style={{ maxWidth: 680 }}>
        <h3>Histórico de decisões</h3>
        {hist.length === 0 && <p className="sub">Nenhuma decisão ainda. O Diário Oficial está em branco — e isso também é uma decisão.</p>}
        {hist.map((h, i) => (
          <div className="item" key={i}>
            <div className="m">
              MISSÃO: {h.missionTitle} · {monthLabel(h.month)}
            </div>
            <div>
              <b>{h.optionId !== 'NEG' ? `${h.optionId}) ` : ''}</b>
              {h.optionTitle}
            </div>
            <div className="h">“{h.headline}”</div>
          </div>
        ))}
        <button className="btn small" onClick={() => set({ showHistory: false })}>
          Fechar
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Finais
const ENDINGS: Record<EndingId, { title: string; lead: string; emoji: string }> = {
  colapso: {
    title: 'Final 1 — Colapso',
    emoji: '🔥',
    lead: 'A inflação venceu, a dívida ficou insustentável e os serviços públicos desmoronaram. O mercado fez as contas, a população fez as malas e a picanha virou lenda urbana. Governar, descobriu-se, é bem mais difícil do que prometer.',
  },
  sobrevivencia: {
    title: 'Final 2 — Sobrevivência',
    emoji: '🩹',
    lead: 'O governo conteve a emergência: o país não quebrou. Mas os problemas estruturais continuam lá, esperando o próximo mandato. O churrasco de domingo voltou — de linguiça, e com moderação.',
  },
  recuperacao: {
    title: 'Final 3 — Recuperação',
    emoji: '📈',
    lead: 'Melhora fiscal gradual, crescimento, emprego voltando e preços estabilizados. Ninguém fez milagre — fez conta, negociou e esperou os efeitos chegarem. Lojas reabriram e a Esplanada voltou a ter mais turistas que manifestantes.',
  },
  milagre: {
    title: 'Final 4 — O Milagre da Picanha',
    emoji: '🍖',
    lead: 'Contra todas as probabilidades, as contas fecharam, a inflação caiu, o emprego voltou e a picanha cabe no bolso. Um churrasco popular toma a Esplanada: o país inteiro em volta da mesma grelha. Os economistas pedem para refazer as contas. O boi pede férias.',
  },
};

export function EndingScreen() {
  const s = useGame();
  const [copied, setCopied] = useState(false);
  if (s.screen !== 'ending' || !s.ending) return null;
  const E = ENDINGS[s.ending];
  const i = s.econ.ind;
  const share = `Joguei BRASIL — MISSÃO IMPOSSÍVEL e terminei no "${E.title}" ${E.emoji}\nInflação ${IND_META.inflation.fmt(i.inflation)} · Desemprego ${IND_META.unemployment.fmt(i.unemployment)} · Dívida ${IND_META.debt.fmt(i.debt)} · Picanha ${brl(i.picanha)}/kg\nConsegue fazer melhor, presidente? (Obra de ficção e sátira.)`;
  return (
    <div className={`ending ${s.ending}`}>
      <div className="tag">FIM DO PRIMEIRO MANDATO · {monthLabel(s.econ.month)}</div>
      <h1>
        {E.emoji} {E.title}
      </h1>
      <div className="lead">{E.lead}</div>
      <div className="grid">
        {IND_ORDER.map((k) => (
          <div className="kpi" key={k}>
            <div className="l">{IND_META[k].short}</div>
            <div className="v">{IND_META[k].fmt(i[k])}</div>
          </div>
        ))}
      </div>
      <h3 style={{ letterSpacing: '.1em', fontSize: 14, color: 'var(--yellow)' }}>SUAS DECISÕES</h3>
      <ol style={{ maxWidth: 900, lineHeight: 1.6 }}>
        {s.history.map((h, idx) => (
          <li key={idx}>
            <b>{h.missionTitle}:</b> {h.optionTitle} <span style={{ opacity: 0.6 }}>— “{h.headline}”</span>
          </li>
        ))}
      </ol>
      <div className="challenge">
        <div>
          <b>DESAFIO FINAL: A ELEIÇÃO</b>
          <span>Faça campanha, enfrente o debate e veja se o povo te dá um segundo mandato para continuar melhorando a vida das pessoas.</span>
        </div>
        <button className="btn primary" onClick={() => s.startElection()}>
          Ir para a eleição ▶
        </button>
      </div>
      <div className="row">
        <button className="btn small" onClick={() => s.newGame()}>
          Recomeçar do zero
        </button>
        <button
          className="btn small"
          onClick={() => {
            try {
              navigator.clipboard.writeText(share).then(() => setCopied(true)).catch(() => setCopied(false));
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? 'Copiado!' : 'Copiar resultado para compartilhar'}
        </button>
        <button className="btn small" onClick={() => s.set({ screen: 'menu', ending: null })}>
          Menu principal
        </button>
      </div>
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 30 }}>{DISCLAIMER}</p>
    </div>
  );
}
