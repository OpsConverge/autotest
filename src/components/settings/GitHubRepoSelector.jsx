import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Github, Search, CheckCircle2, GitBranch, Star } from "lucide-react";

export default function GitHubRepoSelector({ isOpen, onClose, onSelectRepo, repos: externalRepos, accessToken, existingRepos }) {
  const [repos, setRepos] = useState([]);
  const [filteredRepos, setFilteredRepos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (externalRepos && externalRepos.length > 0) {
        setRepos(externalRepos);
        setIsLoading(false);
      } else if (accessToken) {
        fetchRepositories();
      }
    }
  }, [isOpen, accessToken, externalRepos]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = repos.filter(repo => 
        repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRepos(filtered);
    } else {
      setFilteredRepos(repos);
    }
  }, [searchQuery, repos]);

  const fetchRepositories = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock GitHub API call - in real implementation, you'd call GitHub API
      // For demo purposes, we'll simulate repositories
      const mockRepos = [
        {
          id: 1,
          full_name: "company/web-app",
          description: "Main web application",
          default_branch: "main",
          html_url: "https://github.com/company/web-app",
          stargazers_count: 45,
          language: "TypeScript",
          private: false,
          has_actions: true
        },
        {
          id: 2,
          full_name: "company/api-service",
          description: "Backend API service",
          default_branch: "develop",
          html_url: "https://github.com/company/api-service",
          stargazers_count: 23,
          language: "Python",
          private: true,
          has_actions: true
        },
        {
          id: 3,
          full_name: "company/mobile-app",
          description: "React Native mobile application",
          default_branch: "main",
          html_url: "https://github.com/company/mobile-app",
          stargazers_count: 67,
          language: "JavaScript",
          private: false,
          has_actions: false
        },
        {
          id: 4,
          full_name: "company/documentation",
          description: "Technical documentation and guides",
          default_branch: "main",
          html_url: "https://github.com/company/documentation",
          stargazers_count: 12,
          language: "Markdown",
          private: false,
          has_actions: false
        }
      ];
      
      setRepos(mockRepos);
    } catch (err) {
      setError('Failed to fetch repositories. Please check your access token.');
    }
    
    setIsLoading(false);
  };

  const isRepoAlreadyConnected = (repoId) => {
    return existingRepos.some(repo => repo.id === repoId);
  };

  const handleSelectRepo = (repo) => {
    onSelectRepo(repo);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl glass-effect max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-6 h-6" />
            Select GitHub Repository
          </DialogTitle>
          <DialogDescription>
            Choose repositories to connect for automated test result uploads
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Repository List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Skeleton className="w-6 h-6 rounded" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-48 mb-2" />
                          <Skeleton className="h-3 w-32 mb-2" />
                          <div className="flex gap-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-12" />
                          </div>
                        </div>
                      </div>
                      <Skeleton className="h-9 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 mb-2">{error}</div>
                <Button variant="outline" onClick={fetchRepositories}>
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRepos.map((repo) => (
                  <div key={repo.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Github className="w-6 h-6 text-slate-600 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900 truncate">
                              {repo.full_name}
                            </h4>
                            {repo.private && (
                              <Badge variant="outline" className="text-xs">Private</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">
                            {repo.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              <span>{repo.default_branch}</span>
                            </div>
                            {repo.language && (
                              <span>{repo.language}</span>
                            )}
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              <span>{repo.stargazers_count}</span>
                            </div>
                            {repo.has_actions && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Actions
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {isRepoAlreadyConnected(repo.id) ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-sm font-medium">Connected</span>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSelectRepo(repo)}
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredRepos.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-slate-500">
                    <Github className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p>No repositories found</p>
                    {searchQuery && (
                      <p className="text-sm">Try adjusting your search terms</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}