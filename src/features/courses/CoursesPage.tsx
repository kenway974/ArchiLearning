import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { content } from '../../content/index';
import type { Sheet } from '../../content/schema';
import { Icon } from '../../shared/Icon';
import { useProgress } from '../progress/ProgressContext';
import { filterCourses, type CourseFilter } from './filterCourses';

const STATUSES: { value: CourseFilter['status']; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'unread', label: 'Non lus' },
  { value: 'read', label: 'Lus' },
];

function CourseCard({ sheet, read }: { sheet: Sheet; read: boolean }) {
  return (
    <article className="course-card">
      <Link to={`/cours/${sheet.id}`} className="course-link">
        <h3>{sheet.title}</h3>
        <p>{sheet.summary}</p>
        {read && (
          <span className="badge-read">
            <Icon name="check" size={14} />
            <span>Lu</span>
          </span>
        )}
      </Link>
    </article>
  );
}

function CourseSection({ title, sheets, read }: { title: string; sheets: Sheet[]; read: ReadonlySet<string> }) {
  const id = useId();
  if (sheets.length === 0) return null;
  return (
    <section aria-labelledby={id} className="course-section">
      <h2 id={id}>{title}</h2>
      <div className="course-grid">
        {sheets.map((s) => (
          <CourseCard key={s.id} sheet={s} read={read.has(s.id)} />
        ))}
      </div>
    </section>
  );
}

export function CoursesPage() {
  const { read } = useProgress();
  const [filter, setFilter] = useState<CourseFilter>({ query: '', status: 'all' });
  const concepts = filterCourses(content.concepts, filter, read);
  const sectors = filterCourses(content.sectors, filter, read);
  const searchId = useId();
  const filterId = useId();

  return (
    <div className="page">
      <h1>Cours</h1>
      <div className="course-tools">
        <div className="field">
          <label htmlFor={searchId}>Rechercher un cours</label>
          <input
            id={searchId}
            type="search"
            value={filter.query}
            placeholder="ex. événements, Symfony, banque…"
            onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
          />
        </div>
        <div role="radiogroup" aria-labelledby={filterId} className="segmented">
          <span id={filterId} className="segmented-label">
            Filtrer
          </span>
          {STATUSES.map((s) => (
            <label key={s.value} className={filter.status === s.value ? 'segment active' : 'segment'}>
              <input
                type="radio"
                name="statut"
                value={s.value}
                checked={filter.status === s.value}
                onChange={() => setFilter((f) => ({ ...f, status: s.value }))}
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      {concepts.length + sectors.length === 0 ? (
        <div className="empty">
          <p>Aucun cours ne correspond à ta recherche.</p>
          <button type="button" className="btn" onClick={() => setFilter({ query: '', status: 'all' })}>
            Effacer la recherche
          </button>
        </div>
      ) : (
        <>
          <CourseSection title="Concepts" sheets={concepts} read={read} />
          <CourseSection title="Secteurs" sheets={sectors} read={read} />
        </>
      )}
    </div>
  );
}
