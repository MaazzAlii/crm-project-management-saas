import bcryptjs from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  return bcryptjs.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }
  return bcryptjs.compare(password, hash);
}

export interface PasswordStrengthScore {
  score: number; // 0 to 4
  label: 'Empty' | 'Weak' | 'Fair' | 'Strong';
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSymbol: boolean;
}

/**
 * Calculate password strength score (0-4) and criteria breakdown
 */
export function calculatePasswordStrength(password: string): PasswordStrengthScore {
  if (!password || password.length === 0) {
    return {
      score: 0,
      label: 'Empty',
      hasMinLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasDigit: false,
      hasSymbol: false,
    };
  }

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (hasMinLength) score++;
  if (hasUppercase && hasLowercase) score++;
  if (hasDigit) score++;
  if (hasSymbol) score++;

  let label: 'Empty' | 'Weak' | 'Fair' | 'Strong' = 'Weak';
  if (score === 2) label = 'Fair';
  else if (score >= 3) label = 'Strong';

  return {
    score: Math.max(1, Math.min(4, score)),
    label,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasDigit,
    hasSymbol,
  };
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

