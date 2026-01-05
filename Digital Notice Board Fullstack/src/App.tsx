import { Routes, Route } from 'react-router-dom';
import { ClusterLayout } from './routes/ClusterLayout';
import { CanvasPage } from './pages/CanvasPage';
import { HomePage } from './pages/HomePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/app/:clusterId" element={<ClusterLayout />}>
        <Route index element={<CanvasPage />} />
      </Route>
    </Routes>
  );
}

export default App;