import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import Navbar from "./components/Navbar"
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import StudentDashboard from "./pages/StudentDashboard"
import InstructorDashboard from "./pages/InstructorDashboard"
import CoursesPage from "./pages/CoursesPage"
import CourseDetailPage from "./pages/CourseDetailPage"
import CourseManagementPage from "./pages/CourseManagementPage"
import AssessmentPage from "./pages/AssessmentPage"
import AssessmentEditPage from "./pages/AssessmentEditPage"
import AssessmentManagementPage from "./pages/AssessmentManagementPage"
import AboutPage from "./pages/AboutPage"
import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route
              path="/student-dashboard"
              element={
                <ProtectedRoute requiredRole="Student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor-dashboard"
              element={
                <ProtectedRoute requiredRole="Instructor">
                  <InstructorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/course/:id"
              element={
                <ProtectedRoute>
                  <CourseDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/course-management/:id"
              element={
                <ProtectedRoute requiredRole="Instructor">
                  <CourseManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:id"
              element={
                <ProtectedRoute>
                  <AssessmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/edit/:id"
              element={
                <ProtectedRoute requiredRole="Instructor">
                  <AssessmentEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/create"
              element={
                <ProtectedRoute requiredRole="Instructor">
                  <AssessmentEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment-management"
              element={
                <ProtectedRoute requiredRole="Instructor">
                  <AssessmentManagementPage />
                </ProtectedRoute>
              }
            />
            
            {/* Handle undefined routes */}
            <Route path="/assessment/undefined" element={<Navigate to="/student-dashboard" replace />} />
            <Route path="/course/undefined" element={<Navigate to="/courses" replace />} />
            
            {/* Catch-all route */}
            <Route path="*" element={
              <div className="container py-5 text-center">
                <h2>Page Not Found</h2>
                <p className="text-muted">The page you're looking for doesn't exist.</p>
                <button className="btn btn-primary" onClick={() => window.history.back()}>
                  Go Back
                </button>
              </div>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
