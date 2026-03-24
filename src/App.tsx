import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { RoomForm } from './pages/RoomForm';
import { RoomDetail } from './pages/RoomDetail';
import { ScheduleList } from './pages/ScheduleList';
import { ScheduleForm } from './pages/ScheduleForm';
import { DreamcatcherPage } from './pages/DreamcatcherPage';
import { Settings } from './pages/Settings';
import { StubPage } from './pages/StubPage';
import { initializeSettings } from './db';
import { lore } from './lib/lore';

export default function App() {
  useEffect(() => {
    initializeSettings();
  }, []);

  return (
    <BrowserRouter basename="/mind-palace">
      <Routes>
        <Route element={<AppShell />}>
          {/* Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Room CRUD */}
          <Route path="room/new" element={<RoomForm />} />
          <Route path="room/:id" element={<RoomDetail />} />
          <Route path="room/:id/edit" element={<RoomForm />} />

          {/* Schedules */}
          <Route path="room/:id/schedules" element={<ScheduleList />} />
          <Route path="room/:id/schedule/new" element={<ScheduleForm />} />
          <Route path="room/:id/schedule/:sid" element={<ScheduleForm />} />

          {/* Task Log (Phase 3) */}
          <Route path="room/:id/log" element={<StubPage title={lore.taskLog.title} message={lore.taskLog.emptyState} />} />
          <Route path="room/:id/log/new" element={<StubPage title={lore.taskLog.newEntry} />} />
          <Route path="room/:id/log/:lid" element={<StubPage title="Log Entry" />} />

          {/* Procedures (Phase 3) */}
          <Route path="room/:id/procedures" element={<StubPage title={lore.procedures.title} message={lore.procedures.emptyState} />} />
          <Route path="room/:id/procedure/new" element={<StubPage title={lore.procedures.newProcedure} />} />
          <Route path="room/:id/procedure/:pid" element={<StubPage title="Procedure" />} />
          <Route path="room/:id/procedure/:pid/edit" element={<StubPage title="Edit Procedure" />} />

          {/* Inventory */}
          <Route path="room/:id/inventory" element={<StubPage title={lore.inventory.title} message={lore.inventory.emptyState} />} />
          <Route path="room/:id/inventory/new" element={<StubPage title="Add to Shelf" />} />

          {/* Photos (Phase 4) */}
          <Route path="room/:id/photos" element={<StubPage title={lore.photos.title} message={lore.photos.emptyState} />} />

          {/* References (Phase 3) */}
          <Route path="room/:id/references" element={<StubPage title={lore.references.title} message={lore.references.emptyState} />} />

          {/* Dreamcatcher */}
          <Route path="dreamcatcher" element={<DreamcatcherPage />} />

          {/* Settings */}
          <Route path="settings" element={<Settings />} />

          {/* 404 */}
          <Route path="*" element={<StubPage title="Lost" message="This room doesn't exist in the warehouse." />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
