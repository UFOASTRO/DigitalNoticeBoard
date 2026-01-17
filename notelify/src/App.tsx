import { Routes, Route } from 'react-router-dom';
import { ClusterLayout } from './routes/ClusterLayout';
import { CanvasPage } from './pages/CanvasPage';
import { AuthPage } from './pages/AuthPage';
import { LandingPage } from './pages/LandingPage';
import { InvitePage } from './pages/InvitePage';
import { DashboardPage } from './pages/DashboardPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/invite/:token" element={<InvitePage />} />
      <Route path="/app/:clusterId" element={<ClusterLayout />}>
        <Route index element={<CanvasPage />} />
      </Route>
    </Routes>
  );
}

export default App;