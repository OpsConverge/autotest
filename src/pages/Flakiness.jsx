import React, { useState, useEffect } from "react";
import { TestRun } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Waves,
  RefreshCw,
  Download
} from "lucide-react";
import { subDays } from 'date-fns';

import FlakinessMetrics from "../components/flakiness/FlakinessMetrics";
import FlakinessTestsTable from "../components/flakiness/FlakinessTestsTable";
import FlakinessTrendChart from "../components/flakiness/FlakinessTrendChart";

export default function Flakiness() {
  const [allTestRuns, setAllTestRuns] = useState([]);
  const [flakyTests, setFlakyTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [flakinessConfig, setFlakinessConfig] = useState({
    minRuns: 3,
    flakinessThreshold: 0.3
  });
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadFlakinessData();
  }, []);

  const loadFlakinessData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading flakiness data with config:', {
        timeRange,
        minRuns: flakinessConfig.minRuns,
        flakinessThreshold: flakinessConfig.flakinessThreshold
      });
      
      // Use the new flakiness analysis API with configuration
      const analysisData = await TestRun.analyzeFlakiness(
        timeRange, 
        flakinessConfig.minRuns, 
        flakinessConfig.flakinessThreshold
      );
      
      console.log('Flakiness analysis data:', analysisData);
      console.log('Flaky tests found:', analysisData.flakyTests?.length || 0);
      console.log('Summary:', analysisData.summary);
      
      // Set the flaky tests data
      setFlakyTests(analysisData.flakyTests || []);
      setSummary(analysisData.summary || null);
      
      // For backward compatibility, also set all test runs
      const runsData = await TestRun.list("-created_date", 500);
      console.log('Loaded test runs:', runsData.length, runsData);
      console.log('Test run statuses:', runsData.map(r => r.status));
      setAllTestRuns(runsData);
      
    } catch (error) {
      console.error("Error loading flakiness data:", error);
      setFlakyTests([]);
      setSummary(null);
    }
    setIsLoading(false);
  };
  
  const filterDataByTimeRange = (data) => {
    // Temporarily disable time filtering to debug
    console.log(`No filtering applied - returning all ${data.length} items`);
    return data;
    
    const now = new Date();
    const daysDiff = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "all": Infinity
    };

    const daysBack = daysDiff[timeRange];
    if (!daysBack || daysBack === Infinity) {
      console.log(`No time filtering applied for range: ${timeRange}`);
      return data;
    }

    const cutoffDate = subDays(now, daysBack);
    console.log(`Filtering data: ${data.length} items, cutoff date: ${cutoffDate}, time range: ${timeRange}`);
    
    const filtered = data.filter(item => {
      const itemDate = new Date(item.createdAt || item.last_seen);
      const isIncluded = itemDate >= cutoffDate;
      if (!isIncluded) {
        console.log(`Filtered out item: ${item.testSuite} (${item.status}) - date: ${itemDate}`);
      }
      return isIncluded;
    });
    
    console.log(`After filtering: ${filtered.length} items remain`);
    return filtered;
  };
  
  const filteredRuns = filterDataByTimeRange(allTestRuns);
  const filteredFlakyTests = filterDataByTimeRange(flakyTests);
  
  console.log('Filtered runs:', filteredRuns.length, 'Filtered flaky tests:', filteredFlakyTests.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-orange-800 to-red-800 bg-clip-text text-transparent">
              Flakiness Analysis
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
              Identify and analyze unstable tests in your suite
            </p>
          </div>
          <div className="flex gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 glass-effect">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadFlakinessData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <FlakinessMetrics testRuns={filteredRuns} flakyTests={filteredFlakyTests} isLoading={isLoading} />
        
        {/* Trend Chart */}
        <FlakinessTrendChart testRuns={filteredRuns} isLoading={isLoading} />

        {/* Flaky Tests Table */}
        <Card className="glass-effect border-0 shadow-xl">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Top Flaky Tests
            </h2>
            <FlakinessTestsTable flakyTests={filteredFlakyTests} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}