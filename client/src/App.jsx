import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.jsx';
import { Muat } from './components/ui.jsx';
import Layout from './components/Layout.jsx';
import Masuk from './pages/Masuk.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Produk from './pages/Produk.jsx';
import ProdukDetail from './pages/ProdukDetail.jsx';
import ProdukBaru from './pages/ProdukBaru.jsx';
import Belanja from './pages/Belanja.jsx';
import BelanjaBaru from './pages/BelanjaBaru.jsx';
import BelanjaCek from './pages/BelanjaCek.jsx';
import Bahan from './pages/Bahan.jsx';
import BahanDetail from './pages/BahanDetail.jsx';
import Promo from './pages/Promo.jsx';
import Pengaturan from './pages/Pengaturan.jsx';

function Gerbang({ butuhUsaha, children }) {
  const { siap, user, usaha } = useAuth();
  if (!siap) return <Muat penuh />;
  if (!user) return <Navigate to="/masuk" replace />;
  if (butuhUsaha && !usaha?.setup_selesai) return <Navigate to="/mulai" replace />;
  if (!butuhUsaha && usaha?.setup_selesai) return <Navigate to="/" replace />;
  return children;
}

function Tamu({ children }) {
  const { siap, user } = useAuth();
  if (!siap) return <Muat penuh />;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/masuk" element={<Tamu><Masuk mode="masuk" /></Tamu>} />
        <Route path="/daftar" element={<Tamu><Masuk mode="daftar" /></Tamu>} />
        <Route path="/mulai" element={<Gerbang><Onboarding /></Gerbang>} />
        <Route element={<Gerbang butuhUsaha><Layout /></Gerbang>}>
          <Route index element={<Dashboard />} />
          <Route path="produk" element={<Produk />} />
          <Route path="produk/baru" element={<ProdukBaru />} />
          <Route path="produk/:id" element={<ProdukDetail />} />
          <Route path="belanja" element={<Belanja />} />
          <Route path="belanja/baru" element={<BelanjaBaru />} />
          <Route path="belanja/:id" element={<BelanjaCek />} />
          <Route path="bahan" element={<Bahan />} />
          <Route path="bahan/:id" element={<BahanDetail />} />
          <Route path="promo" element={<Promo />} />
          <Route path="pengaturan" element={<Pengaturan />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
