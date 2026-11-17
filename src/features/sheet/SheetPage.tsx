import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSheet } from '../../content/lookup';
import { NotFoundPage } from '../../app/NotFoundPage';
import { SheetView } from './SheetView';

export function SheetPage() {
  const { id } = useParams();
  const sheet = getSheet(id);

  useEffect(() => {
    document.title = sheet ? `${sheet.title} · Archi Map` : 'Introuvable · Archi Map';
    window.scrollTo(0, 0);
  }, [sheet]);

  if (!sheet) return <NotFoundPage />;
  return (
    <div className="page narrow">
      <SheetView sheet={sheet} ctx="page" />
    </div>
  );
}
