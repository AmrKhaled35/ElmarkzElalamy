import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Courses from './pages/Courses';
import Levels from './pages/Levels';
import Teachers from './pages/Teachers';
import Students from './pages/Students';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50" dir="rtl">
        <div className="text-stone-600">جاري التحميل...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/courses"
            element={
              <PrivateRoute>
                <Courses />
              </PrivateRoute>
            }
          />
          <Route
            path="/courses/:courseId/levels"
            element={
              <PrivateRoute>
                <Levels />
              </PrivateRoute>
            }
          />
          <Route
            path="/teachers"
            element={
              <PrivateRoute>
                <Teachers />
              </PrivateRoute>
            }
          />
          <Route
            path="/levels/:levelId/students"
            element={
              <PrivateRoute>
                <Students />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/courses" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
