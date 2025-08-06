import React, { useState, useEffect } from "react";
import { TestRun, Build } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  GitBranch,
  Play,
  Calendar,
  User as UserIcon
} from "lucide-react";
import { format, isValid } from "date-fns";

import MetricsGrid from "../components/dashboard/MetricsGrid";
import RecentActivity from "../components/dashboard/RecentActivity";
import TestTrends from "../components/dashboard/TestTrends";
import FlakyTests from "../components/dashboard/FlakyTests";
import QuickActions from "../components/dashboard/QuickActions";
import LogoutButton from '../components/LogoutButton';
import { useTeam } from '../context/TeamContext';

export default function Dashboard() {
  const [testRuns, setTestRuns] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { activeTeam } = useTeam();
  const userEmail = localStorage.getItem('user');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch latest builds
      const buildsData = await Build.list();
      setBuilds(buildsData);
      let runsData = [];
      if (buildsData && buildsData.length > 0) {
        // Fetch test runs for the latest build
        const latestBuildId = buildsData[0].id;
        runsData = await TestRun.listByBuild(latestBuildId);
      }
      setTestRuns(runsData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    setIsLoading(false);
  };

  const calculateMetrics = () => {
    const totalTests = testRuns.length;
    const passedTests = testRuns.filter(test => test.status === 'passed').length;
    const failedTests = testRuns.filter(test => test.status === 'failed').length;
    const flakyTests = testRuns.filter(test => test.status === 'flaky').length;
    
    const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
    const avgCoverage = testRuns.length > 0 
      ? (testRuns.reduce((sum, test) => sum + (test.coverage_percentage || 0), 0) / testRuns.length).toFixed(1)
      : 0;

    return {
      totalTests,
      passedTests,
      failedTests,
      flakyTests,
      successRate,
      avgCoverage
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-emerald-800 bg-clip-text text-transparent">
              Test Dashboard
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
              Comprehensive overview of your test automation pipeline
            </p>
            <div className="flex items-center mt-4 text-sm text-slate-600">
              <UserIcon className="w-4 h-4 mr-1" />
              User: <span className="font-medium">{userEmail}</span>
              {activeTeam && (
                <>
                  {' '}| Team: <span className="font-medium">{activeTeam.name}</span>
                </>
              )}
            </div>
          </div>
          <QuickActions onRefresh={loadDashboardData} />
        </div>

        {/* Metrics Grid */}
        <MetricsGrid metrics={metrics} isLoading={isLoading} />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            <TestTrends testRuns={testRuns} isLoading={isLoading} />
            <RecentActivity testRuns={testRuns} builds={builds} isLoading={isLoading} />
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-8">
            <FlakyTests testRuns={testRuns} isLoading={isLoading} />
            
            {/* Build Status Card */}
            <Card className="glass-effect border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GitBranch className="w-5 h-5 text-blue-600" />
                  Latest Builds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {builds.slice(0, 5).map((build) => (
                    <div key={build.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {build.version}
                        </p>
                        <p className="text-sm text-slate-500 truncate">
                          {build.branch} • {isValid(new Date(build.created_date)) 
                            ? format(new Date(build.created_date), 'MMM d, HH:mm') 
                            : 'Invalid date'}
                        </p>
                      </div>
                      <Badge 
                        variant={build.status === 'completed' ? 'default' : build.status === 'failed' ? 'destructive' : 'secondary'}
                        className="ml-2"
                      >
                        {build.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <LogoutButton />
    </div>
  );
}