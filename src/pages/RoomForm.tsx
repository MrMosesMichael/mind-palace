import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useRooms, useRoom } from '../hooks/useRooms';
import { getAllModules, getModule, getModuleIcon } from '../modules';
import { lore } from '../lib/lore';
import type { ModuleDefinition } from '../types/modules';
import styles from './RoomForm.module.css';

export function RoomForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const existingRoom = useRoom(id ? Number(id) : undefined);
  const { addRoom, updateRoom } = useRooms();
  const navigate = useNavigate();
  const modules = getAllModules();

  const [selectedModuleType, setSelectedModuleType] = useState<string>(modules[0]?.type ?? '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [metadata, setMetadata] = useState<Record<string, string>>({});

  // Populate form when editing
  useEffect(() => {
    if (existingRoom) {
      setSelectedModuleType(existingRoom.moduleType);
      setName(existingRoom.name);
      setDescription(existingRoom.description ?? '');
      const meta: Record<string, string> = {};
      for (const [key, val] of Object.entries(existingRoom.metadata)) {
        meta[key] = String(val ?? '');
      }
      setMetadata(meta);
    }
  }, [existingRoom]);

  const selectedModule: ModuleDefinition | undefined = getModule(selectedModuleType);

  function handleMetadataChange(key: string, value: string) {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Convert numeric fields
    const processedMetadata: Record<string, unknown> = { ...metadata };
    if (selectedModule) {
      for (const field of selectedModule.roomFields) {
        if (field.type === 'number' && processedMetadata[field.key]) {
          processedMetadata[field.key] = Number(processedMetadata[field.key]);
        }
      }
    }

    if (isEditing && existingRoom) {
      await updateRoom(existingRoom.id!, {
        name,
        description: description || undefined,
        metadata: processedMetadata,
      });
      navigate(`/room/${existingRoom.id}`);
    } else {
      const newId = await addRoom({
        moduleType: selectedModuleType,
        name,
        description: description || undefined,
        metadata: processedMetadata,
      });
      navigate(`/room/${newId}`, { replace: true });
    }
  }

  return (
    <div>
      <PageHeader
        title={isEditing ? `Edit ${selectedModule?.roomLabel ?? 'Room'}` : lore.rooms.newRoom}
        showBack
      />

      <form className={styles.form} onSubmit={handleSubmit}>
        {!isEditing && modules.length > 1 && (
          <Select
            label="Room Type"
            value={selectedModuleType}
            onChange={(e) => {
              setSelectedModuleType(e.target.value);
              setName('');
              setDescription('');
              setMetadata({});
            }}
            options={modules.map((m) => ({ value: m.type, label: m.label }))}
            required
          />
        )}

        {!isEditing && modules.length === 1 && (
          <div className={styles.moduleTag}>
            {selectedModule ? getModuleIcon(selectedModule.icon) : '\uD83D\uDCE6'} {selectedModule?.label}
          </div>
        )}

        <Input
          label={`${selectedModule?.roomLabel ?? 'Room'} Name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            selectedModule?.type === 'garage' ? 'My Tacoma' :
            selectedModule?.type === 'kitchen' ? 'Main Kitchen' :
            selectedModule?.type === 'yard' ? 'Front Lawn' :
            selectedModule?.type === 'bathroom' ? 'Master Bathroom' :
            selectedModule?.type === 'home' ? 'Central HVAC' :
            'Name this room'
          }
          required
        />

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />

        {/* Module-specific fields */}
        {selectedModule?.roomFields.map((field) => {
          if (field.type === 'select' && field.options) {
            return (
              <Select
                key={field.key}
                label={field.label}
                value={metadata[field.key] ?? field.options[0]}
                onChange={(e) => handleMetadataChange(field.key, e.target.value)}
                options={field.options.map((o) => ({ value: o, label: o }))}
                required={field.required}
              />
            );
          }

          return (
            <Input
              key={field.key}
              label={field.label}
              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
              value={metadata[field.key] ?? ''}
              onChange={(e) => handleMetadataChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          );
        })}

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Save Changes' : `Open ${selectedModule?.roomLabel ?? 'Room'}`}
          </Button>
        </div>
      </form>
    </div>
  );
}
