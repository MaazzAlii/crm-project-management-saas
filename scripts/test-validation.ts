/**
 * Validation & Sanitization Security Test Suite
 * Tests edge cases: XSS injection, oversized payloads, malformed emails, negative values, rate limiting.
 */

import {
  CreateClientSchema,
  CreateProjectSchema,
  CreateTaskSchema,
  DeliverableRevisionSchema,
  FileUploadVerificationSchema,
  OutboundMessageSchema,
} from '../lib/validation/schemas'
import { sanitizeString, sanitizeUrl, sanitizeObject, escapeHtml } from '../lib/validation/sanitize'
import { validateAndSanitize } from '../lib/validation/action-wrapper'
import { checkRateLimit } from '../lib/security/rate-limit'

let passed = 0
let failed = 0

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`)
    passed++
  } else {
    console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`)
    failed++
  }
}

console.log('====================================================')
console.log('🧪 RUNNING TASK 61 SECURITY & VALIDATION TEST SUITE')
console.log('====================================================\n')

// ----------------------------------------------------
// 1. Sanitization & XSS Prevention Tests
// ----------------------------------------------------
console.log('1. Testing XSS Sanitization & HTML Neutralization:')

const xss1 = sanitizeString('<script>alert("xss")</script>Hello World')
assert(!xss1.includes('<script>') && xss1.includes('Hello World'), 'Strips <script> tags completely')

const xss2 = sanitizeString('<img src="x" onerror="alert(1)">Image description')
assert(!xss2.includes('onerror=') && xss2.includes('Image description'), 'Strips inline event handlers (onerror)')

const xss3 = sanitizeString('<iframe src="javascript:alert(1)"></iframe>Project notes')
assert(!xss3.includes('<iframe') && !xss3.includes('javascript:'), 'Strips <iframe> and javascript: scheme')

const escaped = escapeHtml('<script>alert("test")</script>')
assert(escaped.includes('&lt;script&gt;') && !escaped.includes('<script>'), 'Escapes HTML special characters')

const safeUrl = sanitizeUrl('https://example.com/asset.pdf')
assert(safeUrl === 'https://example.com/asset.pdf', 'Permits valid HTTPS url')

const maliciousUrl = sanitizeUrl('javascript:alert(document.cookie)')
assert(maliciousUrl === null, 'Blocks javascript: protocol url')

const sanitizedObj = sanitizeObject({
  title: 'Safe Title <script>alert(1)</script>',
  notes: 'Notes with <img src=x onerror=steal()>',
  file_url: 'javascript:evil()',
  meta: {
    nested: 'Nested text with onload=hack()',
  },
})
assert(!sanitizedObj.title.includes('<script>'), 'Recursively sanitizes object strings')
assert(!sanitizedObj.notes.includes('onerror='), 'Sanitizes object event handlers')
assert(sanitizedObj.file_url === null, 'Sanitizes object URL properties')
assert(!sanitizedObj.meta.nested.includes('onload='), 'Sanitizes nested object properties')

// ----------------------------------------------------
// 2. Client Validation Tests
// ----------------------------------------------------
console.log('\n2. Testing Client Validation Schemas:')

// Empty Name
const emptyClient = validateAndSanitize(CreateClientSchema, { name: '' })
assert(!emptyClient.success, 'Rejects empty client name')

// Malformed Email
const malformedEmailClient = validateAndSanitize(CreateClientSchema, {
  name: 'Acme Corp',
  email: 'not-an-email@',
})
assert(!malformedEmailClient.success, 'Rejects malformed email address')

// Valid Client with Sanitized Script Notes
const validClient = validateAndSanitize(CreateClientSchema, {
  name: 'Global Tech Inc',
  email: 'contact@globaltech.com',
  notes: 'Client notes <script>alert(1)</script>',
})
assert(validClient.success, 'Accepts valid client payload')
if (validClient.success) {
  assert(!validClient.data.notes?.includes('<script>'), 'Sanitizes client notes before returning data')
}

// ----------------------------------------------------
// 3. Project Validation Tests
// ----------------------------------------------------
console.log('\n3. Testing Project Validation Schemas:')

// Negative Budget
const negativeBudgetProject = validateAndSanitize(CreateProjectSchema, {
  name: 'Website Redesign',
  client_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  budget: -500,
})
assert(!negativeBudgetProject.success, 'Rejects negative project budget')

// Oversized Budget
const oversizedBudget = validateAndSanitize(CreateProjectSchema, {
  name: 'Website Redesign',
  client_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  budget: 500000000,
})
assert(!oversizedBudget.success, 'Rejects budget exceeding threshold limit')

// Invalid UUID Client ID
const invalidUuidProj = validateAndSanitize(CreateProjectSchema, {
  name: 'Valid Name',
  client_id: 'not-a-valid-uuid-12345',
})
assert(!invalidUuidProj.success, 'Rejects invalid client_id format')

// ----------------------------------------------------
// 4. Deliverable & Revision Validation Tests
// ----------------------------------------------------
console.log('\n4. Testing Deliverable & Revision Schemas:')

const emptyRevision = validateAndSanitize(DeliverableRevisionSchema, {
  deliverableId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  notes: '   ',
})
assert(!emptyRevision.success, 'Rejects empty revision instructions')

const tooShortRevision = validateAndSanitize(DeliverableRevisionSchema, {
  deliverableId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  notes: 'fix',
})
assert(!tooShortRevision.success, 'Rejects revision notes with fewer than 5 characters')

// ----------------------------------------------------
// 5. File Upload Verification Tests
// ----------------------------------------------------
console.log('\n5. Testing File Upload Validation:')

const validFile = validateAndSanitize(FileUploadVerificationSchema, {
  filename: 'deliverable_final.pdf',
  sizeBytes: 15 * 1024 * 1024, // 15MB
  mimeType: 'application/pdf',
})
assert(validFile.success, 'Accepts valid PDF file upload')

const executableFile = validateAndSanitize(FileUploadVerificationSchema, {
  filename: 'payload.exe',
  sizeBytes: 1024,
  mimeType: 'application/x-msdownload',
})
assert(!executableFile.success, 'Rejects executable binary / unpermitted MIME type')

const oversizedFile = validateAndSanitize(FileUploadVerificationSchema, {
  filename: 'massive_raw_video.mp4',
  sizeBytes: 100 * 1024 * 1024, // 100MB
  mimeType: 'video/mp4',
})
assert(!oversizedFile.success, 'Rejects file exceeding 50MB maximum size cap')

// ----------------------------------------------------
// 6. Rate Limiting Tests
// ----------------------------------------------------
console.log('\n6. Testing In-Memory Rate Limiter:')

const testIp = `test-ip-${Date.now()}`
let allowedCount = 0
for (let i = 0; i < 5; i++) {
  const res = checkRateLimit(testIp, { maxRequests: 3, windowMs: 10000 })
  if (res.allowed) allowedCount++
}
assert(allowedCount === 3, 'Rate limiter permits exactly maxRequests (3)')

const throttledRes = checkRateLimit(testIp, { maxRequests: 3, windowMs: 10000 })
assert(!throttledRes.allowed && throttledRes.retryAfterSeconds! > 0, 'Rate limiter throttles excess requests')

// ----------------------------------------------------
// Summary
// ----------------------------------------------------
console.log('\n====================================================')
console.log(`📊 RESULTS: ${passed} PASSED, ${failed} FAILED`)
console.log('====================================================')

if (failed > 0) {
  process.exit(1)
}
