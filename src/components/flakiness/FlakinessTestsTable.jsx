
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, BarChart2, TestTube } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function FlakyTestsTable({ flakyTests, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div>
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50">
            <TableHead>Test Suite</TableHead>
            <TableHead>Environment</TableHead>
            <TableHead>Flakiness Score</TableHead>
            <TableHead>Pattern Analysis</TableHead>
            <TableHead>Pass Rate</TableHead>
            <TableHead>Fail Rate</TableHead>
            <TableHead>Total Runs</TableHead>
            <TableHead>Last Run</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flakyTests.map((test) => (
            <TableRow key={test.id} className="hover:bg-slate-50/50 transition-colors">
              <TableCell>
                <p className="font-medium text-slate-900">{test.testSuite}</p>
                <p className="text-xs text-slate-500 capitalize">{test.testType} test</p>
                {test.flakinessReason && (
                  <Badge variant="outline" className="mt-1 text-xs bg-orange-50 text-orange-700 border-orange-200">
                    {test.flakinessReason}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {test.environment}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-orange-500 h-2.5 rounded-full" 
                      style={{ width: `${test.flakinessScore}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-orange-600">
                    {test.flakinessScore}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {test.patternAnalysis && (
                    <>
                      <div className="text-xs">
                        <span className="font-medium">Alternating:</span> {test.patternAnalysis.alternatingRatio}%
                      </div>
                      <div className="text-xs">
                        <span className="font-medium">Build Consistency:</span> {test.patternAnalysis.buildConsistencyRate}%
                      </div>
                      <div className="text-xs">
                        <span className="font-medium">Max Consecutive Fails:</span> {test.patternAnalysis.maxConsecutiveFailures}
                      </div>
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full" 
                      style={{ width: `${test.passRate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {test.passRate}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-red-500 h-2.5 rounded-full" 
                      style={{ width: `${test.failRate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-red-600">
                    {test.failRate}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-slate-600 font-medium">
                  {test.totalRuns}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-slate-600">
                  {formatDistanceToNow(new Date(test.lastRun), { addSuffix: true })}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <BarChart2 className="w-4 h-4 mr-1" />
                    History
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Analyze
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {flakyTests.length === 0 && (
        <div className="text-center py-12">
          <TestTube className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">No flaky tests found for the selected time range.</p>
        </div>
      )}
    </div>
  );
}
