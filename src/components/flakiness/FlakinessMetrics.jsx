import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertTriangle,
  Zap,
  TestTube,
  Percent
} from "lucide-react";

const MetricCard = ({ title, value, description, icon: Icon, color }) => (
  <Card className="glass-effect border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
    <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-5 rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500`} />
    <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
      <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
      <div className={`p-2 rounded-xl ${color} bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300`}>
        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
      </div>
    </CardHeader>
    <CardContent className="relative z-10">
      <div className="text-3xl font-bold text-slate-900 mb-2">{value}</div>
      <p className="text-xs text-slate-500">{description}</p>
    </CardContent>
  </Card>
);

export default function FlakinessMetrics({ testRuns, flakyTests, isLoading }) {
  const calculateMetrics = () => {
    if (isLoading) {
      return {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        flakyTests: 0,
        passRate: 0,
        failRate: 0,
        flakinessRate: 0,
        highestScore: 0,
        mostFrequent: 'N/A'
      };
    }

    // Calculate comprehensive test statistics
    const totalTests = testRuns.length;
    const passedTests = testRuns.filter(t => t.status === 'passed').length;
    const failedTests = testRuns.filter(t => t.status === 'failed').length;
    const flakyTestsCount = testRuns.filter(t => t.status === 'flaky').length;
    
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const failRate = totalTests > 0 ? (failedTests / totalTests) * 100 : 0;
    const flakinessRate = totalTests > 0 ? (flakyTestsCount / totalTests) * 100 : 0;

    // Calculate flakiness analysis metrics
    const totalFlaky = flakyTests.length;
    const highestScore = flakyTests.length > 0 ? Math.max(...flakyTests.map(t => t.flakinessScore)) : 0;
    
    // Find the most frequent flaky test (highest total runs)
    const mostFrequent = flakyTests.length > 0 
      ? flakyTests.reduce((max, test) => test.totalRuns > max.totalRuns ? test : max).testSuite 
      : 'N/A';
    
    return {
      totalTests,
      passedTests,
      failedTests,
      flakyTests: totalFlaky,
      passRate: passRate.toFixed(1),
      failRate: failRate.toFixed(1),
      flakinessRate: flakinessRate.toFixed(1),
      highestScore,
      mostFrequent
    };
  };

  const metrics = calculateMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="glass-effect border-0 shadow-xl">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Test Runs"
        value={metrics.totalTests}
        description="All test executions"
        icon={TestTube}
        color="bg-blue-500"
      />
      <MetricCard
        title="Failed Tests"
        value={metrics.failedTests}
        description={`${metrics.failRate}% failure rate`}
        icon={AlertTriangle}
        color="bg-red-500"
      />
      <MetricCard
        title="Passed Tests"
        value={metrics.passedTests}
        description={`${metrics.passRate}% pass rate`}
        icon={Zap}
        color="bg-green-500"
      />
      <MetricCard
        title="Flaky Test Suites"
        value={metrics.flakyTests}
        description={`${metrics.flakinessRate}% flakiness rate`}
        icon={Percent}
        color="bg-orange-500"
      />
    </div>
  );
}