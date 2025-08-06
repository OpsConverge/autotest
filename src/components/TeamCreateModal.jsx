import React, { useState } from 'react';
import { useTeam } from '../context/TeamContext';

export default function TeamCreateModal({ isOpen, onClose, onTeamCreated }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { refreshTeams } = useTeam();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:4000/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name })
    });
    if (res.ok) {
      await refreshTeams();
      setName('');
      onTeamCreated && onTeamCreated();
      onClose();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Failed to create team');
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
    }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 320 }}>
        <h2 style={{ marginBottom: 16 }}>Create New Team</h2>
        <input
          type="text"
          placeholder="Team name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={{ width: '100%', padding: 8, marginBottom: 12, borderRadius: 4, border: '1px solid #ccc' }}
        />
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #ccc', background: '#eee' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #007bff', background: '#007bff', color: '#fff' }}>
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
} 