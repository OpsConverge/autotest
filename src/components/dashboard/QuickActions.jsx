import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, RefreshCw, Calendar, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function QuickActions({ onRefresh }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
        <Play className="w-4 h-4 mr-2" />
        Run Tests
      </Button>
      <Button variant="outline" onClick={onRefresh} className="hover:bg-slate-50">
        <RefreshCw className="w-4 h-4 mr-2" />
        Refresh
      </Button>
      <Button variant="outline" className="hover:bg-slate-50">
        <Calendar className="w-4 h-4 mr-2" />
        Schedule
      </Button>
      <Link to={createPageUrl("Settings")}>
        <Button variant="outline" className="hover:bg-slate-50">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </Link>
    </div>
  );
}