import React, { useState } from 'react';
import { useTeam } from '../context/TeamContext';

export default function TeamSwitcher() {
  const { teams, activeTeam, setActiveTeam, loading } = useTeam();
  const [open, setOpen] = useState(false);

  if (loading) return <div>Loading teams...</div>;
  if (!activeTeam) return <div>No teams</div>;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
      >
        {activeTeam.name} ▼
      </button>
      {open && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: 4,
            margin: 0,
            padding: 0,
            listStyle: 'none',
            zIndex: 1000,
            minWidth: 180
          }}
        >
          {teams.map(team => (
            <li
              key={team.id}
              onClick={() => {
                setActiveTeam(team);
                setOpen(false);
              }}
              style={{
                padding: '8px 16px',
                background: team.id === activeTeam.id ? '#f0f0f0' : '#fff',
                cursor: 'pointer',
                fontWeight: team.id === activeTeam.id ? 'bold' : 'normal'
              }}
            >
              {team.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 