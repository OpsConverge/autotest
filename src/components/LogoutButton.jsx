import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const navigate = useNavigate();
  const { setActiveTeam } = useTeam();

  const handleLogout = () => {
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeTeamId');
    localStorage.removeItem('teams');
    
    // Reset team context
    setActiveTeam(null);
    
    // Redirect to landing page
    navigate('/', { replace: true });
  };

  return (
    <Button 
      onClick={handleLogout} 
      variant="outline" 
      size="sm"
      className="text-red-600 hover:text-red-800 hover:bg-red-50 border-red-200 font-medium"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Logout
    </Button>
  );
} 