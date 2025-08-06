import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GitBranch, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Target,
  TestTube,
  Tag
} from "lucide-react";
import { format, isValid } from "date-fns";

export default function BuildCard({ build, onMetricClick, compact = false }) {
  console.log('BuildCard received build:', JSON.stringify(build, null, 2));
  
  const getStatusIcon = () => {
    switch (build.status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    switch (build.status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const successRate = build.totalTests > 0 
    ? ((build.passedTests / build.totalTests) * 100).toFixed(1) 
    : 0;

  // Get release information
  const releaseInfo = build.release ? (
    <div className="flex items-center space-x-1">
      <Tag className="w-4 h-4 text-blue-600" />
      <span className="text-blue-600 font-medium">{build.release.tagName}</span>
      {build.release.isPrerelease && (
        <Badge variant="secondary" className="text-xs ml-1">
          Pre-release
        </Badge>
      )}
    </div>
  ) : (
    <div className="flex items-center space-x-1">
      <span className="text-slate-500 text-sm">Commit: {build.commitHash?.substring(0, 8)}</span>
    </div>
  );

  if (compact) {
    return (
      <Card className="glass-effect border-0 shadow-sm bg-white/70">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div>
                <div className="font-semibold text-slate-800">{build.version}</div>
                <div className="text-sm text-slate-600">{build.commitMessage || 'No commit message'}</div>
                {releaseInfo}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge className={`${getStatusColor()} border text-xs`}>
                {build.status}
              </Badge>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-800">{successRate}%</div>
                <div className="text-xs text-slate-600">Success</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2 mt-3">
            <button
              className="text-center hover:bg-blue-50 p-2 rounded transition-colors cursor-pointer"
              onClick={() => onMetricClick?.(build, 'total')}
            >
              <div className="text-sm font-bold text-slate-800">{build.totalTests || 0}</div>
              <div className="text-xs text-slate-600">Total</div>
            </button>
            <button
              className="text-center hover:bg-green-50 p-2 rounded transition-colors cursor-pointer"
              onClick={() => onMetricClick?.(build, 'passed')}
            >
              <div className="text-sm font-bold text-green-600">{build.passedTests || 0}</div>
              <div className="text-xs text-slate-600">Passed</div>
            </button>
            <button
              className="text-center hover:bg-red-50 p-2 rounded transition-colors cursor-pointer"
              onClick={() => onMetricClick?.(build, 'failed')}
            >
              <div className="text-sm font-bold text-red-600">{build.failedTests || 0}</div>
              <div className="text-xs text-slate-600">Failed</div>
            </button>
            <button
              className="text-center hover:bg-blue-50 p-2 rounded transition-colors cursor-pointer"
              onClick={() => onMetricClick?.(build, 'coverage')}
            >
              <div className="text-sm font-bold text-blue-600">{build.coveragePercentage?.toFixed(1) || 0}%</div>
              <div className="text-xs text-slate-600">Coverage</div>
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {getStatusIcon()}
                <CardTitle className="text-xl font-bold">
                  {build.version}
                </CardTitle>
                <Badge className={`${getStatusColor()} border`}>
                  {build.status}
                </Badge>
              </div>
              <p className="text-slate-600 text-sm mb-2">
                {build.commitMessage || 'No commit message'}
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <GitBranch className="w-4 h-4" />
                  <span>{build.branch}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{build.author || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {isValid(new Date(build.createdAt))
                      ? format(new Date(build.createdAt), 'MMM d, HH:mm')
                      : 'Invalid date'}
                  </span>
                </div>
              </div>
              {/* Release Information */}
              <div className="mt-2">
                {releaseInfo}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
          <button
            className="text-center hover:bg-blue-50 p-3 rounded-lg transition-colors cursor-pointer group"
            onClick={() => onMetricClick?.(build, 'total')}
          >
            <div className="flex items-center justify-center mb-2">
              <TestTube className="w-5 h-5 text-blue-600 mr-2 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-slate-900">
                {build.totalTests || 0}
              </span>
            </div>
            <p className="text-sm text-slate-500">Total Tests</p>
          </button>
          
          <button
            className="text-center hover:bg-emerald-50 p-3 rounded-lg transition-colors cursor-pointer group"
            onClick={() => onMetricClick?.(build, 'passed')}
          >
            <div className="flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-emerald-600">
                {build.passedTests || 0}
              </span>
            </div>
            <p className="text-sm text-slate-500">Passed</p>
          </button>
          
          <button
            className="text-center hover:bg-red-50 p-3 rounded-lg transition-colors cursor-pointer group"
            onClick={() => onMetricClick?.(build, 'failed')}
          >
            <div className="flex items-center justify-center mb-2">
              <XCircle className="w-5 h-5 text-red-600 mr-2 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-red-600">
                {build.failedTests || 0}
              </span>
            </div>
            <p className="text-sm text-slate-500">Failed</p>
          </button>
          
          <button
            className="text-center hover:bg-blue-50 p-3 rounded-lg transition-colors cursor-pointer group"
            onClick={() => onMetricClick?.(build, 'coverage')}
          >
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-blue-600 mr-2 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-blue-600">
                {build.coveragePercentage?.toFixed(1) || 0}%
              </span>
            </div>
            <p className="text-sm text-slate-500">Coverage</p>
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-slate-800">{successRate}%</div>
              <div className="text-sm text-slate-600">Success Rate</div>
            </div>
            
            {build.flakyTests > 0 && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">{build.flakyTests} flaky tests</span>
              </div>
            )}
          </div>
          
          {build.buildDuration && (
            <div className="text-right">
              <div className="text-lg font-bold text-slate-800">{build.buildDuration.toFixed(1)}m</div>
              <div className="text-sm text-slate-600">Duration</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}