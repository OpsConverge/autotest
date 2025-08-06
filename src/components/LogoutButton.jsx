import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';

export default function LogoutButton() {
  const navigate = useNavigate();
  const { setActiveTeam } = useTeam();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeTeamId');
    setActiveTeam(null);
    navigate('/');
  };

  return (
    <button onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #ccc', background: '#eee', cursor: 'pointer' }}>
      Logout
    </button>
  );
} 