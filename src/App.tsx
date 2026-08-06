import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { CadetProfilePage } from './pages/CadetProfilePage';
import { CadetsPage } from './pages/CadetsPage';
import { DashboardPage } from './pages/DashboardPage';
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

const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'roster', element: <RosterPage /> },
      { path: 'roster/:memberId', element: <MemberProfilePage /> },
      { path: 'cadets', element: <CadetsPage /> },
      { path: 'cadets/:cadetId', element: <CadetProfilePage /> },
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
      { path: 'training-sheets', element: <PlaceholderPage title="Training Sheets" description="Confidential digital training progress for FTO and above." /> },
      { path: 'probationer-tests', element: <PlaceholderPage title="Probationer Tests" description="Permission-controlled test records and marking forms." /> },
      { path: 'knowledge-base', element: <PlaceholderPage title="Knowledge Base" description="Searchable SOPs, guides, procedures and policies." /> },
      { path: 'quick-reference', element: <QuickReferencePage /> },
      { path: 'forms', element: <PlaceholderPage title="Forms" description="Shared submissions, drafts and approval workflows." /> },
      { path: 'profile', element: <PlaceholderPage title="My Profile" description="Your EMS account, rank, qualifications and activity." /> },
      { path: 'administration', element: <PlaceholderPage title="Administration" description="Members, permissions, imports, audit logs and settings." /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
