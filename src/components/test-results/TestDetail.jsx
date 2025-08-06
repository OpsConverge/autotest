import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Code, AlertCircle, Clock, GitBranch, Sparkles } from "lucide-react";
import { format } from "date-fns";

export default function TestDetail({ test, onClose }) {
  if (!test) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'flaky': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <Card className="glass-effect border-0 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Test Details</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-500 mb-1">Test Suite</p>
            <p className="font-semibold text-slate-900">{test.test_suite}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Status</p>
            <Badge className={`${getStatusColor(test.status)} border`}>
              {test.status}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Type</p>
            <p className="font-medium text-slate-900 capitalize">{test.test_type}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Duration</p>
            <p className="font-medium text-slate-900">
              {test.duration ? `${test.duration}ms` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Environment</p>
            <p className="font-medium text-slate-900 capitalize">
              {test.environment || 'staging'}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Coverage</p>
            <p className="font-medium text-slate-900">
              {test.coverage_percentage ? `${test.coverage_percentage}%` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Flaky Score */}
        {test.flaky_score && test.flaky_score > 30 && (
          <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <p className="font-semibold text-orange-900">Flaky Test Alert</p>
            </div>
            <p className="text-sm text-orange-800">
              This test has a flakiness score of {test.flaky_score}%. Consider reviewing for stability issues.
            </p>
          </div>
        )}

        {/* Error Message */}
        {test.error_message && (
          <div>
            <p className="text-sm text-slate-500 mb-2 flex items-center gap-2">
              <Code className="w-4 h-4" />
              Error Message
            </p>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <pre className="text-sm text-red-800 whitespace-pre-wrap font-mono">
                {test.error_message}
              </pre>
            </div>
          </div>
        )}

        {/* Stack Trace */}
        {test.stack_trace && (
          <div>
            <p className="text-sm text-slate-500 mb-2">Stack Trace</p>
            <div className="max-h-64 overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">
                {test.stack_trace}
              </pre>
            </div>
          </div>
        )}

        {/* AI Analysis */}
        {test.ai_analysis && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <p className="font-semibold text-blue-900">AI Analysis</p>
              {test.ai_analysis.confidence_score && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {test.ai_analysis.confidence_score}% confidence
                </Badge>
              )}
            </div>
            {test.ai_analysis.root_cause && (
              <div className="mb-3">
                <p className="text-sm font-medium text-blue-900 mb-1">Root Cause:</p>
                <p className="text-sm text-blue-800">{test.ai_analysis.root_cause}</p>
              </div>
            )}
            {test.ai_analysis.suggested_fix && (
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Suggested Fix:</p>
                <p className="text-sm text-blue-800">{test.ai_analysis.suggested_fix}</p>
              </div>
            )}
          </div>
        )}

        {/* Meta Info */}
        <div className="pt-4 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Executed {format(new Date(test.created_date), 'MMM d, yyyy HH:mm')}</span>
            </div>
            {test.branch && (
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                <span>{test.branch}</span>
              </div>
            )}
            {test.build_id && (
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span>Build: {test.build_id}</span>
              </div>
            )}
            <div>
              <span>Trigger: {test.execution_trigger || 'manual'}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1">
            <Code className="w-4 h-4 mr-2" />
            View Code
          </Button>
          <Button variant="outline" className="flex-1">
            <Sparkles className="w-4 h-4 mr-2" />
            Re-analyze
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}