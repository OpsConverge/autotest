


export function createPageUrl(pageName: string) {
    const teamId = localStorage.getItem('activeTeamId');
    console.log('[createPageUrl] pageName:', pageName, 'teamId:', teamId);
    if (teamId) {
        const url = `/teams/${teamId}/${pageName.toLowerCase().replace(/ /g, '-')}`;
        console.log('[createPageUrl] Generated URL:', url);
        return url;
    }
    console.log('[createPageUrl] No teamId found, returning fallback URL');
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

export function getApiUrl(endpoint: string = '') {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}