import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import ThesesList from './pages/thesis/ThesesList';
import ThesisDetails from './pages/thesis/ThesisDetails';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="theses" element={<ProtectedRoute><ThesesList /></ProtectedRoute>} />
        <Route path="theses/:id" element={<ProtectedRoute><ThesisDetails /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

export default App; 