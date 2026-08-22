import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequirePermission } from './auth/RequirePermission';
import { RequireAuth } from './auth/RequireAuth';
import { AppLayout } from './layouts/AppLayout';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { AdministrationPage } from './pages/AdministrationPage';
import { DashboardPage } from './pages/DashboardPage';
import { DiscordLinkingPage } from './pages/DiscordLinkingPage';
import { LoginPage } from './pages/LoginPage';
import { MemberProfilePage } from './pages/MemberProfilePage';
import { MyProfilePage } from './pages/MyProfilePage';
import { ResourceLibraryPage } from './pages/ResourceLibraryPage';
import { RosterPage } from './pages/RosterPage';
import {
  TrainingAttendancePage,
  TrainingDashboardPage,
  TrainingRecordsPage,
  TrainingSessionDetailPage,
  TrainingSessionsPage,
} from './modules/training';
import {
  ActiveRideAlongPage,
  RideAlongDashboardPage,
  RideAlongDetailPage,
  RideAlongHistoryPage,
  StartRideAlongPage,
} from './modules/rideAlongs';
import {
  CadetProfilePage,
  CadetsOverviewPage,
} from './modules/cadets';

const router = createHashRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/access-denied', element: <AccessDeniedPage /> },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'roster', element: <RosterPage /> },
          { path: 'roster/:memberId', element: <MemberProfilePage /> },
          {
            element: <RequirePermission permissions={['cadets.read']} />,
            children: [
              { path: 'cadets', element: <CadetsOverviewPage /> },
              { path: 'cadets/:cadetId', element: <CadetProfilePage /> },
            ],
          },
          {
            element: <RequirePermission permissions={['training.read']} />,
            children: [
              { path: 'training', element: <TrainingDashboardPage /> },
              { path: 'training/sessions', element: <TrainingSessionsPage /> },
              { path: 'training/sessions/:sessionId', element: <TrainingSessionDetailPage /> },
              { path: 'training/attendance', element: <TrainingAttendancePage /> },
              { path: 'training/records', element: <TrainingRecordsPage /> },
            ],
          },
          {
            element: <RequirePermission permissions={['training.read']} />,
            children: [
              { path: 'ride-alongs', element: <RideAlongDashboardPage /> },
              { path: 'ride-alongs/history', element: <RideAlongHistoryPage /> },
              { path: 'ride-alongs/:rideAlongId', element: <RideAlongDetailPage /> },
            ],
          },
          {
            element: <RequirePermission permissions={['training.manage']} />,
            children: [
              { path: 'ride-alongs/start', element: <StartRideAlongPage /> },
              { path: 'ride-alongs/active/:rideAlongId', element: <ActiveRideAlongPage /> },
            ],
          },
          { path: 'resources', element: <ResourceLibraryPage /> },
          { path: 'quick-reference', element: <Navigate to="/resources" replace /> },
          { path: 'training-sheets', element: <Navigate to="/resources" replace /> },
          { path: 'probationer-tests', element: <Navigate to="/resources" replace /> },
          { path: 'knowledge-base', element: <Navigate to="/resources" replace /> },
          { path: 'forms', element: <Navigate to="/resources" replace /> },
          { path: 'profile', element: <MyProfilePage /> },
          {
            element: <RequirePermission permissions={['admin.read']} />,
            children: [{ path: 'administration', element: <AdministrationPage /> }],
          },
          {
            element: <RequirePermission permissions={['discord_ids.manage']} />,
            children: [{ path: 'administration/discord-linking', element: <DiscordLinkingPage /> }],
          },
        ],
      },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
