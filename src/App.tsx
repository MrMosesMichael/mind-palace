import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
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
          <Route path="room/:id/inventory" element={<StubPage title={lore.inventory.title} message={lore.inventory.emptyState} />} />
          <Route path="room/:id/inventory/new" element={<StubPage title="Add to Shelf" />} />

          {/* Photos */}
          <Route path="room/:id/photos" element={<PhotoGallery />} />

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
