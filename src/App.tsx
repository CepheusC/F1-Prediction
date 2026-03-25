import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import EventPrediction from '@/pages/EventPrediction'
import Leaderboard from '@/pages/Leaderboard'
import Info from '@/pages/Info'
import AdminGuard from '@/components/AdminGuard'
import AppShell from '@/components/AppShell'
import { useAuthStore } from '@/store/auth'
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminHome from '@/pages/admin/AdminHome'
import AdminDrivers from '@/pages/admin/AdminDrivers'
import AdminSeasons from '@/pages/admin/AdminSeasons'
import AdminEvents from '@/pages/admin/AdminEvents'
import AdminResults from '@/pages/admin/AdminResults'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.accessToken)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="events/:id" element={<EventPrediction />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="info" element={<Info />} />
          <Route
            path="admin"
            element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }
          >
            <Route index element={<AdminHome />} />
            <Route path="drivers" element={<AdminDrivers />} />
            <Route path="seasons" element={<AdminSeasons />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="results" element={<AdminResults />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
