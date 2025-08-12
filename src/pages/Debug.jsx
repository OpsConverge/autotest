import React, { useEffect, useState } from 'react';
import { useTeam } from '../context/TeamContext';
import { getApiUrl } from '@/utils';

export default function Debug() {
  const { activeTeam, teams, loading, refreshTeams } = useTeam();
  const [apiResponse, setApiResponse] = useState(null);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    const testAPI = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setApiError('No token found');
        return;
      }

      try {
        const response = await fetch(getApiUrl('teams'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setApiResponse(data);
        } else {
          setApiError(`API Error: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        setApiError(`Network Error: ${error.message}`);
      }
    };

    testAPI();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">TeamContext State</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify({
              activeTeam,
              teams,
              loading,
              teamsCount: teams?.length || 0
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">localStorage</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify({
              token: localStorage.getItem('token') ? 'Present' : 'Missing',
              activeTeamId: localStorage.getItem('activeTeamId'),
              teams: localStorage.getItem('teams'),
              user: localStorage.getItem('user')
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">API Response</h2>
          {apiError ? (
            <div className="text-red-600">{apiError}</div>
          ) : apiResponse ? (
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          ) : (
            <div className="text-gray-500">Loading...</div>
          )}
        </div>

                 <div className="bg-white p-4 rounded-lg shadow">
           <h2 className="text-lg font-semibold mb-2">Analysis</h2>
           <ul className="space-y-2">
             <li>• TeamContext loading: {loading ? 'Yes' : 'No'}</li>
             <li>• Active team: {activeTeam ? `Yes (${activeTeam.name})` : 'No'}</li>
             <li>• Teams count: {teams?.length || 0}</li>
             <li>• Token present: {localStorage.getItem('token') ? 'Yes' : 'No'}</li>
             <li>• activeTeamId in localStorage: {localStorage.getItem('activeTeamId') || 'Missing'}</li>
           </ul>
           <div className="mt-4">
             <button 
               onClick={refreshTeams}
               className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
             >
               Refresh Teams
             </button>
           </div>
         </div>
      </div>
    </div>
  );
}
