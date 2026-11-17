import { useId, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { content } from '../../content/index';
import { allSheets, getSheet } from '../../content/lookup';
import type { Sheet } from '../../content/schema';
import { useIsMobile } from '../../shared/useMediaQuery';
import { compareSheets, findLink, type CompareRow } from './compare';

const Cell = ({ value }: { value: CompareRow['left'] }) =>
  Array.isArray(value) ? (
    <ul className="bullets">
      {value.map((v) => (
        <li key={v}>{v}</li>
      ))}
    </ul>
  ) : (
    <p>{value}</p>
  );

function SheetSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Sheet[];
  onChange: (id: string) => void;
}) {
  const id = useId();
  const concepts = options.filter((o) => o.kind === 'concept');
  const sectors = options.filter((o) => o.kind === 'sector');
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choisir…</option>
        {concepts.length > 0 && (
          <optgroup label="Concepts">
            {concepts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </optgroup>
        )}
        {sectors.length > 0 && (
          <optgroup label="Secteurs">
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}

function MobileColumns({ a, b, rows }: { a: Sheet; b: Sheet; rows: CompareRow[] }) {
  const [side, setSide] = useState<'left' | 'right'>('left');
  const shown = side === 'left' ? a : b;
  const tabId = useId();
  return (
    <div>
      <div role="tablist" aria-label="Colonne affichée" className="segmented tabs">
        {(['left', 'right'] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            id={`${tabId}-${s}`}
            aria-selected={side === s}
            aria-controls={`${tabId}-panel`}
            className={side === s ? 'segment active' : 'segment'}
            onClick={() => setSide(s)}
          >
            {(s === 'left' ? a : b).title}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${tabId}-panel`} aria-labelledby={`${tabId}-${side}`}>
        <table className="compare-table" aria-label="Comparaison">
          <thead>
            <tr>
              <th scope="col">Critère</th>
              <th scope="col">{shown.title}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.criterion}>
                <th scope="row">{r.criterion}</th>
                <td>
                  <Cell value={side === 'left' ? r.left : r.right} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ComparePage() {
  const { a = '', b = '' } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const left = getSheet(a);
  const right = getSheet(b);
  const rightOptions = left ? allSheets.filter((s) => s.kind === left.kind && s.id !== left.id) : allSheets;

  const go = (na: string, nb: string) => {
    // Si le premier élément change de type, le second n'est plus comparable : on le retire.
    const keepB = nb && getSheet(na)?.kind === getSheet(nb)?.kind && na !== nb;
    navigate(['/comparer', na, keepB ? nb : ''].filter(Boolean).join('/'));
  };

  const result = left && right ? compareSheets(left, right) : null;
  const link = left && right ? findLink(content.links, left.id, right.id) : undefined;
  const linkTitleId = useId();

  return (
    <div className="page">
      <h1>Comparer deux architectures</h1>
      <p className="muted">Deux concepts ou deux secteurs, côte à côte, critère par critère.</p>

      <div className="compare-tools">
        <SheetSelect label="Premier élément" value={left ? a : ''} options={allSheets} onChange={(id) => go(id, b)} />
        <SheetSelect label="Second élément" value={right ? b : ''} options={rightOptions} onChange={(id) => go(a, id)} />
      </div>

      {result && !result.ok && (
        <p role="alert" className="alert">
          {result.reason === 'mixed-kinds'
            ? 'On compare deux concepts ou deux secteurs, pas un concept et un secteur.'
            : 'Choisis deux éléments différents.'}
        </p>
      )}

      {left && right && result?.ok && (
        <div data-testid="compare-body">
          {link && (
            <section aria-labelledby={linkTitleId} className="callout">
              <h2 id={linkTitleId} className="sr-only">
                Lien entre les deux
              </h2>
              <p className="callout-title">{link.title}</p>
              <p>{link.explanation}</p>
              <Link to={`/liens/${link.id}`}>Voir la relation</Link>
            </section>
          )}
          {isMobile ? (
            <MobileColumns a={left} b={right} rows={result.rows} />
          ) : (
            <table className="compare-table" aria-label="Comparaison">
              <thead>
                <tr>
                  <th scope="col">Critère</th>
                  <th scope="col">
                    <Link to={`/cours/${left.id}`}>{left.title}</Link>
                  </th>
                  <th scope="col">
                    <Link to={`/cours/${right.id}`}>{right.title}</Link>
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.criterion}>
                    <th scope="row">{r.criterion}</th>
                    <td>
                      <Cell value={r.left} />
                    </td>
                    <td>
                      <Cell value={r.right} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
