import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { apiGet, apiPut, apiDelete } from '../services/api';
import { exportWarehouse, importWarehouse, downloadBlob } from '../services/exportService';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../services/apiClient';
import { lore, getRandomTip } from '../lib/lore';
import { formatDate } from '../lib/formatters';
import type { AppSettings } from '../types';
import styles from './Settings.module.css';

export function Settings() {
  const queryClient = useQueryClient();
  const { data: settingsArr = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => apiGet<AppSettings[]>('/api/crud/appSettings'),
  });
  const settings = settingsArr[0];

  const importRef = useRef<HTMLInputElement>(null);
  const { user, logout, refreshUser } = useAuth();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Own profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');

  // Own password change
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPasswordSelf, setNewPasswordSelf] = useState('');

  // User management state (admin only)
  const [showRegister, setShowRegister] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  async function loadUsers() {
    try {
      const r = await apiFetch('/api/users');
      setUsers(await r.json());
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (user?.role === 'admin') loadUsers();
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
    await apiPut(`/api/crud/appSettings/${settings.id}`, changes);
    queryClient.invalidateQueries({ queryKey: ['appSettings'] });
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
      queryClient.invalidateQueries();
    } catch (err) {
      setStatusMsg(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
      if (importRef.current) importRef.current.value = '';
    }
  }

  async function handleClearData() {
    if (!window.confirm('Delete ALL data? This cannot be undone.')) return;
    if (!window.confirm('Are you absolutely sure? Everything will be permanently lost.')) return;

    try {
      const tables = [
        'rooms', 'schedules', 'taskLogs', 'procedures',
        'procedureSteps', 'supplies', 'inventory', 'references',
        'photos', 'notes', 'reminders',
      ];
      for (const table of tables) {
        const rows = await apiGet<{ id: number }[]>(`/api/crud/${table}`);
        for (const row of rows) {
          await apiDelete(`/api/crud/${table}/${row.id}`);
        }
      }
      queryClient.invalidateQueries();
      setStatusMsg('All data cleared.');
    } catch (err) {
      setStatusMsg(`Clear failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ displayName: profileName }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated = await res.json();
      refreshUser(updated);
      setEditingProfile(false);
      setStatusMsg('Profile updated.');
    } catch (err) {
      setStatusMsg(`Update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword: newPasswordSelf }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setChangingPassword(false);
      setCurrentPassword('');
      setNewPasswordSelf('');
      setStatusMsg('Password changed. You may need to log in again on other devices.');
    } catch (err) {
      setStatusMsg(`Password change failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  function startEditUser(u: any) {
    setEditingUserId(u.id);
    setEditDisplayName(u.displayName);
    setEditUsername(u.username);
    setEditRole(u.role);
    setResetPasswordUserId(null);
  }

  function cancelEditUser() {
    setEditingUserId(null);
    setEditDisplayName('');
    setEditUsername('');
    setEditRole('user');
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUserId) return;
    try {
      const res = await apiFetch(`/api/users/${editingUserId}`, {
        method: 'PUT',
        body: JSON.stringify({ displayName: editDisplayName, username: editUsername, role: editRole }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      // If editing self, refresh auth context
      if (editingUserId === user?.id) {
        const updated = await res.json();
        refreshUser(updated);
      }
      cancelEditUser();
      await loadUsers();
      setStatusMsg('User updated.');
    } catch (err) {
      setStatusMsg(`Update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetPasswordUserId) return;
    try {
      const res = await apiFetch(`/api/users/${resetPasswordUserId}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ newPassword: resetPasswordValue }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setResetPasswordUserId(null);
      setResetPasswordValue('');
      setStatusMsg('Password reset. User will need to log in again.');
    } catch (err) {
      setStatusMsg(`Reset failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  async function handleDeleteUser(u: any) {
    if (!window.confirm(`Delete user "${u.displayName}" (${u.username})? All their data will be permanently removed.`)) return;
    try {
      const res = await apiFetch(`/api/users/${u.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      await loadUsers();
      setStatusMsg(`User "${u.displayName}" deleted.`);
    } catch (err) {
      setStatusMsg(`Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
          {editingProfile ? (
            <form className={styles.inlineForm} onSubmit={handleUpdateProfile}>
              <Input
                label="Display Name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
              />
              <div className={styles.formActions}>
                <Button type="submit" size="sm">Save</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingProfile(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <div className={styles.accountInfo}>
              <span className={styles.accountName}>{user?.displayName ?? user?.username}</span>
              <span className={styles.accountRole}>{user?.role}</span>
              <button
                className={styles.inlineAction}
                onClick={() => { setProfileName(user?.displayName ?? ''); setEditingProfile(true); }}
              >
                Edit
              </button>
            </div>
          )}
          <p className={styles.meta}>Username: {user?.username}</p>

          {changingPassword ? (
            <form className={styles.inlineForm} onSubmit={handleChangePassword}>
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                label="New Password"
                type="password"
                value={newPasswordSelf}
                onChange={(e) => setNewPasswordSelf(e.target.value)}
                required
              />
              <div className={styles.formActions}>
                <Button type="submit" size="sm">Change Password</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => { setChangingPassword(false); setCurrentPassword(''); setNewPasswordSelf(''); }}>Cancel</Button>
              </div>
            </form>
          ) : (
            <div className={styles.accountActions}>
              <Button variant="ghost" size="sm" onClick={() => setChangingPassword(true)}>
                Change Password
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                Log Out
              </Button>
            </div>
          )}
        </section>

        {/* User Management (admin only) */}
        {user?.role === 'admin' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Warehouse Keys</h2>
            <p className={styles.description}>Manage who has access to the warehouse.</p>
            <div className={styles.list}>
              {users.map((u: any) => (
                <div key={u.id} className={styles.userCard}>
                  {editingUserId === u.id ? (
                    <form className={styles.userEditForm} onSubmit={handleSaveUser}>
                      <Input label="Display Name" value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} required />
                      <Input label="Username" value={editUsername} onChange={e => setEditUsername(e.target.value)} required />
                      <Select
                        label="Role"
                        value={editRole}
                        onChange={e => setEditRole(e.target.value)}
                        options={[
                          { value: 'user', label: 'User' },
                          { value: 'admin', label: 'Admin' },
                        ]}
                      />
                      <div className={styles.formActions}>
                        <Button type="submit" size="sm">Save</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={cancelEditUser}>Cancel</Button>
                      </div>
                    </form>
                  ) : resetPasswordUserId === u.id ? (
                    <form className={styles.userEditForm} onSubmit={handleResetPassword}>
                      <p className={styles.resetLabel}>Reset password for <strong>{u.displayName}</strong></p>
                      <Input
                        label="New Password"
                        type="password"
                        value={resetPasswordValue}
                        onChange={e => setResetPasswordValue(e.target.value)}
                        required
                      />
                      <div className={styles.formActions}>
                        <Button type="submit" size="sm">Reset Password</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => { setResetPasswordUserId(null); setResetPasswordValue(''); }}>Cancel</Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{u.displayName}</span>
                        <span className={styles.userUsername}>@{u.username}</span>
                        <span className={styles.accountRole}>{u.role}</span>
                      </div>
                      <div className={styles.userActions}>
                        <button className={styles.inlineAction} onClick={() => startEditUser(u)}>Edit</button>
                        <button className={styles.inlineAction} onClick={() => { setResetPasswordUserId(u.id); setEditingUserId(null); setResetPasswordValue(''); }}>Reset Password</button>
                        {u.id !== user?.id && (
                          <button className={`${styles.inlineAction} ${styles.dangerAction}`} onClick={() => handleDeleteUser(u)}>Delete</button>
                        )}
                      </div>
                    </>
                  )}
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
                  await loadUsers();
                  setStatusMsg('User created.');
                } catch { setStatusMsg('Failed to create user.'); }
              }}>
                <Input label="Display Name" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} required />
                <Input label="Username" value={newUsername} onChange={e => setNewUsername(e.target.value)} required />
                <Input label="Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                <div className={styles.formActions}>
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
            Permanently delete all data. This cannot be undone.
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
