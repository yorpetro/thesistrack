import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import NewThesis from './pages/thesis/NewThesis';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UploadDocumentPage from './pages/thesis/UploadDocumentPage';
import StudentHome from './features/home/StudentHome';
import AssistantHome from './features/home/AssistantHome';
import ProfessorHome from './features/home/ProfessorHome';
import ThesisPage from './features/thesis/ThesisPage';
import ThesisListPage from './features/thesis/ThesisListPage';
import SetDeadlines from './features/admin/SetDeadlines';
import AssistantSelectionForm from './features/thesis/components/AssistantSelectionForm';

// Import the Zustand store hook
import { useAuthStore } from './stores/authStore';

// Define possible user roles (matches backend and store)
type UserRole = 'student' | 'professor' | 'graduation_assistant';

// Component to select home based on actual user role from auth store
const HomeSelector = () => {
  // Get user data from the Zustand store
  const { user } = useAuthStore();

  // Handle case where user data might not be loaded yet or user is null
  // ProtectedRoute should ideally handle the null case by redirecting to login
  if (!user) {
    // Optional: Render a loading state or null, though ProtectedRoute might cover this
    return <div>Loading user data...</div>; // Or return null;
  }

  // Get the role from the authenticated user
  const userRole = user.role; // Type is 'student' | 'professor' | 'graduation_assistant'

  // No need to cast anymore, the type comes from the store
  if (userRole === 'graduation_assistant') {
    return <AssistantHome />;
  }
  if (userRole === 'professor') {
    return <ProfessorHome />;
  }
  // Default to student
  return <StudentHome />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<ProtectedRoute><HomeSelector /></ProtectedRoute>} />
        <Route path="theses" element={<ProtectedRoute><ThesisListPage /></ProtectedRoute>} />
        <Route path="theses/new" element={<ProtectedRoute><NewThesis /></ProtectedRoute>} />
        <Route path="theses/:id" element={<ProtectedRoute><ThesisPage /></ProtectedRoute>} />
        <Route path="theses/:thesisId/upload" element={<ProtectedRoute><UploadDocumentPage /></ProtectedRoute>} />
        <Route path="select-assistant" element={<ProtectedRoute><AssistantSelectionForm /></ProtectedRoute>} />
        <Route path="admin/set-deadlines" element={<ProtectedRoute><SetDeadlines /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

export default App; 