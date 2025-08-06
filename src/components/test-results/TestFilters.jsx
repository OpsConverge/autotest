import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

export default function TestFilters({ filters, onFiltersChange, releases = [] }) {
  console.log('TestFilters: Received releases:', releases.length, releases);
  
  const updateFilter = (key, value) => {
    onFiltersChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Filter className="w-4 h-4 text-slate-500" />
      
      <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
        <SelectTrigger className="w-32 bg-white/70">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="passed">Passed</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="flaky">Flaky</SelectItem>
          <SelectItem value="skipped">Skipped</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.testType} onValueChange={(value) => updateFilter('testType', value)}>
        <SelectTrigger className="w-32 bg-white/70">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="unit">Unit</SelectItem>
          <SelectItem value="integration">Integration</SelectItem>
          <SelectItem value="e2e">E2E</SelectItem>
          <SelectItem value="functional">Functional</SelectItem>
          <SelectItem value="performance">Performance</SelectItem>
          <SelectItem value="api">API</SelectItem>
          <SelectItem value="visual">Visual</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.framework} onValueChange={(value) => updateFilter('framework', value)}>
        <SelectTrigger className="w-32 bg-white/70">
          <SelectValue placeholder="Framework" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Frameworks</SelectItem>
          <SelectItem value="Jest">Jest</SelectItem>
          <SelectItem value="Cypress">Cypress</SelectItem>
          <SelectItem value="Playwright">Playwright</SelectItem>
          <SelectItem value="PyTest">PyTest</SelectItem>
          <SelectItem value="JUnit">JUnit</SelectItem>
          <SelectItem value="Mocha">Mocha</SelectItem>
          <SelectItem value="Vitest">Vitest</SelectItem>
          <SelectItem value="unknown">Unknown</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.environment} onValueChange={(value) => updateFilter('environment', value)}>
        <SelectTrigger className="w-32 bg-white/70">
          <SelectValue placeholder="Environment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Environments</SelectItem>
          <SelectItem value="dev">Development</SelectItem>
          <SelectItem value="staging">Staging</SelectItem>
          <SelectItem value="prod">Production</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.release} onValueChange={(value) => updateFilter('release', value)}>
        <SelectTrigger className="w-40 bg-white/70">
          <SelectValue placeholder="Release" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Releases ({releases.length} available)</SelectItem>
          {releases.map(release => (
            <SelectItem key={release.id} value={release.id.toString()}>
              {release.tagName || release.name || `Release ${release.id}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
        <SelectTrigger className="w-32 bg-white/70">
          <SelectValue placeholder="Date Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1d">Last 24h</SelectItem>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
          <SelectItem value="all">All time</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}