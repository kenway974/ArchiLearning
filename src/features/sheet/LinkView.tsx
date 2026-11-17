import { Link } from 'react-router-dom';
import type { Link as SheetLink } from '../../content/schema';
import { getSheet } from '../../content/lookup';
import { sheetHref, type SheetContext } from './SheetView';

export function LinkView({ link, ctx, titleId }: { link: SheetLink; ctx: SheetContext; titleId?: string }) {
  const source = getSheet(link.source)!;
  const target = getSheet(link.target)!;
  return (
    <article className="sheet">
      <p className="eyebrow">Relation</p>
      <h1 id={titleId}>{link.title}</h1>
      <p className="link-ends">
        <Link to={sheetHref(source.id, ctx)} className="chip">
          {source.title}
        </Link>
        <span aria-hidden="true">↔</span>
        <Link to={sheetHref(target.id, ctx)} className="chip">
          {target.title}
        </Link>
      </p>
      <p className="lead">{link.explanation}</p>
      {source.kind === target.kind && (
        <p>
          <Link to={`/comparer/${source.id}/${target.id}`} className="btn">
            Comparer {source.title} et {target.title}
          </Link>
        </p>
      )}
    </article>
  );
}
