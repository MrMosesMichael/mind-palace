import { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { db } from '../db';
import { exportWarehouse, importWarehouse, downloadBlob } from '../services/exportService';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../services/apiClient';
import { pushSync, getSyncStatus, onSyncStatusChange } from '../services/syncService';
import { lore, getRandomTip } from '../lib/lore';
import { formatDate } from '../lib/formatters';
import type { AppSettings } from '../types';
import styles from './Settings.module.css';

export function Settings() {
  const settings = useLiveQuery(() => db.appSettings.toCollection().first());
  const importRef = useRef<HTMLInputElement>(null);
  const { user, logout } = useAuth();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());

  // Sync status listener
  useEffect(() => {
    return onSyncStatusChange(setSyncStatus);
  }, []);

  // User management state (admin only)
  const [showRegister, setShowRegister] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      apiFetch('/api/users').then(r => r.json()).then(setUsers).catch(() => {});
    }
  }, [user?.role]);

  // Apply theme on change
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    if (settings.theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', settings.theme);
    }
  }, [settings?.theme]);

  async function updateSetting(changes: Partial<AppSettings>) {
    if (!settings?.id) return;
    await db.appSettings.update(settings.id, changes);
  }

  async function handleExport() {
    setIsExporting(true);
    setStatusMsg('');
    try {
      const blob = await exportWarehouse();
      const date = new Date().toISOString().split('T')[0];
      downloadBlob(blob, `mind-palace-backup-${date}.zip`);
      await updateSetting({ lastExportDate: new Date().toISOString() });
      setStatusMsg('Backup downloaded successfully.');
    } catch (err) {
      setStatusMsg(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('This will replace ALL existing data. Are you sure?')) {
      if (importRef.current) importRef.current.value = '';
      return;
    }

    setIsImporting(true);
    setStatusMsg('');
    try {
      const stats = await importWarehouse(file);
      setStatusMsg(`Restored ${stats.rooms} rooms and ${stats.photos} photos.`);
    } catch (err) {
      setStatusMsg(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
      if (importRef.current) importRef.current.value = '';
    }
  }

  async function handleClearData() {
    if (!window.confirm('Delete ALL data from the warehouse? This cannot be undone.')) return;
    if (!window.confirm('Are you absolutely sure? Everything will be permanently lost.')) return;

    try {
      const tables = [
        db.rooms, db.schedules, db.taskLogs, db.procedures,
        db.procedureSteps, db.supplies, db.inventory, db.references,
        db.photos, db.notes, db.reminders,
      ];
      await db.transaction('rw', tables, async () => {
        for (const table of tables) {
          await table.clear();
        }
      });
      setStatusMsg('All data cleared.');
    } catch (err) {
      setStatusMsg(`Clear failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return (
    <div>
      <PageHeader title={lore.settings.title} />
      <div className={styles.content}>
        {/* Theme */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{lore.settings.themeTitle}</h2>
          <Select
            label="Theme"
            value={settings?.theme ?? 'dark'}
            onChange={(e) => updateSetting({ theme: e.target.value as AppSettings['theme'] })}
            options={[
              { value: 'dark', label: 'Dark (Canonical)' },
              { value: 'light', label: 'Light' },
              { value: 'system', label: 'System' },
            ]}
          />
        </section>

        {/* Units */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Units</h2>
          <Select
            label="Default Unit System"
            value={settings?.defaultUnitSystem ?? 'miles'}
            onChange={(e) => updateSetting({ defaultUnitSystem: e.target.value as 'miles' | 'km' })}
            options={[
              { value: 'miles', label: 'Miles' },
              { value: 'km', label: 'Kilometers' },
            ]}
          />
        </section>

        {/* Reminders */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Dreamcatcher Sensitivity</h2>
          <div className={styles.row}>
            <Select
              label="Lead time (days)"
              value={String(settings?.reminderLeadDays ?? 7)}
              onChange={(e) => updateSetting({ reminderLeadDays: Number(e.target.value) })}
              options={[
                { value: '3', label: '3 days' },
                { value: '7', label: '7 days' },
                { value: '14', label: '14 days' },
                { value: '30', label: '30 days' },
              ]}
            />
            <Select
              label="Lead distance (miles)"
              value={String(settings?.reminderLeadMiles ?? 500)}
              onChange={(e) => updateSetting({ reminderLeadMiles: Number(e.target.value) })}
              options={[
                { value: '250', label: '250 mi' },
                { value: '500', label: '500 mi' },
                { value: '1000', label: '1,000 mi' },
                { value: '1500', label: '1,500 mi' },
              ]}
            />
          </div>
        </section>

        {/* Export / Import */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{lore.settings.exportTitle}</h2>
          <p className={styles.description}>
            Download a complete backup of all rooms, procedures, photos, and data as a ZIP file.
          </p>
          {settings?.lastExportDate && (
            <p className={styles.meta}>Last backup: {formatDate(settings.lastExportDate)}</p>
          )}
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Packing...' : 'Download Backup'}
          </Button>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{lore.settings.importTitle}</h2>
          <p className={styles.description}>
            Restore from a previously exported backup. This replaces all current data.
          </p>
          <input
            ref={importRef}
            type="file"
            accept=".zip"
            className={styles.hidden}
            onChange={handleImport}
          />
          <Button
            variant="ghost"
            onClick={() => importRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? 'Unpacking...' : 'Restore from Backup'}
          </Button>
        </section>

        {/* Account */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Account</h2>
          <div className={styles.accountInfo}>
            <span className={styles.accountName}>{user?.displayName ?? user?.username}</span>
            <span className={styles.accountRole}>{user?.role}</span>
          </div>
          <div className={styles.syncRow}>
            <span className={styles.syncDot} data-status={syncStatus} />
            <span className={styles.description}>
              {syncStatus === 'syncing' ? 'Syncing...' :
               syncStatus === 'offline' ? 'Offline — changes queued' :
               syncStatus === 'error' ? 'Sync error — will retry' :
               'Synced'}
            </span>
            <Button size="sm" variant="ghost" onClick={() => pushSync()}>Sync Now</Button>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            Log Out
          </Button>
        </section>

        {/* User Management (admin only) */}
        {user?.role === 'admin' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Warehouse Keys</h2>
            <p className={styles.description}>Manage who has access to the warehouse.</p>
            <div className={styles.list}>
              {users.map((u: any) => (
                <div key={u.id} className={styles.userRow}>
                  <span>{u.displayName} ({u.username})</span>
                  <span className={styles.accountRole}>{u.role}</span>
                </div>
              ))}
            </div>
            {showRegister ? (
              <form className={styles.registerForm} onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await apiFetch('/api/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({ username: newUsername, password: newPassword, displayName: newDisplayName }),
                  });
                  setShowRegister(false);
                  setNewUsername(''); setNewPassword(''); setNewDisplayName('');
                  const r = await apiFetch('/api/users');
                  setUsers(await r.json());
                  setStatusMsg('User created.');
                } catch { setStatusMsg('Failed to create user.'); }
              }}>
                <Input label="Display Name" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} required />
                <Input label="Username" value={newUsername} onChange={e => setNewUsername(e.target.value)} required />
                <Input label="Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                <div className={styles.row}>
                  <Button type="submit" size="sm">Create</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowRegister(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setShowRegister(true)}>+ Add User</Button>
            )}
          </section>
        )}

        {/* Danger zone */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitleDanger}>Danger Zone</h2>
          <p className={styles.description}>
            Permanently delete all data from the warehouse. This cannot be undone.
          </p>
          <Button variant="danger" size="sm" onClick={handleClearData}>
            Clear All Data
          </Button>
        </section>

        {/* Status message */}
        {statusMsg && (
          <div className={styles.statusMsg}>{statusMsg}</div>
        )}

        <div className={styles.tip}>
          <em>"{getRandomTip()}"</em>
        </div>

        <div className={styles.version}>
          {lore.appName} v0.1.0
        </div>
      </div>
    </div>
  );
}
