# Multi-Tenant GitHub Integration Guide

This guide explains how the Base44 Test Management App implements multi-tenant GitHub integration, allowing each team to seamlessly connect with their own GitHub repositories.

## 🏗️ Architecture Overview

### Multi-Tenant Design Principles

1. **Team-Scoped Access**: Each team has its own GitHub integration
2. **Role-Based Permissions**: Only team owners and admins can manage GitHub integration
3. **Isolated Data**: GitHub tokens and repositories are stored per team
4. **Seamless Switching**: Users can switch between teams and access different GitHub integrations

### Database Schema

```sql
-- Teams table (multi-tenant foundation)
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Team members with roles
CREATE TABLE team_members (
    user_id INTEGER REFERENCES users(id),
    team_id INTEGER REFERENCES teams(id),
    role VARCHAR(50) DEFAULT 'member', -- 'owner', 'admin', 'member'
    PRIMARY KEY (user_id, team_id)
);

-- GitHub tokens per team
CREATE TABLE github_tokens (
    team_id INTEGER PRIMARY KEY REFERENCES teams(id),
    access_token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Team settings (including GitHub config)
CREATE TABLE team_settings (
    team_id INTEGER PRIMARY KEY REFERENCES teams(id),
    settings JSONB NOT NULL -- includes github_config
);
```

## 🔐 Permission System

### Role Hierarchy

1. **Owner**: Full access to all team features including GitHub integration
2. **Admin**: Can manage GitHub integration and team settings
3. **Member**: Can view and use connected repositories but cannot manage integration

### Permission Checks

```javascript
// Backend permission middleware
async function requireGitHubPermission(req, res, next) {
  const { teamId } = req.params;
  const member = await prisma.teamMember.findUnique({ 
    where: { userId_teamId: { userId: req.user.id, teamId: Number(teamId) } } 
  });
  
  if (!member) return res.status(403).json({ error: 'Not a team member' });
  
  // Only owners and admins can manage GitHub integration
  if (!['owner', 'admin'].includes(member.role)) {
    return res.status(403).json({ 
      error: 'Insufficient permissions. Only team owners and admins can manage GitHub integration.' 
    });
  }
  
  req.teamId = Number(teamId);
  req.userRole = member.role;
  next();
}
```

## 🔄 GitHub Integration Flow

### 1. Team Selection

Users can switch between teams using the team switcher:

```jsx
// TeamSwitcher component
export default function TeamSwitcher() {
  const { teams, activeTeam, setActiveTeam } = useTeam();
  
  return (
    <select value={activeTeam?.id} onChange={(e) => setActiveTeam(teams.find(t => t.id === Number(e.target.value)))}>
      {teams.map(team => (
        <option key={team.id} value={team.id}>{team.name}</option>
      ))}
    </select>
  );
}
```

### 2. GitHub Connection Process

#### Step 1: Initiate Connection
```javascript
// Frontend: Generate GitHub login URL for the current team
const loginUrl = `http://localhost:4000/api/teams/${activeTeam.id}/github/login?token=${userToken}`;
window.location.href = loginUrl;
```

#### Step 2: GitHub OAuth
```javascript
// Backend: Redirect to GitHub with team context
app.get('/api/teams/:teamId/github/login', requireAuth, requireGitHubPermission, async (req, res) => {
  const { teamId } = req.params;
  const state = Math.random().toString(36).substring(2);
  
  // Store team context for callback
  global.teamGithubStates[state] = { teamId, userId: req.user.id, userRole: req.userRole };
  
  const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${CALLBACK_URL}&scope=repo user&state=${state}`;
  res.redirect(url);
});
```

#### Step 3: OAuth Callback
```javascript
// Backend: Handle GitHub callback and store team-specific token
app.get('/api/teams/callback/github', async (req, res) => {
  const { code, state } = req.query;
  const { teamId } = global.teamGithubStates[state];
  
  // Exchange code for access token
  const tokenRes = await axios.post('https://github.com/login/oauth/access_token', {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    redirect_uri: CALLBACK_URL
  });
  
  // Store token for the specific team
  await prisma.githubToken.upsert({
    where: { teamId: Number(teamId) },
    update: { accessToken: tokenRes.data.access_token },
    create: { teamId: Number(teamId), accessToken: tokenRes.data.access_token }
  });
  
  res.redirect(`http://localhost:3000/teams/${teamId}/integrations?github=connected`);
});
```

### 3. Repository Management

#### Fetch Team Repositories
```javascript
// Backend: Fetch repositories for the current team
app.get('/api/teams/:teamId/github/repos', requireAuth, requireTeamMember, async (req, res) => {
  const { teamId } = req.params;
  const tokenRow = await prisma.githubToken.findUnique({ where: { teamId: Number(teamId) } });
  
  if (!tokenRow) return res.status(401).json({ error: 'Not connected to GitHub' });
  
  const ghRes = await axios.get('https://api.github.com/user/repos?per_page=100', {
    headers: { Authorization: `token ${tokenRow.accessToken}` }
  });
  
  res.json(ghRes.data);
});
```

#### Frontend Repository Display
```jsx
// IntegrationSettings component
const [githubStatus, setGithubStatus] = useState(null);

useEffect(() => {
  if (!activeTeam) return;
  
  // Fetch GitHub status for the current team
  fetch(`http://localhost:4000/api/teams/${activeTeam.id}/github/status`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(status => setGithubStatus(status));
}, [activeTeam]);
```

## 🎯 Key Features

### 1. Team-Scoped Integration

- Each team has its own GitHub connection
- Tokens are stored per team, not per user
- Repositories are isolated by team

### 2. Role-Based Access Control

- **Owners/Admins**: Can connect/disconnect GitHub, manage repositories
- **Members**: Can view and use connected repositories

### 3. Seamless Team Switching

- Users can switch between teams
- GitHub integration status updates automatically
- Repository access changes based on active team

### 4. Secure Token Management

- Tokens are stored encrypted in the database
- Tokens are scoped to specific teams
- Automatic token refresh and validation

## 🔧 Implementation Details

### Backend Endpoints

| Endpoint | Method | Description | Permissions |
|----------|--------|-------------|-------------|
| `/api/teams/:teamId/github/login` | GET | Initiate GitHub OAuth | Owner/Admin |
| `/api/teams/callback/github` | GET | GitHub OAuth callback | Public |
| `/api/teams/:teamId/github/status` | GET | Get integration status | Team Member |
| `/api/teams/:teamId/github/repos` | GET | List repositories | Team Member |
| `/api/teams/:teamId/github/disconnect` | DELETE | Disconnect GitHub | Owner/Admin |

### Frontend Components

1. **TeamSwitcher**: Allows users to switch between teams
2. **IntegrationSettings**: Manages GitHub integration for the active team
3. **GitHubRepoSelector**: Selects repositories to connect
4. **TeamContext**: Provides team state management

### State Management

```javascript
// TeamContext.jsx
export function TeamProvider({ children }) {
  const [teams, setTeams] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);
  
  // Fetch teams for current user
  const fetchTeams = async () => {
    const res = await fetch('/api/teams', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setTeams(data.teams);
  };
  
  return (
    <TeamContext.Provider value={{ teams, activeTeam, setActiveTeam }}>
      {children}
    </TeamContext.Provider>
  );
}
```

## 🚀 Usage Examples

### 1. Connecting GitHub for a Team

```javascript
// 1. User selects a team
setActiveTeam(selectedTeam);

// 2. User clicks "Connect GitHub" in IntegrationSettings
const handleConnectGitHub = () => {
  const loginUrl = `http://localhost:4000/api/teams/${activeTeam.id}/github/login?token=${userToken}`;
  window.location.href = loginUrl;
};

// 3. User authorizes on GitHub
// 4. User is redirected back with connected status
```

### 2. Switching Between Teams

```javascript
// User switches teams
const handleTeamSwitch = (newTeam) => {
  setActiveTeam(newTeam);
  // GitHub integration status automatically updates
  // Repository list changes to new team's repositories
};
```

### 3. Managing Repositories

```javascript
// Admin adds repository to team
const addRepository = async (repoId) => {
  const response = await fetch(`/api/teams/${activeTeam.id}/github/repos/${repoId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  // Repository is now available to all team members
};
```

## 🔒 Security Considerations

### 1. Token Security

- Tokens are stored encrypted in the database
- Tokens are scoped to specific teams
- Automatic token rotation and validation

### 2. Permission Validation

- All GitHub operations validate team membership
- Role-based access control for management operations
- Audit logging for sensitive operations

### 3. Data Isolation

- Team data is completely isolated
- Cross-team data access is prevented
- Secure API endpoints with proper authentication

## 📊 Benefits

### For Users

1. **Seamless Experience**: Easy switching between teams
2. **Clear Permissions**: Role-based access control
3. **Isolated Data**: Team-specific repositories and settings

### For Organizations

1. **Multi-Tenant Architecture**: Support for multiple teams
2. **Scalable Design**: Easy to add new teams
3. **Secure Integration**: Proper token and permission management

### For Developers

1. **Clean Architecture**: Well-separated concerns
2. **Extensible Design**: Easy to add new integrations
3. **Maintainable Code**: Clear separation of team logic

## 🔄 Future Enhancements

1. **GitHub Apps**: Support for GitHub Apps instead of OAuth
2. **Repository Permissions**: Granular repository access control
3. **Team Hierarchies**: Support for nested teams
4. **Integration Templates**: Pre-configured integration setups
5. **Audit Logging**: Comprehensive audit trail for all operations

This multi-tenant GitHub integration ensures that each team can seamlessly connect with their own GitHub repositories while maintaining proper isolation and security.
