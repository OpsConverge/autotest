

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  LayoutDashboard, 
  TestTube, 
  GitBranch, 
  TrendingUp, 
  Settings,
  Sparkles,
  Menu,
  Bell,
  Zap, // Added Zap icon
  AlertTriangle, // Added AlertTriangle icon for Flakiness
  Calendar, // Added Calendar icon for TestScheduling
  LogOut, // Added LogOut icon
  Terminal // Added Terminal icon for Debug
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTeam } from "@/context/TeamContext";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Test Results",
    url: createPageUrl("TestResults"),
    icon: TestTube,
  },
  {
    title: "Release History",
    url: createPageUrl("BuildHistory"),
    icon: GitBranch,
  },
  {
    title: "Analytics",
    url: createPageUrl("Analytics"),
    icon: TrendingUp,
  },
  {
    title: "Flakiness",
    url: createPageUrl("Flakiness"),
    icon: AlertTriangle,
  },
  {
    title: "Test Scheduling",
    url: createPageUrl("TestScheduling"),
    icon: Calendar,
  },
  {
    title: "Integrations", // New navigation item for Integrations
    url: createPageUrl("Integrations"),
    icon: Zap,
  },
  {
    title: "AI Assistant",
    url: createPageUrl("AIAssistant"),
    icon: Sparkles,
  },
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: Settings,
  },
  {
    title: "Debug",
    url: createPageUrl("Debug"),
    icon: Terminal,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, activeTeam, setActiveTeam, teams, setTeams } = useTeam();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
        <style>
          {`
            :root {
              --primary: 219 70% 55%;
              --primary-foreground: 210 40% 98%;
              --secondary: 210 40% 96%;
              --secondary-foreground: 222.2 84% 4.9%;
              --accent: 210 40% 94%;
              --accent-foreground: 222.2 84% 4.9%;
              --muted: 210 40% 98%;
              --muted-foreground: 215.4 16.3% 46.9%;
              --border: 214.3 31.8% 91.4%;
              --background: 0 0% 100%;
              --foreground: 222.2 84% 4.9%;
            }
            
            .glass-effect {
              background: rgba(255, 255, 255, 0.85);
              backdrop-filter: blur(12px);
              border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .gradient-border {
              position: relative;
              border-radius: 12px;
              background: linear-gradient(145deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1));
              padding: 1px;
            }
            
            .gradient-border::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              border-radius: 12px;
              background: linear-gradient(145deg, rgba(59, 130, 246, 0.2), rgba(16, 185, 129, 0.2));
              mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
              mask-composite: xor;
            }
          `}
        </style>
        
        <Sidebar className="border-r-0 glass-effect">
          <SidebarHeader className="border-b border-slate-200/60 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <TestTube className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  TestFlow
                </h2>
                <p className="text-xs text-slate-500 font-medium">AI Test Automation</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
                Platform
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`group relative overflow-hidden rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50 hover:shadow-sm ${
                          location.pathname === item.url 
                            ? 'bg-gradient-to-r from-blue-500/10 to-emerald-500/10 text-blue-700 shadow-sm border border-blue-200/50' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-3">
                          <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                            location.pathname === item.url ? 'text-blue-600' : ''
                          }`} />
                          <span className="font-medium">{item.title}</span>
                          {item.title === "AI Assistant" && (
                            <Badge className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5">
                              New
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
                Quick Stats
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Tests Today</span>
                    <span className="font-bold text-emerald-600">1,247</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Success Rate</span>
                    <span className="font-bold text-blue-600">94.2%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Flaky Tests</span>
                    <span className="font-bold text-orange-600">7</span>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200/60 p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {activeTeam?.name?.charAt(0) || 'T'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">
                  {activeTeam?.name || 'Team Alpha'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {(() => {
                    try {
                      const userData = localStorage.getItem('user');
                      if (!userData) return '';
                      
                      // Check if it's a JSON object or just a string (for backward compatibility)
                      if (userData.startsWith('{')) {
                        const parsed = JSON.parse(userData);
                        return parsed.email || '';
                      } else {
                        // If it's just a string (email), return it directly
                        return userData;
                      }
                    } catch {
                      return '';
                    }
                  })()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100">
                  <Bell className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                  onClick={logout}
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header */}
          <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
                <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  TestFlow
                </h1>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                onClick={logout}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

