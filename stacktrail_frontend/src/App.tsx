import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/auth'
import ProtectedRoute from '@/ProtectedRoute'
import Layout from '@/components/Layout'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import OrgList from '@/pages/OrgList'
import OrgNew from '@/pages/OrgNew'
import OrgDetail from '@/pages/OrgDetail'
import CheckupWizard from '@/pages/CheckupWizard'
import AssessmentResults from '@/pages/AssessmentResults'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="orgs" element={<OrgList />} />
            <Route path="orgs/new" element={<OrgNew />} />
            <Route path="orgs/:id" element={<OrgDetail />} />
            <Route path="orgs/:id/checkup" element={<CheckupWizard />} />
            <Route path="assessments/:id" element={<AssessmentResults />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
