import { Navigate, Route, Routes } from 'react-router-dom';
import { BookingPage, LandingPage } from './pages';

const App = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/book" element={<BookingPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
