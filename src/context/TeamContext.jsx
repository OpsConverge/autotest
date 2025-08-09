import React, { createContext, useContext, useState, useEffect } from 'react';
import { getApiUrl } from "@/utils";

const TeamContext = createContext();

export function TeamProvider({ children }) {
  const [teams, setTeams] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch teams for the current user
  const fetchTeams = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const res = await fetch(getApiUrl('teams'), {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setTeams(data.teams);
      // Restore active team from localStorage or default to first
      const storedId = localStorage.getItem('activeTeamId');
      const found = data.teams.find(t => t.id === Number(storedId));
      setActiveTeam(found || data.teams[0] || null);
    } else {
      setTeams([]);
      setActiveTeam(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeams();
    // eslint-disable-next-line
  }, []);

  // Persist active team in localStorage
  useEffect(() => {
    if (activeTeam) {
      localStorage.setItem('activeTeamId', activeTeam.id);
    }
  }, [activeTeam]);

  const value = {
    teams,
    activeTeam,
    setActiveTeam,
    setTeams,
    refreshTeams: fetchTeams,
    loading,
    logout: () => {
      // Clear all stored data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('activeTeamId');
      localStorage.removeItem('teams');
      
      // Reset state
      setTeams([]);
      setActiveTeam(null);
      
      // Redirect to landing page
      window.location.href = '/';
    },
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  return useContext(TeamContext);
} 