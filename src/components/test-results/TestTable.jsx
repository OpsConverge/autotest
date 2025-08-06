
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle2, Clock, ExternalLink, Code } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const getStatusIcon = (status) => {
  switch (status) {
    case 'passed': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
    case 'flaky': return <AlertCircle className="w-4 h-4 text-orange-600" />;
    default: return <Clock className="w-4 h-4 text-slate-400" />;
  }
};

const getStatusBadge = (status) => {
  const variants = {
    passed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    flaky: 'bg-orange-100 text-orange-800 border-orange-200',
    skipped: 'bg-slate-100 text-slate-800 border-slate-200'
  };
  return variants[status] || variants.skipped;
};

export default function TestTable({ tests, isLoading, onTestSelect, selectedTest, onViewCode }) {
  if (isLoading) {
    return (
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl">Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(8).fill(0).map((_, i) => (
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl flex items-center justify-between">
          Test Results
          <span className="text-sm font-normal text-slate-500">
            {tests.length} tests
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead>Test Suite</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Framework</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Build</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.map((test) => (
                <TableRow 
                  key={test.id}
                  className={`cursor-pointer hover:bg-slate-50/50 transition-colors ${
                    selectedTest?.id === test.id ? 'bg-blue-50/50 border-blue-200' : ''
                  }`}
                  onClick={() => onTestSelect(test)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <p className="font-medium text-slate-900">{test.testSuite}</p>
                        {test.flaky_score > 50 && (
                          <p className="text-xs text-orange-600">
                            {test.flaky_score}% flaky score
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {test.testType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {test.framework || 'unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusBadge(test.status)} border`}>
                      {test.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">
                      {test.duration ? `${test.duration}ms` : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600 capitalize">
                      {test.environment || 'staging'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">
                      {test.build?.commitHash?.substring(0, 8) || test.buildId || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">
                      {format(new Date(test.createdAt), 'MMM d, HH:mm')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTestSelect(test);
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      {(test.status === 'failed' || test.status === 'flaky') && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewCode?.(test);
                          }}
                          title="View Code"
                        >
                          <Code className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {tests.length === 0 && (
            <div className="text-center py-12">
              <Code className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No test results found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
