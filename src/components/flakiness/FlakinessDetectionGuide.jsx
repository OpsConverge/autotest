import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Info,
  Zap
} from "lucide-react";

export default function FlakinessDetectionGuide() {
  return (
    <Card className="glass-effect border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          How Flakiness Detection Works
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              Detection Methods
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700">1</Badge>
                <div>
                  <strong>Inconsistent Results:</strong> Tests that pass and fail with the same code
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">2</Badge>
                <div>
                  <strong>Explicit Flaky Status:</strong> Tests marked as 'flaky' in results
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">3</Badge>
                <div>
                  <strong>Low Pass Rate:</strong> Tests with &lt;50% pass rate (5+ runs)
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">4</Badge>
                <div>
                  <strong>Unstable Trends:</strong> Recent vs older run pattern changes
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              Scoring System
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span><strong>0-30%:</strong> Stable tests</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span><strong>30-60%:</strong> Moderately flaky</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span><strong>60-80%:</strong> Highly flaky</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span><strong>80-100%:</strong> Extremely flaky</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-semibold text-slate-800 mb-2">Configuration Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Minimum Runs:</strong> Tests need at least this many runs to be analyzed
            </div>
            <div>
              <strong>Flakiness Threshold:</strong> Percentage above which tests are considered flaky
            </div>
            <div>
              <strong>Time Range:</strong> Period of test runs to analyze for patterns
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 