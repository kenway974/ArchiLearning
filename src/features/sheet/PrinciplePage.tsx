import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPrinciple } from '../../content/lookup';
import { NotFoundPage } from '../../app/NotFoundPage';
import { PrincipleView } from './PrincipleView';

export function PrinciplePage() {
  const { id } = useParams();
  const principle = getPrinciple(id);

  useEffect(() => {
    document.title = principle ? `${principle.title} · Archi Map` : 'Introuvable · Archi Map';
    window.scrollTo(0, 0);
  }, [principle]);

  if (!principle) return <NotFoundPage />;
  return (
    <div className="page narrow">
      <PrincipleView principle={principle} ctx="page" />
    </div>
  );
}
