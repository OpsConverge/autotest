import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, UserPlus, Mail, MoreHorizontal } from "lucide-react";
import TeamInviteModal from '../TeamInviteModal';
import { useTeam } from '../../context/TeamContext';

export default function TeamManagement({ settings, onUpdate }) {
  const { activeTeam } = useTeam();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!activeTeam) return;
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch(`http://localhost:4000/api/teams/${activeTeam.id}/members`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setMembers(data.members || []))
      .finally(() => setLoading(false));
  }, [activeTeam, refresh]);

  const getRoleBadge = (role) => {
    return role === 'admin' 
      ? 'bg-purple-100 text-purple-800 border-purple-200'
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getStatusBadge = (status) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-orange-100 text-orange-800 border-orange-200';
  };

  return (
    <Card className="glass-effect border-0 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            Team Management
          </CardTitle>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700" onClick={() => setShowInviteModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
          <TeamInviteModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            teamId={activeTeam?.id}
            onInvited={() => setRefresh(r => r + 1)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div>Loading members...</div>
          ) : members.length === 0 ? (
            <div>No team members yet.</div>
          ) : members.map((member, idx) => (
            <div key={member.email || idx} className="flex items-center justify-between p-4 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-emerald-500 text-white font-semibold">
                    {member.email ? member.email[0].toUpperCase() : '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-slate-900">{member.name || member.email}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-3 h-3" />
                    <span>{member.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={`${getRoleBadge(member.role)} border text-xs`}>
                  {member.role}
                </Badge>
                <Badge className={`${getStatusBadge('active')} border text-xs`}>
                  active
                </Badge>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
          <h4 className="font-semibold text-slate-900 mb-2">Team Permissions</h4>
          <div className="space-y-2 text-sm text-slate-600">
            <p><strong>Admin:</strong> Full access to all features, settings, and team management</p>
            <p><strong>User:</strong> Access to test results, analytics, and AI assistant</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}