import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TestRun } from "@/api/entities";
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Target,
  Sparkles
} from "lucide-react";

export default function InsightCards() {
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateInsights();
  }, []);

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const recentTests = await TestRun.listByBuild(build.id);
      
      const totalTests = recentTests.length;
      const passedTests = recentTests.filter(test => test.status === 'passed').length;
      const flakyTests = recentTests.filter(test => test.status === 'flaky').length;
      const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
      
      const generatedInsights = [
        {
          id: 1,
          title: "Test Stability",
          value: `${successRate.toFixed(1)}%`,
          description: successRate > 90 ? "Excellent stability" : successRate > 80 ? "Good stability" : "Needs improvement",
          type: successRate > 90 ? "success" : successRate > 80 ? "warning" : "error",
          icon: successRate > 90 ? CheckCircle2 : successRate > 80 ? TrendingUp : AlertTriangle
        },
        {
          id: 2,
          title: "Flaky Test Alert",
          value: flakyTests.toString(),
          description: flakyTests > 5 ? "High flakiness detected" : flakyTests > 0 ? "Some flaky tests found" : "No flaky tests",
          type: flakyTests > 5 ? "error" : flakyTests > 0 ? "warning" : "success",
          icon: AlertTriangle
        },
        {
          id: 3,
          title: "AI Recommendation",
          value: "Focus Area",
          description: flakyTests > 5 ? "Stabilize flaky tests" : successRate < 80 ? "Improve failing tests" : "Optimize performance",
          type: "info",
          icon: Sparkles
        }
      ];

      setInsights(generatedInsights);
    } catch (error) {
      console.error('Error generating insights:', error);
    }
    setIsLoading(false);
  };

  const getCardStyle = (type) => {
    switch (type) {
      case 'success': return 'border-emerald-200 bg-emerald-50/50';
      case 'warning': return 'border-orange-200 bg-orange-50/50';
      case 'error': return 'border-red-200 bg-red-50/50';
      default: return 'border-blue-200 bg-blue-50/50';
    }
  };

  const getIconStyle = (type) => {
    switch (type) {
      case 'success': return 'text-emerald-600 bg-emerald-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array(3).fill(0).map((_, i) => (
          <Card key={i} className="glass-effect border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {insights.map((insight) => (
        <Card key={insight.id} className={`border-0 shadow-xl transition-all duration-300 hover:shadow-2xl ${getCardStyle(insight.type)}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg ${getIconStyle(insight.type)}`}>
                <insight.icon className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="text-xs">
                AI Insight
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                {insight.title}
              </p>
              <p className="text-2xl font-bold text-slate-900 mb-2">
                {insight.value}
              </p>
              <p className="text-sm text-slate-600">
                {insight.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}