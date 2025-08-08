import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Shield, 
  UserPlus, 
  Mail, 
  MoreHorizontal, 
  Edit2, 
  Check, 
  X, 
  Users, 
  Settings,
  Trash2,
  Crown,
  UserCheck,
  UserX,
  ChevronDown
} from "lucide-react";
import TeamInviteModal from '../TeamInviteModal';
import { useTeam } from '../../context/TeamContext';

export default function TeamManagement({ settings, onUpdate }) {
  const { activeTeam, teams, setActiveTeam, setTeams, refreshTeams } = useTeam();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [isLoadingTeamName, setIsLoadingTeamName] = useState(false);
  const [teamNameError, setTeamNameError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingMember, setEditingMember] = useState(null);
  const [removingMember, setRemovingMember] = useState(null);

  useEffect(() => {
    if (!activeTeam) return;
    loadMembers();
  }, [activeTeam, refresh]);

  const loadMembers = async () => {
    if (!activeTeam) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/teams/${activeTeam.id}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      } else {
        console.error('Failed to load members');
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusBadge = (status) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-orange-100 text-orange-800 border-orange-200';
  };

  const handleEditTeamName = () => {
    setIsEditingTeamName(true);
    setNewTeamName(activeTeam?.name || '');
    setTeamNameError('');
  };

  const handleCancelTeamName = () => {
    setIsEditingTeamName(false);
    setNewTeamName('');
    setTeamNameError('');
  };

  const handleSaveTeamName = async () => {
    if (!newTeamName.trim()) {
      setTeamNameError('Team name cannot be empty');
      return;
    }

    if (newTeamName.trim().length > 100) {
      setTeamNameError('Team name cannot exceed 100 characters');
      return;
    }

    if (newTeamName.trim() === activeTeam?.name) {
      setIsEditingTeamName(false);
      return;
    }

    setIsLoadingTeamName(true);
    setTeamNameError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/teams/${activeTeam.id}/name`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newTeamName.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update team name');
      }

      const result = await response.json();
      
      // Update the active team in context
      const updatedTeam = { ...activeTeam, name: result.team.name };
      const updatedTeams = teams.map(team => 
        team.id === activeTeam.id ? updatedTeam : team
      );
      
      setActiveTeam(updatedTeam);
      setTeams(updatedTeams);
      localStorage.setItem('teams', JSON.stringify(updatedTeams));
      
      setIsEditingTeamName(false);
      setSuccess('Team name updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setTeamNameError(err.message || 'Failed to update team name');
    } finally {
      setIsLoadingTeamName(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveTeamName();
    } else if (e.key === 'Escape') {
      handleCancelTeamName();
    }
  };

  const canEditTeam = activeTeam?.role && ['owner', 'admin'].includes(activeTeam.role);

  const handleUpdateMemberRole = async (memberEmail, newRole) => {
    if (!activeTeam) return;
    
    try {
      const token = localStorage.getItem('token');
      // First, we need to get the user ID from the email
      const userResponse = await fetch(`http://localhost:4000/api/users/by-email/${encodeURIComponent(memberEmail)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to find user');
      }
      
      const userData = await userResponse.json();
      
      const response = await fetch(`http://localhost:4000/api/teams/${activeTeam.id}/members/${userData.user.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update member role');
      }

      setSuccess(`Member role updated to ${newRole}`);
      setTimeout(() => setSuccess(''), 3000);
      setEditingMember(null);
      loadMembers(); // Refresh the members list
    } catch (err) {
      console.error('Error updating member role:', err);
      setSuccess(`Error: ${err.message}`);
      setTimeout(() => setSuccess(''), 5000);
    }
  };

  const handleRemoveMember = async (memberEmail) => {
    if (!activeTeam) return;
    
    try {
      const token = localStorage.getItem('token');
      // First, we need to get the user ID from the email
      const userResponse = await fetch(`http://localhost:4000/api/users/by-email/${encodeURIComponent(memberEmail)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to find user');
      }
      
      const userData = await userResponse.json();
      
      const response = await fetch(`http://localhost:4000/api/teams/${activeTeam.id}/members/${userData.user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove member');
      }

      setSuccess('Member removed successfully');
      setTimeout(() => setSuccess(''), 3000);
      setRemovingMember(null);
      loadMembers(); // Refresh the members list
    } catch (err) {
      console.error('Error removing member:', err);
      setSuccess(`Error: ${err.message}`);
      setTimeout(() => setSuccess(''), 5000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Team Information */}
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            Team Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <Check className="w-4 h-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              {isEditingTeamName ? (
                <div className="flex items-center gap-2">
                  <Input
                    id="team-name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1"
                    maxLength={100}
                    disabled={isLoadingTeamName}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSaveTeamName}
                    disabled={isLoadingTeamName}
                    className="h-9 w-9 p-0 hover:bg-green-50 hover:text-green-600"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelTeamName}
                    disabled={isLoadingTeamName}
                    className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    id="team-name"
                    value={activeTeam?.name || ''}
                    readOnly
                    className="flex-1"
                  />
                  {canEditTeam && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleEditTeamName}
                      className="h-9 w-9 p-0 hover:bg-slate-100 hover:text-slate-700"
                      title="Edit team name"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
              {teamNameError && (
                <p className="text-xs text-red-500">{teamNameError}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Team Role</Label>
              <div className="flex items-center gap-2">
                <Badge className={`${getRoleBadge(activeTeam?.role)} border`}>
                  {activeTeam?.role || 'member'}
                </Badge>
                {activeTeam?.role === 'owner' && <Crown className="w-4 h-4 text-yellow-500" />}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Teams */}
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Available Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teams.length === 0 ? (
              <p className="text-slate-500">No teams available.</p>
            ) : (
              teams.map((team) => (
                <div
                  key={team.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    team.id === activeTeam?.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-emerald-500 text-white font-semibold">
                        {team.name ? team.name[0].toUpperCase() : 'T'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-slate-900">{team.name}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Badge className={`${getRoleBadge(team.role)} border text-xs`}>
                          {team.role}
                        </Badge>
                        {team.id === activeTeam?.id && (
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {team.id !== activeTeam?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveTeam(team);
                        localStorage.setItem('activeTeamId', team.id);
                      }}
                    >
                      Switch to Team
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-green-600" />
              Team Members
            </CardTitle>
            {canEditTeam && (
              <Button 
                className="bg-gradient-to-r from-blue-600 to-blue-700" 
                onClick={() => setShowInviteModal(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-500">Loading members...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No team members yet.</p>
                {canEditTeam && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowInviteModal(true)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite First Member
                  </Button>
                )}
              </div>
            ) : (
              members.map((member, idx) => (
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
                    {editingMember === member.email ? (
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(newRole) => handleUpdateMemberRole(member.email, newRole)}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="owner">Owner</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingMember(null)}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Badge className={`${getRoleBadge(member.role)} border text-xs`}>
                        {member.role}
                        {member.role === 'owner' && <Crown className="w-3 h-3 ml-1" />}
                      </Badge>
                    )}
                    <Badge className={`${getStatusBadge('active')} border text-xs`}>
                      active
                    </Badge>
                    {canEditTeam && member.role !== 'owner' && editingMember !== member.email && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => setEditingMember(member.email)}
                          title="Edit role"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                          onClick={() => setRemovingMember(member.email)}
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 p-6 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
            <h4 className="font-semibold text-slate-900 mb-2">Team Permissions</h4>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span><strong>Owner:</strong> Full access to all features, settings, and team management</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-500" />
                <span><strong>Admin:</strong> Full access to all features, settings, and team management</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-500" />
                <span><strong>User:</strong> Access to test results, analytics, and AI assistant</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Invite Modal */}
      {showInviteModal && (
        <TeamInviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          teamId={activeTeam?.id}
          onInvited={() => {
            setRefresh(r => r + 1);
            setShowInviteModal(false);
          }}
        />
      )}

      {/* Remove Member Confirmation Dialog */}
      {removingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Remove Member
            </h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to remove <strong>{removingMember}</strong> from the team? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setRemovingMember(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleRemoveMember(removingMember)}
              >
                Remove Member
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}