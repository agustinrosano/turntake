import { createBrowserRouter, Navigate } from 'react-router-dom';
import LandingLayout from '../components/layout/LandingLayout';
import AdminLayout from '../components/layout/AdminLayout';
import PortalLayout from '../components/layout/PortalLayout';

// Lazily imported components (or just regular imports for now)
import HomePage from '../pages/landing/HomePage';
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/admin/DashboardPage';
import AppointmentsPage from '../pages/admin/AppointmentsPage';
import CustomersPage from '../pages/admin/CustomersPage';
import BusinessSettingsPage from '../pages/admin/BusinessSettingsPage';
import BookingPage from '../pages/portal/BookingPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <LoginPage /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'appointments', element: <AppointmentsPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'settings', element: <BusinessSettingsPage /> },
    ],
  },
  {
    path: '/:businessSlug',
    element: <PortalLayout />,
    children: [
      { index: true, element: <BookingPage /> },
      { path: 'confirm', element: <div>Confirmación de Turno</div> },
      { path: 'status', element: <div>Estado del Turno</div> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  }
]);
