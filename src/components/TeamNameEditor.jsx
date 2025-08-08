import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Check, X } from 'lucide-react';

export default function TeamNameEditor({ teamName, teamId, userRole, onTeamNameUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(teamName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Only show edit option for admin/owner roles
  const canEdit = userRole && ['owner', 'admin'].includes(userRole);

  const handleEdit = () => {
    setIsEditing(true);
    setNewName(teamName);
    setError('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewName(teamName);
    setError('');
  };

  const handleSave = async () => {
    if (!newName.trim()) {
      setError('Team name cannot be empty');
      return;
    }

    if (newName.trim().length > 100) {
      setError('Team name cannot exceed 100 characters');
      return;
    }

    if (newName.trim() === teamName) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:4000/api/teams/${teamId}/name`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update team name');
      }

      const result = await response.json();
      onTeamNameUpdate(result.team.name);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update team name');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!canEdit) {
    return (
      <p className="font-semibold text-slate-900 text-sm truncate">
        {teamName || 'Team Alpha'}
      </p>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 relative">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyPress}
          className="h-6 text-sm font-semibold"
          maxLength={100}
          disabled={isLoading}
          autoFocus
        />
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={isLoading}
            className="h-6 w-6 p-0 hover:bg-green-50 hover:text-green-600"
          >
            <Check className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isLoading}
            className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        {error && (
          <p className="text-xs text-red-500 absolute top-full left-0 mt-1 z-10">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <p className="font-semibold text-slate-900 text-sm truncate">
        {teamName || 'Team Alpha'}
      </p>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleEdit}
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 hover:text-slate-700"
        title="Edit team name"
      >
        <Edit2 className="w-3 h-3" />
      </Button>
    </div>
  );
}
