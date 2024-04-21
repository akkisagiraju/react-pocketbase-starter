import NotFound from '@/pages/not-found';
import { Suspense, lazy } from 'react';
import { Navigate, Outlet, useRoutes } from 'react-router-dom';
import { usePocketBase } from '@/providers/auth-provider';

const DashboardLayout = lazy(
  () => import('@/components/layout/dashboard-layout')
);
const SignInPage = lazy(() => import('@/pages/auth/signin'));
const SignUpPage = lazy(() => import('@/pages/auth/signup'));
const DashboardPage = lazy(() => import('@/pages/dashboard'));

// ----------------------------------------------------------------------

export default function AppRouter() {
  const { user } = usePocketBase();

  const protectedRoutes = [
    {
      path: '/',
      element: user ? (
        <DashboardLayout>
          <Suspense>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      ) : (
        <Navigate to="/login" replace />
      ),
      children: [
        {
          element: <DashboardPage />,
          index: true
        }
      ]
    }
  ];

  const publicRoutes = [
    {
      path: '/login',
      element: <SignInPage />,
      index: true
    },
    {
      path: '/signup',
      element: <SignUpPage />,
      index: true
    },
    {
      path: '/404',
      element: <NotFound />
    },
    {
      path: '*',
      element: <Navigate to="/404" replace />
    }
  ];

  const routes = useRoutes([...protectedRoutes, ...publicRoutes]);

  return routes;
}
