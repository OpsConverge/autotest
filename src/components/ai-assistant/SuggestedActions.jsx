import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  AlertTriangle, 
  TrendingUp, 
  Target,
  Zap,
  FileText
} from "lucide-react";

const suggestions = [
  {
    id: 1,
    title: "Analyze Flaky Tests",
    description: "Identify patterns in test flakiness",
    icon: AlertTriangle,
    prompt: "Analyze my flaky tests and suggest ways to make them more stable. What patterns do you see in the failing tests?"
  },
  {
    id: 2,
    title: "Improve Coverage",
    description: "Get recommendations for better test coverage",
    icon: Target,
    prompt: "How can I improve my test coverage? What areas of my codebase might need more testing?"
  },
  {
    id: 3,
    title: "Performance Optimization",
    description: "Speed up slow tests and builds",
    icon: Zap,
    prompt: "My tests are running slowly. Can you analyze the performance data and suggest optimizations?"
  },
  {
    id: 4,
    title: "Test Strategy",
    description: "Best practices for test automation",
    icon: Lightbulb,
    prompt: "What's the best testing strategy for my project? Should I focus more on unit, integration, or E2E tests?"
  },
  {
    id: 5,
    title: "Failure Analysis",
    description: "Debug recent test failures",
    icon: FileText,
    prompt: "Can you help me understand why my recent tests are failing? What are the most common error patterns?"
  },
  {
    id: 6,
    title: "Trend Analysis",
    description: "Understand test trends over time",
    icon: TrendingUp,
    prompt: "Analyze my testing trends over the past month. Are we improving or declining in quality?"
  }
];

export default function SuggestedActions({ onActionSelect }) {
  return (
    <Card className="glass-effect border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          Suggested Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion.id}
            variant="outline"
            className="w-full text-left justify-start h-auto p-4 hover:bg-slate-50"
            onClick={() => onActionSelect(suggestion.prompt)}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0">
                <suggestion.icon className="w-4 h-4 text-slate-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-900 text-sm">
                  {suggestion.title}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {suggestion.description}
                </p>
              </div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}