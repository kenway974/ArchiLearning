import { Link } from 'react-router-dom';
import type { Principle } from '../../content/schema';
import { getSheet } from '../../content/lookup';
import { sheetHref, type SheetContext } from './SheetView';

export const principleHref = (id: string, ctx: SheetContext) => (ctx === 'map' ? `/carte/${id}` : `/principes/${id}`);

export function PrincipleView({ principle, ctx, titleId }: { principle: Principle; ctx: SheetContext; titleId?: string }) {
  return (
    <article className="sheet">
      <p className="eyebrow">
        <span className="principle-dot" style={{ background: principle.color }} aria-hidden="true" /> Principe partagé
      </p>
      <h1 id={titleId}>{principle.title}</h1>
      <p className="lead">{principle.summary}</p>
      <h2>Pourquoi il compte</h2>
      <p>{principle.why}</p>
      <h2>Les concepts qui l’appliquent</h2>
      <ul className="applications">
        {principle.applications.map((a) => (
          <li key={a.concept}>
            <Link to={sheetHref(a.concept, ctx)}>{getSheet(a.concept)?.title}</Link>
            <p>{a.how}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
