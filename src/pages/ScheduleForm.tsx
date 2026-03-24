import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useSchedules, useSchedule } from '../hooks/useSchedules';
import { useRoom } from '../hooks/useRooms';
import { getModule } from '../modules';
import { lore } from '../lib/lore';
import { todayISO } from '../lib/formatters';
import styles from './ScheduleForm.module.css';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const TIME_UNIT_OPTIONS = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
];

export function ScheduleForm() {
  const { id, sid } = useParams();
  const roomId = Number(id);
  const isEditing = !!sid;
  const existingSchedule = useSchedule(sid ? Number(sid) : undefined);
  const room = useRoom(roomId);
  const mod = room ? getModule(room.moduleType) : undefined;
  const { addSchedule, updateSchedule, deleteSchedule } = useSchedules(roomId);
  const navigate = useNavigate();

  const supportsMileage = mod?.scheduleTypes?.includes('mileage');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<'time' | 'mileage'>('time');
  const [intervalValue, setIntervalValue] = useState('');
  const [intervalUnit, setIntervalUnit] = useState('months');
  const [priority, setPriority] = useState('medium');
  const [isActive, setIsActive] = useState(true);
  const [lastCompletedDate, setLastCompletedDate] = useState('');
  const [lastCompletedValue, setLastCompletedValue] = useState('');
  const [showDefaults, setShowDefaults] = useState(false);

  useEffect(() => {
    if (existingSchedule) {
      setName(existingSchedule.name);
      setDescription(existingSchedule.description ?? '');
      setTriggerType(existingSchedule.triggerType as 'time' | 'mileage');
      setIntervalValue(existingSchedule.intervalValue?.toString() ?? '');
      setIntervalUnit(existingSchedule.intervalUnit ?? 'months');
      setPriority(existingSchedule.priority);
      setIsActive(existingSchedule.isActive);
      setLastCompletedDate(existingSchedule.lastCompletedDate ?? '');
      setLastCompletedValue(existingSchedule.lastCompletedValue?.toString() ?? '');
    }
  }, [existingSchedule]);

  function applyDefault(def: { name: string; intervalValue: number; intervalUnit: string; priority: string }) {
    setName(def.name);
    setTriggerType(def.intervalUnit === 'miles' || def.intervalUnit === 'km' ? 'mileage' : 'time');
    setIntervalValue(def.intervalValue.toString());
    setIntervalUnit(def.intervalUnit);
    setPriority(def.priority);
    setShowDefaults(false);
  }

  function computeNextDue(): { nextDueDate?: string; nextDueValue?: number } {
    if (triggerType === 'time' && intervalValue && lastCompletedDate) {
      const completed = new Date(lastCompletedDate);
      const next = new Date(completed);
      const val = Number(intervalValue);
      switch (intervalUnit) {
        case 'days': next.setDate(next.getDate() + val); break;
        case 'weeks': next.setDate(next.getDate() + val * 7); break;
        case 'months': next.setMonth(next.getMonth() + val); break;
        case 'years': next.setFullYear(next.getFullYear() + val); break;
      }
      return { nextDueDate: next.toISOString().split('T')[0] };
    }

    if (triggerType === 'mileage' && intervalValue && lastCompletedValue) {
      return { nextDueValue: Number(lastCompletedValue) + Number(intervalValue) };
    }

    return {};
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nextDue = computeNextDue();

    const data = {
      roomId,
      name,
      description: description || undefined,
      triggerType: triggerType as 'time' | 'mileage',
      intervalValue: intervalValue ? Number(intervalValue) : undefined,
      intervalUnit: triggerType === 'mileage' ? (mod?.trackingUnit ?? 'miles') : intervalUnit,
      lastCompletedDate: lastCompletedDate || undefined,
      lastCompletedValue: lastCompletedValue ? Number(lastCompletedValue) : undefined,
      nextDueDate: nextDue.nextDueDate,
      nextDueValue: nextDue.nextDueValue,
      priority: priority as 'low' | 'medium' | 'high' | 'critical',
      isActive,
    };

    if (isEditing && existingSchedule) {
      await updateSchedule(existingSchedule.id!, data);
    } else {
      await addSchedule(data);
    }

    navigate(`/room/${id}/schedules`);
  }

  async function handleDelete() {
    if (!existingSchedule) return;
    if (window.confirm(lore.confirmDelete)) {
      await deleteSchedule(existingSchedule.id!);
      navigate(`/room/${id}/schedules`);
    }
  }

  const mileageUnit = mod?.trackingUnit ?? 'miles';

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Edit Schedule' : 'New Schedule'}
        subtitle={room?.name}
        showBack
      />

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Default schedule suggestions */}
        {!isEditing && mod?.defaultSchedules && mod.defaultSchedules.length > 0 && (
          <div className={styles.defaults}>
            <button
              type="button"
              className={styles.defaultsToggle}
              onClick={() => setShowDefaults(!showDefaults)}
            >
              {showDefaults ? 'Hide' : 'Show'} suggested schedules
            </button>
            {showDefaults && (
              <div className={styles.defaultsList}>
                {mod.defaultSchedules.map((def) => (
                  <button
                    key={def.name}
                    type="button"
                    className={styles.defaultItem}
                    onClick={() => applyDefault(def)}
                  >
                    <span className={styles.defaultName}>{def.name}</span>
                    <span className={styles.defaultInterval}>
                      Every {def.intervalValue.toLocaleString()} {def.intervalUnit}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Oil Change"
          required
        />

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details"
        />

        {/* Trigger type */}
        {supportsMileage && (
          <Select
            label="Trigger Type"
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value as 'time' | 'mileage')}
            options={[
              { value: 'time', label: 'Time-based (days, weeks, months)' },
              { value: 'mileage', label: `Mileage-based (${mileageUnit})` },
            ]}
          />
        )}

        {/* Interval */}
        <div className={styles.row}>
          <Input
            label={triggerType === 'mileage' ? `Interval (${mileageUnit})` : 'Interval'}
            type="number"
            value={intervalValue}
            onChange={(e) => setIntervalValue(e.target.value)}
            placeholder={triggerType === 'mileage' ? '5000' : '3'}
            required
          />
          {triggerType === 'time' && (
            <Select
              label="Unit"
              value={intervalUnit}
              onChange={(e) => setIntervalUnit(e.target.value)}
              options={TIME_UNIT_OPTIONS}
            />
          )}
        </div>

        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          options={PRIORITY_OPTIONS}
        />

        {/* Last completed (to seed next-due calculation) */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Last Completed (optional — seeds the next-due calculation)</legend>

          <Input
            label="Date"
            type="date"
            value={lastCompletedDate}
            onChange={(e) => setLastCompletedDate(e.target.value)}
            max={todayISO()}
          />

          {triggerType === 'mileage' && (
            <Input
              label={`Mileage at completion (${mileageUnit})`}
              type="number"
              value={lastCompletedValue}
              onChange={(e) => setLastCompletedValue(e.target.value)}
              placeholder="42000"
            />
          )}
        </fieldset>

        {/* Active toggle */}
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span>Active — tracked by the Dreamcatcher</span>
        </label>

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
            {isEditing ? 'Save' : 'Create Schedule'}
          </Button>
        </div>
      </form>
    </div>
  );
}
