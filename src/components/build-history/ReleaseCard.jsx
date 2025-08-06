import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, GitBranch, Calendar, Tag, CheckCircle2, XCircle, Clock, User, Target, TestTube, AlertTriangle } from 'lucide-react';
import { format, isValid } from 'date-fns';
import BuildCard from './BuildCard';

export default function ReleaseCard({ release, onMetricClick }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Use test statistics from release object (now calculated on backend)
  const totalTests = release.totalTests || 0;
  const passedTests = release.passedTests || 0;
  const failedTests = release.failedTests || 0;
  const flakyTests = release.flakyTests || 0;
  const avgCoverage = release.coveragePercentage || 0;

  const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

  // Get status icon and color based on overall release health
  const getStatusIcon = () => {
    if (failedTests > 0) return <XCircle className="w-5 h-5 text-red-600" />;
    if (passedTests > 0) return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    return <Clock className="w-5 h-5 text-blue-600" />;
  };

  const getStatusColor = () => {
    if (failedTests > 0) return 'bg-red-100 text-red-800 border-red-200';
    if (passedTests > 0) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getStatusText = () => {
    if (failedTests > 0) return 'failed';
    if (passedTests > 0) return 'completed';
    return 'pending';
  };

  return (
    <Card className="glass-effect border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {getStatusIcon()}
                <CardTitle className="text-xl font-bold">
                  {release.name || release.tagName}
                </CardTitle>
                <Badge className={`${getStatusColor()} border`}>
                  {getStatusText()}
                </Badge>
                {release.isPrerelease && (
                  <Badge variant="secondary" className="text-xs">
                    Pre-release
                  </Badge>
                )}
              </div>
              <p className="text-slate-600 text-sm mb-2">
                {release.description || 'No release description'}
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  <span>{release.tagName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <GitBranch className="w-4 h-4" />
                  <span>{release.builds?.[0]?.branch || 'main'}</span>
                </div>
                {release.publishedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {isValid(new Date(release.publishedAt))
                        ? format(new Date(release.publishedAt), 'MMM d, yyyy')
                        : 'Invalid date'}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span>{release.builds?.length || 0} builds</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
          <button
            className="text-center hover:bg-blue-50 p-3 rounded-lg transition-colors cursor-pointer group"
            onClick={() => onMetricClick?.(release, 'total')}
          >
            <div className="flex items-center justify-center mb-2">
              <TestTube className="w-5 h-5 text-blue-600 mr-2 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-slate-900">
                {totalTests}
              </span>
            </div>
            <p className="text-sm text-slate-500">Total Tests</p>
          </button>
          
          <button
            className="text-center hover:bg-emerald-50 p-3 rounded-lg transition-colors cursor-pointer group"
            onClick={() => onMetricClick?.(release, 'passed')}
          >
            <div className="flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-emerald-600">
                {passedTests}
              </span>
            </div>
            <p className="text-sm text-slate-500">Passed</p>
          </button>
          
          <button
            className="text-center hover:bg-red-50 p-3 rounded-lg transition-colors cursor-pointer group"
            onClick={() => onMetricClick?.(release, 'failed')}
          >
            <div className="flex items-center justify-center mb-2">
              <XCircle className="w-5 h-5 text-red-600 mr-2 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-red-600">
                {failedTests}
              </span>
            </div>
            <p className="text-sm text-slate-500">Failed</p>
          </button>
          
          <button
            className="text-center hover:bg-blue-50 p-3 rounded-lg transition-colors cursor-pointer group"
            onClick={() => onMetricClick?.(release, 'coverage')}
          >
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-blue-600 mr-2 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-blue-600">
                {avgCoverage.toFixed(1)}%
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
            
            {flakyTests > 0 && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">{flakyTests} flaky tests</span>
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-600 hover:text-slate-800"
          >
            {isExpanded ? (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Hide Builds
              </>
            ) : (
              <>
                <ChevronRight className="w-4 h-4 mr-2" />
                View Builds ({release.builds?.length || 0})
              </>
            )}
          </Button>
        </div>

        {/* Expanded Builds */}
        {isExpanded && release.builds && release.builds.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-4">
              Builds in this release ({release.builds.length})
            </h4>
            <div className="space-y-4">
              {release.builds.map((build) => (
                <BuildCard
                  key={build.id}
                  build={build}
                  onMetricClick={onMetricClick}
                  compact={true}
                />
              ))}
            </div>
          </div>
        )}

        {isExpanded && (!release.builds || release.builds.length === 0) && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-center text-slate-500 text-sm py-4">
              No builds associated with this release yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 