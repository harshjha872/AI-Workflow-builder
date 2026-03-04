import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { HomePage } from './pages/HomePage';
import { EditorPage } from './pages/EditorPage';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/editor/:id" element={<EditorPage />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  );
}

export default App;

