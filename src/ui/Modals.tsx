import { useMemo, useState } from 'react';
import { IND_META, IND_ORDER, monthLabel, type IndKey } from '../economy/model';
import { sfx } from '../game/sfx';
import { guard, useOpenGuard } from './guard';
import { useGame } from '../game/store';
import { MISSIONS, NEGOTIATION } from '../missions/data';
import { SITE } from '../game/config';

// ------------------------------------------------------------ Decisão
export function DecisionModal() {
  const open = useGame((s) => s.decisionOpen);
  const mi = useGame((s) => s.missionIndex);
  const decide = useGame((s) => s.decide);
  const set = useGame((s) => s.set);
  const m = MISSIONS[mi];
  useOpenGuard(open);
  if (!open || !m?.options) return null;
  return (
    <div className="overlay">
      <div className="panel">
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '.2em', color: 'var(--yellow)' }}>
          MISSÃO {m.num} · DECISÃO PRESIDENCIAL
        </div>
        <h3>{m.question}</h3>
        <div className="sub">Escolha com cuidado: os efeitos dependem da situação atual da economia e alguns só aparecem meses depois.</div>
        <div className="cards">
          {m.options.map((o) => (
            <button key={o.id} className={`card ${o.joke ? 'joke' : ''}`} onClick={guard(() => decide(o.id))} onMouseEnter={() => sfx('click')}>
              {o.joke && <span className="stamp">PIADA · IMPOSTO FICTÍCIO</span>}
              <span className="letter">{o.id}</span>
              <span className="title">{o.title}</span>
              <span className="desc">{o.desc}</span>
              <span className="hint">Efeitos prováveis: {o.hint}</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <button className="btn small" onClick={() => set({ decisionOpen: false })}>
            Pensar mais um pouco
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Tabela de variações
function Deltas({ before, after }: { before: Record<IndKey, number>; after: Record<IndKey, number> }) {
  return (
    <div className="deltas">
      {IND_ORDER.map((k) => {
        const meta = IND_META[k];
        const d = after[k] - before[k];
        const eps = k === 'picanha' ? 0.5 : 0.05;
        const cls = Math.abs(d) < eps ? 'neutral' : (meta.better === 'up') === d > 0 ? 'up-good' : 'up-bad';
        return (
          <div className="row" key={k}>
            <span>{meta.short}</span>
            <span>
              {meta.fmt(before[k])} → <span className={cls}>{meta.fmt(after[k])}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------ Resultado (jornal)
export function OutcomeModal() {
  const o = useGame((s) => s.outcome);
  const month = useGame((s) => s.econ.month);
  const cont = useGame((s) => s.outcomeContinue);
  useOpenGuard(!!o && o.phase === 'now');
  if (!o) return null;
  return (
    <div className="overlay">
      <div className="news">
        <div className="mast">
          <div className="name">O FICTÍCIO DE BRASÍLIA</div>
          <div className="date">Edição extra · {monthLabel(month)}</div>
        </div>
        {o.joke && <div className="joke-banner">ATENÇÃO: O IMPOSTO DESTA NOTÍCIA É UMA PIADA E NÃO EXISTE</div>}
        <div className="choice">Decisão: {o.optionTitle}</div>
        <div className="head">{o.headline}</div>
        {o.phase === 'now' ? (
          <>
            <ul className="msgs">
              {o.messages.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
            <b style={{ fontFamily: 'var(--ui)', fontSize: 13 }}>EFEITO IMEDIATO</b>
            <Deltas before={o.before} after={o.after} />
          </>
        ) : (
          <>
            <div className="later">
              <b style={{ fontFamily: 'var(--ui)' }}>{o.months} MESES DEPOIS…</b>
              <ul className="msgs">
                {o.laterMessages.length ? o.laterMessages.map((m, i) => <li key={i}>{m}</li>) : <li>A economia seguiu seu curso. Nem toda notícia é manchete.</li>}
              </ul>
            </div>
            <b style={{ fontFamily: 'var(--ui)', fontSize: 13 }}>DESDE A DECISÃO</b>
            {o.laterAfter && <Deltas before={o.before} after={o.laterAfter} />}
          </>
        )}
        <div className="newsfoot">
          Quer ver os números reais de impostos e gastos públicos?{' '}
          <a href={SITE.url} target="_blank" rel="noopener noreferrer">
            {SITE.label}
          </a>{' '}
          — {SITE.slogan.toLowerCase()}.
        </div>
        <div style={{ textAlign: 'right' }}>
          <button className="btn primary small" onClick={guard(cont)}>
            {o.phase === 'now' && o.months > 0 ? `Avançar ${o.months} meses ▶` : 'Concluir missão ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Negociação (Missão 7)
export function NegotiationModal() {
  const open = useGame((s) => s.negotiationOpen);
  const pop = useGame((s) => s.econ.ind.popularity);
  const negotiate = useGame((s) => s.negotiate);
  const set = useGame((s) => s.set);
  const [acc, setAcc] = useState<string[]>([]);
  const [appeal, setAppeal] = useState(false);
  const votes = useMemo(() => {
    let v = NEGOTIATION.base;
    for (const b of NEGOTIATION.blocs) if (acc.includes(b.id)) v += b.votes;
    if (appeal) v += Math.round(Math.max(0, Math.min(75, (pop - 30) * 3)));
    return v;
  }, [acc, appeal, pop]);
  useOpenGuard(open);
  if (!open) return null;
  const toggle = (id: string) => {
    sfx('click');
    setAcc((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  };
  const pct = (v: number) => `${(v / 513) * 100}%`;
  return (
    <div className="overlay">
      <div className="panel neg">
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '.2em', color: 'var(--yellow)' }}>MISSÃO 7 · MESA DE NEGOCIAÇÃO</div>
        <h3>Pacote de Reformas</h3>
        <div className="sub">
          Você precisa de <b>{NEGOTIATION.needed}</b> de 513 votos. Sua base tem {NEGOTIATION.base}. Cada acordo traz votos — e consequências. Todos os blocos e parlamentares são fictícios.
        </div>
        {NEGOTIATION.blocs.map((b) => (
          <div key={b.id} className={`bloc ${acc.includes(b.id) ? 'on' : ''}`}>
            <div>
              <div className="n">
                {b.name} — {b.leader} · {b.votes} votos
              </div>
              <div className="d">Exige: {b.demand}</div>
              <div className="c">Custo: {b.cost}</div>
            </div>
            <button className="btn small" onClick={() => toggle(b.id)}>
              {acc.includes(b.id) ? 'Desfazer acordo' : 'Fechar acordo'}
            </button>
          </div>
        ))}
        <div className={`bloc ${appeal ? 'on' : ''}`}>
          <div>
            <div className="n">Apelar à opinião pública (pronunciamento em rede nacional)</div>
            <div className="d">Indecisos podem aderir sem concessões — se o presidente for popular. Popularidade atual: {pop.toFixed(0)}%.</div>
            <div className="c">Rende até 75 votos. Com popularidade abaixo de 35%, pode custar credibilidade.</div>
          </div>
          <button className="btn small" onClick={() => setAppeal((a) => !a)}>
            {appeal ? 'Cancelar' : 'Apelar'}
          </button>
        </div>
        <div className="meter">
          <i style={{ width: pct(Math.min(513, votes)), background: votes >= NEGOTIATION.needed ? 'var(--green)' : '#b5651d' }} />
          <b style={{ left: pct(NEGOTIATION.needed) }} />
          <span>
            Votos estimados: {votes} / {NEGOTIATION.needed}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn small" onClick={() => set({ negotiationOpen: false })}>
            Voltar depois
          </button>
          <button
            className="btn primary small"
            onClick={() => {
              negotiate(acc, appeal);
              setAcc([]);
              setAppeal(false);
            }}
          >
            Colocar em votação ▶
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Introdução de missão
export function MissionIntro() {
  const show = useGame((s) => s.missionIntro);
  const mi = useGame((s) => s.missionIndex);
  const set = useGame((s) => s.set);
  const m = MISSIONS[mi];
  useOpenGuard(show);
  if (!show || !m) return null;
  return (
    <div className="overlay">
      <div className="panel intro">
        <div className="num">MISSÃO {m.num}</div>
        <h3>{m.title}</h3>
        <p style={{ fontWeight: 800 }}>{m.tagline}</p>
        {m.briefing.map((b, i) => (
          <p key={i}>{b}</p>
        ))}
        <p style={{ fontSize: 13, opacity: 0.7 }}>Siga o feixe amarelo e a estrela no minimapa. Use o carro oficial (F) para chegar mais rápido.</p>
        <button
          className="btn primary"
          onClick={guard(() => {
            set({ missionIntro: false });
            const st = m.steps[0];
            if (st) useGame.getState().notify(`Objetivo: ${st.text}`, 'mission');
          })}
        >
          Assumir a missão
        </button>
      </div>
    </div>
  );
}
