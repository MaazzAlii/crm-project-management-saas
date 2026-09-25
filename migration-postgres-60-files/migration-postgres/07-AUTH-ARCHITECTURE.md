# Custom Authentication Architecture

## System Design

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │ POST /api/auth/login
       │ { email, password }
       │
┌──────▼──────────────────────────┐
│   Next.js API Route             │
│  /app/api/auth/login/route.ts   │
│                                  │
│  1. Validate input               │
│  2. Query PostgreSQL             │
│  3. Verify password (bcrypt)     │
│  4. Generate JWT + refresh token │
│  5. Set HTTP-only cookie         │
│  6. Return access token          │
└──────┬──────────────────────────┘
       │
┌──────▼──────────────────────────┐
│   PostgreSQL Database            │
│  - users table                   │
│  - password_hash (bcrypt)        │
│  - refresh_tokens table          │
│  - sessions table (optional)     │
└──────────────────────────────────┘
```

## JWT Structure

```typescript
// Access Token (expires in 1 hour)
{
  userId: "uuid",
  email: "user@example.com",
  role: "user" | "org_admin" | "super_admin",
  orgId: "uuid",
  iat: 1234567890,
  exp: 1234571490
}

// Refresh Token (expires in 7 days)
{
  userId: "uuid",
  tokenFamily: "uuid", // Prevent token reuse attacks
  iat: 1234567890,
  exp: 1235172690
}
```

## Implementation

### 1. Password Hashing

```typescript
// /lib/auth/passwords.ts
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 2. Token Generation

```typescript
// /lib/auth/tokens.ts
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_SECRET!;

export function generateAccessToken(payload: any): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '1h' });
}

export function generateRefreshToken(payload: any): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string, secret: string): any | null {
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}
```

### 3. Login Endpoint

```typescript
// /app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, generateAccessToken, generateRefreshToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Query user
    const result = await db.query(
      'SELECT id, email, password_hash, role, current_org_id FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      orgId: user.current_org_id,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenFamily: crypto.randomUUID(),
    });

    // Store refresh token
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
      [user.id, refreshToken]
    );

    // Create response with HTTP-only cookie
    const response = NextResponse.json({
      accessToken,
      user: { id: user.id, email: user.email },
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4. Auth Middleware

```typescript
// /lib/auth/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './tokens';

export async function withAuth(request: NextRequest, handler: Function) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = verifyToken(token, process.env.JWT_SECRET!);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Attach user to request
  (request as any).user = payload;
  return handler(request);
}
```

### 5. Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  current_org_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table (optional, for additional tracking)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  ip_address VARCHAR(255),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

## Security Considerations

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWTs signed with HS256
- ✅ Refresh tokens stored in HTTP-only cookies
- ✅ CSRF protection via SameSite cookies
- ✅ Token rotation on refresh
- ✅ Token revocation via database
- ✅ Rate limiting on auth endpoints
- ✅ Email verification for signup (optional)

## Testing Auth

```typescript
// tests/auth.test.ts
describe('Authentication', () => {
  it('should register a new user', async () => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      }),
    });
    expect(response.status).toBe(201);
  });

  it('should login with valid credentials', async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      }),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.accessToken).toBeDefined();
  });

  it('should reject invalid password', async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'WrongPassword',
      }),
    });
    expect(response.status).toBe(401);
  });
});
```

---

**Next**: → `19-AUTH-SYSTEM-OVERVIEW.md` for full implementation
