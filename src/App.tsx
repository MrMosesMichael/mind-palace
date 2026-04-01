import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { PalaceLayout } from './components/layout/PalaceLayout';
import { RoomRedirect } from './components/RoomRedirect';
import { Login } from './pages/Login';
import { PalaceSelector } from './pages/PalaceSelector';
import { PalaceView } from './pages/PalaceView';
import { PalaceForm } from './pages/PalaceForm';
import { RoomForm } from './pages/RoomForm';
import { RoomDetail } from './pages/RoomDetail';
import { ScheduleList } from './pages/ScheduleList';
import { ScheduleForm } from './pages/ScheduleForm';
import { TaskLogList } from './pages/TaskLogList';
import { TaskLogForm } from './pages/TaskLogForm';
import { ProcedureList } from './pages/ProcedureList';
import { ProcedureDetail } from './pages/ProcedureDetail';
import { ProcedureForm } from './pages/ProcedureForm';
import { ReferenceList } from './pages/ReferenceList';
import { NotesList } from './pages/NotesList';
import { PhotoGallery } from './pages/PhotoGallery';
import { DreamcatcherPage } from './pages/DreamcatcherPage';
import { Calendar } from './pages/Calendar';
import { Settings } from './pages/Settings';
import { InventoryList } from './pages/InventoryList';
import { InventoryForm } from './pages/InventoryForm';
import { StubPage } from './pages/StubPage';
import { apiGet, apiPost } from './services/api';
import type { AppSettings, Palace } from './types';

async function initializeSettings() {
  // Ensure default app settings exist
  const settings = await apiGet<AppSettings[]>('/api/crud/appSettings');
  if (settings.length === 0) {
    await apiPost('/api/crud/appSettings', {
      defaultUnitSystem: 'miles',
      notificationsEnabled: false,
      reminderLeadDays: 7,
      reminderLeadMiles: 500,
      theme: 'dark',
      exportVersion: 1,
    });
  }

  // Ensure at least one default palace exists
  const palaces = await apiGet<Palace[]>('/api/crud/palaces');
  if (palaces.length === 0) {
    await apiPost('/api/crud/palaces', {
      name: 'My Palace',
      description: 'Default palace',
      imageUrl: '/images/palaces/tudor-bungalow.jpg',
      isDefault: true,
    });
  }
}

function AppRoutes() {
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (isLoggedIn) initializeSettings();
  }, [isLoggedIn]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-muted)' }}>
        Opening the warehouse...
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* Palace selector — landing page */}
        <Route index element={<PalaceSelector />} />

        {/* Create new palace */}
        <Route path="palace/new" element={<PalaceForm />} />

        {/* Palace routes — wrapped in PalaceLayout context */}
        <Route path="palace/:palaceId" element={<PalaceLayout />}>
          {/* Palace view */}
          <Route index element={<PalaceView />} />
          <Route path="edit" element={<PalaceForm />} />

          {/* Room CRUD */}
          <Route path="room/new" element={<RoomForm />} />
          <Route path="room/:id" element={<RoomDetail />} />
          <Route path="room/:id/edit" element={<RoomForm />} />

          {/* Schedules */}
          <Route path="room/:id/schedules" element={<ScheduleList />} />
          <Route path="room/:id/schedule/new" element={<ScheduleForm />} />
          <Route path="room/:id/schedule/:sid" element={<ScheduleForm />} />

          {/* Task Log */}
          <Route path="room/:id/log" element={<TaskLogList />} />
          <Route path="room/:id/log/new" element={<TaskLogForm />} />
          <Route path="room/:id/log/:lid" element={<TaskLogForm />} />

          {/* Procedures */}
          <Route path="room/:id/procedures" element={<ProcedureList />} />
          <Route path="room/:id/procedure/new" element={<ProcedureForm />} />
          <Route path="room/:id/procedure/:pid" element={<ProcedureDetail />} />
          <Route path="room/:id/procedure/:pid/edit" element={<ProcedureForm />} />

          {/* References */}
          <Route path="room/:id/references" element={<ReferenceList />} />

          {/* Notes */}
          <Route path="room/:id/notes" element={<NotesList />} />

          {/* Inventory */}
          <Route path="room/:id/inventory" element={<InventoryList />} />
          <Route path="room/:id/inventory/new" element={<InventoryForm />} />
          <Route path="room/:id/inventory/:iid" element={<InventoryForm />} />

          {/* Photos */}
          <Route path="room/:id/photos" element={<PhotoGallery />} />
        </Route>

        {/* Global pages */}
        <Route path="calendar" element={<Calendar />} />
        <Route path="dreamcatcher" element={<DreamcatcherPage />} />
        <Route path="settings" element={<Settings />} />

        {/* Backward compatibility — old /room/:id routes redirect */}
        <Route path="room/:id/*" element={<RoomRedirect />} />

        {/* 404 */}
        <Route path="*" element={<StubPage title="Lost" message="This room doesn't exist in the warehouse." />} />
      </Route>
    </Routes>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
