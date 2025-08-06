import React, { useState, useEffect } from "react";
import { TestRun, Build } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Calendar,
  Download,
  RefreshCw,
  RotateCcw
} from "lucide-react";
import { subDays } from 'date-fns';

import TestTrendsChart from "../components/analytics/TestTrendsChart";
import CoverageAnalysis from "../components/analytics/CoverageAnalysis";
import TestTypeDistribution from "../components/analytics/TestTypeDistribution";
import PerformanceMetrics from "../components/analytics/PerformanceMetrics";
import { useTeam } from "../context/TeamContext";

export default function Analytics() {
  const [testRuns, setTestRuns] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [activeView, setActiveView] = useState("trends");
  const [isReparsing, setIsReparsing] = useState(false);
  const { activeTeam } = useTeam();

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const [runsData, buildsData] = await Promise.all([
        TestRun.list("-created_date", 200),
        Build.list("-created_date", 50)
      ]);
      setTestRuns(runsData);
      setBuilds(buildsData);
    } catch (error) {
      console.error("Error loading analytics data:", error);
    }
    setIsLoading(false);
  };

  const filterDataByTimeRange = (data) => {
    const now = new Date();
    const daysDiff = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1y": 365
    };

    const daysBack = daysDiff[timeRange];
    if (!daysBack) return data;

    const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    return data.filter(item => new Date(item.created_date) >= cutoffDate);
  };

  const filteredTestRuns = filterDataByTimeRange(testRuns);
  const filteredBuilds = filterDataByTimeRange(builds);

  const handleBulkReparse = async () => {
    if (!activeTeam?.id) {
      alert('No active team found');
      return;
    }

    if (!confirm('This will re-parse all test results for your team. This may take several minutes. Continue?')) {
      return;
    }

    setIsReparsing(true);
    try {
      const result = await TestRun.bulkReparse();
      alert(`Successfully re-parsed ${result.processedBuilds} builds with ${result.updatedTestRuns} test runs updated.`);
      
      // Reload data to show the updated results
      await loadAnalyticsData();
      
    } catch (error) {
      console.error('Error during bulk re-parse:', error);
      alert('Failed to re-parse tests. Check console for details.');
    } finally {
      setIsReparsing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-emerald-800 bg-clip-text text-transparent">
              Analytics
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
              Deep insights into test performance and trends
            </p>
          </div>
          <div className="flex gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 glass-effect">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadAnalyticsData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={handleBulkReparse} disabled={isReparsing}>
              <RotateCcw className="w-4 h-4 mr-2" />
              {isReparsing ? 'Reparsing...' : 'Bulk Reparse'}
            </Button>
          </div>
        </div>

        {/* View Selector */}
        <Card className="glass-effect border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "trends", label: "Test Trends", icon: TrendingUp },
                { id: "coverage", label: "Coverage", icon: BarChart3 },
                { id: "distribution", label: "Test Types", icon: PieChart },
                { id: "performance", label: "Performance", icon: Calendar }
              ].map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant={activeView === id ? "default" : "outline"}
                  onClick={() => setActiveView(id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analytics Content */}
        <div className="space-y-8">
          {activeView === "trends" && (
            <TestTrendsChart testRuns={filteredTestRuns} isLoading={isLoading} />
          )}
          
          {activeView === "coverage" && (
            <CoverageAnalysis testRuns={filteredTestRuns} builds={filteredBuilds} isLoading={isLoading} />
          )}
          
          {activeView === "distribution" && (
            <TestTypeDistribution testRuns={filteredTestRuns} isLoading={isLoading} />
          )}
          
          {activeView === "performance" && (
            <PerformanceMetrics testRuns={filteredTestRuns} builds={filteredBuilds} isLoading={isLoading} />
          )}
        </div>
      </div>
    </div>
  );
}