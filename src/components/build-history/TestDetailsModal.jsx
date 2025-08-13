import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getApiUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TestTube, 
  Target, 
  AlertTriangle,
  GitBranch,
  Calendar,
  User,
  Hash,
  MessageSquare,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { format, isValid } from 'date-fns';

export default function TestDetailsModal({ 
  isOpen, 
  onClose, 
  release, 
  metricType, 
  testRuns = [] 
}) {
  const [expandedErrors, setExpandedErrors] = React.useState(new Set());
  
  if (!release) return null;
  
  const toggleErrorExpansion = (testRunId) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(testRunId)) {
      newExpanded.delete(testRunId);
    } else {
      newExpanded.add(testRunId);
    }
    setExpandedErrors(newExpanded);
  };

  const getMetricTitle = () => {
    switch (metricType) {
      case 'total': return 'Total Tests';
      case 'passed': return 'Passed Tests';
      case 'failed': return 'Failed Tests';
      case 'coverage': return 'Test Coverage';
      default: return 'Test Details';
    }
  };

  const getMetricIcon = () => {
    switch (metricType) {
      case 'total': return <TestTube className="w-6 h-6 text-blue-600" />;
      case 'passed': return <CheckCircle2 className="w-6 h-6 text-emerald-600" />;
      case 'failed': return <XCircle className="w-6 h-6 text-red-600" />;
      case 'coverage': return <Target className="w-6 h-6 text-blue-600" />;
      default: return <TestTube className="w-6 h-6 text-blue-600" />;
    }
  };

  const getMetricColor = () => {
    switch (metricType) {
      case 'total': return 'text-blue-600';
      case 'passed': return 'text-emerald-600';
      case 'failed': return 'text-red-600';
      case 'coverage': return 'text-blue-600';
      default: return 'text-blue-600';
    }
  };

  const getMetricValue = () => {
    const totalTests = release.builds?.reduce((sum, build) => sum + (build.totalTests || 0), 0) || 0;
    const passedTests = release.builds?.reduce((sum, build) => sum + (build.passedTests || 0), 0) || 0;
    const failedTests = release.builds?.reduce((sum, build) => sum + (build.failedTests || 0), 0) || 0;
    const avgCoverage = release.builds?.length > 0 
      ? release.builds.reduce((sum, build) => sum + (build.coveragePercentage || 0), 0) / release.builds.length 
      : 0;

    switch (metricType) {
      case 'total': return totalTests;
      case 'passed': return passedTests;
      case 'failed': return failedTests;
      case 'coverage': return `${avgCoverage.toFixed(1)}%`;
      default: return totalTests;
    }
  };

  const getAllTestRuns = () => {
    if (!release.builds) return [];
    return release.builds.flatMap(build => build.testRuns || []);
  };

  const getTestRunsForMetric = () => {
    const allTestRuns = getAllTestRuns();
    if (!allTestRuns || allTestRuns.length === 0) return [];
    
    switch (metricType) {
      case 'passed': return allTestRuns.filter(tr => tr.status === 'passed');
      case 'failed': return allTestRuns.filter(tr => tr.status === 'failed');
      case 'total': return allTestRuns;
      case 'coverage': return allTestRuns.filter(tr => tr.coveragePercentage > 0);
      default: return allTestRuns;
    }
  };

  const filteredTestRuns = getTestRunsForMetric();

  // Helper function to extract error locations from stack trace
  const extractErrorLocations = (stackTrace) => {
    if (!stackTrace) return [];
    
    const locations = [];
    const lines = stackTrace.split('\n');
    
    console.log('Extracting error locations from stack trace:', stackTrace);
    
    // Common stack trace patterns
    const patterns = [
      // Jest specific: at Object.toBe (file.js:line:column)
      /at\s+Object\.(\w+)\s+\(([^:]+):(\d+):(\d+)\)/,
      // Jest specific: at Object.it (file.js:line:column)
      /at\s+Object\.(\w+)\s+\(([^:]+):(\d+):(\d+)\)/,
      // Jest specific: at Object.test (file.js:line:column)
      /at\s+Object\.(\w+)\s+\(([^:]+):(\d+):(\d+)\)/,
      // JavaScript/TypeScript: at FunctionName (file.js:line:column)
      /at\s+(\w+)\s+\(([^:]+):(\d+):(\d+)\)/,
      // JavaScript/TypeScript: at file.js:line:column
      /at\s+([^:]+):(\d+):(\d+)/,
      // Python: File "file.py", line line, in function
      /File\s+"([^"]+)",\s+line\s+(\d+),\s+in\s+(\w+)/,
      // Java: at package.Class.method(Class.java:line)
      /at\s+([\w.]+)\.(\w+)\(([^:]+):(\d+)\)/,
      // Go: package.function(file.go:line)
      /([\w.]+)\(([^:]+):(\d+)\)/,
      // Additional patterns for different file structures
      // Relative paths: ./src/file.js or ../src/file.js
      /at\s+(\w+)\s+\(([./][^:]+):(\d+):(\d+)\)/,
      // Absolute paths: /path/to/file.js
      /at\s+(\w+)\s+\((\/[^:]+):(\d+):(\d+)\)/,
      // Windows paths: C:\path\to\file.js
      /at\s+(\w+)\s+\(([A-Z]:\\[^:]+):(\d+):(\d+)\)/,
      // Additional Jest patterns for test files
      // at Object.test (/tests/math.test.js:line:column)
      /at\s+Object\.(\w+)\s+\((\/[^:]+):(\d+):(\d+)\)/,
      // at Object.it (/tests/math.test.js:line:column)
      /at\s+Object\.(\w+)\s+\((\/[^:]+):(\d+):(\d+)\)/,
      // at Object.toBe (/tests/math.test.js:line:column)
      /at\s+Object\.(\w+)\s+\((\/[^:]+):(\d+):(\d+)\)/
    ];
    
    // Track unique file paths to avoid duplicates
    const seenFiles = new Set();
    
    lines.forEach(line => {
      console.log('Processing line:', line);
      patterns.forEach((pattern, index) => {
        const match = line.match(pattern);
        if (match) {
          console.log(`Pattern ${index} matched:`, match);
          if (match.length === 5) {
            // Pattern with function name
            const location = {
              function: match[1],
              file: match[2],
              line: parseInt(match[3]),
              column: parseInt(match[4])
            };
            
            // Only add if we haven't seen this file:line combination
            const fileLineKey = `${location.file}:${location.line}`;
            if (!seenFiles.has(fileLineKey)) {
              console.log('Extracted location:', location);
              locations.push(location);
              seenFiles.add(fileLineKey);
            }
          } else if (match.length === 4) {
            // Pattern without function name
            const location = {
              function: 'unknown',
              file: match[1],
              line: parseInt(match[2]),
              column: parseInt(match[3])
            };
            
            const fileLineKey = `${location.file}:${location.line}`;
            if (!seenFiles.has(fileLineKey)) {
              console.log('Extracted location:', location);
              locations.push(location);
              seenFiles.add(fileLineKey);
            }
          } else if (match.length === 3) {
            // Python pattern
            const location = {
              function: match[3],
              file: match[1],
              line: parseInt(match[2])
            };
            
            const fileLineKey = `${location.file}:${location.line}`;
            if (!seenFiles.has(fileLineKey)) {
              console.log('Extracted location:', location);
              locations.push(location);
              seenFiles.add(fileLineKey);
            }
          }
        }
      });
    });
    
    // Also look for Jest error format with line markers (e.g., "> 7 |     expect(2 + 2).toBe(11);")
    const jestErrorLineMatch = stackTrace.match(/>\s*(\d+)\s*\|\s*([^\n]+)/);
    if (jestErrorLineMatch) {
      console.log('Found Jest error line marker:', jestErrorLineMatch[1]);
      // Try to find the file name from the stack trace
      const fileMatch = stackTrace.match(/at\s+Object\.\w+\s+\(([^:]+):/);
      if (fileMatch) {
        const location = {
          function: 'Jest Test',
          file: fileMatch[1],
          line: parseInt(jestErrorLineMatch[1]),
          column: 0
        };
        const fileLineKey = `${location.file}:${location.line}`;
        if (!seenFiles.has(fileLineKey)) {
          console.log('Adding Jest error location with correct line number:', location);
          locations.unshift(location); // Add to beginning as it's most relevant
          seenFiles.add(fileLineKey);
        }
      }
    }
    
    // Sort locations to prioritize test files and most relevant ones
    locations.sort((a, b) => {
      // First, prioritize Jest Test function (most accurate line number)
      if (a.function === 'Jest Test' && b.function !== 'Jest Test') return -1;
      if (a.function !== 'Jest Test' && b.function === 'Jest Test') return 1;
      
      // Then prioritize test files
      const aIsTest = a.file.includes('.test.') || a.file.includes('.spec.');
      const bIsTest = b.file.includes('.test.') || b.file.includes('.spec.');
      
      if (aIsTest && !bIsTest) return -1;
      if (!aIsTest && bIsTest) return 1;
      
      // Then prioritize files in tests/ directory
      const aInTests = a.file.includes('/tests/') || a.file.includes('tests/');
      const bInTests = b.file.includes('/tests/') || b.file.includes('tests/');
      
      if (aInTests && !bInTests) return -1;
      if (!aInTests && bInTests) return 1;
      
      return 0;
    });
    
    return locations.slice(0, 3); // Return first 3 most relevant locations
  };

  // Helper function to clean file paths for GitHub
  const cleanFilePathForGitHub = (filePath) => {
    if (!filePath) return '';
    
    // Remove leading slashes and dots
    let cleanPath = filePath.replace(/^\/+/, '').replace(/^\.\/+/, '');
    
    // Handle Windows paths
    cleanPath = cleanPath.replace(/^[A-Z]:\\/, '').replace(/\\/g, '/');
    
    // Remove any workspace or project prefixes that might be in the path
    // This is common in CI/CD environments
    cleanPath = cleanPath.replace(/^workspace\//, '');
    cleanPath = cleanPath.replace(/^project\//, '');
    cleanPath = cleanPath.replace(/^repo\//, '');
    
    return cleanPath;
  };

  // Helper function to generate GitHub links
  const generateGitHubLink = (repoFullName, commitHash, filePath, lineNumber) => {
    if (!repoFullName || !commitHash || !filePath) return '#';
    
    // Clean up file path
    const cleanPath = cleanFilePathForGitHub(filePath);
    
    const link = `https://github.com/${repoFullName}/blob/${commitHash}/${cleanPath}#L${lineNumber}`;
    
    // Debug logging
    console.log('GitHub Link Debug:', {
      repoFullName,
      commitHash,
      originalFilePath: filePath,
      cleanPath,
      generatedLink: link
    });
    
    return link;
  };

  // Helper function to check if a file path is likely to exist in the repository
  const isLikelyValidFile = (filePath) => {
    if (!filePath) return false;
    
    // Common patterns that are likely to be valid
    const validPatterns = [
      /\.test\.(js|ts|jsx|tsx)$/i,  // Test files
      /\.spec\.(js|ts|jsx|tsx)$/i,  // Spec files
      /\.(js|ts|jsx|tsx|py|java|go|rb|php)$/i,  // Common source files
      /^tests?\//i,  // Files in tests directory
      /^src\//i,     // Files in src directory
      /^lib\//i,     // Files in lib directory
      /^app\//i,     // Files in app directory
    ];
    
    return validPatterns.some(pattern => pattern.test(filePath));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getMetricIcon()}
            <span className={getMetricColor()}>
              {getMetricTitle()} - {release.name || release.tagName}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Release Summary */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {release.builds?.length || 0}
                </div>
                <div className="text-sm text-slate-600">Builds</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {release.builds?.reduce((sum, build) => sum + (build.passedTests || 0), 0) || 0}
                </div>
                <div className="text-sm text-slate-600">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {release.builds?.reduce((sum, build) => sum + (build.failedTests || 0), 0) || 0}
                </div>
                <div className="text-sm text-slate-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {release.builds?.length > 0 
                    ? (release.builds.reduce((sum, build) => sum + (build.coveragePercentage || 0), 0) / release.builds.length).toFixed(1)
                    : 0}%
                </div>
                <div className="text-sm text-slate-600">Coverage</div>
              </div>
            </div>
          </div>

          {/* Failed Tests Summary */}
          {metricType === 'failed' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-red-800">Failed Tests Investigation</h3>
              </div>
              <p className="text-red-700 text-sm mb-3">
                Click on any error location link below to jump directly to the problematic code in GitHub.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">
                    {release.builds?.reduce((sum, build) => 
                      sum + (build.testRuns?.filter(tr => tr.status === 'failed').length || 0), 0) || 0}
                  </div>
                  <div className="text-red-700">Failed Test Runs</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">
                    {release.builds?.filter(build => 
                      build.testRuns?.some(tr => tr.status === 'failed')).length || 0}
                  </div>
                  <div className="text-red-700">Builds with Failures</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">
                    {getAllTestRuns().filter(tr => tr.status === 'failed' && tr.errorMessage).length}
                  </div>
                  <div className="text-red-700">With Error Details</div>
                </div>
              </div>
            </div>
          )}

          {/* Builds with Test Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Builds and Test Results</h3>
            <div className="space-y-4">
              {release.builds?.map((build) => (
                <div key={build.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-slate-500" />
                        <span className="font-mono text-sm">{build.commitHash.substring(0, 8)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-slate-500" />
                        <span className="text-sm">{build.branch}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        <span className="text-sm">{build.author}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={build.status === 'success' ? 'default' : 'destructive'}>
                        {build.status}
                      </Badge>
                      {build.coveragePercentage > 0 && (
                        <Badge variant="outline" className="text-blue-600">
                          {build.coveragePercentage.toFixed(1)}% coverage
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-900">{build.totalTests || 0}</div>
                      <div className="text-xs text-slate-600">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-emerald-600">{build.passedTests || 0}</div>
                      <div className="text-xs text-slate-600">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{build.failedTests || 0}</div>
                      <div className="text-xs text-slate-600">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-amber-600">{build.flakyTests || 0}</div>
                      <div className="text-xs text-slate-600">Flaky</div>
                    </div>
                  </div>

                  {build.commitMessage && (
                    <div className="flex items-start gap-2 mb-3">
                      <MessageSquare className="w-4 h-4 text-slate-500 mt-0.5" />
                      <p className="text-sm text-slate-700">{build.commitMessage}</p>
                    </div>
                  )}

                  {/* Test Runs for this build */}
                  {build.testRuns && build.testRuns.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">
                        Individual Test Results ({build.testRuns.length})
                      </h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {build.testRuns
                          .filter(tr => {
                            if (metricType === 'passed') return tr.status === 'passed';
                            if (metricType === 'failed') return tr.status === 'failed';
                            return true;
                          })
                          .slice(0, 10) // Show first 10 for performance
                          .map((testRun, index) => (
                            <div key={index} className="border border-slate-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {testRun.status === 'passed' ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  ) : testRun.status === 'failed' ? (
                                    <XCircle className="w-4 h-4 text-red-600" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-blue-600" />
                                  )}
                                  <span className="font-medium text-sm">{testRun.testSuite}</span>
                                  {testRun.duration && (
                                    <span className="text-slate-500 text-xs">({testRun.duration}s)</span>
                                  )}
                                </div>
                                {testRun.coveragePercentage > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {testRun.coveragePercentage.toFixed(1)}%
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Error Details for Failed Tests */}
                              {testRun.status === 'failed' && testRun.errorMessage && (
                                <div className="mt-2">
                                  <button
                                    onClick={() => toggleErrorExpansion(`${build.id}-${index}`)}
                                    className="w-full flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded text-xs hover:bg-red-100 transition-colors"
                                  >
                                    <span className="font-semibold text-red-800">View Error Details</span>
                                    {expandedErrors.has(`${build.id}-${index}`) ? (
                                      <ChevronDown className="w-4 h-4 text-red-600" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-red-600" />
                                    )}
                                  </button>
                                  
                                  {expandedErrors.has(`${build.id}-${index}`) && (
                                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                                      <div className="font-semibold text-red-800 mb-1">Error:</div>
                                      <div className="text-red-700 font-mono whitespace-pre-wrap">
                                        {testRun.errorMessage}
                                      </div>
                                      
                                      {/* Stack Trace */}
                                      {testRun.stackTrace && (
                                        <div className="mt-2">
                                          <div className="font-semibold text-red-800 mb-1">Stack Trace:</div>
                                          <div className="text-red-700 font-mono text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                                            {testRun.stackTrace}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* GitHub Links for Error Lines */}
                                      {testRun.stackTrace && (
                                        <div className="mt-2">
                                          <div className="font-semibold text-red-800 mb-1">Error Locations:</div>
                                          <div className="space-y-1">
                                            {(() => {
                                              const locations = extractErrorLocations(testRun.stackTrace);
                                              console.log('Extracted locations for test run:', locations);
                                              
                                              if (locations.length === 0) {
                                                return (
                                                  <div className="text-orange-600 text-xs">
                                                    No error locations found in stack trace. Raw stack trace:
                                                    <div className="mt-1 p-1 bg-gray-100 rounded text-xs font-mono">
                                                      {testRun.stackTrace.substring(0, 200)}...
                                                    </div>
                                                  </div>
                                                );
                                              }
                                              
                                                                                             return locations
                                                 .filter(location => isLikelyValidFile(location.file))
                                                 .map((location, locIndex) => {
                                                   const githubLink = generateGitHubLink(build.repoFullName, build.commitHash, location.file, location.line);
                                                   console.log('Generated GitHub link:', githubLink, 'for location:', location);
                                                   
                                                   const isTestFile = location.file.includes('.test.') || location.file.includes('.spec.') || location.file.includes('/tests/');
                                                   const isMostRelevant = locIndex === 0;
                                                   
                                                   return (
                                                     <a
                                                       key={locIndex}
                                                       href={githubLink}
                                                       target="_blank"
                                                       rel="noopener noreferrer"
                                                       className={`block p-2 border rounded text-xs font-mono transition-colors ${
                                                         isMostRelevant 
                                                           ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-900' 
                                                           : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-900'
                                                       }`}
                                                     >
                                                       {isMostRelevant ? '⭐ ' : '🔗 '}{location.file}:{location.line} - {location.function}
                                                       <div className={`text-xs mt-1 ${isMostRelevant ? 'text-green-500' : 'text-blue-500'}`}>
                                                         {isMostRelevant ? 'Most relevant - Click to view in GitHub' : 'Click to view in GitHub'}
                                                       </div>
                                                     </a>
                                                   );
                                                 });
                                            })()}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* GitHub Links from Error Message (fallback) */}
                                      {!testRun.stackTrace && testRun.errorMessage && (
                                        <div className="mt-2">
                                          <div className="font-semibold text-red-800 mb-1">Error Analysis:</div>
                                          <div className="text-red-600 text-xs mb-2">
                                            No stack trace available, but trying to extract file info from error message.
                                          </div>
                                          {(() => {
                                            // Try to extract file info from error message
                                            const errorLocations = extractErrorLocations(testRun.errorMessage);
                                            console.log('Error locations from error message:', errorLocations);
                                            
                                            if (errorLocations.length > 0) {
                                              return (
                                                <div className="space-y-1">
                                                  {errorLocations.map((location, locIndex) => {
                                                    const githubLink = generateGitHubLink(build.repoFullName, build.commitHash, location.file, location.line);
                                                    return (
                                                      <a
                                                        key={locIndex}
                                                        href={githubLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 hover:bg-blue-100 hover:text-blue-900 text-xs font-mono transition-colors"
                                                      >
                                                        🔗 {location.file}:{location.line} - {location.function}
                                                        <div className="text-blue-500 text-xs mt-1">
                                                          Click to view in GitHub
                                                        </div>
                                                      </a>
                                                    );
                                                  })}
                                                </div>
                                              );
                                            }
                                            
                                            return (
                                              <div className="text-orange-600 text-xs">
                                                No file locations found in error message either.
                                                <br />
                                                                                                 <div className="mt-2">
                                                   <div className="font-semibold text-blue-800 mb-1">Test GitHub Link:</div>
                                                   <a
                                                     href={generateGitHubLink(build.repoFullName, build.commitHash, 'tests/math.test.js', 15)}
                                                     target="_blank"
                                                     rel="noopener noreferrer"
                                                     className="block p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 hover:bg-blue-100 hover:text-blue-900 text-xs font-mono transition-colors"
                                                   >
                                                     🔗 Test Link: tests/math.test.js:15
                                                     <div className="text-blue-500 text-xs mt-1">
                                                       Click to test GitHub navigation
                                                     </div>
                                                   </a>
                                                 </div>
                                                <div className="flex gap-3 mt-1">
                                                  <button
                                                    onClick={async () => {
                                                      try {
                                                        // Get the auth token from localStorage
                                                        const token = localStorage.getItem('token');
                                                        console.log('Using token:', token ? token.substring(0, 20) + '...' : 'No token');
                                                        
                                                        if (!token) {
                                                          alert('No authentication token found. Please log in again.');
                                                          return;
                                                        }
                                                        
                                                        // First, let's test if the token is valid by making a simple request
                                                        const testResponse = await fetch(getApiUrl('teams'), {
                                                          headers: {
                                                            'Authorization': `Bearer ${token}`,
                                                            'Content-Type': 'application/json'
                                                          }
                                                        });
                                                        
                                                        if (!testResponse.ok) {
                                                          alert('Authentication token is invalid or expired. Please log in again.');
                                                          return;
                                                        }
                                                        
                                                        const response = await fetch(getApiUrl(`teams/5/debug-logs/${build.id}`), {
                                                          headers: {
                                                            'Authorization': `Bearer ${token}`,
                                                            'Content-Type': 'application/json'
                                                          }
                                                        });
                                                        
                                                        if (!response.ok) {
                                                          const errorText = await response.text();
                                                          console.error('Response error:', errorText);
                                                          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                                                        }
                                                        
                                                        const data = await response.json();
                                                        console.log('Debug log analysis:', data);
                                                        alert('Check console for log analysis details');
                                                      } catch (error) {
                                                        console.error('Error debugging logs:', error);
                                                        alert(`Error debugging logs: ${error.message}`);
                                                      }
                                                    }}
                                                    className="text-blue-600 hover:underline"
                                                  >
                                                    🔍 Debug Logs
                                                  </button>
                                                  <button
                                                    onClick={async () => {
                                                      try {
                                                        // Get the auth token from localStorage
                                                        const token = localStorage.getItem('token');
                                                        console.log('Using token for re-parse:', token ? token.substring(0, 20) + '...' : 'No token');
                                                        
                                                        if (!token) {
                                                          alert('No authentication token found. Please log in again.');
                                                          return;
                                                        }
                                                        
                                                        const response = await fetch(getApiUrl(`teams/5/reparse-tests/${build.id}`), {
                                                          method: 'POST',
                                                          headers: {
                                                            'Authorization': `Bearer ${token}`,
                                                            'Content-Type': 'application/json'
                                                          }
                                                        });
                                                        
                                                        if (!response.ok) {
                                                          const errorText = await response.text();
                                                          console.error('Response error:', errorText);
                                                          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                                                        }
                                                        
                                                        const data = await response.json();
                                                        if (data.success) {
                                                          alert(`Test results re-parsed successfully! Found ${data.testRuns} test runs. Refresh the page to see updated results.`);
                                                        } else {
                                                          alert('Failed to re-parse test results. Check console for details.');
                                                        }
                                                      } catch (error) {
                                                        console.error('Error re-parsing tests:', error);
                                                        alert(`Error re-parsing tests: ${error.message}`);
                                                      }
                                                    }}
                                                    className="text-green-600 hover:underline"
                                                  >
                                                    🔄 Re-parse Tests
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      // Test GitHub link generation with sample data
                                                      const sampleStackTrace = `at Object.toBe (src/test.js:15:5)
at Object.it (src/test.js:10:3)
> 15 |     expect(2 + 2).toBe(5);
> 16 |   });
> 17 | });`;
                                                      
                                                      const locations = extractErrorLocations(sampleStackTrace);
                                                      const githubLink = generateGitHubLink(build.repoFullName, build.commitHash, 'src/test.js', 15);
                                                      
                                                      console.log('Test GitHub link generation:');
                                                      console.log('Sample stack trace:', sampleStackTrace);
                                                      console.log('Extracted locations:', locations);
                                                      console.log('Generated GitHub link:', githubLink);
                                                      console.log('Build info:', { repoFullName: build.repoFullName, commitHash: build.commitHash });
                                                      
                                                      alert(`Test completed! Check console for details.\n\nGitHub Link: ${githubLink}\n\nExtracted Locations: ${JSON.stringify(locations, null, 2)}`);
                                                    }}
                                                    className="text-purple-600 hover:underline"
                                                  >
                                                    🧪 Test GitHub Links
                                                  </button>
                                                                                                     <button
                                                     onClick={() => {
                                                       // Test with actual build data
                                                       console.log('Testing with actual build data:');
                                                       console.log('Build info:', {
                                                         repoFullName: build.repoFullName,
                                                         commitHash: build.commitHash,
                                                         id: build.id
                                                       });
                                                       
                                                       // Test GitHub link generation with actual data
                                                       const githubLink = generateGitHubLink(build.repoFullName, build.commitHash, 'src/test.js', 15);
                                                       
                                                       console.log('Generated GitHub link with actual data:', githubLink);
                                                       
                                                       alert(`Build Data Test:\n\nRepo: ${build.repoFullName}\nCommit: ${build.commitHash}\nGitHub Link: ${githubLink}`);
                                                     }}
                                                     className="text-indigo-600 hover:underline"
                                                   >
                                                     🏗️ Test Build Data
                                                   </button>
                                                   <button
                                                     onClick={() => {
                                                       // Test repository access
                                                       const repoUrl = `https://github.com/${build.repoFullName}`;
                                                       const commitUrl = `https://github.com/${build.repoFullName}/commit/${build.commitHash}`;
                                                       
                                                       console.log('Repository URLs:', {
                                                         repo: repoUrl,
                                                         commit: commitUrl
                                                       });
                                                       
                                                       alert(`Repository Test:\n\nRepo URL: ${repoUrl}\nCommit URL: ${commitUrl}\n\nTry opening these URLs to verify they work.`);
                                                     }}
                                                     className="text-yellow-600 hover:underline"
                                                   >
                                                     🔍 Test Repo Access
                                                   </button>
                                                   <button
                                                     onClick={() => {
                                                       // Show raw stack trace for debugging
                                                       console.log('Raw stack trace:', testRun.stackTrace);
                                                       console.log('Raw error message:', testRun.errorMessage);
                                                       
                                                       // Extract and show line numbers
                                                       const locations = extractErrorLocations(testRun.stackTrace);
                                                       const lineInfo = locations.map((loc, i) => 
                                                         `${i + 1}. ${loc.file}:${loc.line} - ${loc.function}`
                                                       ).join('\n');
                                                       
                                                       alert(`Raw Stack Trace:\n\n${testRun.stackTrace || 'No stack trace'}\n\nRaw Error Message:\n\n${testRun.errorMessage || 'No error message'}\n\nExtracted Line Numbers:\n${lineInfo}`);
                                                     }}
                                                     className="text-red-600 hover:underline"
                                                   >
                                                     📄 Show Raw Stack Trace
                                                   </button>
                                                  <button
                                                    onClick={async () => {
                                                      try {
                                                        const response = await fetch(getApiUrl('test-github-links'));
                                                        const data = await response.json();
                                                        console.log('Test endpoint response:', data);
                                                        
                                                        // Test the GitHub link generation
                                                        const githubLink = generateGitHubLink(
                                                          data.sampleData.repoFullName,
                                                          data.sampleData.commitHash,
                                                          data.sampleData.filePath,
                                                          data.sampleData.lineNumber
                                                        );
                                                        
                                                        const locations = extractErrorLocations(data.sampleData.sampleStackTrace);
                                                        
                                                        console.log('Generated GitHub link:', githubLink);
                                                        console.log('Extracted locations:', locations);
                                                        
                                                        alert(`Test successful!\n\nGitHub Link: ${githubLink}\n\nExtracted Locations: ${JSON.stringify(locations, null, 2)}`);
                                                      } catch (error) {
                                                        console.error('Test error:', error);
                                                        alert(`Test failed: ${error.message}`);
                                                      }
                                                    }}
                                                    className="text-orange-600 hover:underline"
                                                  >
                                                    🔗 Test Endpoint
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      )}
                                      
                                      {/* Debug info if no repoFullName */}
                                      {testRun.stackTrace && !build.repoFullName && (
                                        <div className="mt-2 text-red-600 text-xs">
                                          No repository info available for GitHub links.
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        {build.testRuns.length > 10 && (
                          <p className="text-xs text-slate-500 text-center">
                            Showing first 10 of {build.testRuns.length} test runs
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* No Test Data Message */}
          {(!release.builds || release.builds.length === 0) && (
            <div className="text-center py-8">
              <TestTube className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">No test data available for this release</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            {metricType === 'failed' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const failedTests = getAllTestRuns().filter(tr => tr.status === 'failed');
                    const errorSummary = failedTests.map(tr => 
                      `${tr.testSuite}: ${tr.errorMessage || 'No error details'}`
                    ).join('\n\n');
                    navigator.clipboard.writeText(errorSummary);
                  }}
                >
                  📋 Copy Error Summary
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const failedTests = getAllTestRuns().filter(tr => tr.status === 'failed');
                    const locations = failedTests.flatMap(tr => 
                      extractErrorLocations(tr.stackTrace || '')
                    );
                    const locationText = locations.map(loc => 
                      `${loc.file}:${loc.line} - ${loc.function}`
                    ).join('\n');
                    navigator.clipboard.writeText(locationText);
                  }}
                >
                  📍 Copy Error Locations
                </Button>
              </>
            )}
          </div>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 