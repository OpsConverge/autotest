import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Target, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format, subDays, eachDayOfInterval } from 'date-fns';

export default function CoverageAnalysis({ testRuns, builds, isLoading }) {
  const generateCoverageData = () => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    return last30Days.map(date => {
      const dayBuilds = builds.filter(build => 
        format(new Date(build.created_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      const avgCoverage = dayBuilds.length > 0 
        ? dayBuilds.reduce((sum, build) => sum + (build.coverage_percentage || 0), 0) / dayBuilds.length
        : 0;

      return {
        date: format(date, 'MMM d'),
        coverage: Math.round(avgCoverage * 100) / 100
      };
    });
  };

  const getCoverageStats = () => {
    const recentBuilds = builds.slice(0, 10);
    const currentCoverage = recentBuilds.length > 0 
      ? recentBuilds.reduce((sum, build) => sum + (build.coverage_percentage || 0), 0) / recentBuilds.length
      : 0;

    const olderBuilds = builds.slice(10, 20);
    const previousCoverage = olderBuilds.length > 0 
      ? olderBuilds.reduce((sum, build) => sum + (build.coverage_percentage || 0), 0) / olderBuilds.length
      : 0;

    const trend = currentCoverage - previousCoverage;

    return {
      current: Math.round(currentCoverage * 100) / 100,
      trend: Math.round(trend * 100) / 100,
      isImproving: trend > 0,
      isStable: Math.abs(trend) < 0.5
    };
  };

  const coverageData = generateCoverageData();
  const stats = getCoverageStats();

  if (isLoading) {
    return (
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-600" />
            Coverage Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-4 gap-8">
      {/* Coverage Chart */}
      <div className="lg:col-span-3">
        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-600" />
              Code Coverage Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={coverageData}>
                  <defs>
                    <linearGradient id="coverageGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    tick={{ fontSize: 12 }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Coverage']}
                    labelStyle={{ color: '#1e293b' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="coverage" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    fill="url(#coverageGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coverage Stats */}
      <div className="space-y-6">
        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Current Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {stats.current}%
              </div>
              <div className="flex items-center justify-center gap-2">
                {stats.isStable ? (
                  <>
                    <Minus className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">Stable</span>
                  </>
                ) : stats.isImproving ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-emerald-600">+{stats.trend}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-600">{stats.trend}%</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Coverage Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Unit Tests</span>
                <Badge 
                  className={stats.current >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}
                >
                  {stats.current >= 80 ? 'Met' : 'Below Target'}
                </Badge>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats.current, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Target: 80%</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Integration</span>
                <Badge 
                  className={stats.current >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}
                >
                  {stats.current >= 70 ? 'Met' : 'Below Target'}
                </Badge>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats.current * 0.85, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Target: 70%</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}