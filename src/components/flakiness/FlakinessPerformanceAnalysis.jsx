import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Target
} from "lucide-react";

export default function FlakinessPerformanceAnalysis({ flakyTests, summary }) {
  const analyzeDetectionMethods = () => {
    const methodCounts = {};
    const methodEffectiveness = {};
    
    flakyTests.forEach(test => {
      test.detectionMethods?.forEach(method => {
        methodCounts[method] = (methodCounts[method] || 0) + 1;
        
        if (!methodEffectiveness[method]) {
          methodEffectiveness[method] = {
            total: 0,
            highScore: 0,
            avgScore: 0
          };
        }
        
        methodEffectiveness[method].total++;
        methodEffectiveness[method].highScore = Math.max(methodEffectiveness[method].highScore, test.flakinessScore);
        methodEffectiveness[method].avgScore += test.flakinessScore;
      });
    });
    
    // Calculate averages
    Object.keys(methodEffectiveness).forEach(method => {
      methodEffectiveness[method].avgScore = Math.round(methodEffectiveness[method].avgScore / methodEffectiveness[method].total);
    });
    
    return { methodCounts, methodEffectiveness };
  };
  
  const { methodCounts, methodEffectiveness } = analyzeDetectionMethods();
  
  const getMethodDisplayName = (method) => {
    const names = {
      'inconsistent_results': 'Inconsistent Results',
      'explicit_flaky_status': 'Explicit Flaky Status',
      'intermittent_pattern': 'Intermittent Pattern',
      'low_pass_rate': 'Low Pass Rate',
      'unstable_trend': 'Unstable Trend',
      'build_inconsistency': 'Build Inconsistency'
    };
    return names[method] || method;
  };
  
  const getMethodIcon = (method) => {
    const icons = {
      'inconsistent_results': <XCircle className="w-4 h-4" />,
      'explicit_flaky_status': <AlertTriangle className="w-4 h-4" />,
      'intermittent_pattern': <TrendingUp className="w-4 h-4" />,
      'low_pass_rate': <BarChart3 className="w-4 h-4" />,
      'unstable_trend': <TrendingUp className="w-4 h-4" />,
      'build_inconsistency': <Target className="w-4 h-4" />
    };
    return icons[method] || <CheckCircle className="w-4 h-4" />;
  };
  
  const getMethodColor = (method) => {
    const colors = {
      'inconsistent_results': 'bg-red-100 text-red-800 border-red-200',
      'explicit_flaky_status': 'bg-orange-100 text-orange-800 border-orange-200',
      'intermittent_pattern': 'bg-purple-100 text-purple-800 border-purple-200',
      'low_pass_rate': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'unstable_trend': 'bg-blue-100 text-blue-800 border-blue-200',
      'build_inconsistency': 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return colors[method] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card className="glass-effect border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Detection Performance Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summary?.totalTests || 0}</div>
            <div className="text-sm text-blue-700">Total Tests Analyzed</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{summary?.flakyTests || 0}</div>
            <div className="text-sm text-orange-700">Flaky Tests Detected</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summary?.flakinessRate || 0}%</div>
            <div className="text-sm text-green-700">Flakiness Rate</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{summary?.averageFlakinessScore || 0}</div>
            <div className="text-sm text-purple-700">Avg Flakiness Score</div>
          </div>
        </div>
        
        {/* Detection Methods Performance */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-3">Detection Methods Performance</h4>
          <div className="space-y-3">
            {Object.entries(methodCounts).map(([method, count]) => {
              const effectiveness = methodEffectiveness[method];
              return (
                <div key={method} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getMethodColor(method)}`}>
                      {getMethodIcon(method)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">
                        {getMethodDisplayName(method)}
                      </div>
                      <div className="text-sm text-slate-600">
                        Detected {count} flaky tests
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900">
                      Avg Score: {effectiveness?.avgScore || 0}%
                    </div>
                    <div className="text-xs text-slate-600">
                      Max: {effectiveness?.highScore || 0}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <h5 className="font-semibold text-slate-800 mb-2">Detection Criteria Met</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>✅ Same Test, Multiple Runs:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {summary?.totalTests || 0} tests
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>✅ Inconsistent Results:</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {methodCounts['inconsistent_results'] || 0} detected
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>✅ Pattern Recognition:</span>
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  {methodCounts['intermittent_pattern'] || 0} detected
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 rounded-lg">
            <h5 className="font-semibold text-slate-800 mb-2">Analysis Quality</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Minimum Runs Required:</span>
                <Badge variant="outline">{summary?.minRuns || 3}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Flakiness Threshold:</span>
                <Badge variant="outline">{(summary?.flakinessThreshold || 0.3) * 100}%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Time Range Analyzed:</span>
                <Badge variant="outline">{summary?.timeRange || '30d'}</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 