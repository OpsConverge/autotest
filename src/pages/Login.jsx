import React, { useState } from 'react';
import { apiClient } from '../api/base44Client';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '@/utils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.login(email, password);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify({ email: res.email }));
      
      console.log('[Login] User logged in successfully:', res.email);
      
      // Always fetch teams from API to ensure we have the latest data
      try {
        const response = await fetch(getApiUrl('teams'), {
          headers: { Authorization: `Bearer ${res.token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[Login] Teams fetched:', data.teams);
          
          if (data.teams && data.teams.length > 0) {
            const teamId = data.teams[0].id;
            localStorage.setItem('teams', JSON.stringify(data.teams));
            localStorage.setItem('activeTeamId', teamId);
            
            console.log('[Login] Redirecting to team dashboard:', teamId);
            navigate(`/teams/${teamId}/dashboard`);
          } else {
            console.log('[Login] No teams found, redirecting to landing page');
            navigate('/');
          }
        } else {
          console.error('[Login] Failed to fetch teams:', response.status);
          setError('Failed to load user teams');
        }
      } catch (teamsErr) {
        console.error('[Login] Error fetching teams:', teamsErr);
        setError('Failed to load user teams');
      }
    } catch (err) {
      console.error('[Login] Login failed:', err);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <div className="mb-4">
          <label className="block mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border px-3 py-2 rounded" />
        </div>
        <div className="mb-6">
          <label className="block mb-1">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border px-3 py-2 rounded" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div className="mt-4 text-center">
          <a href="/Register" className="text-blue-600 hover:underline">Don't have an account? Register</a>
        </div>
      </form>
    </div>
  );
} 