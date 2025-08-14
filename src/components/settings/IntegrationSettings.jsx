import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Github, 
  ExternalLink, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  Users,
  Shield
} from "lucide-react";
import { useTeam } from '../../context/TeamContext';
import { GitHubIntegration } from '../../api/entities';
import { getApiUrl } from '@/utils';
import GitHubRepoSelector from './GitHubRepoSelector';

export default function IntegrationSettings({ settings, onUpdate }) {
  const { activeTeam } = useTeam();
  const [githubStatus, setGithubStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showRepoSelector, setShowRepoSelector] = useState(false);

  // Fetch GitHub status for the current team
  const fetchGitHubStatus = async () => {
    console.log('=== fetchGitHubStatus called ==='); // Very prominent debug log
    console.log('activeTeam:', activeTeam); // Debug activeTeam
    
    if (!activeTeam) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token); // Debug token
      
      const response = await fetch(getApiUrl(`teams/${activeTeam.id}/github/status`), {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const status = await response.json();
        console.log('GitHub status:', status); // Debug log
        console.log('isConnected:', status.isConnected); // Debug log
        console.log('hasToken:', status.hasToken); // Debug log
        setGithubStatus(status);
      } else {
        console.error('Failed to fetch GitHub status, response:', response.status, response.statusText); // Debug log
        setError('Failed to fetch GitHub status');
      }
    } catch (err) {
      console.error('Error fetching GitHub status:', err); // Debug log
      setError('Failed to fetch GitHub status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGitHubStatus();
  }, [activeTeam]);

  const updateSlackConfig = (webhook) => {
    onUpdate({
      ...settings,
      slack_webhook: webhook
    });
  };

  const updateGithubConfig = (config) => {
    onUpdate({
      ...settings,
      github_config: {
        ...(settings?.github_config || {}),
        ...config
      }
    });
  };

  const updateJiraConfig = (config) => {
    onUpdate({
      ...settings,
      jira_config: {
        ...(settings?.jira_config || {}),
        ...config
      }
    });
  };

  const addGitHubRepo = (repo) => {
    const existingRepos = settings?.github_config?.repositories || [];
    const updatedRepos = [...existingRepos, repo];
    
    updateGithubConfig({
      repositories: updatedRepos
    });
    
    setShowRepoSelector(false);
  };

  const removeGitHubRepo = (repoId) => {
    const existingRepos = settings?.github_config?.repositories || [];
    const updatedRepos = existingRepos.filter(repo => repo.id !== repoId);
    
    updateGithubConfig({
      repositories: updatedRepos
    });
  };

  const handleConnectGitHub = () => {
    if (!activeTeam) {
      setError('No active team selected');
      return;
    }
    
    try {
      const loginUrl = GitHubIntegration.githubLoginUrl();
      console.log('Redirecting to GitHub OAuth:', loginUrl); // Debug log
      window.location.href = loginUrl;
    } catch (err) {
      console.error('Error in handleConnectGitHub:', err); // Debug log
      setError(err.message);
    }
  };

  const handleDisconnectGitHub = async () => {
    if (!activeTeam) return;
    
    // Add confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to disconnect ${activeTeam.name} from GitHub? This will remove access to all connected repositories and workflows.`
    );
    
    if (!confirmed) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`teams/${activeTeam.id}/github/disconnect`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setGithubStatus({ ...githubStatus, isConnected: false, hasToken: false });
        updateGithubConfig({ is_connected: false, repositories: [] });
        setSuccess('GitHub integration disconnected successfully');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to disconnect GitHub');
      }
    } catch (err) {
      setError('Failed to disconnect GitHub');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = (repoId) => {
    if (!settings?.github_config?.repositories) return;

    const updatedRepos = settings.github_config.repositories.map(repo => {
      if (repo.id === repoId) {
        return {
          ...repo,
          last_sync_status: 'ok',
          last_sync_time: new Date().toISOString()
        };
      }
      return repo;
    });

    updateGithubConfig({ repositories: updatedRepos });
  };

  const fetchGithubRepos = async () => {
    try {
      const repos = await GitHubIntegration.fetchRepos();
      setGithubRepos(repos);
    } catch (err) {
      setGithubRepos([]);
    }
  };

  const handleSelectRepoForWorkflows = async (repo) => {
    setSelectedRepo(repo);
    setIsLoadingWorkflows(true);
    setWorkflows([]);
    try {
      const data = await GitHubIntegration.fetchWorkflows(repo.full_name);
      setWorkflows(data.workflows || []);
    } catch (err) {
      setWorkflows([]);
    }
    setIsLoadingWorkflows(false);
  };

  return (
    <div className="space-y-6">
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="w-6 h-6 text-slate-700" />
            GitHub Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 rounded-lg border border-slate-200 bg-gradient-to-r from-gray-50 to-slate-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <Github className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">GitHub Integration</h4>
                  <p className="text-sm text-slate-600">
                    {activeTeam ? `Connect ${activeTeam.name} to GitHub repositories` : 'Select a team to manage GitHub integration'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {githubStatus?.permissions?.canManage && (
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    {githubStatus.permissions.userRole}
                  </Badge>
                )}
                <Badge className={githubStatus?.isConnected ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                  {githubStatus?.isConnected ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
            </div>
            
            {!activeTeam ? (
              <div className="text-center py-6 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">No team selected</p>
                <p className="text-xs text-slate-400">Select a team to manage GitHub integration</p>
              </div>
            ) : !githubStatus?.permissions?.canManage ? (
              <div className="text-center py-6 text-slate-500">
                <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">Insufficient permissions</p>
                <p className="text-xs text-slate-400">Only team owners and admins can manage GitHub integration</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Connection Status */}
                {githubStatus?.isConnected ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">GitHub Connected</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDisconnectGitHub}
                      disabled={loading}
                      className="text-red-600 hover:text-red-800 border-red-300"
                    >
                      {loading ? 'Disconnecting...' : 'Disconnect GitHub'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-slate-600" />
                      <span className="text-sm font-medium text-slate-800">GitHub Not Connected</span>
                    </div>
                    <Button 
                      onClick={handleConnectGitHub}
                      disabled={loading}
                      className="bg-slate-900 hover:bg-slate-800"
                    >
                      {loading ? 'Connecting...' : 'Connect GitHub'}
                    </Button>
                  </div>
                )}

                {/* Connected Repositories */}
                {githubStatus?.isConnected && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label>Connected Repositories</Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowRepoSelector(true)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Repository
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {githubStatus?.repositories?.length > 0 ? (
                        githubStatus.repositories.map((repo) => (
                          <div key={repo.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-center gap-3">
                              <Github className="w-4 h-4 text-slate-600" />
                              <div>
                                <p className="font-medium text-slate-900">{repo.full_name}</p>
                                <p className="text-xs text-slate-500">{repo.default_branch} branch</p>
                              </div>
                              {repo.has_actions && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs">
                                  Actions Enabled
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeGitHubRepo(repo.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-slate-500">
                          <Github className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                          <p className="text-sm">No repositories connected</p>
                          <p className="text-xs text-slate-400">Add your first repository to get started</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Team-specific information */}
                {activeTeam && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600">
                      <strong>Team:</strong> {activeTeam.name} | 
                      <strong> Integration Scope:</strong> Team-wide (all team members can access connected repositories)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Jira Integration */}
          <div className="p-6 rounded-lg border border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <ExternalLink className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Jira</h4>
                  <p className="text-sm text-slate-600">Create tickets for test failures automatically</p>
                </div>
              </div>
              <Badge className={settings?.jira_config?.url ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                {settings?.jira_config?.url ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="jira_url">Jira URL</Label>
                <Input
                  id="jira_url"
                  value={settings?.jira_config?.url || ''}
                  onChange={(e) => updateJiraConfig({ url: e.target.value })}
                  placeholder="https://company.atlassian.net"
                />
              </div>
              <div>
                <Label htmlFor="jira_project">Project Key</Label>
                <Input
                  id="jira_project"
                  value={settings?.jira_config?.project_key || ''}
                  onChange={(e) => updateJiraConfig({ project_key: e.target.value })}
                  placeholder="TEST"
                />
              </div>
              <div>
                <Label htmlFor="jira_token">API Token</Label>
                <Input
                  id="jira_token"
                  type="password"
                  value={settings?.jira_config?.api_token || ''}
                  onChange={(e) => updateJiraConfig({ api_token: e.target.value })}
                  placeholder="API token"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            Team Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 rounded-lg border border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Team Members</h4>
                  <p className="text-sm text-slate-600">Manage your team's members and permissions</p>
                </div>
              </div>
              <Badge className="bg-slate-100 text-slate-800">
                {activeTeam?.name || 'No Team Selected'}
              </Badge>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={activeTeam?.name || ''}
                  onChange={(e) => {
                    if (activeTeam) {
                      onUpdate({
                        [activeTeam.id]: { name: e.target.value }
                      });
                    }
                  }}
                  placeholder="Enter team name"
                />
              </div>
              <div>
                <Label htmlFor="team-description">Team Description</Label>
                <Input
                  id="team-description"
                  value={activeTeam?.description || ''}
                  onChange={(e) => {
                    if (activeTeam) {
                      onUpdate({
                        [activeTeam.id]: { description: e.target.value }
                      });
                    }
                  }}
                  placeholder="Enter team description"
                />
              </div>
              <div>
                <Label htmlFor="team-api-key">Team API Key</Label>
                <Input
                  id="team-api-key"
                  value={activeTeam?.api_key || ''}
                  onChange={(e) => {
                    if (activeTeam) {
                      onUpdate({
                        [activeTeam.id]: { api_key: e.target.value }
                      });
                    }
                  }}
                  placeholder="API key"
                />
                <p className="text-xs text-slate-500 mt-1">
                  This key is used for API authentication. Keep it secure.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg border border-slate-200 bg-gradient-to-r from-yellow-50 to-amber-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Settings className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Team Settings</h4>
                  <p className="text-sm text-slate-600">Configure team-specific settings</p>
                </div>
              </div>
              <Badge className="bg-slate-100 text-slate-800">
                {activeTeam?.name || 'No Team Selected'}
              </Badge>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="team-webhook">Team Webhook URL</Label>
                <Input
                  id="team-webhook"
                  value={activeTeam?.slack_webhook || ''}
                  onChange={(e) => {
                    if (activeTeam) {
                      onUpdate({
                        [activeTeam.id]: { slack_webhook: e.target.value }
                      });
                    }
                  }}
                  placeholder="https://hooks.slack.com/services/..."
                  type="url"
                />
                <p className="text-xs text-slate-500 mt-1">
                  This webhook will be used for notifications within this team.
                </p>
              </div>
              <div>
                <Label htmlFor="team-jira-url">Team Jira URL</Label>
                <Input
                  id="team-jira-url"
                  value={activeTeam?.jira_config?.url || ''}
                  onChange={(e) => {
                    if (activeTeam) {
                      onUpdate({
                        [activeTeam.id]: { jira_config: { ...activeTeam.jira_config, url: e.target.value } }
                      });
                    }
                  }}
                  placeholder="https://company.atlassian.net"
                />
              </div>
              <div>
                <Label htmlFor="team-jira-project">Team Jira Project Key</Label>
                <Input
                  id="team-jira-project"
                  value={activeTeam?.jira_config?.project_key || ''}
                  onChange={(e) => {
                    if (activeTeam) {
                      onUpdate({
                        [activeTeam.id]: { jira_config: { ...activeTeam.jira_config, project_key: e.target.value } }
                      });
                    }
                  }}
                  placeholder="TEST"
                />
              </div>
              <div>
                <Label htmlFor="team-jira-token">Team Jira API Token</Label>
                <Input
                  id="team-jira-token"
                  type="password"
                  value={activeTeam?.jira_config?.api_token || ''}
                  onChange={(e) => {
                    if (activeTeam) {
                      onUpdate({
                        [activeTeam.id]: { jira_config: { ...activeTeam.jira_config, api_token: e.target.value } }
                      });
                    }
                  }}
                  placeholder="API token"
                />
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="success">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* GitHub Repository Selector Modal */}
      {showRepoSelector && (
        <GitHubRepoSelector
          isOpen={showRepoSelector}
          onClose={() => setShowRepoSelector(false)}
          onSelectRepo={addGitHubRepo}
          accessToken={settings?.github_config?.access_token}
          existingRepos={settings?.github_config?.repositories || []}
        />
      )}
    </div>
  );
}