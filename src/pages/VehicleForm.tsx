import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useVehicles, useVehicle } from '../hooks/useVehicles';
import { useRoom } from '../hooks/useRooms';
import { lore } from '../lib/lore';
import styles from './VehicleForm.module.css';

export function VehicleForm() {
  const { id, vid, palaceId } = useParams();
  const roomId = Number(id);
  const isEditing = !!vid;
  const existingVehicle = useVehicle(vid ? Number(vid) : undefined);
  const room = useRoom(roomId);
  const { addVehicle, updateVehicle, deleteVehicle } = useVehicles(roomId);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [vin, setVin] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [color, setColor] = useState('');
  const [currentMileage, setCurrentMileage] = useState('');
  const [unitSystem, setUnitSystem] = useState('miles');

  useEffect(() => {
    if (existingVehicle) {
      setName(existingVehicle.name);
      setMake(existingVehicle.make ?? '');
      setModel(existingVehicle.model ?? '');
      setYear(existingVehicle.year?.toString() ?? '');
      setVin(existingVehicle.vin ?? '');
      setLicensePlate(existingVehicle.licensePlate ?? '');
      setColor(existingVehicle.color ?? '');
      setCurrentMileage(existingVehicle.currentMileage?.toString() ?? '');
      setUnitSystem(existingVehicle.unitSystem ?? 'miles');
    }
  }, [existingVehicle]);

  const basePath = palaceId ? `/palace/${palaceId}/room/${id}` : `/room/${id}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data = {
      roomId,
      name,
      make: make || undefined,
      model: model || undefined,
      year: year ? Number(year) : undefined,
      vin: vin || undefined,
      licensePlate: licensePlate || undefined,
      color: color || undefined,
      currentMileage: currentMileage ? Number(currentMileage) : undefined,
      unitSystem: unitSystem as 'miles' | 'km',
    };

    if (isEditing && existingVehicle) {
      await updateVehicle(existingVehicle.id!, data);
    } else {
      await addVehicle(data);
    }
    navigate(basePath);
  }

  async function handleDelete() {
    if (!existingVehicle) return;
    if (window.confirm(lore.confirmDelete)) {
      await deleteVehicle(existingVehicle.id!);
      navigate(basePath);
    }
  }

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Edit Vehicle' : 'Add Vehicle'}
        subtitle={room?.name}
        showBack
      />

      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Daily driver"
          required
        />

        <div className={styles.row}>
          <Input
            label="Make"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder="Toyota"
          />
          <Input
            label="Model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Tacoma"
          />
        </div>

        <div className={styles.row}>
          <Input
            label="Year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2020"
          />
          <Input
            label="Color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Silver"
          />
        </div>

        <Input
          label="VIN"
          value={vin}
          onChange={(e) => setVin(e.target.value)}
          placeholder="1HGBH41JXMN109186"
        />

        <Input
          label="License Plate"
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value)}
          placeholder="ABC-1234"
        />

        <div className={styles.row}>
          <Input
            label="Current Mileage"
            type="number"
            value={currentMileage}
            onChange={(e) => setCurrentMileage(e.target.value)}
            placeholder="45000"
          />
          <Select
            label="Units"
            value={unitSystem}
            onChange={(e) => setUnitSystem(e.target.value)}
            options={[
              { value: 'miles', label: 'Miles' },
              { value: 'km', label: 'Kilometers' },
            ]}
          />
        </div>

        <div className={styles.actions}>
          {isEditing && (
            <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
              Delete Vehicle
            </Button>
          )}
          <div className={styles.spacer} />
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Save' : 'Add Vehicle'}
          </Button>
        </div>
      </form>
    </div>
  );
}
