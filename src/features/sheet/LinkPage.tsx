import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getLink } from '../../content/lookup';
import { NotFoundPage } from '../../app/NotFoundPage';
import { LinkView } from './LinkView';

export function LinkPage() {
  const { id } = useParams();
  const link = getLink(id);

  useEffect(() => {
    document.title = link ? `${link.title} · Archi Map` : 'Introuvable · Archi Map';
  }, [link]);

  if (!link) return <NotFoundPage />;
  return (
    <div className="page narrow">
      <LinkView link={link} ctx="page" />
    </div>
  );
}
