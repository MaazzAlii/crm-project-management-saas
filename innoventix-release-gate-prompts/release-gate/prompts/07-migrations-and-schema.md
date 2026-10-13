# 07: Migrations and schema

1. List every file in supabase/migrations and confirm each one is idempotent (IF NOT EXISTS, ON CONFLICT, or guarded).
2. Run the migration runner twice against a copy of the local database. Both runs must succeed with no changes on the second run.
3. Compare the schema with the TypeScript types and repository SQL. Check these specifically: invitations.status includes 'declined'; org_member_role includes 'viewer'; organization_plans.plan_override exists; email_verifications exists; organizations.verified_domain exists; stripe processed events table exists.
4. Find any schema change applied with an ad hoc statement and not in a migration file.

Output: table of migrations, idempotent yes/no, and schema mismatches.
