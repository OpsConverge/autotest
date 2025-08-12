
import React, { useState, useEffect } from "react";
import { TeamSettings, GitHubIntegration } from "@/api/entities";
import { useTeam } from "../context/TeamContext";
import { getApiUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Zap, 
  Github, 
  MessageSquare, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  Terminal, 
  GitBranch,
  Plus,
  Trash2,
  Save,
  RefreshCw, // New import
  XCircle // New import
} from "lucide-react";
import { format } from "date-fns"; // New import

import GitHubRepoSelector from "../components/settings/GitHubRepoSelector";

const CodeBlock = ({ children }) => (
  <div className="bg-slate-800 text-slate-100 rounded-md p-4 text-sm font-mono overflow-x-auto">
    <pre><code>{children}</code></pre>
  </div>
);

export default function Integrations() {
  const { activeTeam } = useTeam();
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [githubRepos, setGithubRepos] = useState([]);
  const uniqueApiEndpoint = "https://api.testflow.ai/v1/results/upload/a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890";
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
  const [githubUser, setGithubUser] = useState(null);
  
  // Add GitHub status state
  const [githubStatus, setGithubStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  console.log('[Integrations] Component rendered, activeTeam:', activeTeam);
  console.log('[Integrations] localStorage.activeTeamId:', localStorage.getItem('activeTeamId'));

  useEffect(() => {
    if (!activeTeam) return;
    loadSettings();
    fetchGitHubStatus(); // Add GitHub status fetching
  }, [activeTeam]);

  // Add GitHub status fetching function
  const fetchGitHubStatus = async () => {
    if (!activeTeam) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      console.log('=== fetchGitHubStatus called ==='); // Debug log
      console.log('activeTeam:', activeTeam); // Debug log
      console.log('Token exists:', !!token); // Debug token
      
      const response = await fetch(getApiUrl(`teams/${activeTeam.id}/github/status`), {
        headers: { Authorization: `Bearer ${token}` }
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

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const settingsData = await TeamSettings.list();
      setSettings(settingsData[0]);
    } catch (error) {
      setSettings(null);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      await TeamSettings.update(settings.id, settings);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
    setIsSaving(false);
  };

  const updateSettings = (updates) => {
    setSettings(prev => ({
      ...prev,
      ...updates
    }));
  };

  const updateSlackConfig = (webhook) => {
    updateSettings({
      slack_webhook: webhook
    });
  };

  const updateGithubConfig = (config) => {
    setSettings(prev => ({
      ...prev,
      github_config: {
        ...(prev?.github_config || {}),
        ...config
      }
    }));
  };

  const updateJiraConfig = (config) => {
    setSettings(prev => ({
      ...prev,
      jira_config: {
        ...(prev?.jira_config || {}),
        ...config
      }
    }));
  };

  const addGitHubRepo = async (repo) => {
    const existingRepos = settings?.github_config?.repositories || [];
    const updatedRepos = [...existingRepos, repo];
    
    // Update local state
    updateGithubConfig({
      repositories: updatedRepos
    });
    
    // Auto-save to backend
    try {
      await TeamSettings.update(settings?.id, {
        ...settings,
        github_config: {
          ...(settings?.github_config || {}),
          repositories: updatedRepos
        }
      });
      setSuccess('Repository added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error saving repository:', error);
      setError('Failed to save repository');
      // Revert local state on error
      updateGithubConfig({
        repositories: existingRepos
      });
    }
    
    setShowRepoSelector(false);
  };

  const removeGitHubRepo = async (repoId) => {
    const existingRepos = settings?.github_config?.repositories || [];
    const updatedRepos = existingRepos.filter(repo => repo.id !== repoId);
    
    // Update local state
    updateGithubConfig({
      repositories: updatedRepos
    });
    
    // Auto-save to backend
    try {
      await TeamSettings.update(settings?.id, {
        ...settings,
        github_config: {
          ...(settings?.github_config || {}),
          repositories: updatedRepos
        }
      });
      setSuccess('Repository removed successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error removing repository:', error);
      setError('Failed to remove repository');
      // Revert local state on error
      updateGithubConfig({
        repositories: existingRepos
      });
    }
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

  const handleManualSync = async (repoId) => {
    if (!settings?.github_config?.repositories) return;

    const updatedRepos = settings.github_config.repositories.map(repo => {
      if (repo.id === repoId) {
        return {
          ...repo,
          last_sync_status: 'ok', // Simulate successful sync
          last_sync_time: new Date().toISOString()
        };
      }
      return repo;
    });

    // Update local state
    updateGithubConfig({ repositories: updatedRepos });
    
    // Auto-save to backend
    try {
      await TeamSettings.update(settings?.id, {
        ...settings,
        github_config: {
          ...(settings?.github_config || {}),
          repositories: updatedRepos
        }
      });
      setSuccess('Repository synced successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error syncing repository:', error);
      setError('Failed to sync repository');
    }
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

  // Fetch GitHub user info after connection
  useEffect(() => {
    async function fetchGithubUser() {
      if (settings?.github_config?.is_connected) {
        try {
          const teamId = activeTeam?.id || localStorage.getItem('activeTeamId');
          const token = localStorage.getItem('token');
          const res = await fetch(getApiUrl(`teams/${teamId}/github/user`), {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setGithubUser(data);
          }
        } catch (err) {
          setGithubUser(null);
        }
      }
    }
    fetchGithubUser();
  }, [settings?.github_config?.is_connected, activeTeam]);

  useEffect(() => {
    if (showRepoSelector) {
      fetchGithubRepos();
    }
  }, [showRepoSelector]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Loading integrations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-emerald-800 bg-clip-text text-transparent">
              Integrations
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
              Connect your favorite tools and automate your workflow
            </p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-gradient-to-r from-blue-600 to-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="glass-effect border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-600" />
                Platform Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 rounded-lg border border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <MessageSquare className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Slack</h4>
                      <p className="text-sm text-slate-600">Send notifications to Slack channels</p>
                    </div>
                  </div>
                  <Badge className={settings?.slack_webhook ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                    {settings?.slack_webhook ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="slack_webhook">Webhook URL</Label>
                    <Input
                      id="slack_webhook"
                      value={settings?.slack_webhook || ''}
                      onChange={(e) => updateSlackConfig(e.target.value)}
                      placeholder="https://hooks.slack.com/services/..."
                      type="url"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Setup Guide
                    </Button>
                    {settings?.slack_webhook && (
                      <Button variant="outline" size="sm">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Test Connection
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-lg border border-slate-200 bg-gradient-to-r from-gray-50 to-slate-50">
                                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100">
                        <Github className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">GitHub</h4>
                        <p className="text-sm text-slate-600">Integrate with GitHub Actions and repositories</p>
                        {githubUser && (
                          <div className="text-xs text-slate-500 mt-1">Connected as <span className="font-semibold">{githubUser.login}</span></div>
                        )}
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
                       {githubStatus?.isConnected && githubStatus?.permissions?.canManage && (
                         <Button 
                           variant="outline" 
                           size="sm" 
                           onClick={handleDisconnectGitHub}
                           disabled={loading}
                           className="text-red-600 hover:text-red-800 border-red-300 text-xs"
                         >
                           {loading ? 'Disconnecting...' : 'Disconnect'}
                         </Button>
                       )}
                     </div>
                  </div>
                  
                  {/* Conditional rendering based on GitHub connection status */}
                  {githubStatus?.isConnected ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label>Connected Repositories</Label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowRepoSelector(true)}
                          // Removed disabled prop based on access_token, now always enabled if connected
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Repository
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {settings?.github_config?.repositories?.length > 0 ? (
                          settings.github_config.repositories.map((repo) => (
                            <div key={repo.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Github className="w-4 h-4 text-slate-600" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900 truncate">{repo.full_name}</p>
                                  <div className="text-xs text-slate-500 flex items-center gap-2">
                                    <span>Last sync: {repo.last_sync_time ? format(new Date(repo.last_sync_time), 'MMM d, HH:mm') : 'never'}</span>
                                    {repo.last_sync_status === 'ok' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                    {repo.last_sync_status === 'failed' && <XCircle className="w-3 h-3 text-red-500" />}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {/* New Manual Sync Button */}
                                <Button variant="ghost" size="icon" onClick={() => handleManualSync(repo.id)} title="Manual Sync">
                                  <RefreshCw className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" asChild>
                                  <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" // Changed size to "icon"
                                  onClick={() => removeGitHubRepo(repo.id)}
                                  className="text-red-600 hover:bg-red-50" // Adjusted hover style
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleSelectRepoForWorkflows(repo)}
                                  className="ml-2"
                                >
                                  View Workflows
                                </Button>
                                {selectedRepo && selectedRepo.id === repo.id && (
                                  <div className="mt-2 ml-8">
                                    {isLoadingWorkflows ? (
                                      <div className="text-slate-500">Loading workflows...</div>
                                    ) : workflows.length > 0 ? (
                                      <ul className="list-disc pl-4">
                                        {workflows.map(wf => (
                                          <li key={wf.id} className="text-slate-700">{wf.name}</li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <div className="text-slate-500">No workflows found.</div>
                                    )}
                                  </div>
                                )}
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
                  </div>
                ) : (
                  // Display when GitHub is not connected
                  <div className="text-center py-8">
                    <Github className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                    <h4 className="text-lg font-semibold text-slate-800 mb-2">Connect your GitHub Account</h4>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                      Install the TestFlow GitHub App to enable automatic status checks, repository browsing, and CI/CD integration.
                    </p>
                    {githubStatus?.permissions?.canManage ? (
                      <Button onClick={handleConnectGitHub} className="bg-slate-900 hover:bg-slate-800 text-white">
                        <Github className="w-4 h-4 mr-2" />
                        Connect GitHub Account
                      </Button>
                    ) : (
                      <div className="text-sm text-slate-500">
                        Only team owners and admins can manage GitHub integration
                      </div>
                    )}
                  </div>
                )}
                
                
                
                {/* Error and Success Messages */}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-sm text-red-800">{error}</div>
                  </div>
                )}
                {success && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-sm text-green-800">{success}</div>
                  </div>
                )}
              </div>

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
                <GitBranch className="w-6 h-6 text-indigo-600" />
                CI/CD Integration & API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="api-endpoint">Your Unique API Endpoint</Label>
                <div className="flex items-center gap-2">
                  <Input id="api-endpoint" value={uniqueApiEndpoint} readOnly />
                  <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(uniqueApiEndpoint)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Use this endpoint to post your test results from any CI/CD platform.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  Example using cURL
                </h4>
                <CodeBlock>
{`curl -X POST \\
  '${uniqueApiEndpoint}' \\
  -H 'Content-Type: application/xml' \\
  -H 'X-API-KEY: YOUR_TEAM_API_KEY' \\
  --data-binary "@path/to/your/report.xml"`}
                </CodeBlock>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  Example for GitHub Actions
                </h4>
                <CodeBlock>
{`name: Test and Upload Results

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Run tests
      run: npm test # Generates results.xml

    - name: "Upload to TestFlow"
      run: |
        curl -X POST \\
          '${uniqueApiEndpoint}' \\
          -H 'Content-Type: application/xml' \\
          -H 'X-API-KEY: \\$\\{\\{ secrets.TESTFLOW_API_KEY \\}\\}' \\
          --data-binary "@path/to/results.xml"`}
                </CodeBlock>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 mt-4">
                <p className="text-sm text-blue-800">
                  You can generate and manage your team's API keys in the <strong>Settings</strong> section.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {showRepoSelector && (
          <GitHubRepoSelector
            isOpen={showRepoSelector}
            onClose={() => setShowRepoSelector(false)}
            onSelectRepo={addGitHubRepo}
            repos={githubRepos}
            existingRepos={settings?.github_config?.repositories || []}
          />
        )}
      </div>
    </div>
  );
}
