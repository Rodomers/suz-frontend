import { createBrowserRouter, Navigate } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { AdminPage } from '../pages/AdminPage';
import { RulesPage } from '../pages/RulesPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { MainLayout } from '../layouts/MainLayout';
import { EditIOPage } from '../pages/EditIOPage';
import { SearchPage } from '../pages/SearchPage';
import { ViewIOPage } from '../pages/ViewIOPage';
import { QueriesPage } from '../pages/QueriesPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { AdminDataPage } from '../pages/AdminDataPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/rules',
        element: <RulesPage />,
      },
      {
        element: <MainLayout />,
        children: [
          {
            path: '/',
            element: <HomePage />,
          },
          {
            path: '/rules',
            element: <RulesPage />,
          },
          {
            path: '/io/edit/:id',
            element: <EditIOPage />,
          },
          {
            path: '/io/view/:id',
            element: <ViewIOPage />,
          },
          {
            path: '/admin',
            element: <AdminPage />,
          },
          {
            path: '/search',
            element: <SearchPage />,
          },
          {
            path: '/queries',
            element: <QueriesPage />,
          },
          {
            path: '/admin-data',
            element: <AdminDataPage />,
          },
          {
            path: '/admin-users',
            element: <AdminUsersPage />,
          }
        ]
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  }
]);