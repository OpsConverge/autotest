import React, { createContext, useContext, useState, useEffect } from 'react';
import { getApiUrl } from "@/utils";

const TeamContext = createContext();

export function TeamProvider({ children }) {
  const [teams, setTeams] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch teams for the current user
  const fetchTeams = async () => {
    console.log('[TeamContext] fetchTeams called');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('[TeamContext] Token found:', !!token);
      if (!token) {
        console.log('[TeamContext] No token found, skipping team fetch');
        setTeams([]);
        setActiveTeam(null);
        setLoading(false);
        return;
      }
      
      console.log('[TeamContext] Making API call to:', getApiUrl('teams'));
      const res = await fetch(getApiUrl('teams'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('[TeamContext] API response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('[TeamContext] Teams fetched:', data.teams);
        setTeams(data.teams || []);
        
        // Restore active team from localStorage or default to first
        const storedId = localStorage.getItem('activeTeamId');
        console.log('[TeamContext] Stored team ID:', storedId);
        const found = data.teams?.find(t => t.id === Number(storedId));
        console.log('[TeamContext] Found team by stored ID:', found);
        const activeTeam = found || data.teams?.[0] || null;
        console.log('[TeamContext] Setting active team to:', activeTeam);
        setActiveTeam(activeTeam);
        
        if (activeTeam) {
          console.log('[TeamContext] Active team set:', activeTeam.name);
        } else {
          console.log('[TeamContext] No active team found');
        }
      } else {
        console.error('[TeamContext] Failed to fetch teams:', res.status);
        setTeams([]);
        setActiveTeam(null);
      }
    } catch (error) {
      console.error('[TeamContext] Error fetching teams:', error);
      setTeams([]);
      setActiveTeam(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeams();
    // eslint-disable-next-line
  }, []);

  // Listen for storage changes (when token is set after login/registration)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token' && e.newValue && teams.length === 0) {
        console.log('[TeamContext] Token changed, refreshing teams...');
        fetchTeams();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check if we have a token but no teams (for same-page token setting)
    const token = localStorage.getItem('token');
    if (token && teams.length === 0) {
      console.log('[TeamContext] Token found but no teams loaded, refreshing...');
      fetchTeams();
    }

    return () => window.removeEventListener('storage', handleStorageChange);
  }, [teams.length]);

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