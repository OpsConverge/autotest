import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  TestTube, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Target,
  Search,
  Filter,
  Clock,
  Code,
  ExternalLink
} from "lucide-react";
import { TestRun } from "@/api/entities";
import { format } from "date-fns";

const getStatusIcon = (status) => {
  switch (status) {
    case 'passed': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
    case 'flaky': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
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

export default function BuildTestDetailsModal({ isOpen, onClose, build, metricType }) {
  const [testRuns, setTestRuns] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (isOpen && build) {
      loadTestRuns();
    }
  }, [isOpen, build]);

  useEffect(() => {
    applyFilters();
  }, [testRuns, searchQuery, statusFilter, metricType]);

  const loadTestRuns = async () => {
    setIsLoading(true);
    try {
      console.log('Loading test runs for build:', build.id);
      const allTests = await TestRun.listByBuild(build.id);
      console.log('All tests returned from API:', allTests);
      const buildTests = allTests.filter(test => test.buildId === build.id);
      console.log('Filtered tests for this build:', buildTests);
      setTestRuns(buildTests);
    } catch (error) {
      console.error("Error loading test runs:", error);
      setTestRuns([]);
    }
    setIsLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...testRuns];

    // Apply metric type filter
    if (metricType && metricType !== 'total' && metricType !== 'coverage') {
      filtered = filtered.filter(test => test.status === metricType);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(test => 
        test.testSuite?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.errorMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(test => test.status === statusFilter);
    }

    setFilteredTests(filtered);
  };

  const getModalTitle = () => {
    const metricNames = {
      total: 'All Tests',
      passed: 'Passed Tests',
      failed: 'Failed Tests',
      coverage: 'Coverage Details'
    };
    return `${metricNames[metricType] || 'Test Details'} - ${build?.version}`;
  };

  const getMetricIcon = () => {
    switch (metricType) {
      case 'total': return <TestTube className="w-6 h-6 text-blue-600" />;
      case 'passed': return <CheckCircle2 className="w-6 h-6 text-emerald-600" />;
      case 'failed': return <XCircle className="w-6 h-6 text-red-600" />;
      case 'coverage': return <Target className="w-6 h-6 text-purple-600" />;
      default: return <TestTube className="w-6 h-6 text-blue-600" />;
    }
  };

  // Calculate summary stats from testRuns
  console.log('Current testRuns state:', testRuns);
  const totalTests = testRuns.length;
  const passedTests = testRuns.filter(tr => tr.status === 'passed').length;
  const failedTests = testRuns.filter(tr => tr.status === 'failed').length;
  console.log('Calculated stats - total:', totalTests, 'passed:', passedTests, 'failed:', failedTests);
  const coverage =
    testRuns.length > 0
      ? (
          testRuns.reduce((acc, tr) => acc + (tr.coveragePercentage || 0), 0) /
          testRuns.length
        ).toFixed(1)
      : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] glass-effect">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getMetricIcon()}
            <span>{getModalTitle()}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{totalTests}</div>
                <div className="text-sm text-slate-600">Total Tests</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{passedTests}</div>
                <div className="text-sm text-slate-600">Passed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{failedTests}</div>
                <div className="text-sm text-slate-600">Failed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{coverage}%</div>
                <div className="text-sm text-slate-600">Coverage</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search test suites..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="passed">Passed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="flaky">Flaky</SelectItem>
                      <SelectItem value="skipped">Skipped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Results Table */}
          <Card className="flex-1 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Test Results
                <Badge variant="outline">{filteredTests.length} tests</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead>Test Suite</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Coverage</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <span className="text-slate-500">Loading tests...</span>
                        </TableCell>
                      </TableRow>
                    ) : filteredTests.length > 0 ? (
                      filteredTests.map((test) => (
                        <TableRow key={test.id} className="hover:bg-slate-50/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {getStatusIcon(test.status)}
                              <div>
                                <p className="font-medium text-slate-900">{test.testSuite}</p>
                                {test.aiAnalysis?.flaky_score > 50 && (
                                  <p className="text-xs text-orange-600">
                                    {test.aiAnalysis.flaky_score}% flaky score
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
                            <span className="text-sm text-slate-600">
                              {test.coveragePercentage ? `${test.coveragePercentage}%` : '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              {(test.status === 'failed' || test.status === 'flaky') && (
                                <Button variant="ghost" size="sm" title="View Code">
                                  <Code className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <TestTube className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                          <p className="text-slate-500">
                            {metricType === 'failed' ? 'No failed tests found' :
                             metricType === 'passed' ? 'No passed tests found' :
                             'No tests found for this build'}
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}