import path from 'path';
import fs from 'fs';
import db from '../db/index.js';

const PHOTOS_DIR = process.env.PHOTOS_DIR || '/data/photos';

export function deletePhotoFiles(userId: number, photoIds: string[]): void {
  for (const photoId of photoIds) {
    const filePath = path.join(PHOTOS_DIR, String(userId), `${photoId}.jpg`);
    try { fs.unlinkSync(filePath); } catch { /* ignore if already gone */ }
  }
}

export function deletePhotoRecordsAndFiles(userId: number, where: string, params: unknown[]): void {
  const photos = db.prepare(
    `SELECT id FROM photos WHERE userId = ? AND ${where}`
  ).all(userId, ...params) as { id: string }[];

  if (photos.length > 0) {
    deletePhotoFiles(userId, photos.map(p => p.id));
    db.prepare(`DELETE FROM photos WHERE userId = ? AND ${where}`).run(userId, ...params);
  }
}

export function deleteProcedureChildren(userId: number, procedureId: number): void {
  db.prepare('DELETE FROM procedure_steps WHERE userId = ? AND procedureId = ?').run(userId, procedureId);
  db.prepare('DELETE FROM supplies WHERE userId = ? AND procedureId = ?').run(userId, procedureId);
  db.prepare('DELETE FROM refs WHERE userId = ? AND procedureId = ?').run(userId, procedureId);
}

export function deleteNoteChildren(userId: number, noteId: number): void {
  deletePhotoRecordsAndFiles(userId, 'noteId = ?', [noteId]);
}

export function deleteVehicleChildren(userId: number, vehicleId: number): void {
  // Unlink schedules and task_logs from this vehicle (don't delete them — they belong to the room)
  db.prepare('UPDATE schedules SET vehicleId = NULL WHERE userId = ? AND vehicleId = ?').run(userId, vehicleId);
  db.prepare('UPDATE task_logs SET vehicleId = NULL WHERE userId = ? AND vehicleId = ?').run(userId, vehicleId);
}

export function deleteRoomChildren(userId: number, roomId: number): void {
  // Delete vehicles for this room
  const vehicles = db.prepare(
    'SELECT id FROM vehicles WHERE userId = ? AND roomId = ?'
  ).all(userId, roomId) as { id: number }[];
  for (const v of vehicles) {
    deleteVehicleChildren(userId, v.id);
  }
  db.prepare('DELETE FROM vehicles WHERE userId = ? AND roomId = ?').run(userId, roomId);

  // Delete schedules for this room
  db.prepare('DELETE FROM schedules WHERE userId = ? AND roomId = ?').run(userId, roomId);

  // Delete task logs for this room
  db.prepare('DELETE FROM task_logs WHERE userId = ? AND roomId = ?').run(userId, roomId);

  // Delete procedures and their children for this room
  const procedures = db.prepare(
    'SELECT id FROM procedures WHERE userId = ? AND roomId = ?'
  ).all(userId, roomId) as { id: number }[];
  for (const proc of procedures) {
    deleteProcedureChildren(userId, proc.id);
  }
  db.prepare('DELETE FROM procedures WHERE userId = ? AND roomId = ?').run(userId, roomId);

  // Delete references for this room
  db.prepare('DELETE FROM refs WHERE userId = ? AND roomId = ?').run(userId, roomId);

  // Delete photos for this room (also files from disk)
  deletePhotoRecordsAndFiles(userId, 'roomId = ?', [roomId]);

  // Delete notes and their photo children for this room
  const notes = db.prepare(
    'SELECT id FROM notes WHERE userId = ? AND roomId = ?'
  ).all(userId, roomId) as { id: number }[];
  for (const note of notes) {
    deleteNoteChildren(userId, note.id);
  }
  db.prepare('DELETE FROM notes WHERE userId = ? AND roomId = ?').run(userId, roomId);

  // Delete reminders for this room
  db.prepare('DELETE FROM reminders WHERE userId = ? AND roomId = ?').run(userId, roomId);

  // Delete inventory for this room
  db.prepare('DELETE FROM inventory WHERE userId = ? AND roomId = ?').run(userId, roomId);
}

export function deletePalaceChildren(userId: number, palaceId: number): void {
  // Delete room hotspots for this palace
  db.prepare('DELETE FROM room_hotspots WHERE userId = ? AND palaceId = ?').run(userId, palaceId);

  // Delete rooms and all their children
  const rooms = db.prepare(
    'SELECT id FROM rooms WHERE userId = ? AND palaceId = ?'
  ).all(userId, palaceId) as { id: number }[];
  for (const room of rooms) {
    deleteRoomChildren(userId, room.id);
  }
  db.prepare('DELETE FROM rooms WHERE userId = ? AND palaceId = ?').run(userId, palaceId);
}
