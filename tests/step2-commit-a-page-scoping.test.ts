import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Commit A: Project Pages & Team Scoping Audit', () => {
  it('app/(dashboard)/projects/[id]/page.tsx strictly scopes team members to organization_members', () => {
    const filePath = path.join(process.cwd(), 'app/(dashboard)/projects/[id]/page.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    // Must not query users table without organization filter
    expect(content).not.toMatch(/SELECT\s+id,\s*full_name,\s*email\s+FROM\s+users\s+ORDER\s+BY/i);
    // Must query users with organization_members join and organization_id parameter
    expect(content).toMatch(/organization_members\s+om\s+ON\s+om\.user_id\s*=\s*u\.id\s+WHERE\s+om\.organization_id\s*=\s*\$1/i);
  });

  it('app/(dashboard)/projects/kanban/page.tsx strictly scopes clients and users to organization', () => {
    const filePath = path.join(process.cwd(), 'app/(dashboard)/projects/kanban/page.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    // Clients must be scoped
    expect(content).not.toMatch(/SELECT\s+id,\s*name\s+FROM\s+clients\s+ORDER\s+BY\s+name\s+ASC['"`]/i);
    expect(content).toMatch(/SELECT\s+id,\s*name\s+FROM\s+clients\s+WHERE\s+organization_id\s*=\s*\$1/i);

    // Users must be scoped through organization_members
    expect(content).not.toMatch(/SELECT\s+id,\s*full_name,\s*email\s+FROM\s+users\s+ORDER\s+BY\s+full_name\s+ASC['"`]/i);
    expect(content).toMatch(/organization_members\s+om\s+ON\s+om\.user_id\s*=\s*u\.id\s+WHERE\s+om\.organization_id\s*=\s*\$1/i);
  });

  it('app/(dashboard)/projects/page.tsx strictly scopes clients and users to organization', () => {
    const filePath = path.join(process.cwd(), 'app/(dashboard)/projects/page.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    // Clients must be scoped
    expect(content).not.toMatch(/SELECT\s+id,\s*name\s+FROM\s+clients\s+ORDER\s+BY\s+name\s+ASC['"`]/i);
    expect(content).toMatch(/SELECT\s+id,\s*name\s+FROM\s+clients\s+WHERE\s+organization_id\s*=\s*\$1/i);

    // Users must be scoped through organization_members
    expect(content).not.toMatch(/SELECT\s+id,\s*full_name,\s*email\s+FROM\s+users\s+ORDER\s+BY\s+full_name\s+ASC['"`]/i);
    expect(content).toMatch(/organization_members\s+om\s+ON\s+om\.user_id\s*=\s*u\.id\s+WHERE\s+om\.organization_id\s*=\s*\$1/i);
  });

  it('app/(dashboard)/tasks/actions.ts does not fall back to fake usr_1 members', () => {
    const filePath = path.join(process.cwd(), 'app/(dashboard)/tasks/actions.ts');
    const content = fs.readFileSync(filePath, 'utf8');

    expect(content).not.toContain('usr_1');
    expect(content).not.toContain('alex@agency.com');
  });

  it('components/dashboard/QuickActions.tsx points Invite Team button to valid /settings/team route', () => {
    const filePath = path.join(process.cwd(), 'components/dashboard/QuickActions.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    expect(content).not.toContain("href: '/team?action=invite'");
    expect(content).toContain("href: '/settings/team?action=invite'");
  });
});
