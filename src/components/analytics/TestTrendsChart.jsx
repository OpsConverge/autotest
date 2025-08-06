import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp, Calendar } from "lucide-react";
import { format, subDays, eachDayOfInterval } from 'date-fns';

export default function TestTrendsChart({ testRuns, isLoading }) {
  const generateChartData = () => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    return last30Days.map(date => {
      const dayTests = testRuns.filter(test => 
        format(new Date(test.created_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );

      const passed = dayTests.filter(test => test.status === 'passed').length;
      const failed = dayTests.filter(test => test.status === 'failed').length;
      const flaky = dayTests.filter(test => test.status === 'flaky').length;
      const total = dayTests.length;
      const successRate = total > 0 ? (passed / total) * 100 : 0;

      return {
        date: format(date, 'MMM d'),
        fullDate: format(date, 'yyyy-MM-dd'),
        passed,
        failed,
        flaky,
        total,
        successRate: Math.round(successRate * 100) / 100
      };
    });
  };

  const chartData = generateChartData();

  if (isLoading) {
    return (
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Test Trends Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-4 gap-8">
      {/* Main Chart */}
      <div className="lg:col-span-3">
        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Test Trends Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelStyle={{ color: '#1e293b' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      backdropFilter: 'blur(8px)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    name="Total Tests"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="passed" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    name="Passed"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="failed" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    name="Failed"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="flaky" 
                    stroke="#f97316" 
                    strokeWidth={3}
                    dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                    name="Flaky"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Rate Trend */}
      <div>
        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Success Rate Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    tick={{ fontSize: 10 }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Success Rate']}
                    labelStyle={{ color: '#1e293b' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="successRate" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}