


export function createPageUrl(pageName: string) {
    const teamId = localStorage.getItem('activeTeamId');
    if (teamId) {
        return `/teams/${teamId}/${pageName.toLowerCase().replace(/ /g, '-')}`;
    }
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

export function getApiUrl(endpoint: string = '') {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
    return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}