import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  CheckCircle2,
  XCircle,
  Target,
  Clock
} from "lucide-react";

const ComparisonMetric = ({ label, value1, value2, unit = '', type = 'number' }) => {
  const getDifference = () => {
    if (type === 'percentage') {
      return value2 - value1;
    }
    return value2 - value1;
  };

  const difference = getDifference();
  const isPositive = difference > 0;
  const isNeutral = difference === 0;

  const getIcon = () => {
    if (isNeutral) return <Minus className="w-4 h-4 text-slate-500" />;
    return isPositive ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getColor = () => {
    if (isNeutral) return 'text-slate-600';
    // For some metrics, positive change might be bad (like failed tests)
    if (label.includes('Failed') || label.includes('Flaky')) {
      return isPositive ? 'text-red-600' : 'text-emerald-600';
    }
    return isPositive ? 'text-emerald-600' : 'text-red-600';
  };

  return (
    <div className="p-4 rounded-lg bg-slate-50/50 border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <div className="flex items-center gap-1">
          {getIcon()}
          <span className={`text-sm font-medium ${getColor()}`}>
            {isNeutral ? '0' : (isPositive ? '+' : '')}{difference}{unit}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-slate-900">{value1}{unit}</span>
        <span className="text-slate-400">→</span>
        <span className="text-lg font-bold text-slate-900">{value2}{unit}</span>
      </div>
    </div>
  );
};

export default function BuildComparison({ builds }) {
  const [build1, build2] = builds;

  return (
    <Card className="glass-effect border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl">Build Comparison</CardTitle>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>{build1.version} ({build1.branch})</span>
          </div>
          <span>vs</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span>{build2.version} ({build2.branch})</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ComparisonMetric
            label="Total Tests"
            value1={build1.totalTests || 0}
            value2={build2.totalTests || 0}
          />
          <ComparisonMetric
            label="Passed Tests"
            value1={build1.passedTests || 0}
            value2={build2.passedTests || 0}
          />
          <ComparisonMetric
            label="Failed Tests"
            value1={build1.failedTests || 0}
            value2={build2.failedTests || 0}
          />
          <ComparisonMetric
            label="Coverage"
            value1={build1.coveragePercentage || 0}
            value2={build2.coveragePercentage || 0}
            unit="%"
            type="percentage"
          />
          <ComparisonMetric
            label="Flaky Tests"
            value1={build1.flakyTests || 0}
            value2={build2.flakyTests || 0}
          />
          <ComparisonMetric
            label="Build Duration"
            value1={build1.buildDuration || 0}
            value2={build2.buildDuration || 0}
            unit=" min"
          />
        </div>

        {/* Success Rate Comparison */}
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-4">Success Rate Comparison</h4>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">{build1.version}</span>
                <span className="font-medium">
                  {build1.total_tests > 0 ? ((build1.passed_tests / build1.total_tests) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${build1.total_tests > 0 ? (build1.passed_tests / build1.total_tests) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">{build2.version}</span>
                <span className="font-medium">
                  {build2.total_tests > 0 ? ((build2.passed_tests / build2.total_tests) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${build2.total_tests > 0 ? (build2.passed_tests / build2.total_tests) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}