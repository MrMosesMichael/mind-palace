import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useTaskLogs, useTaskLog } from '../hooks/useTaskLogs';
import { useSchedules } from '../hooks/useSchedules';
import { useRoom } from '../hooks/useRooms';
import { getModule } from '../modules';
import { lore } from '../lib/lore';
import { todayISO } from '../lib/formatters';
import styles from './TaskLogForm.module.css';

export function TaskLogForm() {
  const { id, lid, palaceId } = useParams();
  const roomId = Number(id);
  const isEditing = !!lid;
  const existingLog = useTaskLog(lid ? Number(lid) : undefined);
  const room = useRoom(roomId);
  const mod = room ? getModule(room.moduleType) : undefined;
  const { activeSchedules } = useSchedules(roomId);
  const { addTaskLog, updateTaskLog, deleteTaskLog } = useTaskLogs(roomId);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayISO());
  const [scheduleId, setScheduleId] = useState('');
  const [trackingValue, setTrackingValue] = useState('');
  const [cost, setCost] = useState('');
  const [laborHours, setLaborHours] = useState('');
  const [performedBy, setPerformedBy] = useState('self');
  const [notes, setNotes] = useState('');

  // Pre-fill tracking value from room's current mileage
  useEffect(() => {
    if (!isEditing && room && mod?.trackingUnit) {
      const current = (room.metadata as Record<string, unknown>)?.currentMileage;
      if (current) setTrackingValue(String(current));
    }
  }, [room, mod, isEditing]);

  // Auto-set title when selecting a schedule
  useEffect(() => {
    if (scheduleId && !isEditing) {
      const schedule = activeSchedules.find((s) => s.id === Number(scheduleId));
      if (schedule && !title) {
        setTitle(schedule.name);
      }
    }
  }, [scheduleId, activeSchedules, isEditing, title]);

  // Populate form when editing
  useEffect(() => {
    if (existingLog) {
      setTitle(existingLog.title);
      setDescription(existingLog.description ?? '');
      setDate(existingLog.date);
      setScheduleId(existingLog.scheduleId?.toString() ?? '');
      setTrackingValue(existingLog.trackingValue?.toString() ?? '');
      setCost(existingLog.cost?.toString() ?? '');
      setLaborHours(existingLog.laborHours?.toString() ?? '');
      setPerformedBy(existingLog.performedBy);
      setNotes(existingLog.notes ?? '');
    }
  }, [existingLog]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data = {
      roomId,
      title,
      description: description || undefined,
      date,
      scheduleId: scheduleId ? Number(scheduleId) : undefined,
      trackingValue: trackingValue ? Number(trackingValue) : undefined,
      cost: cost ? Number(cost) : undefined,
      laborHours: laborHours ? Number(laborHours) : undefined,
      performedBy,
      notes: notes || undefined,
      photoIds: existingLog?.photoIds ?? [],
    };

    const logPath = palaceId ? `/palace/${palaceId}/room/${id}/log` : `/room/${id}/log`;

    if (isEditing && existingLog) {
      await updateTaskLog(existingLog.id!, data);
      navigate(logPath);
    } else {
      await addTaskLog(data);
      navigate(logPath, { replace: true });
    }
  }

  async function handleDelete() {
    if (!existingLog) return;
    if (window.confirm(lore.confirmDelete)) {
      await deleteTaskLog(existingLog.id!);
      navigate(palaceId ? `/palace/${palaceId}/room/${id}/log` : `/room/${id}/log`);
    }
  }

  const mileageUnit = mod?.trackingUnit ?? 'miles';

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Edit Log Entry' : lore.taskLog.newEntry}
        subtitle={room?.name}
        showBack
      />

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Link to schedule */}
        {activeSchedules.length > 0 && (
          <Select
            label="Link to Schedule (optional)"
            value={scheduleId}
            onChange={(e) => setScheduleId(e.target.value)}
            options={[
              { value: '', label: 'Ad-hoc / Other' },
              ...activeSchedules.map((s) => ({
                value: String(s.id),
                label: s.name,
              })),
            ]}
          />
        )}

        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Oil Change"
          required
        />

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details about what was done"
        />

        <div className={styles.row}>
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={todayISO()}
            required
          />
          <Select
            label="Performed By"
            value={performedBy}
            onChange={(e) => setPerformedBy(e.target.value)}
            options={[
              { value: 'self', label: 'DIY (Self)' },
              { value: 'shop', label: 'Shop / Mechanic' },
            ]}
          />
        </div>

        {/* Tracking value (mileage) */}
        {mod?.trackingUnit && (
          <Input
            label={`Odometer at completion (${mileageUnit})`}
            type="number"
            value={trackingValue}
            onChange={(e) => setTrackingValue(e.target.value)}
            placeholder="45000"
          />
        )}

        <div className={styles.row}>
          <Input
            label="Cost ($)"
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="0.00"
            step="0.01"
          />
          <Input
            label="Labor (hours)"
            type="number"
            value={laborHours}
            onChange={(e) => setLaborHours(e.target.value)}
            placeholder="1.5"
            step="0.25"
          />
        </div>

        <div className={styles.notesField}>
          <label className={styles.label} htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            className={styles.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about the work done..."
            rows={4}
          />
        </div>

        <div className={styles.actions}>
          {isEditing && (
            <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <div className={styles.spacer} />
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Save' : 'Log Entry'}
          </Button>
        </div>
      </form>
    </div>
  );
}
