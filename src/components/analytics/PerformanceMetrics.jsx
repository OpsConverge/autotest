import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts';
import { Zap, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { format, subDays, eachDayOfInterval } from 'date-fns';

export default function PerformanceMetrics({ testRuns, builds, isLoading }) {
  const generatePerformanceData = () => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    return last30Days.map(date => {
      const dayTests = testRuns.filter(test => 
        format(new Date(test.created_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      const dayBuilds = builds.filter(build => 
        format(new Date(build.created_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );

      const avgTestDuration = dayTests.length > 0 
        ? dayTests.reduce((sum, test) => sum + (test.duration || 0), 0) / dayTests.length
        : 0;

      const avgBuildDuration = dayBuilds.length > 0 
        ? dayBuilds.reduce((sum, build) => sum + (build.build_duration || 0), 0) / dayBuilds.length
        : 0;

      return {
        date: format(date, 'MMM d'),
        testDuration: Math.round(avgTestDuration),
        buildDuration: Math.round(avgBuildDuration * 60), // Convert to seconds
        testCount: dayTests.length
      };
    });
  };

  const getSlowTests = () => {
    return testRuns
      .filter(test => test.duration && test.duration > 5000) // Tests slower than 5 seconds
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);
  };

  const getPerformanceStats = () => {
    const recentTests = testRuns.slice(0, 100);
    const avgDuration = recentTests.length > 0 
      ? recentTests.reduce((sum, test) => sum + (test.duration || 0), 0) / recentTests.length
      : 0;

    const recentBuilds = builds.slice(0, 10);
    const avgBuildTime = recentBuilds.length > 0 
      ? recentBuilds.reduce((sum, build) => sum + (build.build_duration || 0), 0) / recentBuilds.length
      : 0;

    return {
      avgTestDuration: Math.round(avgDuration),
      avgBuildTime: Math.round(avgBuildTime),
      slowTestCount: getSlowTests().length,
      totalTestsToday: testRuns.filter(test => 
        format(new Date(test.created_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      ).length
    };
  };

  const performanceData = generatePerformanceData();
  const slowTests = getSlowTests();
  const stats = getPerformanceStats();

  if (isLoading) {
    return (
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-600" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Performance Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-effect border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Avg Test Duration</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.avgTestDuration}ms
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Zap className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Avg Build Time</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.avgBuildTime}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Slow Tests</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.slowTestCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tests Today</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.totalTestsToday}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              Test Duration Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => [`${value}ms`, 'Avg Duration']}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="testDuration" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              Slowest Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {slowTests.map((test, index) => (
                <div key={test.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {test.test_suite}
                    </p>
                    <p className="text-sm text-slate-600">
                      {test.test_type} • {test.environment || 'staging'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-200">
                      {test.duration}ms
                    </Badge>
                    <div className="text-sm text-slate-500">
                      #{index + 1}
                    </div>
                  </div>
                </div>
              ))}
              {slowTests.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No slow tests detected</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}