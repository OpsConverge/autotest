import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp } from "lucide-react";
import { format, subDays, eachDayOfInterval } from 'date-fns';

export default function FlakinessTrendChart({ testRuns, isLoading }) {
  const generateChartData = () => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    return last30Days.map(date => {
      const dayTests = testRuns.filter(test => 
        format(new Date(test.createdAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      return {
        date: format(date, 'MMM d'),
        flaky: dayTests.filter(test => test.status === 'flaky').length,
      };
    });
  };

  const chartData = generateChartData();

  if (isLoading) {
    return (
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-600" />
            Flakiness Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-orange-600" />
          Flakiness Trend
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
                dataKey="flaky" 
                stroke="#f97316" 
                strokeWidth={3}
                dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                name="Flaky Tests"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}