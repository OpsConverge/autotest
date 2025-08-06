import React from 'react';
import { safeFormat } from "@/utils/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, GitBranch, User, AlertCircle } from "lucide-react";
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";

const ActivityItem = ({ activity, type }) => {
  const getIcon = () => {
    if (type === 'test') {
      return activity.status === 'failed' ? AlertCircle : Clock;
    }
    return GitBranch;
  };

  const getStatusColor = () => {
    if (type === 'test') {
      switch (activity.status) {
        case 'passed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'failed': return 'bg-red-100 text-red-800 border-red-200';
        case 'flaky': return 'bg-orange-100 text-orange-800 border-orange-200';
        default: return 'bg-slate-100 text-slate-800 border-slate-200';
      }
    } else {
      switch (activity.status) {
        case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'failed': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-blue-100 text-blue-800 border-blue-200';
      }
    }
  };

  const Icon = getIcon();

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 transition-all duration-200 group">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-slate-900 truncate">
            {type === 'test' ? activity.test_suite : activity.version}
          </p>
          <Badge className={`${getStatusColor()} border text-xs`}>
            {activity.status}
          </Badge>
        </div>
        <p className="text-sm text-slate-600 mb-2">
          {type === 'test' 
            ? `${activity.test_type} test • ${activity.environment || 'staging'}`
            : `${activity.branch} • ${activity.author || 'Unknown'}`
          }
        </p>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>{safeFormat(activity.created_date)}</span>
          {type === 'test' && activity.duration && (
            <span>{activity.duration}ms</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default function RecentActivity({ testRuns, builds, isLoading }) {
  if (isLoading) {
    return (
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Clock className="w-6 h-6 text-blue-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Combine and sort activities
  const allActivity = [
    ...testRuns.slice(0, 10).map(run => ({ ...run, type: 'test' })),
    ...builds.slice(0, 5).map(build => ({ ...build, type: 'build' }))
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 8);

  return (
    <Card className="glass-effect border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Clock className="w-6 h-6 text-blue-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allActivity.map((activity, index) => (
            <ActivityItem 
              key={`${activity.type}-${activity.id}-${index}`} 
              activity={activity} 
              type={activity.type} 
            />
          ))}
          {allActivity.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}