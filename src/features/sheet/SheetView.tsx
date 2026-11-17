import { useId, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ConceptSheet, SectorSheet, Sheet } from '../../content/schema';
import { content } from '../../content/index';
import { allSheets, getSheet } from '../../content/lookup';
import { findLink } from '../compare/compare';
import { buildPath, getStep, getStepReason } from '../path/buildPath';
import { useProgress } from '../progress/ProgressContext';
import { Quiz } from '../quiz/Quiz';
import { CopyButton } from '../../shared/CopyButton';
import { Icon } from '../../shared/Icon';
import { CodeBlock } from './CodeBlock';
import { Tree } from './Tree';

/** Où s'affiche la fiche : en pleine page (/cours) ou dans le panneau de la carte (/carte). */
export type SheetContext = 'page' | 'map';

export const sheetHref = (id: string, ctx: SheetContext) => (ctx === 'map' ? `/carte/${id}` : `/cours/${id}`);
export const linkHref = (id: string, ctx: SheetContext) => (ctx === 'map' ? `/carte/liens/${id}` : `/liens/${id}`);

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="sheet-section">
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

const Bullets = ({ items }: { items: string[] }) => (
  <ul className="bullets">
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

export function SheetHeader({ sheet }: { sheet: Sheet }) {
  const { read, toggleRead } = useProgress();
  const isRead = read.has(sheet.id);
  return (
    <div className="sheet-header" data-testid="sheet-header">
      <Link to={`/carte/${sheet.id}`} className="btn btn-small" state={{ glide: true }}>
        <Icon name="map" size={16} /> Voir sur la mindmap
      </Link>
      <Link to={`/comparer/${sheet.id}`} className="btn btn-small">
        <Icon name="compare" size={16} /> Comparer avec…
      </Link>
      <button
        type="button"
        className={isRead ? 'btn btn-small btn-done' : 'btn btn-small'}
        onClick={() => toggleRead(sheet.id)}
        aria-pressed={isRead}
      >
        <Icon name="check" size={16} /> {isRead ? 'Marquer comme non lue' : 'Marquer comme lue'}
      </button>
    </div>
  );
}

/** « Pour bien comprendre ce sujet, commence par… » quand des prérequis ne sont pas lus. */
function PathIntro({ sheet, ctx }: { sheet: Sheet; ctx: SheetContext }) {
  const { read, startPath, progress } = useProgress();
  const navigate = useNavigate();
  const path = buildPath(allSheets, sheet.id, read);
  if (path.length < 2 || progress.activePath?.target === sheet.id) return null;
  const before = path.slice(0, -1);

  return (
    <section className="callout" aria-label="Avant de commencer">
      <p className="callout-title">Avant de commencer</p>
      <p>Pour bien comprendre ce sujet, commence par :</p>
      <ol className="path-steps">
        {before.map((id) => (
          <li key={id}>
            <Link to={sheetHref(id, ctx)}>{getSheet(id)?.title}</Link>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          startPath(sheet.id, path);
          navigate(sheetHref(path[0]!, ctx), { state: { glide: true } });
        }}
      >
        Suivre le parcours <Icon name="arrow" size={16} />
      </button>
    </section>
  );
}

function FurtherLinks({ sheet, ctx }: { sheet: Sheet; ctx: SheetContext }) {
  if (sheet.nextSteps.length === 0) return null;
  return (
    <ul className="further">
      {sheet.nextSteps.map((step) => (
        <li key={step.id}>
          <Link to={sheetHref(step.id, ctx)} state={{ glide: true }}>
            {getSheet(step.id)?.title}
          </Link>
          <span> — {step.reason}</span>
        </li>
      ))}
    </ul>
  );
}

/** Fin de fiche : « Suivant » pendant un parcours, sinon « Pour aller plus loin ». */
function PathNext({ sheet, ctx }: { sheet: Sheet; ctx: SheetContext }) {
  const { progress, markRead } = useProgress();
  const navigate = useNavigate();
  const active = progress.activePath;
  const step = active ? getStep(active.steps, sheet.id) : null;

  if (active && step) {
    const next = step.next ? getSheet(step.next) : undefined;
    return (
      <section className="callout callout-next" aria-label="Suite du parcours">
        <p className="callout-title">
          Parcours « {getSheet(active.target)?.title} » · Étape {step.index} / {step.total}
        </p>
        {next ? (
          <>
            <p>{getStepReason(allSheets, active.steps, sheet.id)}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                markRead(sheet.id);
                navigate(sheetHref(next.id, ctx), { state: { glide: true } });
              }}
            >
              Suivant : {next.title} <Icon name="arrow" size={16} />
            </button>
          </>
        ) : (
          <>
            <p className="path-done">
              <Icon name="check" size={18} /> Parcours terminé. Lis cette fiche jusqu’au bout, puis marque-la comme lue.
            </p>
            {sheet.nextSteps.length > 0 && <p>Pour aller plus loin :</p>}
            <FurtherLinks sheet={sheet} ctx={ctx} />
          </>
        )}
      </section>
    );
  }

  if (sheet.nextSteps.length === 0) {
    return (
      <section className="callout" aria-label="Pour aller plus loin">
        <p className="callout-title">Pour aller plus loin</p>
        <p>
          <Link to="/comparer">Compare cette fiche à une autre</Link> ou reviens à la <Link to="/carte">mindmap</Link>.
        </p>
      </section>
    );
  }
  return (
    <section className="callout" aria-label="Pour aller plus loin">
      <p className="callout-title">Pour aller plus loin</p>
      <FurtherLinks sheet={sheet} ctx={ctx} />
    </section>
  );
}

function ConceptBody({ sheet, ctx }: { sheet: ConceptSheet; ctx: SheetContext }) {
  return (
    <>
      <Section title="Idée">
        <p className="lead">{sheet.summary}</p>
      </Section>
      <Section title="Problème résolu">
        <p>{sheet.problem}</p>
      </Section>
      <Section title="Quand l’utiliser">
        <Bullets items={sheet.whenToUse} />
      </Section>
      <Section title="Quand l’éviter">
        <Bullets items={sheet.whenToAvoid} />
      </Section>
      <Section title="Taille d’équipe et d’entreprise">
        <p>{sheet.teamSize}</p>
      </Section>
      <Section title="Arborescence">
        <Tree nodes={sheet.tree} label={`Arborescence d’exemple : ${sheet.title}`} />
      </Section>
      <Section title="Code">
        <CodeBlock code={sheet.code} />
      </Section>
      <Section title="Pièges">
        <Bullets items={sheet.pitfalls} />
      </Section>
      <Section title="Architectures voisines">
        <ul className="neighbors">
          {sheet.neighbors.map((id) => {
            const link = findLink(content.links, sheet.id, id);
            return (
              <li key={id}>
                {link ? (
                  <Link to={linkHref(link.id, ctx)}>
                    <strong>{getSheet(id)?.title}</strong>
                    <span className="muted"> — {link.title}</span>
                  </Link>
                ) : (
                  getSheet(id)?.title
                )}
              </li>
            );
          })}
        </ul>
      </Section>
    </>
  );
}

const SIZE_LABELS = { small: 'Petite entreprise', medium: 'Entreprise moyenne', large: 'Grande entreprise' } as const;

function SectorBody({ sheet }: { sheet: SectorSheet }) {
  return (
    <>
      <Section title="Contexte et contraintes">
        <p className="lead">{sheet.summary}</p>
        <p>{sheet.context}</p>
        <Bullets items={sheet.constraints} />
      </Section>
      <Section title="Architecture selon la taille">
        <div className="sizes">
          {(Object.keys(SIZE_LABELS) as (keyof typeof SIZE_LABELS)[]).map((size) => (
            <div key={size} className="card">
              <h3>{SIZE_LABELS[size]}</h3>
              <p>
                <strong>{sheet.bySize[size].architecture}</strong>
              </p>
              <p>{sheet.bySize[size].why}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Langage et framework">
        <p>
          <strong>{sheet.stack.framework}</strong>
        </p>
        <p>{sheet.stack.why}</p>
      </Section>
      <Section title="Arborescence">
        <Tree nodes={sheet.tree} label={`Arborescence d’exemple : ${sheet.title}`} />
      </Section>
      <Section title="Code">
        <CodeBlock code={sheet.code} />
      </Section>
      <Section title="Pièges courants">
        <Bullets items={sheet.pitfalls} />
      </Section>
      {sheet.companies.length > 0 && (
        <Section title="Entreprises">
          <ul className="bullets">
            {sheet.companies.map((c) => (
              <li key={c.name}>
                <strong>{c.name}</strong> : {c.fact}{' '}
                <a href={c.source} target="_blank" rel="noreferrer">
                  Source ({c.name})
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}

/** Contenu complet d'une fiche, identique en pleine page et dans le panneau de la carte. */
export function SheetView({ sheet, ctx, titleId }: { sheet: Sheet; ctx: SheetContext; titleId?: string }) {
  return (
    <article className="sheet">
      <p className="eyebrow">{sheet.kind === 'concept' ? 'Concept' : 'Secteur'}</p>
      <h1 id={titleId}>{sheet.title}</h1>
      <SheetHeader sheet={sheet} />
      <PathIntro sheet={sheet} ctx={ctx} />
      {sheet.kind === 'concept' ? <ConceptBody sheet={sheet} ctx={ctx} /> : <SectorBody sheet={sheet} />}
      <Section title="Quiz">
        <Quiz key={sheet.id} sheetId={sheet.id} questions={sheet.quiz} />
      </Section>
      <Section title="Idée de post LinkedIn">
        <blockquote className="post">{sheet.linkedinPost}</blockquote>
        <CopyButton text={sheet.linkedinPost} label="Copier le post" />
      </Section>
      <PathNext sheet={sheet} ctx={ctx} />
    </article>
  );
}
