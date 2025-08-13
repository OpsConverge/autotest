import React, { useState } from 'react';
import { getApiUrl } from '@/utils';

export default function TeamInviteModal({ isOpen, onClose, teamId, onInvited }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(getApiUrl(`teams/${teamId}/invite`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        setEmail('');
        setPassword('');
        onInvited && onInvited();
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to invite member');
      }
    } catch (err) {
      setError('Network error or server not responding');
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
    }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 320 }}>
        <h2 style={{ marginBottom: 16 }}>Invite Team Member</h2>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: 8, marginBottom: 12, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <input
          type="password"
          placeholder="Password (for new user)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: 8, marginBottom: 12, borderRadius: 4, border: '1px solid #ccc' }}
        />
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #ccc', background: '#eee' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #007bff', background: '#007bff', color: '#fff' }}>
            {loading ? 'Inviting...' : 'Invite'}
          </button>
        </div>
      </form>
    </div>
  );
} 