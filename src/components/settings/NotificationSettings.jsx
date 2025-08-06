import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageSquare } from "lucide-react";

export default function NotificationSettings({ settings, onUpdate }) {
  const updateNotificationPreference = (key, value) => {
    onUpdate({
      notification_preferences: {
        ...settings.notification_preferences,
        [key]: value
      }
    });
  };

  return (
    <Card className="glass-effect border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-emerald-600" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <MessageSquare className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <Label htmlFor="failed_tests">Failed Tests</Label>
                <p className="text-sm text-slate-500">Get notified when tests fail</p>
              </div>
            </div>
            <Switch
              id="failed_tests"
              checked={settings?.notification_preferences?.failed_tests || false}
              onCheckedChange={(checked) => updateNotificationPreference('failed_tests', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <MessageSquare className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <Label htmlFor="flaky_tests">Flaky Tests</Label>
                <p className="text-sm text-slate-500">Get notified about flaky test detection</p>
              </div>
            </div>
            <Switch
              id="flaky_tests"
              checked={settings?.notification_preferences?.flaky_tests || false}
              onCheckedChange={(checked) => updateNotificationPreference('flaky_tests', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <MessageSquare className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <Label htmlFor="coverage_drops">Coverage Drops</Label>
                <p className="text-sm text-slate-500">Get notified when coverage decreases</p>
              </div>
            </div>
            <Switch
              id="coverage_drops"
              checked={settings?.notification_preferences?.coverage_drops || false}
              onCheckedChange={(checked) => updateNotificationPreference('coverage_drops', checked)}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-4">Delivery Methods</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-slate-200 bg-white/50">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Email</span>
              </div>
              <p className="text-sm text-slate-600">
                Notifications will be sent to your registered email address
              </p>
            </div>
            <div className="p-4 rounded-lg border border-slate-200 bg-white/50">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <span className="font-medium">Slack</span>
              </div>
              <p className="text-sm text-slate-600">
                Configure Slack webhook in the Integrations tab
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}