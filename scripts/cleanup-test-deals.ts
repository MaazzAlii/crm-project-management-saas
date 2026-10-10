import { query } from '@/lib/db';

async function main() {
  const args = process.argv.slice(2);

  const orgIdIndex = args.indexOf('--orgId');
  const titlesIndex = args.indexOf('--titles');
  const isConfirm = args.includes('--confirm');

  if (orgIdIndex === -1 || !args[orgIdIndex + 1]) {
    console.error('Usage: npx tsx scripts/cleanup-test-deals.ts --orgId <ORG_ID> --titles <TITLE1,TITLE2,...> [--confirm]');
    process.exit(1);
  }

  if (titlesIndex === -1 || !args[titlesIndex + 1]) {
    console.error('Usage: npx tsx scripts/cleanup-test-deals.ts --orgId <ORG_ID> --titles <TITLE1,TITLE2,...> [--confirm]');
    process.exit(1);
  }

  const orgId = args[orgIdIndex + 1];
  const titles = args[titlesIndex + 1].split(',').map((t) => t.trim()).filter(Boolean);

  console.log(`🔍 Searching for deals in organization [${orgId}] matching titles:`, titles);

  const findRes = await query<{ id: string; title: string; stage_id: string; created_at: string }>(
    `SELECT id, title, stage_id, created_at FROM public.deals WHERE org_id = $1 AND title = ANY($2::text[])`,
    [orgId, titles]
  );

  const rows = findRes.rows || [];
  console.log(`Found ${rows.length} matching deal(s):`);
  rows.forEach((r) => {
    console.log(`  - ID: ${r.id} | Title: "${r.title}" | Stage: ${r.stage_id} | Created: ${r.created_at}`);
  });

  if (rows.length === 0) {
    console.log('No matching test deals found.');
    process.exit(0);
  }

  if (!isConfirm) {
    console.log('\n⚠️ DRY RUN: Pass --confirm to permanently delete these deals.');
    process.exit(0);
  }

  console.log('\n🗑️ Deleting test deals...');
  const deleteRes = await query(
    `DELETE FROM public.deals WHERE org_id = $1 AND title = ANY($2::text[]) RETURNING id`,
    [orgId, titles]
  );

  console.log(`✅ Successfully deleted ${deleteRes.rowCount} test deal(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error running cleanup:', err);
  process.exit(1);
});
