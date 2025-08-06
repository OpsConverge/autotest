import React, { useState } from 'react';
import { apiClient } from '../api/base44Client';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiClient.register(email, password);
      setSuccess(true);
      setTimeout(() => navigate('/Login'), 1500);
    } catch (err) {
      setError('Registration failed. User may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        {success && <div className="mb-4 text-green-600">Registration successful! Redirecting to login...</div>}
        <div className="mb-4">
          <label className="block mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border px-3 py-2 rounded" />
        </div>
        <div className="mb-6">
          <label className="block mb-1">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border px-3 py-2 rounded" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
        <div className="mt-4 text-center">
          <a href="/Login" className="text-blue-600 hover:underline">Already have an account? Login</a>
        </div>
      </form>
    </div>
  );
} 