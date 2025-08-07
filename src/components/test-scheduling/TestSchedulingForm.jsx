import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamSettings } from "@/api/entities";

export default function TestSchedulingForm({ isOpen, onClose, onSubmit, testToEdit }) {
  const [formData, setFormData] = useState({});
  const [connectedRepos, setConnectedRepos] = useState([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [workflows, setWorkflows] = useState([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);

  useEffect(() => {
    // Fetch connected GitHub repositories
    const fetchRepos = async () => {
      setIsLoadingRepos(true);
      try {
        const settingsData = await TeamSettings.list();
        if (settingsData.length > 0 && settingsData[0].github_config?.repositories) {
          setConnectedRepos(settingsData[0].github_config.repositories);
        }
      } catch (error) {
        console.error("Failed to fetch GitHub repositories:", error);
      }
      setIsLoadingRepos(false);
    };

    if (isOpen) {
      fetchRepos();
    }
  }, [isOpen]);

  // Fetch workflows when repository is selected
  const fetchWorkflows = async (repoFullName) => {
    if (!repoFullName) {
      setWorkflows([]);
      return;
    }
    
    setIsLoadingWorkflows(true);
    try {
      const { GitHubIntegration } = await import('@/api/entities');
      const workflowsData = await GitHubIntegration.fetchWorkflows(repoFullName);
      // GitHub API returns { workflows: [...] }, so we need to access the workflows property
      const workflowsArray = Array.isArray(workflowsData.workflows) ? workflowsData.workflows : [];
      setWorkflows(workflowsArray);
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
      setWorkflows([]);
    }
    setIsLoadingWorkflows(false);
  };
  
  useEffect(() => {
    if (testToEdit) {
      setFormData(testToEdit);
    } else {
      setFormData({
        name: '',
        description: '',
        test_type: 'on_demand',
        cron_expression: '',
        github_repo_full_name: '',
        workflow_file_name: '.github/workflows/main.yml',
        is_active: true,
      });
    }
  }, [testToEdit, isOpen]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    // Handle manual workflow input
    if (id === 'workflow_file_name_manual') {
      setFormData(prev => ({ ...prev, workflow_file_name: value }));
    } else {
      setFormData(prev => ({ ...prev, [id]: value }));
    }
  };
  
  const handleSelectChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glass-effect">
        <DialogHeader>
          <DialogTitle>{testToEdit ? 'Edit Test Configuration' : 'Create New Test Configuration'}</DialogTitle>
          <DialogDescription>
            Set up a new on-demand or scheduled test run linked to a GitHub workflow.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Configuration Name</Label>
            <Input id="name" value={formData.name || ''} onChange={handleChange} placeholder="e.g., Nightly Regression Suite" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description || ''} onChange={handleChange} placeholder="A brief description of what this test does." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test_type">Test Type</Label>
              <Select id="test_type" value={formData.test_type} onValueChange={(v) => handleSelectChange('test_type', v)} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_demand">On-Demand</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.test_type === 'scheduled' && (
              <div className="space-y-2">
                <Label htmlFor="cron_expression">Cron Expression</Label>
                <Input id="cron_expression" value={formData.cron_expression || ''} onChange={handleChange} placeholder="* * * * *" required />
                <p className="text-xs text-slate-500">Standard cron format for scheduling.</p>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="github_repo_full_name">GitHub Repository</Label>
            <Select id="github_repo_full_name" value={formData.github_repo_full_name} onValueChange={(v) => {
              handleSelectChange('github_repo_full_name', v);
              fetchWorkflows(v);
            }} required disabled={isLoadingRepos}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingRepos ? "Loading repos..." : "Select a repository"} />
              </SelectTrigger>
              <SelectContent>
                {connectedRepos.map(repo => (
                  <SelectItem key={repo.id} value={repo.full_name}>{repo.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workflow_file_name">Workflow File Name</Label>
            <Select 
              id="workflow_file_name" 
              value={formData.workflow_file_name} 
              onValueChange={(v) => handleSelectChange('workflow_file_name', v)} 
              required 
              disabled={isLoadingWorkflows || !formData.github_repo_full_name}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !formData.github_repo_full_name 
                    ? "Select a repository first" 
                    : isLoadingWorkflows 
                      ? "Loading workflows..." 
                      : (!workflows || workflows.length === 0) 
                        ? "No workflows found" 
                        : "Select a workflow"
                } />
              </SelectTrigger>
              <SelectContent>
                {(workflows || []).map(workflow => (
                  <SelectItem key={workflow.id} value={workflow.path}>
                    {workflow.name} ({workflow.path})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.github_repo_full_name && (!workflows || workflows.length === 0) && !isLoadingWorkflows && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">No workflows found in this repository. Please enter the workflow path manually:</p>
                <Input 
                  id="workflow_file_name_manual" 
                  value={formData.workflow_file_name || ''} 
                  onChange={handleChange} 
                  placeholder=".github/workflows/ci.yml" 
                  required 
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-700">{testToEdit ? 'Save Changes' : 'Create Configuration'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}