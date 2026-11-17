import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ProgressProvider } from '../features/progress/ProgressContext';
import { Layout } from './Layout';
import { HomePage } from './HomePage';
import { NotFoundPage } from './NotFoundPage';
import { CoursesPage } from '../features/courses/CoursesPage';
import { SheetPage } from '../features/sheet/SheetPage';
import { LinkPage } from '../features/sheet/LinkPage';
import { MapPage } from '../features/mindmap/MapPage';
import { ProgressPage } from '../features/progress/ProgressPage';
import { ComparePage } from '../features/compare/ComparePage';

export function App() {
  return (
    <ProgressProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="cours" element={<CoursesPage />} />
            <Route path="cours/:id" element={<SheetPage />} />
            <Route path="liens/:id" element={<LinkPage />} />
            <Route path="carte" element={<MapPage />} />
            <Route path="carte/liens/:linkId" element={<MapPage />} />
            <Route path="carte/:id" element={<MapPage />} />
            <Route path="progression" element={<ProgressPage />} />
            <Route path="comparer/:a?/:b?" element={<ComparePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProgressProvider>
  );
}
