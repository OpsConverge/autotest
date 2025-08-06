import React, { useState, useEffect } from 'react';
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
  Search
} from "lucide-react";

import GitHubRepoSelector from "./GitHubRepoSelector";

const CodeBlock = ({ children }) => (
  <div className="bg-slate-800 text-slate-100 rounded-md p-4 text-sm font-mono overflow-x-auto">
    <pre><code>{children}</code></pre>
  </div>
);

export default function IntegrationSettings({ settings, onUpdate }) {
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const uniqueApiEndpoint = "https://api.testflow.ai/v1/results/upload/a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890";

  const updateSlackConfig = (webhook) => {
    onUpdate({
      slack_webhook: webhook
    });
  };

  const updateGithubConfig = (config) => {
    onUpdate({
      github_config: {
        ...settings.github_config,
        ...config
      }
    });
  };

  const updateJiraConfig = (config) => {
    onUpdate({
      jira_config: {
        ...settings.jira_config,
        ...config
      }
    });
  };

  const addGitHubRepo = (repo) => {
    const existingRepos = settings.github_config?.repositories || [];
    const updatedRepos = [...existingRepos, repo];
    
    onUpdate({
      github_config: {
        ...settings.github_config,
        repositories: updatedRepos
      }
    });
    setShowRepoSelector(false);
  };

  const removeGitHubRepo = (repoId) => {
    const existingRepos = settings.github_config?.repositories || [];
    const updatedRepos = existingRepos.filter(repo => repo.id !== repoId);
    
    onUpdate({
      github_config: {
        ...settings.github_config,
        repositories: updatedRepos
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-600" />
            Platform Integrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Slack Integration */}
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

          {/* GitHub Integration */}
          <div className="p-6 rounded-lg border border-slate-200 bg-gradient-to-r from-gray-50 to-slate-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <Github className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">GitHub</h4>
                  <p className="text-sm text-slate-600">Integrate with GitHub Actions and repositories</p>
                </div>
              </div>
              <Badge className={settings?.github_config?.access_token ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                {settings?.github_config?.access_token ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
            
            <div className="space-y-4">
              {/* Access Token */}
              <div>
                <Label htmlFor="github_token">Personal Access Token</Label>
                <Input
                  id="github_token"
                  type="password"
                  value={settings?.github_config?.access_token || ''}
                  onChange={(e) => updateGithubConfig({ access_token: e.target.value })}
                  placeholder="ghp_xxxxxxxxxxxx"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Required to browse and connect repositories
                </p>
              </div>

              {/* Connected Repositories */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Connected Repositories</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowRepoSelector(true)}
                    disabled={!settings?.github_config?.access_token}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Repository
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {settings?.github_config?.repositories?.map((repo) => (
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
                  )) || (
                    <div className="text-center py-6 text-slate-500">
                      <Github className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-sm">No repositories connected</p>
                      <p className="text-xs text-slate-400">Add your first repository to get started</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
          -H 'X-API-KEY: \${{ secrets.TESTFLOW_API_KEY }}' \\
          --data-binary "@path/to/results.xml"`}
            </CodeBlock>
          </div>
           <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 mt-4">
              <p className="text-sm text-blue-800">
                You can generate and manage your team's API keys under the <span className="font-semibold">Team</span> tab.
              </p>
            </div>
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