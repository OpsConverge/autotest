console.log('=== Backend index.js loaded ===');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const { signJwt, hashPassword, comparePassword, requireAuth } = require('./auth');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const PORT = 4000;
const JWT_SECRET = 'dev_secret';

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.options('*', cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(bodyParser.json());

// Helper to get user email from JWT or request
function getUserEmail(req) {
  // Try to get from Authorization header (Bearer token)
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const token = auth.slice(7);
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload.email) return payload.email;
    } catch (e) {}
  }
  // Fallback: try req.body or req.query
  return req.body?.email || req.query?.email || null;
}

// In-memory stores per user
const users = [];
const githubTokens = {}; // { [email]: token }
const teamSettings = {}; // { [email]: settings }

// User registration
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, passwordHash } });
    return res.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (err) {
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signJwt({ id: user.id, email: user.email });
    return res.json({ token, email: user.email });
  } catch (err) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

// GitHub OAuth endpoints (store token per user)
const CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23lilHj2BK7xYltHSf';
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '39ff7a09ab52f50714fba70fbb2965aad0e12309';
const CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:4000/api/github/callback';

// Step 1: Redirect to GitHub OAuth
app.get('/api/github/login', (req, res) => {
  // For demo, pass email as query param (in production, use session/JWT)
  const email = req.query.email;
  if (!email) return res.status(400).send('Missing email');
  const state = Math.random().toString(36).substring(2);
  const scope = 'repo user';
  const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&scope=${scope}&state=${state}&allow_signup=true`;
  // Store email in state for callback (for demo, not secure)
  githubTokens[state] = { email };
  res.redirect(url);
});

// Step 2: GitHub OAuth callback
app.get('/api/github/callback', async (req, res) => {
  const { code, state } = req.query;
  let email = null;
  if (state && githubTokens[state]) {
    email = githubTokens[state].email;
    delete githubTokens[state];
  }
  if (!code || !email) return res.status(400).send('Missing code or email');
  try {
    const tokenRes = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: CALLBACK_URL
    }, {
      headers: { Accept: 'application/json' }
    });
    const access_token = tokenRes.data.access_token;
    console.log('GitHub access token for', email, ':', access_token);
    if (!access_token) return res.status(400).send('No access token');
    githubTokens[email] = access_token;
    // Mark as connected in team settings
    if (!teamSettings[email]) teamSettings[email] = {};
    if (!teamSettings[email].github_config) teamSettings[email].github_config = {};
    teamSettings[email].github_config.is_connected = true;
    res.redirect(`http://localhost:5173/Integrations?github=connected&email=${encodeURIComponent(email)}`);
  } catch (err) {
    res.status(500).send('GitHub OAuth failed');
  }
});

// Step 3: Fetch user repos (using stored token)
app.get('/api/github/repos', async (req, res) => {
  const email = getUserEmail(req);
  const token = githubTokens[email];
  if (!token) return res.status(401).json({ error: 'Not connected to GitHub' });
  try {
    const ghRes = await axios.get('https://api.github.com/user/repos?per_page=100', {
      headers: { Authorization: `token ${token}` }
    });
    res.json(ghRes.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch repos' });
  }
});

// Fetch GitHub Actions workflows for a repo
app.get('/api/github/workflows', async (req, res) => {
  const email = getUserEmail(req);
  const token = githubTokens[email];
  const repoFullName = req.query.repo;
  if (!token || !repoFullName) return res.status(400).json({ error: 'Missing token or repo' });
  try {
    const ghRes = await axios.get(`https://api.github.com/repos/${repoFullName}/actions/workflows`, {
      headers: { Authorization: `token ${token}` }
    });
    res.json(ghRes.data.workflows || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

// Create a new team and add current user as owner
app.post('/api/teams', requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Team name required' });
  try {
    const team = await prisma.team.create({ data: { name } });
    await prisma.teamMember.create({ data: { userId: req.user.id, teamId: team.id, role: 'owner' } });
    return res.json({ team });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create team' });
  }
});

// List teams for current user
app.get('/api/teams', requireAuth, async (req, res) => {
  try {
    const teams = await prisma.teamMember.findMany({
      where: { userId: req.user.id },
      include: { team: true }
    });
    return res.json({ teams: teams.map(tm => ({ ...tm.team, role: tm.role })) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list teams' });
  }
});

// Invite member by email (add as member)
app.post('/api/teams/:teamId/invite', requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      if (!password) return res.status(400).json({ error: 'Password required for new user' });
      const passwordHash = await hashPassword(password);
      user = await prisma.user.create({ data: { email, passwordHash } });
    }
    // Only allow if current user is a member of the team
    const isMember = await prisma.teamMember.findUnique({ where: { userId_teamId: { userId: req.user.id, teamId: Number(teamId) } } });
    if (!isMember) return res.status(403).json({ error: 'Not a team member' });
    // Add as member if not already
    await prisma.teamMember.upsert({
      where: { userId_teamId: { userId: user.id, teamId: Number(teamId) } },
      update: {},
      create: { userId: user.id, teamId: Number(teamId), role: 'member' }
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to invite/add member' });
  }
});

// List team members
app.get('/api/teams/:teamId/members', requireAuth, async (req, res) => {
  const { teamId } = req.params;
  try {
    const members = await prisma.teamMember.findMany({
      where: { teamId: Number(teamId) },
      include: { user: true }
    });
    return res.json({ members: members.map(m => ({ email: m.user.email, role: m.role })) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list members' });
  }
});

// Helper: check if user is a member of the team
async function requireTeamMember(req, res, next) {
  const { teamId } = req.params;
  console.log('[requireTeamMember] Checking membership for user:', req.user.id, 'team:', teamId);
  const member = await prisma.teamMember.findUnique({ where: { userId_teamId: { userId: req.user.id, teamId: Number(teamId) } } });
  console.log('[requireTeamMember] Membership found:', !!member);
  if (!member) return res.status(403).json({ error: 'Not a team member' });
  req.teamId = Number(teamId);
  next();
}

// Get team settings
app.get('/api/teams/:teamId/settings', requireAuth, requireTeamMember, async (req, res) => {
  try {
    let settings = await prisma.teamSettings.findUnique({ where: { teamId: req.teamId } });
    if (!settings) {
      // Create default settings if not exist
      settings = await prisma.teamSettings.create({
        data: {
          teamId: req.teamId,
          settings: {
            team_name: '',
            slack_webhook: '',
            jira_config: { url: '', project_key: '', api_token: '' },
            github_config: { is_connected: false, repositories: [] },
            notification_preferences: { failed_tests: true, flaky_tests: true, coverage_drops: true },
            flaky_threshold: 70
          }
        }
      });
    }
    res.json(settings.settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get team settings' });
  }
});

// Update team settings
app.put('/api/teams/:teamId/settings', requireAuth, requireTeamMember, async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings) return res.status(400).json({ error: 'Missing settings' });
    const updated = await prisma.teamSettings.upsert({
      where: { teamId: req.teamId },
      update: { settings },
      create: { teamId: req.teamId, settings }
    });
    res.json(updated.settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update team settings' });
  }
});

// Create a build for a team
app.post('/api/teams/:teamId/builds', requireAuth, requireTeamMember, async (req, res) => {
  const { version, branch, commitHash, commitMessage, author, status, totalTests, passedTests, failedTests, flakyTests, coveragePercentage, buildDuration, environment } = req.body;
  if (!version || !branch || !commitHash || !status) return res.status(400).json({ error: 'Missing required build fields' });
  try {
    const build = await prisma.build.create({
      data: {
        teamId: req.teamId,
        version,
        branch,
        commitHash,
        commitMessage,
        author,
        status,
        totalTests,
        passedTests,
        failedTests,
        flakyTests,
        coveragePercentage,
        buildDuration,
        environment
      }
    });
    res.json(build);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create build' });
  }
});

// List builds for a team
app.get('/api/teams/:teamId/builds', requireAuth, requireTeamMember, async (req, res) => {
  try {
    const builds = await prisma.build.findMany({
      where: { teamId: req.teamId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(convertBigInts(builds));
  } catch (err) {
    console.error('Error fetching builds:', err); // <-- Add this!
    res.status(500).json({ error: 'Failed to list builds' });
  }
});

// GET /api/teams/:teamId/builds?repo=repoFullName&limit=50
app.get('/api/teams/:teamId/builds', requireAuth, requireTeamMember, async (req, res) => {
  console.log('GET /api/teams/:teamId/builds endpoint hit');
  const { teamId } = req.params;
  const { repo, limit = 50 } = req.query;

  try {
    console.log('Fetching builds for team:', teamId, 'repo:', repo, 'limit:', limit);
    const builds = await prisma.build.findMany({
      where: {
        teamId: parseInt(teamId, 10),
        ...(repo ? { repoFullName: repo } : {})
      },
      include: {
        release: true // Include release information
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit, 10)
    });

    // Convert all BigInts to strings
    const buildsSafe = convertBigInts(builds);

    console.log('Fetched builds:', builds.length);
    res.json(buildsSafe);
  } catch (err) {
    console.error('Error fetching builds:', err);
    res.status(500).json({ error: 'Failed to fetch builds' });
  }
});

// Create a test run for a build
app.post('/api/builds/:buildId/test-runs', requireAuth, async (req, res) => {
  const { buildId } = req.params;
  const { testSuite, testType, status, duration, coveragePercentage, errorMessage, stackTrace, screenshotUrl, aiAnalysis, executionTrigger, environment, branch, commitHash } = req.body;
  if (!testSuite || !testType || !status) return res.status(400).json({ error: 'Missing required test run fields' });
  try {
    // Check build exists and user is a member of the team
    const build = await prisma.build.findUnique({ where: { id: Number(buildId) }, include: { team: true } });
    if (!build) return res.status(404).json({ error: 'Build not found' });
    const member = await prisma.teamMember.findUnique({ where: { userId_teamId: { userId: req.user.id, teamId: build.teamId } } });
    if (!member) return res.status(403).json({ error: 'Not a team member' });
    const testRun = await prisma.testRun.create({
      data: {
        buildId: build.id,
        testSuite,
        testType,
        status,
        duration,
        coveragePercentage,
        errorMessage,
        stackTrace,
        screenshotUrl,
        aiAnalysis,
        executionTrigger,
        environment,
        branch,
        commitHash
      }
    });
    res.json(testRun);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create test run' });
  }
});

// List test runs for a build
app.get('/api/builds/:buildId/test-runs', requireAuth, async (req, res) => {
  const { buildId } = req.params;
  console.log('Fetching test runs for buildId:', buildId);
  try {
    // Check build exists and user is a member of the team
    const build = await prisma.build.findUnique({ where: { id: Number(buildId) }, include: { team: true } });
    console.log('Found build:', build);
    if (!build) return res.status(404).json({ error: 'Build not found' });
    const member = await prisma.teamMember.findUnique({ where: { userId_teamId: { userId: req.user.id, teamId: build.teamId } } });
    console.log('Found member:', member);
    if (!member) return res.status(403).json({ error: 'Not a team member' });
    const testRuns = await prisma.testRun.findMany({
      where: { buildId: build.id },
      orderBy: { createdAt: 'desc' }
    });
    console.log('Found test runs:', testRuns.length, testRuns);
    res.json(convertBigInts(testRuns));
  } catch (err) {
    console.error('Error fetching test runs:', err);
    res.status(500).json({ error: 'Failed to list test runs' });
  }
});

// List all test runs for a team
app.get('/api/teams/:teamId/test-runs', requireAuth, requireTeamMember, async (req, res) => {
  const { teamId } = req.params;
  const { sortBy = '-created_date', limit = 50 } = req.query;
  
  try {
    // Parse sortBy parameter
    let orderBy = { createdAt: 'desc' };
    if (sortBy.startsWith('-')) {
      const field = sortBy.substring(1);
      // Map field names to actual Prisma field names
      const fieldMapping = {
        'created_date': 'createdAt',
        'createdAt': 'createdAt',
        'id': 'id',
        'status': 'status',
        'testSuite': 'testSuite',
        'environment': 'environment'
      };
      const mappedField = fieldMapping[field] || 'createdAt';
      orderBy = { [mappedField]: 'desc' };
    } else {
      const fieldMapping = {
        'created_date': 'createdAt',
        'createdAt': 'createdAt',
        'id': 'id',
        'status': 'status',
        'testSuite': 'testSuite',
        'environment': 'environment'
      };
      const mappedField = fieldMapping[sortBy] || 'createdAt';
      orderBy = { [mappedField]: 'asc' };
    }
    
    // Get all builds for the team first
    const builds = await prisma.build.findMany({
      where: { teamId: Number(teamId) },
      select: { id: true }
    });
    
    const buildIds = builds.map(build => build.id);
    
    // Get test runs for all builds
    const testRuns = await prisma.testRun.findMany({
      where: { buildId: { in: buildIds } },
      orderBy: orderBy,
      take: Number(limit),
      include: {
        build: {
          select: {
            id: true,
            commitHash: true,
            branch: true,
            repoFullName: true,
            createdAt: true,
            releaseId: true
          }
        }
      }
    });
    
    console.log(`Found ${testRuns.length} test runs for team ${teamId}`);
    console.log('Test run statuses:', testRuns.map(r => r.status));
    console.log('Test run status counts:', {
      passed: testRuns.filter(r => r.status === 'passed').length,
      failed: testRuns.filter(r => r.status === 'failed').length,
      flaky: testRuns.filter(r => r.status === 'flaky').length
    });
    
    // Debug: Show sample build information
    if (testRuns.length > 0) {
      console.log('Sample test run build info:', {
        buildId: testRuns[0].buildId,
        build: testRuns[0].build,
        releaseId: testRuns[0].build?.releaseId
      });
    }
    
    // Transform the data to include build information
    const transformedTestRuns = testRuns.map(testRun => ({
      ...testRun,
      buildId: testRun.buildId,
      build: testRun.build
    }));
    
    res.json(transformedTestRuns);
  } catch (err) {
    console.error('Error fetching team test runs:', err);
    res.status(500).json({ error: 'Failed to list test runs' });
  }
});

// Team-scoped GitHub OAuth endpoints
const TEAM_GITHUB_CALLBACK_URL = process.env.TEAM_GITHUB_CALLBACK_URL || 'http://localhost:4000/api/teams/callback/github';

// Step 1: Redirect to GitHub OAuth for a team
app.get('/api/teams/:teamId/github/login', requireAuth, requireTeamMember, async (req, res) => {
  const { teamId } = req.params;
  const state = Math.random().toString(36).substring(2);
  const scope = 'repo user';
  const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(TEAM_GITHUB_CALLBACK_URL)}&scope=${scope}&state=${state}&allow_signup=true`;
  // Store teamId in memory for callback (for demo, not secure)
  if (!global.teamGithubStates) global.teamGithubStates = {};
  global.teamGithubStates[state] = { teamId, userId: req.user.id };
  res.redirect(url);
});

// Step 2: GitHub OAuth callback for a team
app.get('/api/teams/callback/github', async (req, res) => {
  const { code, state } = req.query;
  if (!global.teamGithubStates || !global.teamGithubStates[state]) {
    return res.status(400).send('Invalid state');
  }
  const { teamId } = global.teamGithubStates[state];
  delete global.teamGithubStates[state];
  if (!code || !teamId) return res.status(400).send('Missing code or teamId');
  try {
    const tokenRes = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: TEAM_GITHUB_CALLBACK_URL
    }, {
      headers: { Accept: 'application/json' }
    });
    const access_token = tokenRes.data.access_token;
    if (!access_token) return res.status(400).send('No access token');
    // Store token in DB (GithubToken table)
    await prisma.githubToken.upsert({
      where: { teamId: Number(teamId) },
      update: { accessToken: access_token },
      create: { teamId: Number(teamId), accessToken: access_token }
    });
    // Mark as connected in team settings
    const settings = await prisma.teamSettings.findUnique({ where: { teamId: Number(teamId) } });
    if (settings) {
      const newSettings = { ...settings.settings, github_config: { ...(settings.settings.github_config || {}), is_connected: true } };
      await prisma.teamSettings.update({ where: { teamId: Number(teamId) }, data: { settings: newSettings } });
    }
    res.redirect(`http://localhost:5173/teams/${teamId}/integrations?github=connected`);
  } catch (err) {
    res.status(500).send('GitHub OAuth failed');
  }
});

// Step 3: Fetch team GitHub repos
app.get('/api/teams/:teamId/github/repos', requireAuth, requireTeamMember, async (req, res) => {
  const { teamId } = req.params;
  const tokenRow = await prisma.githubToken.findUnique({ where: { teamId: Number(teamId) } });
  if (!tokenRow) return res.status(401).json({ error: 'Not connected to GitHub' });
  try {
    const ghRes = await axios.get('https://api.github.com/user/repos?per_page=100', {
      headers: { Authorization: `token ${tokenRow.accessToken}` }
    });
    res.json(ghRes.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch repos' });
  }
});

// Step 4: Fetch team GitHub workflows for a repo
app.get('/api/teams/:teamId/github/workflows', requireAuth, requireTeamMember, async (req, res) => {
  const { teamId } = req.params;
  const { repoFullName } = req.query;
  const tokenRow = await prisma.githubToken.findUnique({ where: { teamId: Number(teamId) } });
  if (!tokenRow) return res.status(401).json({ error: 'Not connected to GitHub' });
  try {
    const ghRes = await axios.get(`https://api.github.com/repos/${repoFullName}/actions/workflows`, {
      headers: { Authorization: `token ${tokenRow.accessToken}` }
    });
    res.json(ghRes.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

// Fetch connected GitHub user info for a team
app.get('/api/teams/:teamId/github/user', requireAuth, requireTeamMember, async (req, res) => {
  const { teamId } = req.params;
  const tokenRow = await prisma.githubToken.findUnique({ where: { teamId: Number(teamId) } });
  if (!tokenRow) return res.status(401).json({ error: 'Not connected to GitHub' });
  try {
    const ghRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${tokenRow.accessToken}` }
    });
    res.json(ghRes.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch GitHub user info' });
  }
});

// Required imports


// Helper to get the GitHub OAuth token for a team
async function getGithubTokenForTeam(teamId) {
  // Adjust the model/field names if your schema differs
  const tokenRecord = await prisma.githubToken.findFirst({
    where: { teamId: parseInt(teamId, 10) },
    orderBy: { createdAt: 'desc' } // In case there are multiple, get the latest
  });
  return tokenRecord?.accessToken || null;
}

// Combined sync function for builds and releases
app.post('/api/teams/:teamId/repos/:repoFullName/sync', requireAuth, requireTeamMember, async (req, res) => {
  const { teamId } = req.params;
  const repoFullName = decodeURIComponent(req.params.repoFullName);
  
  try {
    const githubToken = await getGithubTokenForTeam(teamId);
    if (!githubToken) {
      return res.status(400).json({ error: 'GitHub not connected for this team' });
    }

    const [owner, repo] = repoFullName.split('/');
    
    // Step 1: Sync releases first
    console.log('Syncing releases for:', repoFullName);
    const releasesResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/releases`, {
      headers: { Authorization: `token ${githubToken}` }
    });

    const releases = releasesResponse.data;
    let syncedReleases = 0;

    for (const release of releases) {
      // Create or update release
      const releaseRecord = await prisma.release.upsert({
        where: { teamId_tagName: { teamId: Number(teamId), tagName: release.tag_name } },
        update: {
          name: release.name,
          description: release.body,
          commitHash: release.target_commitish,
          isPrerelease: release.prerelease,
          publishedAt: new Date(release.published_at)
        },
        create: {
          teamId: Number(teamId),
          tagName: release.tag_name,
          name: release.name,
          description: release.body,
          commitHash: release.target_commitish,
          isPrerelease: release.prerelease,
          publishedAt: new Date(release.published_at)
        }
      });

      syncedReleases++;
    }



    // Step 2: Sync workflow runs and builds
    console.log('Syncing workflow runs for:', repoFullName);
    const runsResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/actions/runs`, {
      headers: { Authorization: `token ${githubToken}` },
      params: { per_page: 50 }
    });

    const runs = runsResponse.data.workflow_runs;
    let syncedBuilds = 0;

    for (const run of runs) {
      // Check if build already exists
      const existingBuild = await prisma.build.findUnique({
        where: { workflowRunId: BigInt(run.id) }
      });

      if (existingBuild) {
        console.log(`Build for workflow run ${run.id} already exists, skipping`);
        continue;
      }

      // Create new build
      const build = await prisma.build.create({
        data: {
          teamId: Number(teamId),
          version: run.head_sha,
          branch: run.head_branch,
          commitHash: run.head_sha,
          commitMessage: run.head_commit?.message || 'No commit message',
          author: run.head_commit?.author?.name || 'Unknown',
          status: run.conclusion || run.status,
          repoFullName: repoFullName,
          workflowRunId: BigInt(run.id),
          environment: run.environment || 'production'
        }
      });

      const buildId = build.id;
      let testResultsParsed = false;

      // Step 3: Try to fetch and parse artifacts first
      const artifactsResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${run.id}/artifacts`, {
        headers: { Authorization: `token ${githubToken}` }
      });

      const artifacts = artifactsResponse.data.artifacts;
      
      for (const artifact of artifacts) {
        if (artifact.name.toLowerCase().includes('test') || artifact.name.toLowerCase().includes('junit')) {
          const artifactUrl = `https://api.github.com/repos/${owner}/${repo}/actions/artifacts/${artifact.id}/zip`;
          const artifactRes = await axios.get(artifactUrl, {
            headers: { Authorization: `token ${githubToken}` },
            responseType: 'arraybuffer'
          });

          const AdmZip = require('adm-zip');
          const zip = new AdmZip(artifactRes.data);
          const zipEntries = zip.getEntries();

          for (const entry of zipEntries) {
            if (entry.entryName.endsWith('.xml')) {
              const xmlContent = entry.getData().toString('utf8');
              const xml2js = require('xml2js');
              const parser = new xml2js.Parser();
              
              try {
                const result = await parser.parseStringPromise(xmlContent);
                
                // Check if test runs already exist for this build
                const existingTestRuns = await prisma.testRun.findMany({
                  where: { buildId: buildId }
                });

                if (existingTestRuns.length > 0) {
                  console.log(`Test runs already exist for build ${buildId}, skipping artifact parsing`);
                  testResultsParsed = true;
                  break;
                }

                // Loop through test cases and store each as a TestRun
                const testSuites = result.testsuites?.testsuite || [];
                
                // Determine environment based on workflow run
                let environment = 'default';
                if (run.name) {
                  const runName = run.name.toLowerCase();
                  if (runName.includes('test') || runName.includes('unit') || runName.includes('integration')) {
                    environment = 'test';
                  } else if (runName.includes('build') || runName.includes('compile')) {
                    environment = 'build';
                  } else if (runName.includes('deploy') || runName.includes('production')) {
                    environment = 'production';
                  } else if (runName.includes('staging')) {
                    environment = 'staging';
                  } else if (runName.includes('dev') || runName.includes('development')) {
                    environment = 'development';
                  }
                }
                
                for (const suite of testSuites) {
                  const suiteName = suite.$?.name || 'unknown';
                  const testCases = suite.testcase || [];
                  for (const testCase of testCases) {
                    const name = testCase.$?.name || 'unknown';
                    const status = testCase.failure ? 'failed' : 'passed';
                    const duration = testCase.$?.time ? parseFloat(testCase.$.time) : null;
                    
                    // Enhanced error parsing for JUnit XML
                    let errorMessage = null;
                    let stackTrace = null;
                    
                    if (testCase.failure) {
                      const failure = Array.isArray(testCase.failure) ? testCase.failure[0] : testCase.failure;
                      errorMessage = failure._ || failure.message || 'Test failed';
                      
                      // Extract stack trace if available
                      if (failure.stacktrace) {
                        stackTrace = failure.stacktrace;
                      } else if (failure._ && failure._.includes('at ')) {
                        // Try to extract stack trace from error message
                        const lines = failure._.split('\n');
                        const stackLines = lines.filter(line => line.trim().startsWith('at '));
                        if (stackLines.length > 0) {
                          stackTrace = stackLines.join('\n');
                        }
                      }
                    }

                    await prisma.testRun.create({
                      data: {
                        buildId: buildId,
                        testSuite: suiteName,
                        testType: testType,
                        framework: framework,
                        status,
                        duration,
                        errorMessage,
                        stackTrace,
                        environment: environment,
                      }
                    });
                  }
                }
                testResultsParsed = true;
                break;
              } catch (xmlError) {
                console.error('Error parsing XML:', xmlError);
                continue;
              }
            }
          }
          if (testResultsParsed) break;
        }
      }
      
      // Step 4: Calculate and update build stats
      const testRunsForBuild = await prisma.testRun.findMany({
        where: { buildId: buildId }
      });
      
      const totalTests = testRunsForBuild.length;
      const passedTests = testRunsForBuild.filter(tr => tr.status === 'passed').length;
      const failedTests = testRunsForBuild.filter(tr => tr.status === 'failed').length;
      const flakyTests = testRunsForBuild.filter(tr => tr.status === 'flaky').length;
      const avgCoverage = testRunsForBuild.length > 0 
        ? testRunsForBuild.reduce((sum, tr) => sum + (tr.coveragePercentage || 0), 0) / testRunsForBuild.length
        : 0;
      
      // Update build with calculated stats
      await prisma.build.update({
        where: { id: buildId },
        data: {
          totalTests,
          passedTests,
          failedTests,
          flakyTests,
          coveragePercentage: avgCoverage
        }
      });
      
      // Step 5: If no artifact, fetch and parse logs (only if no test runs exist)
      if (!testResultsParsed && testRunsForBuild.length === 0) {
        const jobsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${run.id}/jobs`;
        const jobsRes = await axios.get(jobsUrl, {
          headers: { Authorization: `token ${githubToken}` }
        });
        const jobs = jobsRes.data.jobs;

        for (const job of jobs) {
          const logUrl = `https://api.github.com/repos/${owner}/${repo}/actions/jobs/${job.id}/logs`;
          const logRes = await axios.get(logUrl, {
            headers: { Authorization: `token ${githubToken}` },
            responseType: 'arraybuffer'
          });
          const logText = logRes.data.toString('utf8');
          
          // Determine environment based on job name and workflow
          let environment = 'default';
          if (job.name) {
            const jobName = job.name.toLowerCase();
            if (jobName.includes('test') || jobName.includes('unit') || jobName.includes('integration')) {
              environment = 'test';
            } else if (jobName.includes('build') || jobName.includes('compile')) {
              environment = 'build';
            } else if (jobName.includes('deploy') || jobName.includes('production')) {
              environment = 'production';
            } else if (jobName.includes('staging')) {
              environment = 'staging';
            } else if (jobName.includes('dev') || jobName.includes('development')) {
              environment = 'development';
            }
          }
          
          // Improve test suite naming
          let testSuite = 'unknown';
          if (job.name) {
            // Clean up job name for test suite
            testSuite = job.name.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'unknown';
          }
          
          // Enhanced test type and framework detection from logs
          let testType = 'unknown';
          let framework = 'unknown';
          
          // Framework detection patterns
          const frameworkPatterns = [
            { pattern: /jest/i, name: 'Jest', type: 'unit' },
            { pattern: /mocha/i, name: 'Mocha', type: 'unit' },
            { pattern: /jasmine/i, name: 'Jasmine', type: 'unit' },
            { pattern: /vitest/i, name: 'Vitest', type: 'unit' },
            { pattern: /cypress/i, name: 'Cypress', type: 'e2e' },
            { pattern: /playwright/i, name: 'Playwright', type: 'e2e' },
            { pattern: /selenium/i, name: 'Selenium', type: 'e2e' },
            { pattern: /puppeteer/i, name: 'Puppeteer', type: 'e2e' },
            { pattern: /pytest/i, name: 'PyTest', type: 'unit' },
            { pattern: /unittest/i, name: 'UnitTest', type: 'unit' },
            { pattern: /nose/i, name: 'Nose', type: 'unit' },
            { pattern: /rspec/i, name: 'RSpec', type: 'unit' },
            { pattern: /minitest/i, name: 'Minitest', type: 'unit' },
            { pattern: /junit/i, name: 'JUnit', type: 'unit' },
            { pattern: /testng/i, name: 'TestNG', type: 'unit' },
            { pattern: /spock/i, name: 'Spock', type: 'unit' },
            { pattern: /go test/i, name: 'Go Test', type: 'unit' },
            { pattern: /ginkgo/i, name: 'Ginkgo', type: 'unit' },
            { pattern: /gtest/i, name: 'Google Test', type: 'unit' },
            { pattern: /catch2/i, name: 'Catch2', type: 'unit' },
            { pattern: /boost.test/i, name: 'Boost.Test', type: 'unit' },
            { pattern: /xunit/i, name: 'xUnit', type: 'unit' },
            { pattern: /nunit/i, name: 'NUnit', type: 'unit' },
            { pattern: /mstest/i, name: 'MSTest', type: 'unit' },
            { pattern: /phpunit/i, name: 'PHPUnit', type: 'unit' },
            { pattern: /codeception/i, name: 'Codeception', type: 'unit' },
            { pattern: /karma/i, name: 'Karma', type: 'unit' },
            { pattern: /ava/i, name: 'Ava', type: 'unit' },
            { pattern: /tap/i, name: 'TAP', type: 'unit' },
            { pattern: /tape/i, name: 'Tape', type: 'unit' },
            { pattern: /uvu/i, name: 'UVU', type: 'unit' },
            { pattern: /node:test/i, name: 'Node.js Test', type: 'unit' },
            { pattern: /deno test/i, name: 'Deno Test', type: 'unit' },
            { pattern: /bun test/i, name: 'Bun Test', type: 'unit' }
          ];
          
          // Test type detection patterns
          const testTypePatterns = [
            { pattern: /unit test/i, type: 'unit' },
            { pattern: /integration test/i, type: 'integration' },
            { pattern: /e2e test|end-to-end test/i, type: 'e2e' },
            { pattern: /functional test/i, type: 'functional' },
            { pattern: /performance test|load test|stress test/i, type: 'performance' },
            { pattern: /security test|penetration test/i, type: 'security' },
            { pattern: /accessibility test|a11y test/i, type: 'accessibility' },
            { pattern: /visual test|screenshot test/i, type: 'visual' },
            { pattern: /api test|rest test/i, type: 'api' },
            { pattern: /contract test/i, type: 'contract' },
            { pattern: /smoke test/i, type: 'smoke' },
            { pattern: /regression test/i, type: 'regression' },
            { pattern: /acceptance test/i, type: 'acceptance' },
            { pattern: /bdd test|behavior test/i, type: 'bdd' },
            { pattern: /tdd test/i, type: 'tdd' }
          ];
          
          // Detect framework and test type from logs
          for (const frameworkPattern of frameworkPatterns) {
            if (frameworkPattern.pattern.test(logText)) {
              framework = frameworkPattern.name;
              testType = frameworkPattern.type;
              break;
            }
          }
          
          // If framework not detected, try test type patterns
          if (framework === 'unknown') {
            for (const typePattern of testTypePatterns) {
              if (typePattern.pattern.test(logText)) {
                testType = typePattern.type;
                break;
              }
            }
          }
          
          // Additional detection from job name
          if (job.name) {
            const jobName = job.name.toLowerCase();
            
            // Framework detection from job name
            if (framework === 'unknown') {
              for (const frameworkPattern of frameworkPatterns) {
                if (frameworkPattern.pattern.test(jobName)) {
                  framework = frameworkPattern.name;
                  testType = frameworkPattern.type;
                  break;
                }
              }
            }
            
            // Test type detection from job name
            if (testType === 'unknown') {
              for (const typePattern of testTypePatterns) {
                if (typePattern.pattern.test(jobName)) {
                  testType = typePattern.type;
                  break;
                }
              }
            }
          }
          
          console.log(`Detected framework: ${framework}, test type: ${testType} for job: ${job.name}`);
          
          // Try to extract test suite name from logs
          const testSuiteMatch = logText.match(/FAIL\s+([^\s]+)/);
          if (testSuiteMatch) {
            testSuite = testSuiteMatch[1].replace(/\.test\.js$/, '').replace(/\.spec\.js$/, '');
          }
          
          // Try to extract test name from Jest output
          const testNameMatch = logText.match(/✕\s+(.+?)(?=\n|$)/);
          if (testNameMatch) {
            const testName = testNameMatch[1].trim();
            // Use test name as part of test suite if we don't have a good suite name
            if (testSuite === 'unknown' || testSuite === job.name) {
              testSuite = testName;
            }
          }
          
          console.log(`Processing job: ${job.name}, testSuite: ${testSuite}, environment: ${environment}`);
          
          // More comprehensive test result patterns
          const testResultPatterns = [
            // Jest format from user's logs
            /Test Suites:\s+(\d+) failed, (\d+) total/,
            /Tests:\s+(\d+) failed, (\d+) total/,
            /Test Suites:\s+(\d+) passed, (\d+) total/,
            /Tests:\s+(\d+) passed, (\d+) total/,
            // Jest format
            /Tests:\s+(\d+) failed, (\d+) passed, (\d+) total/,
            /Tests:\s+(\d+) passed, (\d+) failed, (\d+) total/,
            // Jest with different wording
            /(\d+) failed, (\d+) passed, (\d+) total/,
            /(\d+) passed, (\d+) failed, (\d+) total/,
            // Jest summary format
            /Test Suites:\s+(\d+) failed, (\d+) passed, (\d+) total/,
            /Test Suites:\s+(\d+) passed, (\d+) failed, (\d+) total/,
            // Jest with different separators
            /Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/,
            // Mocha format
            /(\d+)\s+passing.*?(\d+)\s+failing/,
            /(\d+)\s+failing.*?(\d+)\s+passing/,
            // Generic test result patterns
            /(\d+)\s+tests?\s+failed/,
            /(\d+)\s+tests?\s+passed/,
            /Failed:\s+(\d+)/,
            /Passed:\s+(\d+)/,
            // GitHub Actions specific patterns
            /Test Results:\s+(\d+) failed, (\d+) passed/,
            /Test Results:\s+(\d+) passed, (\d+) failed/,
            // Look for any numbers that might be test counts
            /(\d+)\s+failed/,
            /(\d+)\s+passed/,
            /(\d+)\s+total/
          ];
          
          let failed = 0, passed = 0, total = 0;
          let testResultsFound = false;
          
          // Try each pattern to find test results
          for (const pattern of testResultPatterns) {
            const match = logText.match(pattern);
            if (match) {
              console.log(`Found test results with pattern: ${pattern.source}`);
              console.log(`Match:`, match);
              
              // Parse based on pattern type
              if (pattern.source.includes('failed') && pattern.source.includes('passed')) {
                if (match[0].includes('failed,') && match[0].includes('passed,')) {
                  failed = parseInt(match[1], 10);
                  passed = parseInt(match[2], 10);
                  total = parseInt(match[3], 10);
                } else {
                  passed = parseInt(match[1], 10);
                  failed = parseInt(match[2], 10);
                  total = parseInt(match[3], 10);
                }
                testResultsFound = true;
                break;
              } else if (pattern.source.includes('failed') && pattern.source.includes('total') && !pattern.source.includes('passed')) {
                // Handle format like "1 failed, 1 total" or "Test Suites: 1 failed, 1 total"
                failed = parseInt(match[1], 10);
                total = parseInt(match[2], 10);
                passed = total - failed;
                testResultsFound = true;
                break;
              } else if (pattern.source.includes('passed') && pattern.source.includes('total') && !pattern.source.includes('failed')) {
                // Handle format like "1 passed, 1 total" or "Test Suites: 1 passed, 1 total"
                passed = parseInt(match[1], 10);
                total = parseInt(match[2], 10);
                failed = total - passed;
                testResultsFound = true;
                break;
              } else if (pattern.source.includes('passing') && pattern.source.includes('failing')) {
                if (match[0].includes('passing')) {
                  passed = parseInt(match[1], 10);
                  failed = parseInt(match[2], 10);
                } else {
                  failed = parseInt(match[1], 10);
                  passed = parseInt(match[2], 10);
                }
                total = passed + failed;
                testResultsFound = true;
                break;
              } else if (pattern.source.includes('Failed:')) {
                failed = parseInt(match[1], 10);
                // Look for passed count separately
                const passedMatch = logText.match(/Passed:\s+(\d+)/);
                if (passedMatch) {
                  passed = parseInt(passedMatch[1], 10);
                  total = passed + failed;
                  testResultsFound = true;
                  break;
                }
              } else if (pattern.source.includes('Passed:')) {
                passed = parseInt(match[1], 10);
                // Look for failed count separately
                const failedMatch = logText.match(/Failed:\s+(\d+)/);
                if (failedMatch) {
                  failed = parseInt(failedMatch[1], 10);
                  total = passed + failed;
                  testResultsFound = true;
                  break;
                }
              }
            }
          }
          
          // If no structured test results found, try to detect failures from log content
          if (!testResultsFound) {
            console.log('No structured test results found, checking for failure indicators...');
            
            // Look for failure indicators in the logs
            const failureIndicators = [
              /FAILED/gi,
              /✗/g,
              /❌/g,
              /Error:/gi,
              /Exception:/gi,
              /AssertionError:/gi,
              /Test failed:/gi,
              /expect\(.+\)\.toBe\(.+\)/gi,
              /expect\(.+\)\.toEqual\(.+\)/gi
            ];
            
            let failureCount = 0;
            for (const indicator of failureIndicators) {
              const matches = logText.match(indicator);
              if (matches) {
                failureCount += matches.length;
              }
            }
            
            if (failureCount > 0) {
              console.log(`Found ${failureCount} failure indicators in logs`);
              failed = failureCount;
              passed = 0;
              total = failureCount;
              testResultsFound = true;
            }
          }
          
          console.log(`Parsed test results: failed=${failed}, passed=${passed}, total=${total}, found=${testResultsFound}`);

          if (testResultsFound) {
            // Store summary TestRuns only if none exist
            if (passed > 0) {
              await prisma.testRun.create({
                data: {
                  buildId,
                  testSuite: testSuite,
                  testType: 'unknown',
                  status: 'passed',
                  duration: null,
                  errorMessage: null,
                  environment: environment,
                }
              });
            }
            if (failed > 0) {
              // Enhanced log parsing for detailed error information
              let errorDetails = 'Failed tests detected in logs';
              let stackTrace = null;
              
              // Look for more comprehensive error patterns in the logs
              const errorPatterns = [
                // Jest specific patterns from user's logs
                /expect\(received\)\.toBe\(expected\)/gi,
                /Expected:\s*([^\n]+)/gi,
                /Received:\s*([^\n]+)/gi,
                /at Object\.toBe \(([^:]+):(\d+):(\d+)\)/gi,
                /at Object\.\w+ \(([^:]+):(\d+):(\d+)\)/gi,
                // Jest specific patterns
                /expect\(received\)\.toBe\(expected\)/gi,
                /Expected:\s*([^\n]+)/gi,
                /Received:\s*([^\n]+)/gi,
                // Common test failure patterns
                /Error:\s*(.+?)(?=\n|$)/gi,
                /Exception:\s*(.+?)(?=\n|$)/gi,
                /AssertionError:\s*(.+?)(?=\n|$)/gi,
                /Test failed:\s*(.+?)(?=\n|$)/gi,
                /FAILED\s*(.+?)(?=\n|$)/gi,
                /✗\s*(.+?)(?=\n|$)/gi,
                /❌\s*(.+?)(?=\n|$)/gi,
                // Jest patterns
                /expect\(.+\)\.toBe\(.+\)/gi,
                /expect\(.+\)\.toEqual\(.+\)/gi,
                // Mocha patterns
                /AssertionError:\s*(.+?)(?=\n|$)/gi,
                // Generic failure patterns
                /failed\s+with\s+error:\s*(.+?)(?=\n|$)/gi,
                /test\s+.*\s+failed:\s*(.+?)(?=\n|$)/gi
              ];
              
              // Find the most detailed error message
              let bestError = null;
              for (const pattern of errorPatterns) {
                const matches = logText.match(pattern);
                if (matches && matches.length > 0) {
                  const match = matches[0];
                  if (!bestError || match.length > bestError.length) {
                    bestError = match;
                  }
                }
              }
              
              // Also look for the specific Jest error format from user's logs
              const jestErrorMatch = logText.match(/expect\(received\)\.toBe\(expected\)[^]*?Expected:\s*([^\n]+)[^]*?Received:\s*([^\n]+)/);
              if (jestErrorMatch) {
                const expected = jestErrorMatch[1];
                const received = jestErrorMatch[2];
                bestError = `expect(received).toBe(expected)\nExpected: ${expected}\nReceived: ${received}`;
              }
              
              if (bestError) {
                errorDetails = bestError.trim();
              }
              
              // Enhanced stack trace extraction with Jest-specific patterns
              const stackTracePatterns = [
                // Jest specific from user's logs: at Object.toBe (tests/math.test.js:19:19)
                /at Object\.toBe \(([^:]+):(\d+):(\d+)\)/g,
                /at Object\.\w+ \(([^:]+):(\d+):(\d+)\)/g,
                // Jest specific: at Object.toBe (file.js:line:column)
                /at\s+Object\.\w+\s+\(([^:]+):(\d+):(\d+)\)/g,
                // Jest specific: at Object.it (file.js:line:column)
                /at\s+Object\.\w+\s+\(([^:]+):(\d+):(\d+)\)/g,
                // Jest specific: at Object.test (file.js:line:column)
                /at\s+Object\.\w+\s+\(([^:]+):(\d+):(\d+)\)/g,
                // Generic JavaScript/TypeScript stack traces
                /(?:at\s+[\w.]+\([^)]+\)\s*\n?)+/g,
                // Python tracebacks
                /(?:File\s+"[^"]+",\s+line\s+\d+,\s+in\s+\w+\s*\n?)+/g,
                // Java stack traces
                /(?:at\s+[\w.]+\.\w+\([^)]+\)\s*\n?)+/g,
                // Go stack traces
                /(?:[\w.]+\([^)]+\)\s*\n?)+/g,
                // Generic stack trace patterns
                /(?:at\s+[\w.]+\([^)]+\)\s*\n?)+/g,
                /(?:in\s+[\w.]+\([^)]+\)\s*\n?)+/g
              ];
              
              for (const pattern of stackTracePatterns) {
                const matches = logText.match(pattern);
                if (matches && matches.length > 0) {
                  // Find the longest stack trace (most detailed)
                  const longestMatch = matches.reduce((longest, current) => 
                    current.length > longest.length ? current : longest
                  );
                  stackTrace = longestMatch.trim();
                  break;
                }
              }
              
              // If no structured stack trace found, try to extract error context
              if (!stackTrace) {
                // Look for Jest-specific error format with line markers
                const jestErrorMatch = logText.match(/(\d+\s+\|\s*\n\s*\d+\s+\|\s*\n\s*>\s*\d+\s+\|\s*[^\n]+)/);
                if (jestErrorMatch) {
                  stackTrace = jestErrorMatch[0];
                } else {
                  // Look for lines around error messages that might contain file/line info
                  const errorLines = logText.split('\n');
                  const errorContext = [];
                  
                  for (let i = 0; i < errorLines.length; i++) {
                    const line = errorLines[i];
                    if (line.includes('Error:') || line.includes('Exception:') || line.includes('FAILED')) {
                      // Add the error line and a few lines before/after for context
                      for (let j = Math.max(0, i - 2); j <= Math.min(errorLines.length - 1, i + 3); j++) {
                        if (errorLines[j].trim()) {
                          errorContext.push(errorLines[j]);
                        }
                      }
                      break;
                    }
                  }
                  
                  if (errorContext.length > 0) {
                    stackTrace = errorContext.join('\n');
                  }
                }
              }
              
              await prisma.testRun.create({
                data: {
                  buildId,
                  testSuite: testSuite,
                  testType: 'unknown',
                  status: 'failed',
                  duration: null,
                  errorMessage: errorDetails,
                  stackTrace,
                  environment: environment,
                }
              });
            }
          } else {
            // Fallback: If no structured test results found but job failed, create a failed test run
            if (job.conclusion === 'failure' || job.conclusion === 'cancelled') {
              console.log(`Job ${job.name} failed but no test results found, creating fallback failed test run`);
              await prisma.testRun.create({
                data: {
                  buildId,
                  testSuite: testSuite,
                  testType: 'unknown',
                  status: 'failed',
                  duration: null,
                  errorMessage: 'Job failed - no structured test results found in logs',
                  stackTrace: null,
                  environment: environment,
                }
              });
            }
          }
        }
      }

      syncedBuilds++;
    }

    // Step 3: Associate builds with releases based on commit ranges
    console.log('Associating builds with releases...');
    
    // Get all releases for this repo, sorted by published date (oldest first)
    const dbReleases = await prisma.release.findMany({
      where: { 
        teamId: Number(teamId)
      },
      orderBy: { publishedAt: 'asc' }
    });

    // Filter out releases without tagName
    const validReleases = dbReleases.filter(release => release.tagName);

    console.log(`Found ${validReleases.length} valid releases to process`);

    // For each release, get the actual commit hash for the tag
    for (let i = 0; i < validReleases.length; i++) {
      const currentRelease = validReleases[i];
      
      try {
        // Get the actual commit hash for this tag
        const tagResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/refs/tags/${currentRelease.tagName}`, {
          headers: { Authorization: `token ${githubToken}` }
        });
        
        const tagCommitHash = tagResponse.data.object.sha;
        console.log(`Release ${currentRelease.tagName} tag points to commit: ${tagCommitHash.substring(0, 8)}`);
        
        // Update the release with the correct commit hash
        await prisma.release.update({
          where: { id: currentRelease.id },
          data: { commitHash: tagCommitHash }
        });
        
        // Update our local copy
        currentRelease.commitHash = tagCommitHash;
      } catch (error) {
        console.error(`Error getting commit hash for tag ${currentRelease.tagName}:`, error.message);
        continue;
      }
    }

    // Step 1: Sort releases chronologically (earliest to latest)
    const sortedReleases = validReleases.sort((a, b) => 
      new Date(a.publishedAt || a.createdAt).getTime() - new Date(b.publishedAt || b.createdAt).getTime()
    );

    console.log('Sorted releases by date:', sortedReleases.map(r => `${r.tagName} (${r.publishedAt || r.createdAt})`));

    // Step 2: Get the first commit in the repo for the initial range
    let firstCommitSha = null;
    try {
      const firstCommitResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`, {
        headers: { Authorization: `token ${githubToken}` },
        params: { per_page: 1 }
      });
      
      if (firstCommitResponse.data.length > 0) {
        // Get the last commit (which is actually the first commit in the repo)
        const allCommitsResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`, {
          headers: { Authorization: `token ${githubToken}` },
          params: { per_page: 1000 } // Get many commits to find the first one
        });
        
        firstCommitSha = allCommitsResponse.data[allCommitsResponse.data.length - 1].sha;
        console.log(`First commit in repo: ${firstCommitSha.substring(0, 8)}`);
      }
    } catch (error) {
      console.error('Error getting first commit:', error.message);
    }

    // Step 3: Associate builds in commit ranges between releases
    for (let i = 0; i < sortedReleases.length; i++) {
      const current = sortedReleases[i];
      const previous = i > 0 ? sortedReleases[i - 1] : null;

      console.log(`\nProcessing release ${current.tagName} (${current.name})`);
      
      const baseSha = previous?.commitHash ?? firstCommitSha;
      const headSha = current.commitHash;

      console.log(`  Range: ${baseSha ? baseSha.substring(0, 8) : 'START'}..${headSha.substring(0, 8)}`);

      let commitShas = [];
      
      if (baseSha && baseSha !== headSha) {
        // Use the GitHub API to get commits between two commits
        try {
          const compareResult = await axios.get(`https://api.github.com/repos/${owner}/${repo}/compare/${baseSha}...${headSha}`, {
            headers: { Authorization: `token ${githubToken}` }
          });
          
          commitShas = compareResult.data.commits.map(c => c.sha);
          console.log(`  Found ${commitShas.length} commits in range`);
        } catch (error) {
          console.error(`  Error comparing commits: ${error.message}`);
          continue;
        }
      } else if (!baseSha) {
        // For the first release, get commits up to the release commit
        try {
          const commitsResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`, {
            headers: { Authorization: `token ${githubToken}` },
            params: {
              sha: headSha,
              per_page: 100
            }
          });
          
          commitShas = commitsResponse.data.map(c => c.sha);
          console.log(`  Found ${commitShas.length} commits up to release`);
        } catch (error) {
          console.error(`  Error getting commits: ${error.message}`);
          continue;
        }
      }

      // Associate builds with this release (only unassociated builds)
      if (commitShas.length > 0) {
        const updatedBuilds = await prisma.build.updateMany({
          where: {
            teamId: Number(teamId),
            repoFullName: repoFullName,
            commitHash: { in: commitShas },
            releaseId: null // prevent re-linking already associated builds
          },
          data: {
            releaseId: current.id
          }
        });
        
        console.log(`  Associated ${updatedBuilds.count} builds with ${current.tagName}`);
        
        // Log which commits were associated
        if (updatedBuilds.count > 0) {
          const associatedBuilds = await prisma.build.findMany({
            where: {
              teamId: Number(teamId),
              repoFullName: repoFullName,
              releaseId: current.id
            },
            select: { commitHash: true }
          });
          
          console.log(`  Associated commits: ${associatedBuilds.map(b => b.commitHash.substring(0, 8)).join(', ')}`);
        }
      }
    }



    // Step 4: Final verification - show all builds and their associations
    console.log('\n=== FINAL BUILD ASSOCIATIONS ===');
    const finalBuilds = await prisma.build.findMany({
      where: {
        teamId: Number(teamId),
        repoFullName: repoFullName
      },
      include: {
        release: {
          select: {
            tagName: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by release for better visibility
    const byRelease = {};
    finalBuilds.forEach(build => {
      const releaseName = build.release?.tagName || 'UNRELEASED';
      if (!byRelease[releaseName]) byRelease[releaseName] = [];
      byRelease[releaseName].push(build.commitHash.substring(0, 8));
    });

    console.log('Builds grouped by release:');
    Object.entries(byRelease).forEach(([release, commits]) => {
      console.log(`  ${release}: ${commits.length} builds (${commits.join(', ')})`);
    });
    console.log('=== END FINAL ASSOCIATIONS ===\n');

    res.json({ 
      success: true, 
      syncedReleases, 
      syncedBuilds, 
      totalReleases: releases.length,
      totalRuns: runs.length 
    });
  } catch (err) {
    console.error('Combined sync error:', err);
    res.status(500).json({ error: 'Failed to sync builds and releases' });
  }
});



// Properly associate builds with releases based on commit ranges
app.post('/api/teams/:teamId/repos/:repoFullName/associate-releases', requireAuth, requireTeamMember, async (req, res) => {
  const { teamId } = req.params;
  const repoFullName = decodeURIComponent(req.params.repoFullName);
  
  try {
    const githubToken = await getGithubTokenForTeam(teamId);
    if (!githubToken) {
      return res.status(400).json({ error: 'GitHub not connected for this team' });
    }

    const [owner, repo] = repoFullName.split('/');
    
    // Step 1: Get all releases for this repo, sorted by published date (oldest first)
    const releases = await prisma.release.findMany({
      where: { 
        teamId: Number(teamId)
      },
      orderBy: { publishedAt: 'asc' }
    });

    // Filter out releases without tagName
    const validReleases = releases.filter(release => release.tagName);

    console.log(`Found ${validReleases.length} valid releases to process`);

    // Step 2: For each release, get the actual commit hash for the tag
    for (let i = 0; i < validReleases.length; i++) {
      const currentRelease = validReleases[i];
      
      try {
        // Get the actual commit hash for this tag
        const tagResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/refs/tags/${currentRelease.tagName}`, {
          headers: { Authorization: `token ${githubToken}` }
        });
        
        const tagCommitHash = tagResponse.data.object.sha;
        console.log(`Release ${currentRelease.tagName} tag points to commit: ${tagCommitHash.substring(0, 8)}`);
        
        // Update the release with the correct commit hash
        await prisma.release.update({
          where: { id: currentRelease.id },
          data: { commitHash: tagCommitHash }
        });
        
        // Update our local copy
        currentRelease.commitHash = tagCommitHash;
      } catch (error) {
        console.error(`Error getting commit hash for tag ${currentRelease.tagName}:`, error.message);
        // Skip this release if we can't get its commit hash
        continue;
      }
    }

    // Step 3: For each release, find commits between this release and the previous one
    for (let i = 0; i < validReleases.length; i++) {
      const currentRelease = validReleases[i];
      const previousRelease = i > 0 ? validReleases[i - 1] : null;
      
      console.log(`Processing release ${currentRelease.tagName} (${currentRelease.name})`);
      
      let sinceCommit = null;
      let untilCommit = currentRelease.commitHash;
      
      if (previousRelease) {
        sinceCommit = previousRelease.commitHash;
        console.log(`  Range: ${sinceCommit.substring(0, 8)}..${untilCommit.substring(0, 8)}`);
      } else {
        console.log(`  Range: start of repo..${untilCommit.substring(0, 8)}`);
      }

      // Step 3: Get commits in this range
      const commitsParams = {
        sha: untilCommit,
        per_page: 100
      };
      
      let commits = [];
      
      if (sinceCommit) {
        // Use the GitHub API to get commits between two commits
        const commitsResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/compare/${sinceCommit}...${untilCommit}`, {
          headers: { Authorization: `token ${githubToken}` }
        });
        
        commits = commitsResponse.data.commits;
        console.log(`  Found ${commits.length} commits in range`);
      } else {
        // For the first release, get commits up to the release commit
        const commitsResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`, {
          headers: { Authorization: `token ${githubToken}` },
          params: commitsParams
        });
        
        commits = commitsResponse.data;
        console.log(`  Found ${commits.length} commits in range`);
      }

      // Step 4: Associate builds with this release
      let associatedBuilds = 0;
      for (const commit of commits) {
        console.log(`    Processing commit: ${commit.sha.substring(0, 8)} - ${commit.commit.message}`);
        
        const updatedBuilds = await prisma.build.updateMany({
          where: {
            teamId: Number(teamId),
            repoFullName: repoFullName,
            commitHash: commit.sha
          },
          data: {
            releaseId: currentRelease.id
          }
        });
        
        if (updatedBuilds.count > 0) {
          associatedBuilds += updatedBuilds.count;
          console.log(`    Associated ${updatedBuilds.count} builds for commit ${commit.sha.substring(0, 8)}`);
        } else {
          console.log(`    No builds found for commit ${commit.sha.substring(0, 8)}`);
        }
      }

      console.log(`  Total builds associated with ${currentRelease.tagName}: ${associatedBuilds}`);
    }

    // Step 5: Handle unreleased builds (commits after the latest release)
    if (validReleases.length > 0) {
      const latestRelease = validReleases[validReleases.length - 1];
      console.log(`Handling unreleased builds (after ${latestRelease.tagName})`);
      
      // Get commits after the latest release
      const unreleasedCommitsResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`, {
        headers: { Authorization: `token ${githubToken}` },
        params: {
          since: latestRelease.commitHash,
          per_page: 100
        }
      });

      const unreleasedCommits = unreleasedCommitsResponse.data;
      console.log(`Found ${unreleasedCommits.length} unreleased commits`);

      // Remove release association from these builds (make them unreleased)
      for (const commit of unreleasedCommits) {
        await prisma.build.updateMany({
          where: {
            teamId: Number(teamId),
            repoFullName: repoFullName,
            commitHash: commit.sha
          },
          data: {
            releaseId: null
          }
        });
      }
    }

    res.json({ 
      success: true, 
      releasesProcessed: validReleases.length,
      message: 'Successfully associated builds with releases based on commit ranges'
    });
  } catch (err) {
    console.error('Error associating releases:', err);
    res.status(500).json({ error: 'Failed to associate releases' });
  }
});



// Parse test results for existing builds
app.post('/api/teams/:teamId/parse-test-results', requireAuth, requireTeamMember, async (req, res) => {
  const { teamId } = req.params;
  const { repo } = req.body;
  
  try {
    const githubToken = await getGithubTokenForTeam(teamId);
    if (!githubToken) {
      return res.status(400).json({ error: 'GitHub not connected for this team' });
    }

    const [owner, repoName] = repo.split('/');
    
    // Find builds that don't have test runs
    const buildsWithoutTests = await prisma.build.findMany({
      where: { 
        teamId: Number(teamId),
        repoFullName: repo
      },
      include: {
        testRuns: true
      }
    });

    // Filter to only include builds with workflowRunId (GitHub Actions builds)
    const buildsToProcess = buildsWithoutTests.filter(build => 
      build.workflowRunId && build.testRuns.length === 0
    );
    console.log(`Found ${buildsToProcess.length} builds without test results to process`);

    let processedCount = 0;
    let testResultsFound = 0;

    for (const build of buildsToProcess) {
      console.log(`Processing test results for build ${build.id} (workflow run ${build.workflowRunId})`);
      
      let testResultsParsed = false;

      // Try to fetch and parse artifacts first
      try {
        const artifactsResponse = await axios.get(`https://api.github.com/repos/${owner}/${repoName}/actions/runs/${build.workflowRunId}/artifacts`, {
          headers: { Authorization: `token ${githubToken}` }
        });

        const artifacts = artifactsResponse.data.artifacts;
        
        for (const artifact of artifacts) {
          if (artifact.name.toLowerCase().includes('test') || artifact.name.toLowerCase().includes('junit')) {
            const artifactUrl = `https://api.github.com/repos/${owner}/${repoName}/actions/artifacts/${artifact.id}/zip`;
            const artifactRes = await axios.get(artifactUrl, {
              headers: { Authorization: `token ${githubToken}` },
              responseType: 'arraybuffer'
            });

            const AdmZip = require('adm-zip');
            const zip = new AdmZip(artifactRes.data);
            const zipEntries = zip.getEntries();

            for (const entry of zipEntries) {
              if (entry.entryName.endsWith('.xml')) {
                const xmlContent = entry.getData().toString('utf8');
                const xml2js = require('xml2js');
                const parser = new xml2js.Parser();
                
                try {
                  const result = await parser.parseStringPromise(xmlContent);
                  
                  // Loop through test cases and store each as a TestRun
                  const testSuites = result.testsuites?.testsuite || [];
                  for (const suite of testSuites) {
                    const suiteName = suite.$?.name || 'unknown';
                    const testCases = suite.testcase || [];
                    for (const testCase of testCases) {
                      const name = testCase.$?.name || 'unknown';
                      const status = testCase.failure ? 'failed' : 'passed';
                      const duration = testCase.$?.time ? parseFloat(testCase.$.time) : null;
                      const errorMessage = testCase.failure ? (Array.isArray(testCase.failure) ? testCase.failure[0]._ : testCase.failure._) : null;

                      await prisma.testRun.create({
                        data: {
                          buildId: build.id,
                          testSuite: suiteName,
                          testType: 'unit',
                          status,
                          duration,
                          errorMessage,
                          environment: run.environment || 'default',
                        }
                      });
                    }
                  }
                  testResultsParsed = true;
                  testResultsFound++;
                  console.log(`Parsed test results from artifact for build ${build.id}`);
                  break;
                } catch (xmlError) {
                  console.error('Error parsing XML:', xmlError);
                  continue;
                }
              }
            }
            if (testResultsParsed) break;
          }
        }
      } catch (artifactError) {
        console.log(`No artifacts found for build ${build.id}, trying logs`);
      }

      // If no artifacts, try parsing logs
      if (!testResultsParsed) {
        try {
          const jobsUrl = `https://api.github.com/repos/${owner}/${repoName}/actions/runs/${build.workflowRunId}/jobs`;
          const jobsRes = await axios.get(jobsUrl, {
            headers: { Authorization: `token ${githubToken}` }
          });
          const jobs = jobsRes.data.jobs;

          for (const job of jobs) {
            const logUrl = `https://api.github.com/repos/${owner}/${repoName}/actions/jobs/${job.id}/logs`;
            const logRes = await axios.get(logUrl, {
              headers: { Authorization: `token ${githubToken}` },
              responseType: 'arraybuffer'
            });
            const logText = logRes.data.toString('utf8');
            
            // Determine environment based on job name and workflow
            let environment = 'default';
            if (job.name) {
              const jobName = job.name.toLowerCase();
              if (jobName.includes('test') || jobName.includes('unit') || jobName.includes('integration')) {
                environment = 'test';
              } else if (jobName.includes('build') || jobName.includes('compile')) {
                environment = 'build';
              } else if (jobName.includes('deploy') || jobName.includes('production')) {
                environment = 'production';
              } else if (jobName.includes('staging')) {
                environment = 'staging';
              } else if (jobName.includes('dev') || jobName.includes('development')) {
                environment = 'development';
              }
            }
            
            // Improve test suite naming
            let testSuite = 'unknown';
            if (job.name) {
              // Clean up job name for test suite
              testSuite = job.name.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'unknown';
            }
            
            // Enhanced test type and framework detection from logs
            let testType = 'unknown';
            let framework = 'unknown';
            
            // Framework detection patterns
            const frameworkPatterns = [
              { pattern: /jest/i, name: 'Jest', type: 'unit' },
              { pattern: /mocha/i, name: 'Mocha', type: 'unit' },
              { pattern: /jasmine/i, name: 'Jasmine', type: 'unit' },
              { pattern: /vitest/i, name: 'Vitest', type: 'unit' },
              { pattern: /cypress/i, name: 'Cypress', type: 'e2e' },
              { pattern: /playwright/i, name: 'Playwright', type: 'e2e' },
              { pattern: /selenium/i, name: 'Selenium', type: 'e2e' },
              { pattern: /puppeteer/i, name: 'Puppeteer', type: 'e2e' },
              { pattern: /pytest/i, name: 'PyTest', type: 'unit' },
              { pattern: /unittest/i, name: 'UnitTest', type: 'unit' },
              { pattern: /nose/i, name: 'Nose', type: 'unit' },
              { pattern: /rspec/i, name: 'RSpec', type: 'unit' },
              { pattern: /minitest/i, name: 'Minitest', type: 'unit' },
              { pattern: /junit/i, name: 'JUnit', type: 'unit' },
              { pattern: /testng/i, name: 'TestNG', type: 'unit' },
              { pattern: /spock/i, name: 'Spock', type: 'unit' },
              { pattern: /go test/i, name: 'Go Test', type: 'unit' },
              { pattern: /ginkgo/i, name: 'Ginkgo', type: 'unit' },
              { pattern: /gtest/i, name: 'Google Test', type: 'unit' },
              { pattern: /catch2/i, name: 'Catch2', type: 'unit' },
              { pattern: /boost.test/i, name: 'Boost.Test', type: 'unit' },
              { pattern: /xunit/i, name: 'xUnit', type: 'unit' },
              { pattern: /nunit/i, name: 'NUnit', type: 'unit' },
              { pattern: /mstest/i, name: 'MSTest', type: 'unit' },
              { pattern: /phpunit/i, name: 'PHPUnit', type: 'unit' },
              { pattern: /codeception/i, name: 'Codeception', type: 'unit' },
              { pattern: /karma/i, name: 'Karma', type: 'unit' },
              { pattern: /ava/i, name: 'Ava', type: 'unit' },
              { pattern: /tap/i, name: 'TAP', type: 'unit' },
              { pattern: /tape/i, name: 'Tape', type: 'unit' },
              { pattern: /uvu/i, name: 'UVU', type: 'unit' },
              { pattern: /node:test/i, name: 'Node.js Test', type: 'unit' },
              { pattern: /deno test/i, name: 'Deno Test', type: 'unit' },
              { pattern: /bun test/i, name: 'Bun Test', type: 'unit' }
            ];
            
            // Test type detection patterns
            const testTypePatterns = [
              { pattern: /unit test/i, type: 'unit' },
              { pattern: /integration test/i, type: 'integration' },
              { pattern: /e2e test|end-to-end test/i, type: 'e2e' },
              { pattern: /functional test/i, type: 'functional' },
              { pattern: /performance test|load test|stress test/i, type: 'performance' },
              { pattern: /security test|penetration test/i, type: 'security' },
              { pattern: /accessibility test|a11y test/i, type: 'accessibility' },
              { pattern: /visual test|screenshot test/i, type: 'visual' },
              { pattern: /api test|rest test/i, type: 'api' },
              { pattern: /contract test/i, type: 'contract' },
              { pattern: /smoke test/i, type: 'smoke' },
              { pattern: /regression test/i, type: 'regression' },
              { pattern: /acceptance test/i, type: 'acceptance' },
              { pattern: /bdd test|behavior test/i, type: 'bdd' },
              { pattern: /tdd test/i, type: 'tdd' }
            ];
            
            // Detect framework and test type from logs
            for (const frameworkPattern of frameworkPatterns) {
              if (frameworkPattern.pattern.test(logText)) {
                framework = frameworkPattern.name;
                testType = frameworkPattern.type;
                break;
              }
            }
            
            // If framework not detected, try test type patterns
            if (framework === 'unknown') {
              for (const typePattern of testTypePatterns) {
                if (typePattern.pattern.test(logText)) {
                  testType = typePattern.type;
                  break;
                }
              }
            }
            
            // Additional detection from job name
            if (job.name) {
              const jobName = job.name.toLowerCase();
              
              // Framework detection from job name
              if (framework === 'unknown') {
                for (const frameworkPattern of frameworkPatterns) {
                  if (frameworkPattern.pattern.test(jobName)) {
                    framework = frameworkPattern.name;
                    testType = frameworkPattern.type;
                    break;
                  }
                }
              }
              
              // Test type detection from job name
              if (testType === 'unknown') {
                for (const typePattern of testTypePatterns) {
                  if (typePattern.pattern.test(jobName)) {
                    testType = typePattern.type;
                    break;
                  }
                }
              }
            }
            
            console.log(`Detected framework: ${framework}, test type: ${testType} for job: ${job.name}`);
            
            // Try to extract test suite name from logs
            const testSuiteMatch = logText.match(/FAIL\s+([^\s]+)/);
            if (testSuiteMatch) {
              testSuite = testSuiteMatch[1].replace(/\.test\.js$/, '').replace(/\.spec\.js$/, '');
            }
            
            // Try to extract test name from Jest output
            const testNameMatch = logText.match(/✕\s+(.+?)(?=\n|$)/);
            if (testNameMatch) {
              const testName = testNameMatch[1].trim();
              // Use test name as part of test suite if we don't have a good suite name
              if (testSuite === 'unknown' || testSuite === job.name) {
                testSuite = testName;
              }
            }
            
            console.log(`Processing job: ${job.name}, testSuite: ${testSuite}, environment: ${environment}`);
            
            // More comprehensive test result patterns
            const testResultPatterns = [
              // Jest format from user's logs
              /Test Suites:\s+(\d+) failed, (\d+) total/,
              /Tests:\s+(\d+) failed, (\d+) total/,
              /Test Suites:\s+(\d+) passed, (\d+) total/,
              /Tests:\s+(\d+) passed, (\d+) total/,
              // Jest format
              /Tests:\s+(\d+) failed, (\d+) passed, (\d+) total/,
              /Tests:\s+(\d+) passed, (\d+) failed, (\d+) total/,
              // Jest with different wording
              /(\d+) failed, (\d+) passed, (\d+) total/,
              /(\d+) passed, (\d+) failed, (\d+) total/,
              // Jest summary format
              /Test Suites:\s+(\d+) failed, (\d+) passed, (\d+) total/,
              /Test Suites:\s+(\d+) passed, (\d+) failed, (\d+) total/,
              // Jest with different separators
              /Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/,
              // Mocha format
              /(\d+)\s+passing.*?(\d+)\s+failing/,
              /(\d+)\s+failing.*?(\d+)\s+passing/,
              // Generic test result patterns
              /(\d+)\s+tests?\s+failed/,
              /(\d+)\s+tests?\s+passed/,
              /Failed:\s+(\d+)/,
              /Passed:\s+(\d+)/,
              // GitHub Actions specific patterns
              /Test Results:\s+(\d+) failed, (\d+) passed/,
              /Test Results:\s+(\d+) passed, (\d+) failed/,
              // Look for any numbers that might be test counts
              /(\d+)\s+failed/,
              /(\d+)\s+passed/,
              /(\d+)\s+total/
            ];
            
            let failed = 0, passed = 0, total = 0;
            let testResultsFound = false;
            
            // Try each pattern to find test results
            for (const pattern of testResultPatterns) {
              const match = logText.match(pattern);
              if (match) {
                console.log(`Found test results with pattern: ${pattern.source}`);
                console.log(`Match:`, match);
                
                // Parse based on pattern type
                if (pattern.source.includes('failed') && pattern.source.includes('passed')) {
                  if (match[0].includes('failed,') && match[0].includes('passed,')) {
                    failed = parseInt(match[1], 10);
                    passed = parseInt(match[2], 10);
                    total = parseInt(match[3], 10);
                  } else {
                    passed = parseInt(match[1], 10);
                    failed = parseInt(match[2], 10);
                    total = parseInt(match[3], 10);
                  }
                  testResultsFound = true;
                  break;
                } else if (pattern.source.includes('failed') && pattern.source.includes('total') && !pattern.source.includes('passed')) {
                  // Handle format like "1 failed, 1 total" or "Test Suites: 1 failed, 1 total"
                  failed = parseInt(match[1], 10);
                  total = parseInt(match[2], 10);
                  passed = total - failed;
                  testResultsFound = true;
                  break;
                } else if (pattern.source.includes('passed') && pattern.source.includes('total') && !pattern.source.includes('failed')) {
                  // Handle format like "1 passed, 1 total" or "Test Suites: 1 passed, 1 total"
                  passed = parseInt(match[1], 10);
                  total = parseInt(match[2], 10);
                  failed = total - passed;
                  testResultsFound = true;
                  break;
                } else if (pattern.source.includes('passing') && pattern.source.includes('failing')) {
                  if (match[0].includes('passing')) {
                    passed = parseInt(match[1], 10);
                    failed = parseInt(match[2], 10);
                  } else {
                    failed = parseInt(match[1], 10);
                    passed = parseInt(match[2], 10);
                  }
                  total = passed + failed;
                  testResultsFound = true;
                  break;
                } else if (pattern.source.includes('Failed:')) {
                  failed = parseInt(match[1], 10);
                  // Look for passed count separately
                  const passedMatch = logText.match(/Passed:\s+(\d+)/);
                  if (passedMatch) {
                    passed = parseInt(passedMatch[1], 10);
                    total = passed + failed;
                    testResultsFound = true;
                    break;
                  }
                } else if (pattern.source.includes('Passed:')) {
                  passed = parseInt(match[1], 10);
                  // Look for failed count separately
                  const failedMatch = logText.match(/Failed:\s+(\d+)/);
                  if (failedMatch) {
                    failed = parseInt(failedMatch[1], 10);
                    total = passed + failed;
                    testResultsFound = true;
                    break;
                  }
                }
              }
            }
            
            // If no structured test results found, try to detect failures from log content
            if (!testResultsFound) {
              console.log('No structured test results found, checking for failure indicators...');
              
              // Look for failure indicators in the logs
              const failureIndicators = [
                /FAILED/gi,
                /✗/g,
                /❌/g,
                /Error:/gi,
                /Exception:/gi,
                /AssertionError:/gi,
                /Test failed:/gi,
                /expect\(.+\)\.toBe\(.+\)/gi,
                /expect\(.+\)\.toEqual\(.+\)/gi
              ];
              
              let failureCount = 0;
              for (const indicator of failureIndicators) {
                const matches = logText.match(indicator);
                if (matches) {
                  failureCount += matches.length;
                }
              }
              
              if (failureCount > 0) {
                console.log(`Found ${failureCount} failure indicators in logs`);
                failed = failureCount;
                passed = 0;
                total = failureCount;
                testResultsFound = true;
              }
            }
            
            console.log(`Parsed test results: failed=${failed}, passed=${passed}, total=${total}, found=${testResultsFound}`);

            if (testResultsFound) {
              // Store summary TestRuns only if none exist
              if (passed > 0) {
                await prisma.testRun.create({
                  data: {
                    buildId,
                    testSuite: testSuite,
                    testType: 'unknown',
                    status: 'passed',
                    duration: null,
                    errorMessage: null,
                    environment: environment,
                  }
                });
              }
              if (failed > 0) {
                // Enhanced log parsing for detailed error information
                let errorDetails = 'Failed tests detected in logs';
                let stackTrace = null;
                
                // Look for more comprehensive error patterns in the logs
                const errorPatterns = [
                  // Jest specific patterns from user's logs
                  /expect\(received\)\.toBe\(expected\)/gi,
                  /Expected:\s*([^\n]+)/gi,
                  /Received:\s*([^\n]+)/gi,
                  /at Object\.toBe \(([^:]+):(\d+):(\d+)\)/gi,
                  /at Object\.\w+ \(([^:]+):(\d+):(\d+)\)/gi,
                  // Jest specific patterns
                  /expect\(received\)\.toBe\(expected\)/gi,
                  /Expected:\s*([^\n]+)/gi,
                  /Received:\s*([^\n]+)/gi,
                  // Common test failure patterns
                  /Error:\s*(.+?)(?=\n|$)/gi,
                  /Exception:\s*(.+?)(?=\n|$)/gi,
                  /AssertionError:\s*(.+?)(?=\n|$)/gi,
                  /Test failed:\s*(.+?)(?=\n|$)/gi,
                  /FAILED\s*(.+?)(?=\n|$)/gi,
                  /✗\s*(.+?)(?=\n|$)/gi,
                  /❌\s*(.+?)(?=\n|$)/gi,
                  // Jest patterns
                  /expect\(.+\)\.toBe\(.+\)/gi,
                  /expect\(.+\)\.toEqual\(.+\)/gi,
                  // Mocha patterns
                  /AssertionError:\s*(.+?)(?=\n|$)/gi,
                  // Generic failure patterns
                  /failed\s+with\s+error:\s*(.+?)(?=\n|$)/gi,
                  /test\s+.*\s+failed:\s*(.+?)(?=\n|$)/gi
                ];
                
                // Find the most detailed error message
                let bestError = null;
                for (const pattern of errorPatterns) {
                  const matches = logText.match(pattern);
                  if (matches && matches.length > 0) {
                    const match = matches[0];
                    if (!bestError || match.length > bestError.length) {
                      bestError = match;
                    }
                  }
                }
                
                // Also look for the specific Jest error format from user's logs
                const jestErrorMatch = logText.match(/expect\(received\)\.toBe\(expected\)[^]*?Expected:\s*([^\n]+)[^]*?Received:\s*([^\n]+)/);
                if (jestErrorMatch) {
                  const expected = jestErrorMatch[1];
                  const received = jestErrorMatch[2];
                  bestError = `expect(received).toBe(expected)\nExpected: ${expected}\nReceived: ${received}`;
                }
                
                if (bestError) {
                  errorDetails = bestError.trim();
                }
                
                // Enhanced stack trace extraction with Jest-specific patterns
                const stackTracePatterns = [
                  // Jest specific from user's logs: at Object.toBe (tests/math.test.js:19:19)
                  /at Object\.toBe \(([^:]+):(\d+):(\d+)\)/g,
                  /at Object\.\w+ \(([^:]+):(\d+):(\d+)\)/g,
                  // Jest specific: at Object.toBe (file.js:line:column)
                  /at\s+Object\.\w+\s+\(([^:]+):(\d+):(\d+)\)/g,
                  // Jest specific: at Object.it (file.js:line:column)
                  /at\s+Object\.\w+\s+\(([^:]+):(\d+):(\d+)\)/g,
                  // Jest specific: at Object.test (file.js:line:column)
                  /at\s+Object\.\w+\s+\(([^:]+):(\d+):(\d+)\)/g,
                  // Generic JavaScript/TypeScript stack traces
                  /(?:at\s+[\w.]+\([^)]+\)\s*\n?)+/g,
                  // Python tracebacks
                  /(?:File\s+"[^"]+",\s+line\s+\d+,\s+in\s+\w+\s*\n?)+/g,
                  // Java stack traces
                  /(?:at\s+[\w.]+\.\w+\([^)]+\)\s*\n?)+/g,
                  // Go stack traces
                  /(?:[\w.]+\([^)]+\)\s*\n?)+/g,
                  // Generic stack trace patterns
                  /(?:at\s+[\w.]+\([^)]+\)\s*\n?)+/g,
                  /(?:in\s+[\w.]+\([^)]+\)\s*\n?)+/g
                ];
                
                for (const pattern of stackTracePatterns) {
                  const matches = logText.match(pattern);
                  if (matches && matches.length > 0) {
                    // Find the longest stack trace (most detailed)
                    const longestMatch = matches.reduce((longest, current) => 
                      current.length > longest.length ? current : longest
                    );
                    stackTrace = longestMatch.trim();
                    break;
                  }
                }
                
                // If no structured stack trace found, try to extract error context
                if (!stackTrace) {
                  // Look for Jest-specific error format with line markers
                  const jestErrorMatch = logText.match(/(\d+\s+\|\s*\n\s*\d+\s+\|\s*\n\s*>\s*\d+\s+\|\s*[^\n]+)/);
                  if (jestErrorMatch) {
                    stackTrace = jestErrorMatch[0];
                  } else {
                    // Look for lines around error messages that might contain file/line info
                    const errorLines = logText.split('\n');
                    const errorContext = [];
                    
                    for (let i = 0; i < errorLines.length; i++) {
                      const line = errorLines[i];
                      if (line.includes('Error:') || line.includes('Exception:') || line.includes('FAILED')) {
                        // Add the error line and a few lines before/after for context
                        for (let j = Math.max(0, i - 2); j <= Math.min(errorLines.length - 1, i + 3); j++) {
                          if (errorLines[j].trim()) {
                            errorContext.push(errorLines[j]);
                          }
                        }
                        break;
                      }
                    }
                    
                    if (errorContext.length > 0) {
                      stackTrace = errorContext.join('\n');
                    }
                  }
                }
                
                await prisma.testRun.create({
                  data: {
                    buildId,
                    testSuite: testSuite,
                    testType: 'unknown',
                    status: 'failed',
                    duration: null,
                    errorMessage: errorDetails,
                    stackTrace,
                    environment: environment,
                  }
                });
              }
            } else {
              // Fallback: If no structured test results found but job failed, create a failed test run
              if (job.conclusion === 'failure' || job.conclusion === 'cancelled') {
                console.log(`Job ${job.name} failed but no test results found, creating fallback failed test run`);
                await prisma.testRun.create({
                  data: {
                    buildId,
                    testSuite: testSuite,
                    testType: 'unknown',
                    status: 'failed',
                    duration: null,
                    errorMessage: 'Job failed - no structured test results found in logs',
                    stackTrace: null,
                    environment: environment,
                  }
                });
              }
            }
          }
        } catch (logError) {
          console.log(`Could not parse logs for build ${build.id}:`, logError.message);
        }
      }

      // Update build stats
      const testRunsForBuild = await prisma.testRun.findMany({
        where: { buildId: build.id }
      });
      
      const totalTests = testRunsForBuild.length;
      const passedTests = testRunsForBuild.filter(tr => tr.status === 'passed').length;
      const failedTests = testRunsForBuild.filter(tr => tr.status === 'failed').length;
      const flakyTests = testRunsForBuild.filter(tr => tr.status === 'flaky').length;
      const avgCoverage = testRunsForBuild.length > 0 
        ? testRunsForBuild.reduce((sum, tr) => sum + (tr.coveragePercentage || 0), 0) / testRunsForBuild.length
        : 0;
      
      await prisma.build.update({
        where: { id: build.id },
        data: {
          totalTests,
          passedTests,
          failedTests,
          flakyTests,
          coveragePercentage: avgCoverage
        }
      });

      processedCount++;
    }

    res.json({ 
      success: true, 
      processedCount,
      testResultsFound,
      totalBuilds: buildsToProcess.length
    });
  } catch (err) {
    console.error('Error parsing test results:', err);
    res.status(500).json({ error: 'Failed to parse test results' });
  }
});

// Endpoint to recalculate stats for existing builds
app.post('/api/teams/:teamId/recalculate-build-stats', requireAuth, requireTeamMember, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { repo } = req.body;
    console.log('Recalculating stats for team:', teamId, 'repo:', repo);
    
    const builds = await prisma.build.findMany({
      where: { 
        teamId: parseInt(teamId, 10),
        ...(repo ? { repoFullName: repo } : {})
      }
    });
    
    console.log(`Found ${builds.length} builds to update`);
    
    let updatedCount = 0;
    for (const build of builds) {
      const testRuns = await prisma.testRun.findMany({
        where: { buildId: build.id }
      });
      
      const totalTests = testRuns.length;
      const passedTests = testRuns.filter(tr => tr.status === 'passed').length;
      const failedTests = testRuns.filter(tr => tr.status === 'failed').length;
      const flakyTests = testRuns.filter(tr => tr.status === 'flaky').length;
      const avgCoverage = testRuns.length > 0 
        ? testRuns.reduce((sum, tr) => sum + (tr.coveragePercentage || 0), 0) / testRuns.length
        : 0;
      
      await prisma.build.update({
        where: { id: build.id },
        data: {
          totalTests,
          passedTests,
          failedTests,
          flakyTests,
          coveragePercentage: avgCoverage
        }
      });
      
      updatedCount++;
      console.log(`Updated build ${build.id} with stats:`, { totalTests, passedTests, failedTests, flakyTests, coveragePercentage: avgCoverage });
    }
    
    res.json({ success: true, updatedCount });
  } catch (err) {
    console.error('Error recalculating build stats:', err);
    res.status(500).json({ error: 'Failed to recalculate build stats' });
  }
});

// List releases for a team
app.get('/api/teams/:teamId/releases', requireAuth, requireTeamMember, async (req, res) => {
  console.log('Releases endpoint called for teamId:', req.teamId);
  try {
    const releases = await prisma.release.findMany({
      where: { teamId: req.teamId },
      orderBy: { publishedAt: 'desc' }
    });

    console.log('Found releases:', releases.length);
    releases.forEach((release, index) => {
      console.log(`Release ${index + 1}:`, {
        id: release.id,
        name: release.name,
        tagName: release.tagName
      });
    });

    res.json(convertBigInts(releases));
  } catch (err) {
    console.error('Error fetching releases:', err);
    res.status(500).json({ error: 'Failed to list releases' });
  }
});

// Check build associations
app.get('/api/teams/:teamId/builds/associations', requireAuth, requireTeamMember, async (req, res) => {
  const { teamId } = req.params;

  try {
    const builds = await prisma.build.findMany({
      where: { teamId: Number(teamId) },
      include: {
        release: {
          select: {
            id: true,
            name: true,
            tagName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const buildAssociations = builds.map(build => ({
      id: build.id,
      commitHash: build.commitHash,
      version: build.version,
      repoFullName: build.repoFullName,
      releaseId: build.releaseId,
      releaseName: build.release?.name,
      releaseTagName: build.release?.tagName
    }));

    res.json(buildAssociations);
  } catch (err) {
    console.error('Error checking build associations:', err);
    res.status(500).json({ error: 'Failed to check build associations' });
  }
});

// Re-parse test results for a specific build
app.post('/api/teams/:teamId/reparse-tests/:buildId', requireAuth, requireTeamMember, async (req, res) => {
  const { teamId, buildId } = req.params;
  
  try {
    const build = await prisma.build.findUnique({
      where: { id: Number(buildId) }
    });
    
    if (!build) {
      return res.status(404).json({ error: 'Build not found' });
    }
    
    // Delete existing test runs for this build
    await prisma.testRun.deleteMany({
      where: { buildId: Number(buildId) }
    });
    
    // Get the GitHub token
    const githubToken = await getGithubTokenForTeam(teamId);
    if (!githubToken) {
      return res.status(401).json({ error: 'GitHub token not found' });
    }
    
    const [owner, repo] = build.repoFullName.split('/');
    
    // Re-parse test results using the enhanced logic
    let testResultsParsed = false;
    
    // Step 1: Try to parse JUnit XML artifacts
    const artifactsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${build.workflowRunId}/artifacts`;
    const artifactsRes = await axios.get(artifactsUrl, {
      headers: { Authorization: `token ${githubToken}` }
    });
    
    for (const artifact of artifactsRes.data.artifacts) {
      if (artifact.name.includes('test') || artifact.name.includes('junit') || artifact.name.includes('coverage')) {
        const artifactUrl = `https://api.github.com/repos/${owner}/${repo}/actions/artifacts/${artifact.id}/zip`;
        const artifactRes = await axios.get(artifactUrl, {
          headers: { Authorization: `token ${githubToken}` },
          responseType: 'arraybuffer'
        });
        
        const AdmZip = require('adm-zip');
        const zip = new AdmZip(artifactRes.data);
        const zipEntries = zip.getEntries();
        
        for (const entry of zipEntries) {
          if (entry.entryName.endsWith('.xml')) {
            const xmlContent = entry.getData().toString('utf8');
            const xml2js = require('xml2js');
            const parser = new xml2js.Parser();
            
            try {
              const result = await parser.parseStringPromise(xmlContent);
              
              // Loop through test cases and store each as a TestRun
              const testSuites = result.testsuites?.testsuite || [];
              for (const suite of testSuites) {
                const suiteName = suite.$?.name || 'unknown';
                const testCases = suite.testcase || [];
                for (const testCase of testCases) {
                  const name = testCase.$?.name || 'unknown';
                  const status = testCase.failure ? 'failed' : 'passed';
                  const duration = testCase.$?.time ? parseFloat(testCase.$.time) : null;
                  
                  // Enhanced error parsing for JUnit XML
                  let errorMessage = null;
                  let stackTrace = null;
                  
                  if (testCase.failure) {
                    const failure = Array.isArray(testCase.failure) ? testCase.failure[0] : testCase.failure;
                    errorMessage = failure._ || failure.message || 'Test failed';
                    
                    // Extract stack trace if available
                    if (failure.stacktrace) {
                      stackTrace = failure.stacktrace;
                    } else if (failure._ && failure._.includes('at ')) {
                      // Try to extract stack trace from error message
                      const lines = failure._.split('\n');
                      const stackLines = lines.filter(line => line.trim().startsWith('at '));
                      if (stackLines.length > 0) {
                        stackTrace = stackLines.join('\n');
                      }
                    }
                  }
                  
                  await prisma.testRun.create({
                    data: {
                      buildId: Number(buildId),
                      testSuite: suiteName,
                      testType: 'unit',
                      status,
                      duration,
                      errorMessage,
                      stackTrace,
                      environment: run.environment || 'default',
                    }
                  });
                }
              }
              testResultsParsed = true;
              break;
            } catch (xmlError) {
              console.error('Error parsing XML:', xmlError);
              continue;
            }
          }
        }
        if (testResultsParsed) break;
      }
    }
    
    // Step 2: If no artifacts, parse logs with enhanced logic
    if (!testResultsParsed) {
      const jobsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${build.workflowRunId}/jobs`;
      const jobsRes = await axios.get(jobsUrl, {
        headers: { Authorization: `token ${githubToken}` }
      });
      const jobs = jobsRes.data.jobs;
      
      for (const job of jobs) {
        const logUrl = `https://api.github.com/repos/${owner}/${repo}/actions/jobs/${job.id}/logs`;
        const logRes = await axios.get(logUrl, {
          headers: { Authorization: `token ${githubToken}` },
          responseType: 'arraybuffer'
        });
        const logText = logRes.data.toString('utf8');
        
        // Determine environment based on job name and workflow
        let environment = 'default';
        if (job.name) {
          const jobName = job.name.toLowerCase();
          if (jobName.includes('test') || jobName.includes('unit') || jobName.includes('integration')) {
            environment = 'test';
          } else if (jobName.includes('build') || jobName.includes('compile')) {
            environment = 'build';
          } else if (jobName.includes('deploy') || jobName.includes('production')) {
            environment = 'production';
          } else if (jobName.includes('staging')) {
            environment = 'staging';
          } else if (jobName.includes('dev') || jobName.includes('development')) {
            environment = 'development';
          }
        }
        
        // Improve test suite naming
        let testSuite = 'unknown';
        if (job.name) {
          // Clean up job name for test suite
          testSuite = job.name.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'unknown';
        }
        
        // Enhanced test type and framework detection from logs
        let testType = 'unknown';
        let framework = 'unknown';
        
        // Framework detection patterns
        const frameworkPatterns = [
          { pattern: /jest/i, name: 'Jest', type: 'unit' },
          { pattern: /mocha/i, name: 'Mocha', type: 'unit' },
          { pattern: /jasmine/i, name: 'Jasmine', type: 'unit' },
          { pattern: /vitest/i, name: 'Vitest', type: 'unit' },
          { pattern: /cypress/i, name: 'Cypress', type: 'e2e' },
          { pattern: /playwright/i, name: 'Playwright', type: 'e2e' },
          { pattern: /selenium/i, name: 'Selenium', type: 'e2e' },
          { pattern: /puppeteer/i, name: 'Puppeteer', type: 'e2e' },
          { pattern: /pytest/i, name: 'PyTest', type: 'unit' },
          { pattern: /unittest/i, name: 'UnitTest', type: 'unit' },
          { pattern: /nose/i, name: 'Nose', type: 'unit' },
          { pattern: /rspec/i, name: 'RSpec', type: 'unit' },
          { pattern: /minitest/i, name: 'Minitest', type: 'unit' },
          { pattern: /junit/i, name: 'JUnit', type: 'unit' },
          { pattern: /testng/i, name: 'TestNG', type: 'unit' },
          { pattern: /spock/i, name: 'Spock', type: 'unit' },
          { pattern: /go test/i, name: 'Go Test', type: 'unit' },
          { pattern: /ginkgo/i, name: 'Ginkgo', type: 'unit' },
          { pattern: /gtest/i, name: 'Google Test', type: 'unit' },
          { pattern: /catch2/i, name: 'Catch2', type: 'unit' },
          { pattern: /boost.test/i, name: 'Boost.Test', type: 'unit' },
          { pattern: /xunit/i, name: 'xUnit', type: 'unit' },
          { pattern: /nunit/i, name: 'NUnit', type: 'unit' },
          { pattern: /mstest/i, name: 'MSTest', type: 'unit' },
          { pattern: /phpunit/i, name: 'PHPUnit', type: 'unit' },
          { pattern: /codeception/i, name: 'Codeception', type: 'unit' },
          { pattern: /karma/i, name: 'Karma', type: 'unit' },
          { pattern: /ava/i, name: 'Ava', type: 'unit' },
          { pattern: /tap/i, name: 'TAP', type: 'unit' },
          { pattern: /tape/i, name: 'Tape', type: 'unit' },
          { pattern: /uvu/i, name: 'UVU', type: 'unit' },
          { pattern: /node:test/i, name: 'Node.js Test', type: 'unit' },
          { pattern: /deno test/i, name: 'Deno Test', type: 'unit' },
          { pattern: /bun test/i, name: 'Bun Test', type: 'unit' }
        ];
        
        // Test type detection patterns
        const testTypePatterns = [
          { pattern: /unit test/i, type: 'unit' },
          { pattern: /integration test/i, type: 'integration' },
          { pattern: /e2e test|end-to-end test/i, type: 'e2e' },
          { pattern: /functional test/i, type: 'functional' },
          { pattern: /performance test|load test|stress test/i, type: 'performance' },
          { pattern: /security test|penetration test/i, type: 'security' },
          { pattern: /accessibility test|a11y test/i, type: 'accessibility' },
          { pattern: /visual test|screenshot test/i, type: 'visual' },
          { pattern: /api test|rest test/i, type: 'api' },
          { pattern: /contract test/i, type: 'contract' },
          { pattern: /smoke test/i, type: 'smoke' },
          { pattern: /regression test/i, type: 'regression' },
          { pattern: /acceptance test/i, type: 'acceptance' },
          { pattern: /bdd test|behavior test/i, type: 'bdd' },
          { pattern: /tdd test/i, type: 'tdd' }
        ];
        
        // Detect framework and test type from logs
        for (const frameworkPattern of frameworkPatterns) {
          if (frameworkPattern.pattern.test(logText)) {
            framework = frameworkPattern.name;
            testType = frameworkPattern.type;
            break;
          }
        }
        
        // If framework not detected, try test type patterns
        if (framework === 'unknown') {
          for (const typePattern of testTypePatterns) {
            if (typePattern.pattern.test(logText)) {
              testType = typePattern.type;
              break;
            }
          }
        }
        
        // Additional detection from job name
        if (job.name) {
          const jobName = job.name.toLowerCase();
          
          // Framework detection from job name
          if (framework === 'unknown') {
            for (const frameworkPattern of frameworkPatterns) {
              if (frameworkPattern.pattern.test(jobName)) {
                framework = frameworkPattern.name;
                testType = frameworkPattern.type;
                break;
              }
            }
          }
          
          // Test type detection from job name
          if (testType === 'unknown') {
            for (const typePattern of testTypePatterns) {
              if (typePattern.pattern.test(jobName)) {
                testType = typePattern.type;
                break;
              }
            }
          }
        }
        
        console.log(`Detected framework: ${framework}, test type: ${testType} for job: ${job.name}`);
        
        // Try to extract test suite name from logs
        const testSuiteMatch = logText.match(/FAIL\s+([^\s]+)/);
        if (testSuiteMatch) {
          testSuite = testSuiteMatch[1].replace(/\.test\.js$/, '').replace(/\.spec\.js$/, '');
        }
        
        // Try to extract test name from Jest output
        const testNameMatch = logText.match(/✕\s+(.+?)(?=\n|$)/);
        if (testNameMatch) {
          const testName = testNameMatch[1].trim();
          // Use test name as part of test suite if we don't have a good suite name
          if (testSuite === 'unknown' || testSuite === job.name) {
            testSuite = testName;
          }
        }
        
        console.log(`Processing job: ${job.name}, testSuite: ${testSuite}, environment: ${environment}`);
        
        // More comprehensive test result patterns
        const testResultPatterns = [
          // Jest format from user's logs
          /Test Suites:\s+(\d+) failed, (\d+) total/,
          /Tests:\s+(\d+) failed, (\d+) total/,
          /Test Suites:\s+(\d+) passed, (\d+) total/,
          /Tests:\s+(\d+) passed, (\d+) total/,
          // Jest format
          /Tests:\s+(\d+) failed, (\d+) passed, (\d+) total/,
          /Tests:\s+(\d+) passed, (\d+) failed, (\d+) total/,
          // Jest with different wording
          /(\d+) failed, (\d+) passed, (\d+) total/,
          /(\d+) passed, (\d+) failed, (\d+) total/,
          // Jest summary format
          /Test Suites:\s+(\d+) failed, (\d+) passed, (\d+) total/,
          /Test Suites:\s+(\d+) passed, (\d+) failed, (\d+) total/,
          // Jest with different separators
          /Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/,
          // Mocha format
          /(\d+)\s+passing.*?(\d+)\s+failing/,
          /(\d+)\s+failing.*?(\d+)\s+passing/,
          // Generic test result patterns
          /(\d+)\s+tests?\s+failed/,
          /(\d+)\s+tests?\s+passed/,
          /Failed:\s+(\d+)/,
          /Passed:\s+(\d+)/,
          // GitHub Actions specific patterns
          /Test Results:\s+(\d+) failed, (\d+) passed/,
          /Test Results:\s+(\d+) passed, (\d+) failed/,
          // Look for any numbers that might be test counts
          /(\d+)\s+failed/,
          /(\d+)\s+passed/,
          /(\d+)\s+total/
        ];
        
        let failed = 0, passed = 0, total = 0;
        let testResultsFound = false;
        
        // Try each pattern to find test results
        for (const pattern of testResultPatterns) {
          const match = logText.match(pattern);
          if (match) {
            console.log(`Found test results with pattern: ${pattern.source}`);
            console.log(`Match:`, match);
            
            // Parse based on pattern type
            if (pattern.source.includes('failed') && pattern.source.includes('passed')) {
              if (match[0].includes('failed,') && match[0].includes('passed,')) {
                failed = parseInt(match[1], 10);
                passed = parseInt(match[2], 10);
                total = parseInt(match[3], 10);
              } else {
                passed = parseInt(match[1], 10);
                failed = parseInt(match[2], 10);
                total = parseInt(match[3], 10);
              }
              testResultsFound = true;
              break;
            } else if (pattern.source.includes('failed') && pattern.source.includes('total') && !pattern.source.includes('passed')) {
              // Handle format like "1 failed, 1 total" or "Test Suites: 1 failed, 1 total"
              failed = parseInt(match[1], 10);
              total = parseInt(match[2], 10);
              passed = total - failed;
              testResultsFound = true;
              break;
            } else if (pattern.source.includes('passed') && pattern.source.includes('total') && !pattern.source.includes('failed')) {
              // Handle format like "1 passed, 1 total" or "Test Suites: 1 passed, 1 total"
              passed = parseInt(match[1], 10);
              total = parseInt(match[2], 10);
              failed = total - passed;
              testResultsFound = true;
              break;
            } else if (pattern.source.includes('passing') && pattern.source.includes('failing')) {
              if (match[0].includes('passing')) {
                passed = parseInt(match[1], 10);
                failed = parseInt(match[2], 10);
              } else {
                failed = parseInt(match[1], 10);
                passed = parseInt(match[2], 10);
              }
              total = passed + failed;
              testResultsFound = true;
              break;
            } else if (pattern.source.includes('Failed:')) {
              failed = parseInt(match[1], 10);
              // Look for passed count separately
              const passedMatch = logText.match(/Passed:\s+(\d+)/);
              if (passedMatch) {
                passed = parseInt(passedMatch[1], 10);
                total = passed + failed;
                testResultsFound = true;
                break;
              }
            } else if (pattern.source.includes('Passed:')) {
              passed = parseInt(match[1], 10);
              // Look for failed count separately
              const failedMatch = logText.match(/Failed:\s+(\d+)/);
              if (failedMatch) {
                failed = parseInt(failedMatch[1], 10);
                total = passed + failed;
                testResultsFound = true;
                break;
              }
            }
          }
        }
        
        // If no structured test results found, try to detect failures from log content
        if (!testResultsFound) {
          console.log('No structured test results found, checking for failure indicators...');
          
          // Look for failure indicators in the logs
          const failureIndicators = [
            /FAILED/gi,
            /✗/g,
            /❌/g,
            /Error:/gi,
            /Exception:/gi,
            /AssertionError:/gi,
            /Test failed:/gi,
            /expect\(.+\)\.toBe\(.+\)/gi,
            /expect\(.+\)\.toEqual\(.+\)/gi
          ];
          
          let failureCount = 0;
          for (const indicator of failureIndicators) {
            const matches = logText.match(indicator);
            if (matches) {
              failureCount += matches.length;
            }
          }
          
          if (failureCount > 0) {
            console.log(`Found ${failureCount} failure indicators in logs`);
            failed = failureCount;
            passed = 0;
            total = failureCount;
            testResultsFound = true;
          }
        }
        
        console.log(`Parsed test results: failed=${failed}, passed=${passed}, total=${total}, found=${testResultsFound}`);

        if (testResultsFound) {
          // Store summary TestRuns only if none exist
          if (passed > 0) {
            await prisma.testRun.create({
              data: {
                buildId,
                testSuite: testSuite,
                testType: 'unknown',
                status: 'passed',
                duration: null,
                errorMessage: null,
                environment: environment,
              }
            });
          }
          if (failed > 0) {
            // Enhanced log parsing for detailed error information
            let errorDetails = 'Failed tests detected in logs';
            let stackTrace = null;
            
            // Look for more comprehensive error patterns in the logs
            const errorPatterns = [
              // Jest specific patterns from user's logs
              /expect\(received\)\.toBe\(expected\)/gi,
              /Expected:\s*([^\n]+)/gi,
              /Received:\s*([^\n]+)/gi,
              /at Object\.toBe \(([^:]+):(\d+):(\d+)\)/gi,
              /at Object\.\w+ \(([^:]+):(\d+):(\d+)\)/gi,
              // Jest specific patterns
              /expect\(received\)\.toBe\(expected\)/gi,
              /Expected:\s*([^\n]+)/gi,
              /Received:\s*([^\n]+)/gi,
              // Common test failure patterns
              /Error:\s*(.+?)(?=\n|$)/gi,
              /Exception:\s*(.+?)(?=\n|$)/gi,
              /AssertionError:\s*(.+?)(?=\n|$)/gi,
              /Test failed:\s*(.+?)(?=\n|$)/gi,
              /FAILED\s*(.+?)(?=\n|$)/gi,
              /✗\s*(.+?)(?=\n|$)/gi,
              /❌\s*(.+?)(?=\n|$)/gi,
              // Jest patterns
              /expect\(.+\)\.toBe\(.+\)/gi,
              /expect\(.+\)\.toEqual\(.+\)/gi,
              // Mocha patterns
              /AssertionError:\s*(.+?)(?=\n|$)/gi,
              // Generic failure patterns
              /failed\s+with\s+error:\s*(.+?)(?=\n|$)/gi,
              /test\s+.*\s+failed:\s*(.+?)(?=\n|$)/gi
            ];
            
            // Find the most detailed error message
            let bestError = null;
            for (const pattern of errorPatterns) {
              const matches = logText.match(pattern);
              if (matches && matches.length > 0) {
                const match = matches[0];
                if (!bestError || match.length > bestError.length) {
                  bestError = match;
                }
              }
            }
            
            // Also look for the specific Jest error format from user's logs
            const jestErrorMatch = logText.match(/expect\(received\)\.toBe\(expected\)[^]*?Expected:\s*([^\n]+)[^]*?Received:\s*([^\n]+)/);
            if (jestErrorMatch) {
              const expected = jestErrorMatch[1];
              const received = jestErrorMatch[2];
              bestError = `expect(received).toBe(expected)\nExpected: ${expected}\nReceived: ${received}`;
            }
            
            if (bestError) {
              errorDetails = bestError.trim();
            }
            
            // Enhanced stack trace extraction with Jest-specific patterns
            const stackTracePatterns = [
              // Jest specific from user's logs: at Object.toBe (tests/math.test.js:19:19)
              /at Object\.toBe \(([^:]+):(\d+):(\d+)\)/g,
              /at Object\.\w+ \(([^:]+):(\d+):(\d+)\)/g,
              // Jest specific: at Object.toBe (file.js:line:column)
              /at\s+Object\.\w+\s+\(([^:]+):(\d+):(\d+)\)/g,
              // Jest specific: at Object.it (file.js:line:column)
              /at\s+Object\.\w+\s+\(([^:]+):(\d+):(\d+)\)/g,
              // Jest specific: at Object.test (file.js:line:column)
              /at\s+Object\.\w+\s+\(([^:]+):(\d+):(\d+)\)/g,
              // Generic JavaScript/TypeScript stack traces
              /(?:at\s+[\w.]+\([^)]+\)\s*\n?)+/g,
              // Python tracebacks
              /(?:File\s+"[^"]+",\s+line\s+\d+,\s+in\s+\w+\s*\n?)+/g,
              // Java stack traces
              /(?:at\s+[\w.]+\.\w+\([^)]+\)\s*\n?)+/g,
              // Go stack traces
              /(?:[\w.]+\([^)]+\)\s*\n?)+/g,
              // Generic stack trace patterns
              /(?:at\s+[\w.]+\([^)]+\)\s*\n?)+/g,
              /(?:in\s+[\w.]+\([^)]+\)\s*\n?)+/g
            ];
            
            for (const pattern of stackTracePatterns) {
              const matches = logText.match(pattern);
              if (matches && matches.length > 0) {
                // Find the longest stack trace (most detailed)
                const longestMatch = matches.reduce((longest, current) => 
                  current.length > longest.length ? current : longest
                );
                stackTrace = longestMatch.trim();
                break;
              }
            }
            
            // If no structured stack trace found, try to extract error context
            if (!stackTrace) {
              // Look for Jest-specific error format with line markers
              const jestErrorMatch = logText.match(/(\d+\s+\|\s*\n\s*\d+\s+\|\s*\n\s*>\s*\d+\s+\|\s*[^\n]+)/);
              if (jestErrorMatch) {
                stackTrace = jestErrorMatch[0];
              } else {
                // Look for lines around error messages that might contain file/line info
                const errorLines = logText.split('\n');
                const errorContext = [];
                
                for (let i = 0; i < errorLines.length; i++) {
                  const line = errorLines[i];
                  if (line.includes('Error:') || line.includes('Exception:') || line.includes('FAILED')) {
                    // Add the error line and a few lines before/after for context
                    for (let j = Math.max(0, i - 2); j <= Math.min(errorLines.length - 1, i + 3); j++) {
                      if (errorLines[j].trim()) {
                        errorContext.push(errorLines[j]);
                      }
                    }
                    break;
                  }
                }
                
                if (errorContext.length > 0) {
                  stackTrace = errorContext.join('\n');
                }
              }
            }
            
            await prisma.testRun.create({
              data: {
                buildId: Number(buildId),
                testSuite: testSuite,
                testType: 'unknown',
                status: 'failed',
                duration: null,
                errorMessage: errorDetails,
                stackTrace,
                environment: environment,
              }
            });
          }
          
          if (passed > 0) {
            await prisma.testRun.create({
              data: {
                buildId: Number(buildId),
                testSuite: testSuite,
                testType: 'unknown',
                status: 'passed',
                duration: null,
                errorMessage: null,
                stackTrace: null,
                environment: environment,
              }
            });
          }
          
          break;
        }
      }
    }
    
    // Step 3: Recalculate build stats
    const updatedTestRuns = await prisma.testRun.findMany({
      where: { buildId: Number(buildId) }
    });
    
    const newTotalTests = updatedTestRuns.length;
    const newPassedTests = updatedTestRuns.filter(tr => tr.status === 'passed').length;
    const newFailedTests = updatedTestRuns.filter(tr => tr.status === 'failed').length;
    const newFlakyTests = updatedTestRuns.filter(tr => tr.status === 'flaky').length;
    const newAvgCoverage = updatedTestRuns.length > 0 
      ? updatedTestRuns.reduce((sum, tr) => sum + (tr.coveragePercentage || 0), 0) / updatedTestRuns.length
      : 0;
    
    await prisma.build.update({
      where: { id: Number(buildId) },
      data: {
        totalTests: newTotalTests,
        passedTests: newPassedTests,
        failedTests: newFailedTests,
        flakyTests: newFlakyTests,
        coveragePercentage: newAvgCoverage
      }
    });
    
    res.json({ 
      success: true, 
      message: 'Test results re-parsed successfully',
      testRuns: updatedTestRuns.length,
      testRunData: convertBigInts(updatedTestRuns)
    });
    
  } catch (error) {
    console.error('Error re-parsing test results:', error);
    res.status(500).json({ error: 'Failed to re-parse test results' });
  }
});

// Simple test endpoint (no auth required for testing)
app.get('/api/test-github-links', async (req, res) => {
  res.json({
    message: 'GitHub link generation test',
    sampleData: {
      repoFullName: 'test/repo',
      commitHash: 'abc123',
      filePath: 'src/test.js',
      lineNumber: 15,
      sampleStackTrace: `at Object.toBe (src/test.js:15:5)
at Object.it (src/test.js:10:3)
> 15 |     expect(2 + 2).toBe(5);`
    }
  });
});

// Debug endpoint to check log parsing
app.get('/api/teams/:teamId/debug-logs/:buildId', requireAuth, requireTeamMember, async (req, res) => {
  const { teamId, buildId } = req.params;
  
  try {
    const build = await prisma.build.findUnique({
      where: { id: Number(buildId) },
      include: { testRuns: true }
    });
    
    if (!build) {
      return res.status(404).json({ error: 'Build not found' });
    }
    
    // Get the GitHub token
    const githubToken = await getGithubTokenForTeam(teamId);
    if (!githubToken) {
      return res.status(401).json({ error: 'GitHub token not found' });
    }
    
    const [owner, repo] = build.repoFullName.split('/');
    
    // Get workflow run details
    const runUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${build.workflowRunId}`;
    const runRes = await axios.get(runUrl, {
      headers: { Authorization: `token ${githubToken}` }
    });
    
    // Get jobs for this run
    const jobsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${build.workflowRunId}/jobs`;
    const jobsRes = await axios.get(jobsUrl, {
      headers: { Authorization: `token ${githubToken}` }
    });
    
    const jobs = jobsRes.data.jobs;
    const logAnalysis = [];
    
    for (const job of jobs) {
      const logUrl = `https://api.github.com/repos/${owner}/${repo}/actions/jobs/${job.id}/logs`;
      const logRes = await axios.get(logUrl, {
        headers: { Authorization: `token ${githubToken}` },
        responseType: 'arraybuffer'
      });
      const logText = logRes.data.toString('utf8');
      
      // Analyze the log content
      const analysis = {
        jobName: job.name,
        logLength: logText.length,
        lines: logText.split('\n').length,
        errorPatterns: [],
        stackTracePatterns: [],
        sampleLines: logText.split('\n').slice(0, 20) // First 20 lines
      };
      
      // Check for error patterns
      const errorPatterns = [
        /Error:/gi, /Exception:/gi, /FAILED/gi, /✗/gi, /❌/gi,
        /expect\(/gi, /AssertionError:/gi
      ];
      
      errorPatterns.forEach(pattern => {
        const matches = logText.match(pattern);
        if (matches) {
          analysis.errorPatterns.push({
            pattern: pattern.source,
            count: matches.length,
            samples: matches.slice(0, 3)
          });
        }
      });
      
      // Check for stack trace patterns
      const stackPatterns = [
        /at\s+[\w.]+\([^)]+\)/gi,
        /File\s+"[^"]+",\s+line\s+\d+/gi,
        /in\s+[\w.]+\([^)]+\)/gi
      ];
      
      stackPatterns.forEach(pattern => {
        const matches = logText.match(pattern);
        if (matches) {
          analysis.stackTracePatterns.push({
            pattern: pattern.source,
            count: matches.length,
            samples: matches.slice(0, 3)
          });
        }
      });
      
      logAnalysis.push(analysis);
    }
    
    res.json({
      build: convertBigInts(build),
      testRuns: convertBigInts(build.testRuns),
      logAnalysis: logAnalysis
    });
    
  } catch (error) {
    console.error('Error debugging logs:', error);
    res.status(500).json({ error: 'Failed to debug logs' });
  }
});

// Get builds grouped by releases
app.get('/api/teams/:teamId/builds/by-releases', requireAuth, requireTeamMember, async (req, res) => {
  const { teamId } = req.params;
  const { repo } = req.query;

  console.log('Fetching builds by releases for team:', teamId, 'repo filter:', repo);

  try {
    // First, let's check what builds exist and their release associations
    const allBuilds = await prisma.build.findMany({
      where: { 
        teamId: Number(teamId),
        ...(repo ? { repoFullName: repo } : {})
      },
      include: {
        release: {
          select: {
            id: true,
            name: true,
            tagName: true
          }
        }
      }
    });

    console.log('All builds in database:');
    allBuilds.forEach(build => {
      console.log(`  Build ${build.id}: commit ${build.commitHash.substring(0, 8)} -> Release: ${build.release?.tagName || 'UNRELEASED'}`);
    });

    const releases = await prisma.release.findMany({
      where: { teamId: Number(teamId) },
      include: {
        builds: {
          where: repo ? { repoFullName: repo } : {},
          include: {
            testRuns: true
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { publishedAt: 'desc' }
    });

    console.log('Found releases:', releases.length);
    releases.forEach((release, index) => {
      console.log(`Release ${index + 1}:`, {
        id: release.id,
        name: release.name,
        tagName: release.tagName,
        buildsCount: release.builds.length,
        builds: release.builds.map(b => ({ 
          id: b.id, 
          repoFullName: b.repoFullName,
          version: b.version 
        }))
      });
    });

    // Calculate test statistics for builds associated with releases
    const releasesWithBuildStats = releases.map(release => {
      const buildsWithStats = release.builds.map(build => {
        const totalTests = build.testRuns.length;
        const passedTests = build.testRuns.filter(run => run.status === 'passed').length;
        const failedTests = build.testRuns.filter(run => run.status === 'failed').length;
        const flakyTests = build.testRuns.filter(run => run.status === 'flaky').length;
        
        console.log(`Release build ${build.id} stats:`, {
          totalTests,
          passedTests,
          failedTests,
          flakyTests,
          testRunsCount: build.testRuns.length
        });

        return {
          ...build,
          totalTests,
          passedTests,
          failedTests,
          flakyTests,
          coveragePercentage: build.coveragePercentage || 0
        };
      });

      return {
        ...release,
        builds: buildsWithStats
      };
    });

    // Also include builds without releases (unreleased builds)
    const unreleasedBuilds = await prisma.build.findMany({
      where: {
        teamId: Number(teamId),
        releaseId: null,
        ...(repo ? { repoFullName: repo } : {})
      },
      include: {
        testRuns: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('Found unreleased builds:', unreleasedBuilds.length);

    // Calculate test statistics for unreleased builds by aggregating test runs
    const unreleasedBuildsWithStats = unreleasedBuilds.map(build => {
      const totalTests = build.testRuns.length;
      const passedTests = build.testRuns.filter(run => run.status === 'passed').length;
      const failedTests = build.testRuns.filter(run => run.status === 'failed').length;
      const flakyTests = build.testRuns.filter(run => run.status === 'flaky').length;
      
      console.log(`Unreleased build ${build.id} stats:`, {
        totalTests,
        passedTests,
        failedTests,
        flakyTests,
        testRunsCount: build.testRuns.length
      });

      return {
        ...build,
        totalTests,
        passedTests,
        failedTests,
        flakyTests,
        coveragePercentage: build.coveragePercentage || 0
      };
    });

    // Calculate test statistics for each release by aggregating build data
    const releasesWithStats = releasesWithBuildStats.map(release => {
      const totalTests = release.builds.reduce((sum, build) => sum + (build.totalTests || 0), 0);
      const passedTests = release.builds.reduce((sum, build) => sum + (build.passedTests || 0), 0);
      const failedTests = release.builds.reduce((sum, build) => sum + (build.failedTests || 0), 0);
      const flakyTests = release.builds.reduce((sum, build) => sum + (build.flakyTests || 0), 0);
      const totalCoverage = release.builds.reduce((sum, build) => sum + (build.coveragePercentage || 0), 0);
      const avgCoverage = release.builds.length > 0 ? totalCoverage / release.builds.length : 0;

      console.log(`Release ${release.tagName} stats:`, {
        builds: release.builds.length,
        totalTests,
        passedTests,
        failedTests,
        flakyTests,
        avgCoverage: avgCoverage.toFixed(1)
      });

      return {
        ...release,
        totalTests,
        passedTests,
        failedTests,
        flakyTests,
        coveragePercentage: avgCoverage
      };
    });

    const result = {
      releases: convertBigInts(releasesWithStats),
      unreleasedBuilds: convertBigInts(unreleasedBuildsWithStats)
    };

    res.json(result);
  } catch (err) {
    console.error('Error fetching builds by releases:', err);
    res.status(500).json({ error: 'Failed to fetch builds by releases' });
  }
});

// Flakiness detection endpoint
app.get('/api/teams/:teamId/flakiness-analysis', requireAuth, requireTeamMember, async (req, res) => {
  const { teamId } = req.params;
  const { timeRange = '30d', minRuns = 3, flakinessThreshold = 0.3 } = req.query;
  
  try {
    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }
    
    // Get all builds for the team in the time range
    const builds = await prisma.build.findMany({
      where: { 
        teamId: Number(teamId),
        createdAt: { gte: startDate }
      },
      select: { id: true, commitHash: true, createdAt: true }
    });
    
    const buildIds = builds.map(build => build.id);
    
    // Get all test runs for these builds
    const testRuns = await prisma.testRun.findMany({
      where: { buildId: { in: buildIds } },
      orderBy: { createdAt: 'desc' },
      include: {
        build: {
          select: {
            id: true,
            commitHash: true,
            branch: true,
            repoFullName: true,
            createdAt: true
          }
        }
      }
    });
    
    console.log(`Flakiness analysis: Found ${testRuns.length} test runs across ${buildIds.length} builds`);
    console.log('Test runs sample:', testRuns.slice(0, 5).map(tr => ({
      id: tr.id,
      testSuite: tr.testSuite,
      environment: tr.environment,
      status: tr.status,
      buildId: tr.buildId
    })));
    
    // Group test runs by test suite and environment
    const testGroups = {};
    testRuns.forEach(testRun => {
      const key = `${testRun.testSuite}-${testRun.environment || 'default'}`;
      if (!testGroups[key]) {
        testGroups[key] = [];
      }
      testGroups[key].push(testRun);
    });
    
    console.log(`Grouped into ${Object.keys(testGroups).length} test groups:`, Object.keys(testGroups));
    
    // Analyze each test group for flakiness
    const flakinessResults = [];
    
    Object.entries(testGroups).forEach(([key, runs]) => {
      console.log(`Analyzing group ${key}: ${runs.length} runs`);
      
      if (runs.length < Number(minRuns)) {
        console.log(`  Skipping ${key}: only ${runs.length} runs (need ${minRuns})`);
        return; // Skip tests with too few runs
      }
      
      const totalRuns = runs.length;
      const passedRuns = runs.filter(r => r.status === 'passed').length;
      const failedRuns = runs.filter(r => r.status === 'failed').length;
      const flakyRuns = runs.filter(r => r.status === 'flaky').length;
      
      console.log(`  Group ${key} stats: total=${totalRuns}, passed=${passedRuns}, failed=${failedRuns}, flaky=${flakyRuns}`);
      
      // Calculate flakiness metrics
      const passRate = passedRuns / totalRuns;
      const failRate = failedRuns / totalRuns;
      const flakyRate = flakyRuns / totalRuns;
      
      // Determine if test is flaky
      let isFlaky = false;
      let flakinessScore = 0;
      let flakinessReason = '';
      let detectionMethods = [];
      
      // 0. NEW: Check for mixed results within individual builds (potential flakiness indicator)
      const buildResultsMixed = {};
      runs.forEach(run => {
        const buildKey = run.build.commitHash.substring(0, 8);
        if (!buildResultsMixed[buildKey]) {
          buildResultsMixed[buildKey] = [];
        }
        buildResultsMixed[buildKey].push(run.status);
      });
      
      // Check if any build has mixed results (both passed and failed tests)
      let buildsWithMixedResults = 0;
      Object.entries(buildResultsMixed).forEach(([buildKey, statuses]) => {
        const uniqueStatuses = new Set(statuses);
        if (uniqueStatuses.has('passed') && uniqueStatuses.has('failed')) {
          buildsWithMixedResults++;
          console.log(`    Build ${buildKey} has mixed results: ${statuses.join(', ')}`);
        }
      });
      
      if (buildsWithMixedResults > 0) {
        const mixedResultsScore = (buildsWithMixedResults / Object.keys(buildResultsMixed).length) * 100;
        if (mixedResultsScore > 30) { // If more than 30% of builds have mixed results
          isFlaky = true;
          flakinessScore = Math.max(flakinessScore, mixedResultsScore);
          flakinessReason = `Mixed results in ${buildsWithMixedResults} builds`;
          detectionMethods.push('mixed_results_in_builds');
          console.log(`    Detected flakiness: ${flakinessReason} (score: ${mixedResultsScore})`);
        }
      }
      
      // 1. Check for inconsistent results (pass/fail pattern) - SAME CODE, DIFFERENT RESULTS
      if (passedRuns > 0 && failedRuns > 0) {
        const inconsistencyScore = Math.min(passRate, failRate) * 100;
        if (inconsistencyScore > Number(flakinessThreshold) * 100) {
          isFlaky = true;
          flakinessScore = Math.max(flakinessScore, inconsistencyScore);
          flakinessReason = 'Inconsistent pass/fail results';
          detectionMethods.push('inconsistent_results');
        }
      }
      
      // 2. Check for explicit flaky status
      if (flakyRuns > 0) {
        isFlaky = true;
        flakinessScore = Math.max(flakinessScore, flakyRate * 100);
        flakinessReason = flakyRuns === totalRuns ? 'Consistently flaky' : 'Mixed flaky results';
        detectionMethods.push('explicit_flaky_status');
      }
      
      // 3. Enhanced Pattern Recognition - INTERMITTENT FAILURES
      // Look for alternating patterns (pass-fail-pass-fail)
      const statusSequence = runs.map(r => r.status);
      let alternatingPatterns = 0;
      let consecutiveFailures = 0;
      let maxConsecutiveFailures = 0;
      
      for (let i = 1; i < statusSequence.length; i++) {
        // Check for alternating patterns
        if (statusSequence[i] !== statusSequence[i-1]) {
          alternatingPatterns++;
        }
        
        // Track consecutive failures
        if (statusSequence[i] === 'failed') {
          consecutiveFailures++;
          maxConsecutiveFailures = Math.max(maxConsecutiveFailures, consecutiveFailures);
        } else {
          consecutiveFailures = 0;
        }
      }
      
      // Calculate pattern-based flakiness
      const alternatingRatio = alternatingPatterns / (statusSequence.length - 1);
      const intermittentScore = alternatingRatio * 100;
      
      if (intermittentScore > 40 && totalRuns >= 5) {
        isFlaky = true;
        flakinessScore = Math.max(flakinessScore, intermittentScore);
        flakinessReason = 'Intermittent failure pattern detected';
        detectionMethods.push('intermittent_pattern');
      }
      
      // 4. Check for low pass rate (consistently failing)
      if (passRate < 0.5 && totalRuns >= 5) {
        flakinessScore = Math.max(flakinessScore, (1 - passRate) * 100);
        if (!isFlaky) {
          flakinessReason = 'Low pass rate';
        }
        detectionMethods.push('low_pass_rate');
      }
      
      // 5. Enhanced Trend Analysis - RECENT VS OLDER PATTERNS
      const recentRuns = runs.slice(0, Math.ceil(totalRuns * 0.3)); // Last 30% of runs
      const olderRuns = runs.slice(Math.ceil(totalRuns * 0.3));
      
      if (recentRuns.length > 0 && olderRuns.length > 0) {
        const recentPassRate = recentRuns.filter(r => r.status === 'passed').length / recentRuns.length;
        const olderPassRate = olderRuns.filter(r => r.status === 'passed').length / olderRuns.length;
        const trendChange = Math.abs(recentPassRate - olderPassRate);
        
        if (trendChange > 0.3) {
          flakinessScore = Math.max(flakinessScore, trendChange * 100);
          if (!isFlaky) {
            flakinessReason = 'Unstable trend';
          }
          detectionMethods.push('unstable_trend');
        }
      }
      
      // 6. Build-to-Build Consistency Analysis
      // Check if the same test fails inconsistently across different builds
      const buildResults = {};
      runs.forEach(run => {
        const buildKey = run.build.commitHash.substring(0, 8);
        if (!buildResults[buildKey]) {
          buildResults[buildKey] = [];
        }
        buildResults[buildKey].push(run.status);
      });
      
      // Calculate build consistency
      const buildConsistencyScores = Object.values(buildResults).map(statuses => {
        const uniqueStatuses = new Set(statuses);
        return uniqueStatuses.size === 1 ? 1 : 0; // 1 if consistent, 0 if inconsistent
      });
      
      const buildConsistencyRate = buildConsistencyScores.reduce((sum, score) => sum + score, 0) / buildConsistencyScores.length;
      
      if (buildConsistencyRate < 0.7 && Object.keys(buildResults).length >= 3) {
        flakinessScore = Math.max(flakinessScore, (1 - buildConsistencyRate) * 100);
        if (!isFlaky) {
          flakinessReason = 'Inconsistent across builds';
        }
        detectionMethods.push('build_inconsistency');
      }
      
      // Only include tests that meet flakiness criteria
      if (isFlaky || flakinessScore > Number(flakinessThreshold) * 100) {
        const [testSuite, testType, environment] = key.split('-');
        
        flakinessResults.push({
          id: key,
          testSuite,
          testType,
          environment,
          totalRuns,
          passedRuns,
          failedRuns,
          flakyRuns,
          passRate: (passRate * 100).toFixed(1),
          failRate: (failRate * 100).toFixed(1),
          flakyRate: (flakyRate * 100).toFixed(1),
          flakinessScore: Math.round(flakinessScore),
          isFlaky,
          flakinessReason,
          detectionMethods,
          patternAnalysis: {
            alternatingPatterns,
            alternatingRatio: (alternatingRatio * 100).toFixed(1),
            maxConsecutiveFailures,
            buildConsistencyRate: (buildConsistencyRate * 100).toFixed(1),
            totalBuilds: Object.keys(buildResults).length
          },
          lastRun: runs[0].createdAt,
          firstRun: runs[runs.length - 1].createdAt,
          recentRuns: recentRuns.length,
          olderRuns: olderRuns.length,
          runs: runs.map(r => ({
            id: r.id,
            status: r.status,
            createdAt: r.createdAt,
            buildId: r.buildId,
            build: r.build
          }))
        });
      }
    });
    
    // Sort by flakiness score (highest first)
    flakinessResults.sort((a, b) => b.flakinessScore - a.flakinessScore);
    
    console.log(`Flakiness analysis complete: ${flakinessResults.length} flaky tests found`);
    if (flakinessResults.length > 0) {
      console.log('Flaky tests:', flakinessResults.map(test => ({
        testSuite: test.testSuite,
        environment: test.environment,
        flakinessScore: test.flakinessScore,
        reason: test.flakinessReason,
        detectionMethods: test.detectionMethods
      })));
    }
    
    // Calculate summary statistics
    const summary = {
      totalTests: Object.keys(testGroups).length,
      flakyTests: flakinessResults.length,
      flakinessRate: Object.keys(testGroups).length > 0 
        ? (flakinessResults.length / Object.keys(testGroups).length * 100).toFixed(1)
        : 0,
      averageFlakinessScore: flakinessResults.length > 0
        ? (flakinessResults.reduce((sum, test) => sum + test.flakinessScore, 0) / flakinessResults.length).toFixed(1)
        : 0,
      timeRange,
      minRuns: Number(minRuns),
      flakinessThreshold: Number(flakinessThreshold)
    };
    
    res.json({
      summary,
      flakyTests: flakinessResults,
      analysis: {
        totalTestRuns: testRuns.length,
        totalBuilds: builds.length,
        dateRange: {
          start: startDate,
          end: now
        }
      }
    });
    
  } catch (err) {
    console.error('Error analyzing flakiness:', err);
    res.status(500).json({ error: 'Failed to analyze flakiness' });
  }
});

// Debug endpoint to manually create test runs for testing
app.post('/api/debug/create-test-runs', requireAuth, async (req, res) => {
  try {
    const { buildId, testRuns } = req.body;
    
    if (!buildId || !testRuns || !Array.isArray(testRuns)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    
    const createdRuns = [];
    for (const testRun of testRuns) {
      const created = await prisma.testRun.create({
        data: {
          buildId: Number(buildId),
          testSuite: testRun.testSuite || 'debug-test',
          testType: testRun.testType || 'unit',
          status: testRun.status || 'failed',
          duration: testRun.duration || null,
          errorMessage: testRun.errorMessage || 'Debug test run',
          stackTrace: testRun.stackTrace || null,
          environment: testRun.environment || 'test',
        }
      });
      createdRuns.push(created);
    }
    
    res.json({ message: 'Test runs created successfully', testRuns: createdRuns });
  } catch (error) {
    console.error('Error creating debug test runs:', error);
    res.status(500).json({ error: 'Failed to create test runs' });
  }
});

// Re-parse all test results for a team with enhanced framework detection
app.post('/api/teams/:teamId/reparse-all-tests', requireAuth, requireTeamMember, async (req, res) => {
  const { teamId } = req.params;
  
  try {
    console.log(`Starting bulk re-parse for team ${teamId}`);
    
    // Get GitHub token
    const githubToken = await getGithubTokenForTeam(teamId);
    if (!githubToken) {
      return res.status(401).json({ error: 'GitHub token not found' });
    }
    
    // Get all builds for the team
    const builds = await prisma.build.findMany({
      where: { teamId: Number(teamId) },
      include: {
        testRuns: true
      }
    });
    
    console.log(`Found ${builds.length} builds to re-parse`);
    
    let processedBuilds = 0;
    let updatedTestRuns = 0;
    
    for (const build of builds) {
      try {
        console.log(`Re-parsing build ${build.id} (${build.testRuns.length} existing test runs)`);
        
        // Delete existing test runs
        await prisma.testRun.deleteMany({
          where: { buildId: build.id }
        });
        
        // Extract owner and repo from build
        const [owner, repo] = build.repoFullName.split('/');
        
        // Re-fetch workflow run
        const runUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${build.workflowRunId}`;
        const runRes = await axios.get(runUrl, {
          headers: { Authorization: `token ${githubToken}` }
        });
        const run = runRes.data;
        
        // Re-parse with enhanced detection (simplified version)
        // Get artifacts
        const artifactsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${run.id}/artifacts`;
        const artifactsRes = await axios.get(artifactsUrl, {
          headers: { Authorization: `token ${githubToken}` }
        });
        const artifacts = artifactsRes.data.artifacts;
        
        let testResultsParsed = false;
        
        // Try to parse JUnit XML artifacts first
        for (const artifact of artifacts) {
          if (artifact.name.includes('test-results') || artifact.name.includes('junit') || artifact.name.includes('test')) {
            try {
              const artifactUrl = `https://api.github.com/repos/${owner}/${repo}/actions/artifacts/${artifact.id}/zip`;
              const artifactRes = await axios.get(artifactUrl, {
                headers: { Authorization: `token ${githubToken}` },
                responseType: 'arraybuffer'
              });
              
              const zip = new AdmZip(artifactRes.data);
              const zipEntries = zip.getEntries();
              
              for (const entry of zipEntries) {
                if (entry.entryName.endsWith('.xml')) {
                  try {
                    const xmlContent = entry.getData().toString('utf8');
                    const parser = new xml2js.Parser();
                    const result = await parser.parseStringPromise(xmlContent);
                    
                    if (result.testsuites || result.testsuite) {
                      const testSuites = result.testsuites?.testsuite || [result.testsuite];
                      
                      for (const suite of testSuites) {
                        const suiteName = suite.$.name || 'unknown';
                        const tests = suite.testcase || [];
                        
                        for (const test of tests) {
                          const testName = test.$.name || 'unknown';
                          const status = test.failure || test.error ? 'failed' : 'passed';
                          const duration = test.$.time ? parseFloat(test.$.time) : null;
                          
                          // Enhanced framework and test type detection
                          let testType = 'unit';
                          let framework = 'unknown';
                          
                          // Framework detection patterns
                          const frameworkPatterns = [
                            { pattern: /jest/i, name: 'Jest', type: 'unit' },
                            { pattern: /cypress/i, name: 'Cypress', type: 'e2e' },
                            { pattern: /playwright/i, name: 'Playwright', type: 'e2e' },
                            { pattern: /pytest/i, name: 'PyTest', type: 'unit' },
                            { pattern: /junit/i, name: 'JUnit', type: 'unit' }
                          ];
                          
                          // Detect from test name and suite name
                          const combinedText = `${testName} ${suiteName}`.toLowerCase();
                          for (const pattern of frameworkPatterns) {
                            if (pattern.pattern.test(combinedText)) {
                              framework = pattern.name;
                              testType = pattern.type;
                              break;
                            }
                          }
                          
                          await prisma.testRun.create({
                            data: {
                              buildId: build.id,
                              testSuite: suiteName,
                              testType: testType,
                              framework: framework,
                              status,
                              duration,
                              environment: 'test'
                            }
                          });
                          updatedTestRuns++;
                        }
                      }
                      testResultsParsed = true;
                      break;
                    }
                  } catch (xmlError) {
                    console.error('Error parsing XML:', xmlError);
                    continue;
                  }
                }
              }
              if (testResultsParsed) break;
            } catch (artifactError) {
              console.error('Error processing artifact:', artifactError);
              continue;
            }
          }
        }
        
        // If no artifacts, try log parsing
        if (!testResultsParsed) {
          const jobsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${run.id}/jobs`;
          const jobsRes = await axios.get(jobsUrl, {
            headers: { Authorization: `token ${githubToken}` }
          });
          const jobs = jobsRes.data.jobs;
          
          for (const job of jobs) {
            const logUrl = `https://api.github.com/repos/${owner}/${repo}/actions/jobs/${job.id}/logs`;
            const logRes = await axios.get(logUrl, {
              headers: { Authorization: `token ${githubToken}` },
              responseType: 'arraybuffer'
            });
            const logText = logRes.data.toString('utf8');
            
            // Enhanced framework and test type detection
            let testType = 'unknown';
            let framework = 'unknown';
            
            // Framework detection patterns
            const frameworkPatterns = [
              { pattern: /jest/i, name: 'Jest', type: 'unit' },
              { pattern: /cypress/i, name: 'Cypress', type: 'e2e' },
              { pattern: /playwright/i, name: 'Playwright', type: 'e2e' },
              { pattern: /pytest/i, name: 'PyTest', type: 'unit' },
              { pattern: /junit/i, name: 'JUnit', type: 'unit' }
            ];
            
            // Detect from logs
            for (const pattern of frameworkPatterns) {
              if (pattern.pattern.test(logText)) {
                framework = pattern.name;
                testType = pattern.type;
                break;
              }
            }
            
            // Detect from job name
            if (framework === 'unknown' && job.name) {
              const jobName = job.name.toLowerCase();
              for (const pattern of frameworkPatterns) {
                if (pattern.pattern.test(jobName)) {
                  framework = pattern.name;
                  testType = pattern.type;
                  break;
                }
              }
            }
            
            // Create test run with detected framework and type
            await prisma.testRun.create({
              data: {
                buildId: build.id,
                testSuite: job.name || 'unknown',
                testType: testType,
                framework: framework,
                status: job.conclusion === 'success' ? 'passed' : 'failed',
                environment: 'test'
              }
            });
            updatedTestRuns++;
            testResultsParsed = true;
            break;
          }
        }
        
        processedBuilds++;
        console.log(`Successfully re-parsed build ${build.id} with ${updatedTestRuns} test runs`);
        
      } catch (error) {
        console.error(`Error re-parsing build ${build.id}:`, error);
      }
    }
    
    res.json({ 
      message: `Re-parsed ${processedBuilds} builds`,
      processedBuilds,
      updatedTestRuns
    });
    
  } catch (error) {
    console.error('Error in bulk re-parse:', error);
    res.status(500).json({ error: 'Failed to re-parse all tests' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

function convertBigInts(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertBigInts);
  } else if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        typeof value === 'bigint' ? value.toString() : convertBigInts(value)
      ])
    );
  }
  return obj;
}