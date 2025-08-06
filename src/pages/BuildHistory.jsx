
import React, { useState, useEffect } from "react";
import { Build, Release } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  GitBranch,
  ChevronsRight,
  X,
  Search,
  Filter,
  Tag,
  List
} from "lucide-react";

import BuildCard from "../components/build-history/BuildCard";
import ReleaseCard from "../components/build-history/ReleaseCard";
import BuildComparison from "../components/build-history/BuildComparison";
import BuildTestDetailsModal from "../components/build-history/BuildTestDetailsModal";
import TestDetailsModal from "../components/build-history/TestDetailsModal";
import { useTeam } from "../context/TeamContext";
import { TeamSettings } from "@/api/entities";

export default function BuildHistory() {
  const [releases, setReleases] = useState([]);
  const [unreleasedBuilds, setUnreleasedBuilds] = useState([]);
  const [filteredReleases, setFilteredReleases] = useState([]);
  const [filteredUnreleasedBuilds, setFilteredUnreleasedBuilds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    branch: "all",
    author: "all"
  });
  
  // New state for test details modal
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [selectedMetricType, setSelectedMetricType] = useState(null);
  const [isTestDetailsModalOpen, setIsTestDetailsModalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // State for release test details modal
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [selectedReleaseMetricType, setSelectedReleaseMetricType] = useState(null);
  const [isReleaseTestDetailsModalOpen, setIsReleaseTestDetailsModalOpen] = useState(false);

  const { activeTeam } = useTeam();
  const [settings, setSettings] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState("");

  useEffect(() => {
    loadData();
  }, [selectedRepo]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedRepo) {
        console.log('Auto-refreshing data...');
        loadData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [selectedRepo]);

  useEffect(() => {
    applyFilters();
  }, [releases, unreleasedBuilds, searchQuery, filters]);

  // Load settings when activeTeam changes
  useEffect(() => {
    async function loadSettings() {
      if (!activeTeam) return;
      // Fetch settings for the active team (reuse your TeamSettings.list logic)
      const settingsData = await TeamSettings.list();
      setSettings(settingsData[0]);
    }
    loadSettings();
  }, [activeTeam]);

  const connectedRepos = settings?.github_config?.repositories || [];

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading data for repo:', selectedRepo);
      const data = await Build.listByReleases(selectedRepo || null);
      
      console.log('Loaded data:', data);
      console.log('Releases:', data.releases?.length || 0);
      console.log('Unreleased builds:', data.unreleasedBuilds?.length || 0);
      
      // Log test statistics for each release
      if (data.releases) {
        data.releases.forEach(release => {
          console.log(`Release ${release.tagName}:`, {
            totalTests: release.totalTests,
            passedTests: release.passedTests,
            failedTests: release.failedTests,
            flakyTests: release.flakyTests,
            coveragePercentage: release.coveragePercentage
          });
        });
      }
      
      // Log test statistics for unreleased builds
      if (data.unreleasedBuilds) {
        data.unreleasedBuilds.forEach(build => {
          console.log(`Unreleased build ${build.id}:`, {
            version: build.version,
            totalTests: build.totalTests,
            passedTests: build.passedTests,
            failedTests: build.failedTests,
            flakyTests: build.flakyTests,
            coveragePercentage: build.coveragePercentage,
            testRunsCount: build.testRuns?.length || 0
          });
        });
      }
      
      setReleases(data.releases || []);
      setUnreleasedBuilds(data.unreleasedBuilds);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const applyFilters = () => {
    // Filter releases based on search and filters
    let filteredReleases = [...releases];
    let filteredUnreleasedBuilds = [...unreleasedBuilds];

    // Search filter
    if (searchQuery) {
      filteredReleases = filteredReleases.filter(release =>
        (release.name || release.tagName)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        release.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      filteredUnreleasedBuilds = filteredUnreleasedBuilds.filter(build =>
        build.version?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        build.commitMessage?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        build.author?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter (for unreleased builds)
    if (filters.status !== "all") {
      filteredUnreleasedBuilds = filteredUnreleasedBuilds.filter(build => build.status === filters.status);
    }

    // Branch filter
    if (filters.branch !== "all") {
      filteredReleases = filteredReleases.filter(release => 
        release.builds?.some(build => build.branch === filters.branch)
      );
      filteredUnreleasedBuilds = filteredUnreleasedBuilds.filter(build => build.branch === filters.branch);
    }

    // Author filter (for unreleased builds)
    if (filters.author !== "all") {
      filteredUnreleasedBuilds = filteredUnreleasedBuilds.filter(build => build.author === filters.author);
    }

    setFilteredReleases(filteredReleases);
    setFilteredUnreleasedBuilds(filteredUnreleasedBuilds);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilters({
      status: "all",
      branch: "all",
      author: "all"
    });
  };

  const handleMetricClick = (build, metricType) => {
    setSelectedBuild(build);
    setSelectedMetricType(metricType);
    setIsTestDetailsModalOpen(true);
  };

  const handleReleaseMetricClick = (release, metricType) => {
    setSelectedRelease(release);
    setSelectedReleaseMetricType(metricType);
    setIsReleaseTestDetailsModalOpen(true);
  };

  const handleSync = async () => {
    if (!selectedRepo || !activeTeam?.id) {
      alert('Please select a repository and ensure a team is active.');
      return;
    }
    try {
      console.log('Starting sync for repo:', selectedRepo);
      const result = await Build.sync(selectedRepo);
      console.log('Sync result:', result);
      alert(`Successfully synced ${result.syncedBuilds} builds and ${result.syncedReleases} releases`);
      
      // Add a small delay to ensure backend processing is complete
      console.log('Waiting for backend processing...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Reloading data after sync...');
      await loadData(); // reload data after syncing
      console.log('Data reloaded after sync');
    } catch (e) {
      console.error('Sync failed:', e);
      alert('Failed to sync builds and releases');
    }
  };



  // Get unique values for filter dropdowns from unreleased builds
  const uniqueBranches = [...new Set(unreleasedBuilds.map(build => build.branch).filter(Boolean))];
  const uniqueAuthors = [...new Set(unreleasedBuilds.map(build => build.author).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-emerald-800 bg-clip-text text-transparent">
              Release History
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
              Track releases and their associated builds and test results
            </p>
            {lastUpdated && (
              <p className="text-slate-500 mt-1 text-sm">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Select
              value={selectedRepo}
              onValueChange={setSelectedRepo}
              className="w-64"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a repository" />
              </SelectTrigger>
              <SelectContent>
                {connectedRepos.map(repo => (
                  <SelectItem key={repo.full_name} value={repo.full_name}>
                    {repo.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              onClick={handleSync}
              className="bg-gradient-to-r from-green-600 to-green-700"
              disabled={!selectedRepo}
            >
              Sync Builds & Releases
            </Button>
          </div>
          <Button onClick={loadData} className="bg-gradient-to-r from-blue-600 to-blue-700">
            <GitBranch className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="glass-effect border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search releases by name, description, or build details..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/50 border-slate-200"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 items-center">
                <Filter className="w-4 h-4 text-slate-500" />

                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-32 bg-white/70">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="building">Building</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.branch}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, branch: value }))}
                >
                  <SelectTrigger className="w-36 bg-white/70">
                    <SelectValue placeholder="Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {uniqueBranches.map(branch => (
                      <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.author}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, author: value }))}
                >
                  <SelectTrigger className="w-36 bg-white/70">
                    <SelectValue placeholder="Author" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Authors</SelectItem>
                    {uniqueAuthors.map(author => (
                      <SelectItem key={author} value={author}>{author}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(searchQuery || filters.status !== "all" || filters.branch !== "all" || filters.author !== "all") && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Results Summary */}
        {(filteredReleases.length !== releases.length || filteredUnreleasedBuilds.length !== unreleasedBuilds.length) && (
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">
              Filtered Results ({filteredReleases.length} releases, {filteredUnreleasedBuilds.length} unreleased builds)
            </h2>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid gap-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-500">Loading releases...</p>
            </div>
          ) : (
            <>
              {/* Releases */}
              {filteredReleases.map((release) => (
                <ReleaseCard
                  key={release.id}
                  release={release}
                  onMetricClick={handleReleaseMetricClick}
                />
              ))}
              
              {/* Unreleased Builds */}
              {filteredUnreleasedBuilds.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-4">Unreleased Builds</h2>
                  <div className="space-y-4">
                    {filteredUnreleasedBuilds.map((build) => (
                      <BuildCard
                        key={build.id}
                        build={build}
                        onMetricClick={handleMetricClick}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty States */}
          {!isLoading && filteredReleases.length === 0 && filteredUnreleasedBuilds.length === 0 && releases.length > 0 && (
            <Card className="glass-effect border-0 shadow-xl">
              <CardContent className="text-center py-12">
                <Search className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">No releases match your filters</h3>
                <p className="text-slate-500 mb-4">Try adjusting your search criteria or filters</p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}

          {!isLoading && releases.length === 0 && unreleasedBuilds.length === 0 && (
            <Card className="glass-effect border-0 shadow-xl">
              <CardContent className="text-center py-12">
                <Tag className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">No builds or releases found</h3>
                <p className="text-slate-500 mb-4">
                  {selectedRepo 
                    ? `No builds found for repository: ${selectedRepo}`
                    : "No builds found. Select a repository or sync builds from GitHub."
                  }
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={handleSync}
                    className="bg-gradient-to-r from-green-600 to-green-700"
                    disabled={!selectedRepo}
                  >
                    Sync Builds & Releases
                  </Button>
                  <Button 
                    onClick={loadData}
                    variant="outline"
                  >
                    Refresh Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Test Details Modal */}
        <BuildTestDetailsModal
          isOpen={isTestDetailsModalOpen}
          onClose={() => setIsTestDetailsModalOpen(false)}
          build={selectedBuild}
          metricType={selectedMetricType}
        />

        {/* Release Test Details Modal */}
        <TestDetailsModal
          isOpen={isReleaseTestDetailsModalOpen}
          onClose={() => setIsReleaseTestDetailsModalOpen(false)}
          release={selectedRelease}
          metricType={selectedReleaseMetricType}
        />
      </div>
    </div>
  );
}
