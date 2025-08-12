import { getApiUrl } from '@/utils';

// Local API client for communicating with local Node/Express backend
export const apiClient = {
  async login(email, password) {
    const res = await fetch(getApiUrl('auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },
  async register(email, password) {
    const res = await fetch(getApiUrl('auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },
  // Add more API methods as needed

  syncBuilds: async (teamId, repoFullName) => {
    const token = localStorage.getItem('token');
    const res = await fetch(getApiUrl(`teams/${teamId}/repos/${repoFullName}/sync-builds`), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Sync failed');
    return res.json();
  },

  fetchBuilds: async (teamId, repoFullName, limit = 50) => {
    const token = localStorage.getItem('token');
    const res = await fetch(getApiUrl(`teams/${teamId}/builds?repo=${encodeURIComponent(repoFullName)}&limit=${limit}`), {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch builds');
    return res.json();
  }
};
