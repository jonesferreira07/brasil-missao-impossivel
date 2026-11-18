import { useEffect, useState } from 'react';
import { OPPONENT, PLAN_INFO } from '../economy/election';
import { IND_META, monthLabel, type EndingId, type IndKey } from '../economy/model';
import { sfx } from '../game/sfx';
import { useGame } from '../game/store';
import { guard, useOpenGuard } from './guard';
import { SITE } from '../game/config';
import { DISCLAIMER } from './HUD';

const pct = (v: number) => `${v.toFixed(1).replace('.', ',')}%`;

// ------------------------------------------------------------ Apuração
export function ElectionModal() {
  const open = useGame((s) => s.electionOpen);
  const res = useGame((s) => s.election);
  const run = useGame((s) => s.runContinuity);
  const [t, setT] = useState(0); // 0..1 progresso da apuração
  useOpenGuard(open);
  useEffect(() => {
    if (!open) return;
    setT(0);
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (performance.now() - start) / 7000);
      setT(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else sfx(res?.won ? 'good' : 'bad');
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open]);
  if (!open || !res) return null;
  // apuração: urnas chegam aos poucos, com oscilação no começo
  const counted = t;
  const wobble = (1 - counted) * Math.sin(counted * 18) * 6;
  const shown = res.total + wobble * (1 - counted);
  const done = counted >= 1;
  return (
    <div className="overlay">
      <div className="panel elec">
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '.2em', color: 'var(--yellow)' }}>DESAFIO FINAL · APURAÇÃO AO VIVO</div>
        <h3>O povo decide</h3>
        <div className="sub">Urnas apuradas: {Math.round(counted * 100)}%. Eleição simulada; candidatos e partidos fictícios.</div>
        <div className="duel">
          <div className={`cand me ${done && res.won ? 'win' : ''}`}>
            <div className="nm">O Presidente</div>
            <div className="pc">{pct(shown)}</div>
          </div>
          <div className="vs">×</div>
          <div className={`cand op ${done && !res.won ? 'win' : ''}`}>
            <div className="nm">{OPPONENT.name}</div>
            <div className="pt">{OPPONENT.party}</div>
            <div className="pc">{pct(100 - shown)}</div>
          </div>
        </div>
        <div className="duelbar">
          <i style={{ width: `${shown}%` }} />
          <b />
        </div>
        <div className="regions">
          {res.regions.map((r, idx) => {
            const local = Math.max(0, Math.min(1, counted * 1.6 - idx * 0.12));
            const sh = r.share + (1 - local) * Math.sin(local * 12 + idx) * 8;
            return (
              <div className="reg" key={r.id}>
                <div className="rn">
                  <b>{r.name}</b> <span>{Math.round(r.weight * 100)}% do eleitorado</span>
                </div>
                <div className="rb">
                  <i style={{ width: `${local > 0 ? sh : 50}%`, opacity: local > 0 ? 1 : 0.25 }} />
                  <span>{local > 0 ? pct(sh) : 'aguardando urnas…'}</span>
                </div>
                {local >= 1 && <div className="rnote">{r.note}</div>}
              </div>
            );
          })}
        </div>
        {done && (
          <div className="verdict">
            <div className={res.won ? 'g' : 'b'}>{res.won ? 'REELEITO! O povo deu mais quatro anos ao governo.' : `DERROTA. ${OPPONENT.name} venceu a eleição.`}</div>
            <button className="btn primary small" onClick={guard(run)}>
              {res.won ? 'Governar o segundo mandato ▶' : 'Ver a herança que você deixou ▶'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Reflexão final
export function FinalNote() {
  const hist = useGame((s) => s.history);
  const econ = useGame((s) => s.econ);
  const cut = hist.some((h) => (h.missionId === 'm2' && h.optionId === 'C') || (h.missionId === 'm3' && h.optionId === 'C') || (h.missionId === 'm9' && h.optionId === 'C'));
  const tax = econ.ind.taxBurden;
  const inst = econ.lev.institutions ?? 0;
  return (
    <section className="note">
      <div className="nk">REFLEXÃO FINAL</div>
      <h2>O Brasil é um país rico. O desafio é gastar certo.</h2>
      <p>
        Terra, água, energia, alimentos, minérios, criatividade e gente trabalhadora: dinheiro e potencial não faltam. O que falta, muitas vezes, é{' '}
        <b>gastar bem</b>. Cada real que vai para <b>supersalários, penduricalhos e privilégios</b> é um real que não chega à escola, ao posto de saúde,
        à estrada ou ao bolso de quem precisa. Economizar começa por cortar o dinheiro mal gasto — não o essencial.
      </p>
      <p>
        E quem move a economia de verdade é o <b>pequeno e médio empresário</b>: a padaria, a oficina, o mercadinho, a loja do bairro. São eles que
        abrem vagas e fazem a cidade funcionar — e hoje são sufocados por impostos demais e burocracia demais. Aliviar quem produz é a forma mais
        direta de gerar emprego.
      </p>
      <p>
        E hoje, quem mais se beneficia desse modelo? <b>Grandes empresas com isenções fiscais bilionárias, bancos com juros altíssimos e quem
        vive de renda</b>. Quem precisa de crédito — o pequeno empresário, o trabalhador, a família endividada — paga a conta duas vezes: no
        imposto e nos juros. Um país que premia quem empresta e pune quem produz não sai do lugar.
      </p>
      <p>
        <b>O Brasil é o país do futuro que nunca chega?</b> Enquanto 7 em cada 10 alunos de 15 anos não alcançam o básico em matemática (PISA
        2022) e cerca de 90 milhões de pessoas vivem sem coleta de esgoto (Sinisa 2024), o futuro continua sendo promessa. Ele só chega quando o
        dinheiro chega de verdade à escola, ao posto de saúde e ao cano de esgoto — sem ficar pelo caminho.
      </p>
      <p>
        E nenhuma prosperidade dura sem <b>instituições fortes e independentes</b>. Numa República, nenhum poder pode ser réu, advogado, promotor e
        juiz ao mesmo tempo — nem o Judiciário, nem o Executivo, nem o Legislativo. Os Três Poderes precisam ser independentes e se limitar uns aos
        outros, dentro da Constituição. Sem isso, não há segurança jurídica, investimento nem confiança.
      </p>
      <p>
        Governar bem é isso: <b>cortar o desperdício, aliviar quem produz e proteger quem mais precisa</b>. O resto é discurso — e a inflação não
        aceita discurso como forma de pagamento.
      </p>
      <div className="mine">
        <b>No seu governo:</b> {cut ? 'você enfrentou privilégios e desperdícios' : 'você não chegou a enfrentar os privilégios e penduricalhos'}; a carga
        tributária terminou em {tax.toFixed(1).replace('.', ',')}% do PIB{tax < 33.5 ? ', mais leve para quem produz' : tax > 34.5 ? ', ainda pesada para quem produz' : ''}; e os Três Poderes terminaram{' '}
        {inst > 2.5 ? 'independentes e em equilíbrio' : inst < -2.5 ? 'em crise institucional' : 'num equilíbrio frágil'}.
      </div>
      <a className="site-cta" href={SITE.url} target="_blank" rel="noopener noreferrer">
        <div>
          <b>Cidadão informado é cidadão que cobra.</b>
          <span>
            Saiba quanto você paga de imposto, como cada Poder gasta o seu dinheiro, quanto custa cada parlamentar e para onde vão as emendas — e cobre
            seus representantes.
          </span>
        </div>
        <em>{SITE.label} ↗</em>
      </a>
    </section>
  );
}

// ------------------------------------------------------------ Tela final
const KEYS: IndKey[] = ['inflation', 'unemployment', 'debt', 'primary', 'taxBurden', 'purchasingPower', 'services', 'picanha'];
const FIRST: Record<EndingId, string> = {
  colapso: 'Colapso',
  sobrevivencia: 'Sobrevivência',
  recuperacao: 'Recuperação',
  milagre: 'Milagre da Picanha',
};

export function FinalScreen() {
  const s = useGame();
  const [copied, setCopied] = useState(false);
  if (s.screen !== 'final' || !s.continuity || !s.election) return null;
  const c = s.continuity;
  const el = s.election;
  const plan = s.campaign ? PLAN_INFO[s.campaign.plan] : null;
  const head = !c.won
    ? { t: 'Derrota nas urnas', cls: 'colapso', lead: `O povo escolheu ${OPPONENT.name}. Abaixo, como ficou o país com a herança que você deixou.` }
    : c.verdict === 'otimo' || c.verdict === 'bom'
      ? { t: 'Reeleito — e o Brasil melhorou', cls: 'recuperacao', lead: 'O segundo mandato confirmou o rumo: a vida do povo melhorou de forma visível.' }
      : c.verdict === 'regular'
        ? { t: 'Reeleito — mas faltou', cls: 'sobrevivencia', lead: 'O país não quebrou, mas o segundo mandato entregou menos do que prometeu.' }
        : { t: 'Reeleito — e a conta chegou', cls: 'colapso', lead: 'As promessas de campanha viraram dívida, inflação e frustração. Governar é mais difícil do que prometer.' };
  const share = `Joguei BRASIL — MISSÃO IMPOSSÍVEL: 1º mandato "${s.ending ? FIRST[s.ending] : '-'}", eleição com ${pct(el.total)} e resultado final "${head.t}". O Brasil é rico — o desafio é gastar certo. Consegue fazer melhor? (Obra de ficção e sátira.)`;
  return (
    <div className={`ending final ${head.cls}`}>
      <div className="tag">FIM DE JOGO · {monthLabel(s.econ.month + 48)}</div>
      <h1>{head.t}</h1>
      <div className="lead">{head.lead}</div>
      <div className="chips">
        <span>1º mandato: {s.ending ? FIRST[s.ending] : '—'}</span>
        <span>
          Eleição: {pct(el.total)} {el.won ? '(reeleito)' : '(derrotado)'}
        </span>
        {c.won && plan && <span>2º mandato: {plan.title}</span>}
      </div>
      <h3 className="sec">{c.won ? 'OS QUATRO ANOS DO SEGUNDO MANDATO' : 'OS QUATRO ANOS SEGUINTES'}</h3>
      <p style={{ opacity: 0.8, marginTop: 0 }}>{c.desc}</p>
      <div className="scroll">
        <table className="proj">
          <thead>
            <tr>
              <th />
              {c.snapshots.map((sn) => (
                <th key={sn.label}>{sn.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {KEYS.map((k) => (
              <tr key={k}>
                <td>{IND_META[k].short}</td>
                {c.snapshots.map((sn, i) => {
                  const prev = i > 0 ? c.snapshots[i - 1].ind[k] : sn.ind[k];
                  const d = sn.ind[k] - prev;
                  const good = IND_META[k].better === 'up' ? d > 0 : d < 0;
                  const small = Math.abs(d) < (k === 'picanha' ? 1 : 0.1);
                  return (
                    <td key={i} className={i === 0 || small ? '' : good ? 'g' : 'b'}>
                      {IND_META[k].fmt(sn.ind[k])}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="sec">A VIDA DO POVO</h3>
      <ul className="life">
        {c.life.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      <FinalNote />
      <h3 className="sec">SUAS DECISÕES</h3>
      <ol style={{ maxWidth: 900, lineHeight: 1.6 }}>
        {s.history.map((h, idx) => (
          <li key={idx}>
            <b>{h.missionTitle}:</b> {h.optionTitle}
          </li>
        ))}
      </ol>
      <div className="row">
        <button className="btn primary small" onClick={() => s.newGame()}>
          Novo governo
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

// ------------------------------------------------------------ Abertura (letterbox + legendas)
export function IntroOverlay() {
  const screen = useGame((s) => s.screen);
  const line = useGame((s) => s.introLine);
  const finish = useGame((s) => s.finishIntro);
  if (screen !== 'intro') return null;
  return (
    <div className="intro-ov">
      <div className="lb top" />
      <div className="lb bot">
        {line && (
          <div className="sub">
            {line.speaker && <b>{line.speaker}: </b>}
            {line.text}
          </div>
        )}
      </div>
      <button className="skip" onClick={finish}>
        Pular cena ▶▶
      </button>
    </div>
  );
}
