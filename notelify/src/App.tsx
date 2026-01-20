import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ClusterLayout } from './routes/ClusterLayout';
import { CanvasPage } from './pages/CanvasPage';
import { AuthPage } from './pages/AuthPage';
import { LandingPage } from './pages/LandingPage';
import { InvitePage } from './pages/InvitePage';
import { DashboardPage } from './pages/DashboardPage';
import { useStore } from './store/useStore';
import VideoDock from './components/VideoDock';
import { CallToast } from './components/CallToast';

function App() {
  const { theme } = useStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <>
      <VideoDock />
      <CallToast />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route path="/app/:clusterId" element={<ClusterLayout />}>
          <Route index element={<CanvasPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;