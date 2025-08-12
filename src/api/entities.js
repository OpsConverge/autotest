import { apiClient } from './base44Client';
import { getApiUrl } from '@/utils';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getActiveTeamId() {
  const teamId = localStorage.getItem('activeTeamId');
  console.log('[getActiveTeamId] teamId from localStorage:', teamId);
  return teamId;
}

export const GitHubIntegration = {
  githubLoginUrl() {
    const teamId = getActiveTeamId();
    const token = localStorage.getItem('token');
    if (!teamId) throw new Error('No active team');
    if (!token) throw new Error('No auth token');
    return `${getApiUrl(`teams/${teamId}/github/login`)}?token=${encodeURIComponent(token)}`;
  },
  async fetchRepos() {
    const teamId = getActiveTeamId();
    if (!teamId) throw new Error('No active team');
    const res = await fetch(getApiUrl(`teams/${teamId}/github/repos`), {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch GitHub repos');
    return res.json();
  },
  async fetchWorkflows(repoFullName) {
    const teamId = getActiveTeamId();
    if (!teamId) throw new Error('No active team');
    const res = await fetch(getApiUrl(`teams/${teamId}/github/workflows?repoFullName=${encodeURIComponent(repoFullName)}`), {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch workflows');
    return res.json();
  }
};

export const Release = {
  async list() {
    const teamId = getActiveTeamId();
    const token = localStorage.getItem('token');
    if (!teamId) throw new Error('No active team');
    if (!token) throw new Error('No auth token');
    
    const res = await fetch(`http://localhost:4000/api/teams/${teamId}/releases`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to load releases');
    return res.json();
  },
};

export const Build = {
  async list(sortBy = "-created_date", limit = 50) {
    const teamId = getActiveTeamId();
    const token = localStorage.getItem('token');
    if (!teamId) throw new Error('No active team');
    if (!token) throw new Error('No auth token');
    
    const res = await fetch(`http://localhost:4000/api/teams/${teamId}/builds?limit=${limit}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to load builds');
    return res.json();
  },

  async listByReleases(repo = null) {
    const teamId = getActiveTeamId();
    const token = localStorage.getItem('token');
    if (!teamId) throw new Error('No active team');
    if (!token) throw new Error('No auth token');
    
    const url = repo 
      ? `http://localhost:4000/api/teams/${teamId}/builds/by-releases?repo=${encodeURIComponent(repo)}`
      : `http://localhost:4000/api/teams/${teamId}/builds/by-releases`;
    
    const res = await fetch(url, {
      headers: { 
        ...getAuthHeaders(),
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (!res.ok) throw new Error('Failed to load builds by releases');
    return res.json();
  },

  async create(buildData) {
    const teamId = getActiveTeamId();
    const token = localStorage.getItem('token');
    if (!teamId) throw new Error('No active team');
    if (!token) throw new Error('No auth token');
    
    const res = await fetch(`http://localhost:4000/api/teams/${teamId}/builds`, {
      method: 'POST',
      headers: { 
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(buildData)
    });
    if (!res.ok) throw new Error('Failed to create build');
    return res.json();
  },

  async sync(repoFullName) {
    const teamId = getActiveTeamId();
    const token = localStorage.getItem('token');
    if (!teamId) throw new Error('No active team');
    if (!token) throw new Error('No auth token');
    
    const res = await fetch(`http://localhost:4000/api/teams/${teamId}/repos/${encodeURIComponent(repoFullName)}/sync`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to sync builds and releases');
    return res.json();
  },




};

export const TestRun = {
  async list(sortBy = "-created_date", limit = 50) {
    const teamId = getActiveTeamId();
    if (!teamId) throw new Error('No active team');
    
    const url = `http://localhost:4000/api/teams/${teamId}/test-runs?sortBy=${encodeURIComponent(sortBy)}&limit=${limit}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to load test runs');
    return res.json();
  },
  
  async listByBuild(buildId) {
    const res = await fetch(`http://localhost:4000/api/builds/${buildId}/test-runs`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to load test runs');
    return res.json();
  },
  
  async analyzeFlakiness(timeRange = '30d', minRuns = 3, flakinessThreshold = 0.3) {
    const teamId = getActiveTeamId();
    if (!teamId) throw new Error('No active team');
    
    const url = `http://localhost:4000/api/teams/${teamId}/flakiness-analysis?timeRange=${timeRange}&minRuns=${minRuns}&flakinessThreshold=${flakinessThreshold}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to analyze flakiness');
    return res.json();
  },
  
  async create(buildId, testRun) {
    const res = await fetch(`http://localhost:4000/api/builds/${buildId}/test-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(testRun)
    });
    if (!res.ok) throw new Error('Failed to create test run');
    return res.json();
  },

  async bulkReparse() {
    const teamId = getActiveTeamId();
    if (!teamId) throw new Error('No active team');
    
    const res = await fetch(`http://localhost:4000/api/teams/${teamId}/reparse-all-tests`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to bulk re-parse tests');
    return res.json();
  }
};

export const TeamSettings = {
  async list() {
    const teamId = getActiveTeamId();
    console.log('[TeamSettings.list] teamId:', teamId);
    if (!teamId) throw new Error('No active team');
    const res = await fetch(getApiUrl(`teams/${teamId}/settings`), {
      headers: { 
        ...getAuthHeaders(),
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    console.log('[TeamSettings.list] Response status:', res.status);
    if (!res.ok) throw new Error('Failed to load team settings');
    const data = await res.json();
    console.log('[TeamSettings.list] Settings data:', data);
    return [data]; // for compatibility with existing code
  },
  async update(id, settings) {
    const teamId = getActiveTeamId();
    if (!teamId) throw new Error('No active team');
    const res = await fetch(getApiUrl(`teams/${teamId}/settings`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ settings })
    });
    if (!res.ok) throw new Error('Failed to update team settings');
    return res.json();
  },
  async create(settings) {
    // For demo, just call update
    return this.update(null, settings);
  }
};

export const User = {};

export const ScheduledTest = {
  async list(sortBy = "-createdAt", limit = 50) {
    const teamId = getActiveTeamId();
    if (!teamId) throw new Error('No active team');
    
    const url = `http://localhost:4000/api/teams/${teamId}/scheduled-tests?sortBy=${encodeURIComponent(sortBy)}&limit=${limit}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to load scheduled tests');
    return res.json();
  },

  async get(id) {
    const teamId = getActiveTeamId();
    if (!teamId) throw new Error('No active team');
    
    const res = await fetch(`http://localhost:4000/api/teams/${teamId}/scheduled-tests/${id}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to load scheduled test');
    return res.json();
  },

  async create(data) {
    const teamId = getActiveTeamId();
    if (!teamId) throw new Error('No active team');
    
    const res = await fetch(`http://localhost:4000/api/teams/${teamId}/scheduled-tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create scheduled test');
    return res.json();
  },

  async update(id, data) {
    const teamId = getActiveTeamId();
    if (!teamId) throw new Error('No active team');
    
    const res = await fetch(`http://localhost:4000/api/teams/${teamId}/scheduled-tests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update scheduled test');
    return res.json();
  },

  async delete(id) {
    const teamId = getActiveTeamId();
    if (!teamId) throw new Error('No active team');
    
    const res = await fetch(`http://localhost:4000/api/teams/${teamId}/scheduled-tests/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to delete scheduled test');
    return res.json();
  },

  async runNow(id) {
    const teamId = getActiveTeamId();
    if (!teamId) throw new Error('No active team');
    
    const res = await fetch(`http://localhost:4000/api/teams/${teamId}/scheduled-tests/${id}/run`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to trigger test run');
    return res.json();
  },

  async getRunHistory(id, limit = 20) {
    const teamId = getActiveTeamId();
    if (!teamId) throw new Error('No active team');
    
    const url = `http://localhost:4000/api/teams/${teamId}/scheduled-tests/${id}/runs?limit=${limit}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to load run history');
    return res.json();
  },

  async checkStatus(id) {
    const teamId = getActiveTeamId();
    if (!teamId) throw new Error('No active team');
    
    const res = await fetch(`http://localhost:4000/api/teams/${teamId}/scheduled-tests/${id}/status`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to check status');
    return res.json();
  }
};