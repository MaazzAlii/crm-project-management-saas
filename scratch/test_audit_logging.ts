import { logAuditEvent, AUDIT_ACTIONS } from '../lib/audit/log'
import { fetchOrgAuditLogs, fetchSuperAdminAuditLogs, formatAuditLogsCsv } from '../lib/audit/query'

async function runAuditLoggingTests() {
  console.log('--- Starting Audit Logging & Compliance Tests ---')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ PASS: ${msg}`)
      passed++
    } else {
      console.error(`❌ FAIL: ${msg}`)
      failed++
    }
  }

  const testOrgA = 'org_alpha_test_123'
  const testOrgB = 'org_beta_test_456'

  // Test 1: Log standard tenant event
  const log1 = await logAuditEvent({
    organizationId: testOrgA,
    actorId: 'usr_alpha_admin',
    actorEmail: 'admin@alpha.com',
    actorName: 'Alpha Admin',
    action: AUDIT_ACTIONS.TEAM_MEMBER_ROLE_UPDATED,
    entityType: 'organization_member',
    entityId: 'mem_999',
    details: { oldRole: 'member', newRole: 'admin' },
    ipAddress: '192.168.1.50',
  })
  assert(log1 === true, 'Successfully logged tenant role update event')

  // Test 2: Log billing event
  const log2 = await logAuditEvent({
    organizationId: testOrgA,
    actorId: 'usr_alpha_admin',
    actorEmail: 'admin@alpha.com',
    action: AUDIT_ACTIONS.CHECKOUT_SESSION_INITIATED,
    entityType: 'billing',
    entityId: 'price_pro_monthly',
    details: { plan: 'Pro', amount: 99 },
  })
  assert(log2 === true, 'Successfully logged billing checkout event')

  // Test 3: Log Super Admin impersonation event
  const log3 = await logAuditEvent({
    organizationId: testOrgB,
    actorId: 'usr_super_admin',
    actorEmail: 'super@innoventix.io',
    actorIsSuperAdmin: true,
    action: AUDIT_ACTIONS.SUPER_ADMIN_IMPERSONATION_START,
    entityType: 'organization',
    entityId: testOrgB,
    details: { reason: 'Investigating billing discrepancy', duration: '60m' },
  })
  assert(log3 === true, 'Successfully logged Super Admin impersonation event')

  // Test 4: Query Org A audit logs (Tenant Isolation)
  const orgAResult = await fetchOrgAuditLogs(testOrgA)
  assert(orgAResult.logs.length >= 2, `Org A logs count >= 2 (got ${orgAResult.logs.length})`)
  const hasOrgBInA = orgAResult.logs.some((l) => l.organization_id === testOrgB)
  assert(!hasOrgBInA, 'Tenant Isolation verified: Org A cannot view Org B audit logs')

  // Test 5: Query with Action filter
  const billingFiltered = await fetchOrgAuditLogs(testOrgA, { action: AUDIT_ACTIONS.CHECKOUT_SESSION_INITIATED })
  assert(
    billingFiltered.logs.every((l) => l.action === AUDIT_ACTIONS.CHECKOUT_SESSION_INITIATED),
    'Action filter successfully filtered to only checkout events'
  )

  // Test 6: Query Super Admin platform-wide logs
  const saResult = await fetchSuperAdminAuditLogs()
  assert(saResult.logs.length >= 3, `Super admin query returns platform-wide logs (got ${saResult.logs.length})`)

  const saOnlyResult = await fetchSuperAdminAuditLogs({ isSuperAdminOnly: true })
  assert(
    saOnlyResult.logs.every((l) => l.actor_is_super_admin === true),
    'Super admin filter successfully restricted to only super admin actions'
  )

  // Test 7: CSV Export Formatting
  const csv = formatAuditLogsCsv(orgAResult.logs)
  assert(csv.includes('Timestamp,Action,Organization ID'), 'CSV headers correctly formatted')
  assert(csv.includes('TEAM_MEMBER_ROLE_UPDATED'), 'CSV contains action payload')
  assert(csv.includes('admin@alpha.com'), 'CSV contains actor email')

  console.log(`\nTest Summary: ${passed} passed, ${failed} failed`)
  if (failed > 0) {
    process.exit(1)
  }
}

runAuditLoggingTests().catch((e) => {
  console.error(e)
  process.exit(1)
})
