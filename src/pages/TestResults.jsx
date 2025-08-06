
import React, { useState, useEffect } from "react";
import { TestRun, Release } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Download,
  Upload, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Code,
  ExternalLink,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";

import TestFilters from "../components/test-results/TestFilters";
import TestTable from "../components/test-results/TestTable";
import TestDetail from "../components/test-results/TestDetail";
import UploadTestResultsModal from "../components/test-results/UploadTestResultsModal";
import CodeViewer from "../components/test-results/CodeViewer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TestResults() {
  const [testRuns, setTestRuns] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [releases, setReleases] = useState([]);
  const [filters, setFilters] = useState({
    status: "all",
    testType: "all",
    framework: "all",
    environment: "all",
    dateRange: "7d",
    release: "all"
  });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false);
  const [codeViewerTest, setCodeViewerTest] = useState(null);

  useEffect(() => {
    loadTestRuns();
    loadReleases();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [testRuns, searchQuery, filters]);

  const loadReleases = async () => {
    try {
      const data = await Release.list();
      console.log('TestResults: Loaded releases:', data);
      console.log('TestResults: Number of releases:', data.length);
      setReleases(data);
    } catch (error) {
      console.error("Error loading releases:", error);
    }
  };

  const loadTestRuns = async () => {
    setIsLoading(true);
    try {
      // Load all test runs for the team instead of a specific build
      const data = await TestRun.list("-createdAt", 500);
      console.log('TestResults: Loaded test runs:', data);
      console.log('TestResults: Sample test run:', data[0]);
      console.log('TestResults: Sample test run build info:', data[0]?.build);
      console.log('TestResults: Sample test run buildId:', data[0]?.buildId);
      setTestRuns(data);
    } catch (error) {
      console.error("Error loading test runs:", error);
    }
    setIsLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...testRuns];
    console.log('TestResults: Applying filters to', filtered.length, 'test runs');

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(test => 
        test.testSuite?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.errorMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('TestResults: After search filter:', filtered.length);
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(test => test.status === filters.status);
      console.log('TestResults: After status filter:', filtered.length, 'for status:', filters.status);
    }

    // Test type filter
    if (filters.testType !== "all") {
      filtered = filtered.filter(test => test.testType === filters.testType);
      console.log('TestResults: After test type filter:', filtered.length, 'for type:', filters.testType);
    }

    // Framework filter
    if (filters.framework !== "all") {
      filtered = filtered.filter(test => test.framework === filters.framework);
      console.log('TestResults: After framework filter:', filtered.length, 'for framework:', filters.framework);
    }

    // Environment filter
    if (filters.environment !== "all") {
      filtered = filtered.filter(test => test.environment === filters.environment);
      console.log('TestResults: After environment filter:', filtered.length, 'for environment:', filters.environment);
    }

    // Release filter
    if (filters.release !== "all") {
      console.log('TestResults: Filtering by release:', filters.release);
      console.log('TestResults: Sample test run buildId:', filtered[0]?.buildId);
      console.log('TestResults: Sample test run build:', filtered[0]?.build);
      filtered = filtered.filter(test => {
        const testReleaseId = test.build?.releaseId?.toString() || test.buildId?.toString();
        const matches = testReleaseId === filters.release;
        console.log(`Test ${test.id}: buildId=${test.buildId}, build.releaseId=${test.build?.releaseId}, matches=${matches}`);
        return matches;
      });
      console.log('TestResults: After release filter:', filtered.length, 'for release:', filters.release);
    }

    // Date range filter
    const now = new Date();
    const daysDiff = {
      "1d": 1,
      "7d": 7,
      "30d": 30,
      "90d": 90
    };

    if (filters.dateRange !== "all") {
      const daysBack = daysDiff[filters.dateRange];
      if (daysBack) {
        const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
        filtered = filtered.filter(test => new Date(test.createdAt) >= cutoffDate);
        console.log('TestResults: After date filter:', filtered.length, 'for range:', filters.dateRange);
      }
    }

    console.log('TestResults: Final filtered results:', filtered.length);
    setFilteredTests(filtered);
  };

  const handleViewCode = (test) => {
    setCodeViewerTest(test);
    setIsCodeViewerOpen(true);
  };

  const calculateTestTypeStats = () => {
    if (filteredTests.length === 0) return {};
    
    const stats = {};
    filteredTests.forEach(test => {
      const testType = test.testType || 'unknown';
      if (!stats[testType]) {
        stats[testType] = { total: 0, passed: 0, failed: 0, flaky: 0 };
      }
      stats[testType].total++;
      if (test.status === 'passed') stats[testType].passed++;
      else if (test.status === 'failed') stats[testType].failed++;
      else if (test.status === 'flaky') stats[testType].flaky++;
    });
    
    return stats;
  };

  const testTypeStats = calculateTestTypeStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-emerald-800 bg-clip-text text-transparent">
              Test Results
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
              Detailed analysis of all test executions
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="hover:bg-slate-50" onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Results
            </Button>
            <Button variant="outline" className="hover:bg-slate-50">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={loadTestRuns} className="bg-gradient-to-r from-blue-600 to-blue-700">
              <Search className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="glass-effect border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search test suites, errors, or descriptions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/50 border-slate-200"
                  />
                </div>
              </div>
              <TestFilters filters={filters} onFiltersChange={setFilters} releases={releases} />
              {console.log('TestResults: Passing releases to TestFilters:', releases.length, releases)}
            </div>
            
            {/* Test Type Summary */}
            {Object.keys(testTypeStats).length > 0 && (
              <div className="mt-6">
                {filters.release !== "all" && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Release: {releases.find(r => r.id.toString() === filters.release)?.tagName || releases.find(r => r.id.toString() === filters.release)?.name || `Release ${filters.release}`}
                    </h3>
                    <p className="text-blue-700">
                      Showing {filteredTests.length} test runs for this release
                    </p>
                  </div>
                )}
                <h3 className="text-lg font-semibold mb-4">Test Type Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Object.entries(testTypeStats).map(([testType, stats]) => (
                    <Card key={testType} className="bg-slate-50/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium capitalize">{testType}</h4>
                          <Badge variant="outline">{stats.total} tests</Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-green-600">Passed:</span>
                            <span>{stats.passed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-600">Failed:</span>
                            <span>{stats.failed}</span>
                          </div>
                          {stats.flaky > 0 && (
                            <div className="flex justify-between">
                              <span className="text-yellow-600">Flaky:</span>
                              <span>{stats.flaky}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-1 border-t">
                            <span className="font-medium">Pass Rate:</span>
                            <span className="font-medium">
                              {stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <div className={`grid gap-8 ${selectedTest ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          <div>
            <TestTable 
              tests={filteredTests}
              isLoading={isLoading}
              onTestSelect={setSelectedTest}
              selectedTest={selectedTest}
              onViewCode={handleViewCode}
            />
          </div>
          
          {selectedTest && (
            <div>
              <TestDetail 
                test={selectedTest}
                onClose={() => setSelectedTest(null)}
              />
            </div>
          )}
        </div>
      </div>
      
      <UploadTestResultsModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      <CodeViewer
        test={codeViewerTest}
        isOpen={isCodeViewerOpen}
        onClose={() => setIsCodeViewerOpen(false)}
      />
    </div>
  );
}
