import { Navigate, Route, Routes } from 'react-router-dom';
import { BookingConfirmationPage, BookingPage, LandingPage } from './pages';

const App = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/book" element={<BookingPage />} />
    <Route path="/booking/confirmation" element={<BookingConfirmationPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
