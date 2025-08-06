


export function createPageUrl(pageName: string) {
    const teamId = localStorage.getItem('activeTeamId');
    if (teamId) {
        return `/teams/${teamId}/${pageName.toLowerCase().replace(/ /g, '-')}`;
    }
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}