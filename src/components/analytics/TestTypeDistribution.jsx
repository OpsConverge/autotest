import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TestTube, Code } from 'lucide-react';

export default function TestTypeDistribution({ testRuns, isLoading }) {
  const calculateTestTypeDistribution = () => {
    if (isLoading || !testRuns || testRuns.length === 0) {
      return [];
    }

    const typeCounts = {};
    const frameworkCounts = {};

    testRuns.forEach(test => {
      // Count by test type
      const testType = test.testType || 'unknown';
      typeCounts[testType] = (typeCounts[testType] || 0) + 1;
      
      // Count by framework
      const framework = test.framework || 'unknown';
      frameworkCounts[framework] = (frameworkCounts[framework] || 0) + 1;
    });

    const typeData = Object.entries(typeCounts).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      type: 'testType'
    }));

    const frameworkData = Object.entries(frameworkCounts).map(([framework, count]) => ({
      name: framework.charAt(0).toUpperCase() + framework.slice(1),
      value: count,
      type: 'framework'
    }));

    return { typeData, frameworkData };
  };

  const { typeData, frameworkData } = calculateTestTypeDistribution();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5 text-blue-600" />
              Test Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-green-600" />
              Framework Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Test Type Distribution */}
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-blue-600" />
            Test Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              No test type data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Framework Distribution */}
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-green-600" />
            Framework Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {frameworkData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={frameworkData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {frameworkData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              No framework data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}