import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { BookingConfirmationPage, BookingPage, LandingPage } from './pages';

const AdminApp = lazy(() => import('../admin/App'));
const AdminLoginPage = lazy(() => import('../admin/pages/Login'));

const App = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/book" element={<BookingPage />} />
    <Route path="/booking/confirmation" element={<BookingConfirmationPage />} />
    <Route
      path="/admin/login"
      element={
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">Loading admin...</div>}>
          <AdminLoginPage />
        </Suspense>
      }
    />
    <Route
      path="/admin/*"
      element={
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">Loading admin...</div>}>
          <AdminApp />
        </Suspense>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
