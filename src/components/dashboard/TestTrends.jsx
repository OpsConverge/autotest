import React from 'react';
import { safeFormat } from "@/utils/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from "lucide-react";
import { format, subDays } from 'date-fns';

export default function TestTrends({ testRuns, isLoading }) {
  const generateTrendData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayRuns = testRuns.filter(run => 
        safeFormat(run.created_date, 'yyyy-MM-dd') === safeFormat(date, 'yyyy-MM-dd')
      );
      
      return {
        date: format(date, 'MMM d'),
        passed: dayRuns.filter(run => run.status === 'passed').length,
        failed: dayRuns.filter(run => run.status === 'failed').length,
        flaky: dayRuns.filter(run => run.status === 'flaky').length,
        total: dayRuns.length
      };
    });
    
    return last7Days;
  };

  const trendData = generateTrendData();

  return (
    <Card className="glass-effect border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          Test Trends (7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
              <Legend />
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
  );
}