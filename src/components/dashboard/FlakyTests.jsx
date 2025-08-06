import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FlakyTests({ testRuns, isLoading }) {
  if (isLoading) {
    return (
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Flaky Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="p-3">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const flakyTests = testRuns
    .filter(test => test.status === 'flaky' || (test.flaky_score && test.flaky_score > 50))
    .sort((a, b) => (b.flaky_score || 0) - (a.flaky_score || 0))
    .slice(0, 5);

  return (
    <Card className="glass-effect border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Flaky Tests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {flakyTests.map((test) => (
            <div key={test.id} className="p-3 rounded-lg bg-orange-50/50 border border-orange-200/50 hover:bg-orange-100/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <p className="font-medium text-slate-900 text-sm truncate pr-2">
                  {test.test_suite}
                </p>
                <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs flex-shrink-0">
                  {test.flaky_score || 75}% flaky
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                {test.test_type} • {test.environment || 'staging'}
              </p>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <ExternalLink className="w-3 h-3 mr-1" />
                Analyze
              </Button>
            </div>
          ))}
          {flakyTests.length === 0 && (
            <div className="text-center py-6 text-slate-500">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No flaky tests detected</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}