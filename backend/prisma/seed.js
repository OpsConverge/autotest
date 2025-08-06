const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // bcrypt hash for 'admin123'
  const passwordHash = '$2a$10$wH6QwQw6QwQw6QwQw6QwOeQwQw6QwQw6QwQw6QwQw6QwQw6QwQw6';

  // Create a user (if not exists)
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash,
    },
  });

  // Create a team
  const team = await prisma.team.create({
    data: { name: 'Seed Team' },
  });

  // Add user as owner
  await prisma.teamMember.create({
    data: { userId: user.id, teamId: team.id, role: 'owner' },
  });

  // Create default team settings
  await prisma.teamSettings.create({
    data: {
      teamId: team.id,
      settings: {
        team_name: 'Seed Team',
        slack_webhook: '',
        jira_config: { url: '', project_key: '', api_token: '' },
        github_config: { is_connected: false, repositories: [] },
        notification_preferences: { failed_tests: true, flaky_tests: true, coverage_drops: true },
        flaky_threshold: 70,
      },
    },
  });

  console.log('Seeded user and team!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect()); 