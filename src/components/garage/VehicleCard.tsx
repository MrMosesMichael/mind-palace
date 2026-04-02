import type { Vehicle } from '../../types';
import styles from './VehicleCard.module.css';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick: () => void;
}

export function VehicleCard({ vehicle, onClick }: VehicleCardProps) {
  const title = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || vehicle.name;
  const mileage = vehicle.currentMileage != null
    ? `${Number(vehicle.currentMileage).toLocaleString()} ${vehicle.unitSystem}`
    : null;

  return (
    <button className={styles.card} onClick={onClick}>
      <div className={styles.header}>
        <span className={styles.name}>{vehicle.name}</span>
        {vehicle.color && <span className={styles.colorDot} style={{ background: vehicle.color }} />}
      </div>
      {title !== vehicle.name && (
        <span className={styles.subtitle}>{title}</span>
      )}
      <div className={styles.details}>
        {mileage && <span className={styles.mileage}>{mileage}</span>}
        {vehicle.licensePlate && <span className={styles.plate}>{vehicle.licensePlate}</span>}
      </div>
    </button>
  );
}
