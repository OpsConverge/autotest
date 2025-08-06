import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Target,
  Zap
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const MetricCard = ({ title, value, change, icon: Icon, color, trend }) => (
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
      {change && (
        <div className="flex items-center gap-2">
          <Badge variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'} className="text-xs">
            {change}
          </Badge>
          <span className="text-xs text-slate-500">vs last week</span>
        </div>
      )}
    </CardContent>
  </Card>
);

export default function MetricsGrid({ metrics, isLoading }) {
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
        title="Total Tests"
        value={metrics.totalTests.toLocaleString()}
        change="+12%"
        trend="up"
        icon={Activity}
        color="bg-blue-500"
      />
      <MetricCard
        title="Success Rate"
        value={`${metrics.successRate}%`}
        change="+2.3%"
        trend="up"
        icon={CheckCircle2}
        color="bg-emerald-500"
      />
      <MetricCard
        title="Flaky Tests"
        value={metrics.flakyTests}
        change="-8%"
        trend="down"
        icon={AlertTriangle}
        color="bg-orange-500"
      />
      <MetricCard
        title="Coverage"
        value={`${metrics.avgCoverage}%`}
        change="+1.2%"
        trend="up"
        icon={Target}
        color="bg-purple-500"
      />
    </div>
  );
}