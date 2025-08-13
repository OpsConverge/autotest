import React, { useEffect, useState } from 'react';
import { useTeam } from '../context/TeamContext';
import { getApiUrl } from '@/utils';

export default function TeamMembersList({ refresh }) {
  const { activeTeam } = useTeam();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    if (!activeTeam) return;
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(getApiUrl(`teams/${activeTeam.id}/members`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      setMembers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line
  }, [activeTeam, refresh]);

  if (!activeTeam) return null;
  if (loading) return <div>Loading team members...</div>;

  return (
    <div style={{ marginTop: 16 }}>
      <h3>Team Members</h3>
      <ul style={{ padding: 0, listStyle: 'none' }}>
        {members.map(m => (
          <li key={m.email} style={{ padding: '6px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
            <span>{m.email}</span>
            <span style={{ color: '#888', fontSize: 13 }}>{m.role}</span>
          </li>
        ))}
      </ul>
    </div>
  );
} 