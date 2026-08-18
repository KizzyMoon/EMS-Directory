import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequirePermission } from './auth/RequirePermission';
import { RequireAuth } from './auth/RequireAuth';
import { AppLayout } from './layouts/AppLayout';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { DashboardPage } from './pages/DashboardPage';
import { DiscordLinkingPage } from './pages/DiscordLinkingPage';
import { LoginPage } from './pages/LoginPage';
import { MemberProfilePage } from './pages/MemberProfilePage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { QuickReferencePage } from './pages/QuickReferencePage';
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
          { path: 'training', element: <TrainingDashboardPage /> },
          { path: 'training/sessions', element: <TrainingSessionsPage /> },
          { path: 'training/sessions/:sessionId', element: <TrainingSessionDetailPage /> },
          { path: 'training/attendance', element: <TrainingAttendancePage /> },
          { path: 'training/records', element: <TrainingRecordsPage /> },
          { path: 'ride-alongs', element: <RideAlongDashboardPage /> },
          { path: 'ride-alongs/start', element: <StartRideAlongPage /> },
          { path: 'ride-alongs/active/:rideAlongId', element: <ActiveRideAlongPage /> },
          { path: 'ride-alongs/history', element: <RideAlongHistoryPage /> },
          { path: 'ride-alongs/:rideAlongId', element: <RideAlongDetailPage /> },
          {
            element: <RequirePermission permissions={['fto_resources.read']} />,
            children: [
              { path: 'training-sheets', element: <PlaceholderPage title="Training Sheets" description="Confidential digital training progress for FTO and above." /> },
              { path: 'probationer-tests', element: <PlaceholderPage title="Probationer Tests" description="Permission-controlled test records and marking forms." /> },
              { path: 'knowledge-base', element: <PlaceholderPage title="Knowledge Base" description="FTO-only SOPs, guides, procedures and policies." /> },
              { path: 'forms', element: <PlaceholderPage title="Forms" description="FTO-only submissions, drafts and approval workflows." /> },
            ],
          },
          { path: 'quick-reference', element: <QuickReferencePage /> },
          { path: 'profile', element: <PlaceholderPage title="My Profile" description="Your EMS account, rank, qualifications and activity." /> },
          { path: 'administration', element: <PlaceholderPage title="Administration" description="Members, permissions, imports, audit logs and settings." /> },
          { path: 'administration/discord-linking', element: <DiscordLinkingPage /> },
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
