import React, { useEffect, useState } from "react";
import { TeamSettings } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Settings as SettingsIcon, 
  Bell,
  Save,
  Shield,
  User as UserIcon
} from "lucide-react";

import NotificationSettings from "../components/settings/NotificationSettings";
import TeamManagement from "../components/settings/TeamManagement";
import { useTeam } from '../context/TeamContext';

export default function Settings() {
  const { activeTeam } = useTeam();
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [refreshMembers, setRefreshMembers] = useState(0);
  
  console.log('[Settings] Component rendered, activeTeam:', activeTeam);
  console.log('[Settings] localStorage.activeTeamId:', localStorage.getItem('activeTeamId'));

  useEffect(() => {
    if (activeTeam) {
      loadSettings();
    }
  }, [activeTeam]);

  const loadSettings = async () => {
    console.log('[Settings] Loading settings, activeTeam:', activeTeam);
    setIsLoading(true);
    try {
      const settingsData = await TeamSettings.list();
      console.log('[Settings] Settings data received:', settingsData);
      if (settingsData.length > 0) {
        setSettings(settingsData[0]);
      } else {
        console.log('[Settings] No settings found, creating default');
        // Create default settings
        const defaultSettings = {
          team_name: "Team Alpha",
          notification_preferences: {
            failed_tests: true,
            flaky_tests: true,
            coverage_drops: true
          },
          flaky_threshold: 70
        };
        const created = await TeamSettings.create(defaultSettings);
        setSettings(created);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      await TeamSettings.update(settings.id, settings);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
    setIsSaving(false);
  };

  const updateSettings = (updates) => {
    setSettings(prev => ({
      ...prev,
      ...updates
    }));
  };

  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "team", label: "Team", icon: Shield }
  ];

  if (!activeTeam) return <div>Please select or create a team to continue.</div>;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-emerald-800 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
              Configure your team preferences and platform settings
            </p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-gradient-to-r from-blue-600 to-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Tab Navigation */}
        <Card className="glass-effect border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant={activeTab === id ? "default" : "outline"}
                  onClick={() => setActiveTab(id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="space-y-8">
          {activeTab === "general" && (
            <Card className="glass-effect border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="w-6 h-6 text-blue-600" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="team_name">Team Name</Label>
                    <Input
                      id="team_name"
                      value={settings?.team_name || ''}
                      onChange={(e) => updateSettings({ team_name: e.target.value })}
                      placeholder="Enter team name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flaky_threshold">Flaky Test Threshold (%)</Label>
                    <Input
                      id="flaky_threshold"
                      type="number"
                      min="0"
                      max="100"
                      value={settings?.flaky_threshold || 70}
                      onChange={(e) => updateSettings({ flaky_threshold: parseInt(e.target.value) })}
                    />
                    <p className="text-sm text-slate-500">
                      Tests with a flakiness score above this threshold will be flagged
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <NotificationSettings 
              settings={settings} 
              onUpdate={updateSettings} 
            />
          )}

          {activeTab === "team" && (
            <div className="space-y-8">
              <TeamManagement 
                settings={settings} 
                onUpdate={updateSettings} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}