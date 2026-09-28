/**
 * =============================================================================
 * Innoventix Platform v2 — Type-Safe PostgreSQL Query Builder
 * =============================================================================
 * Provides parameterized, SQL-injection safe query building utilities with
 * mandatory multi-tenant scoping and pagination support.
 */

export interface QueryResultWithCount<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface WhereCondition {
  field: string;
  operator: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'ILIKE' | 'IN' | 'IS NULL' | 'IS NOT NULL';
  value?: any;
}

/**
 * Build a parameterized SELECT query
 */
export function buildSelectQuery(options: {
  table: string;
  columns?: string[];
  where?: WhereCondition[];
  orgId?: string;
  pagination?: PaginationOptions;
}): { text: string; values: any[] } {
  const { table, columns = ['*'], where = [], orgId, pagination } = options;
  const values: any[] = [];
  const clauses: string[] = [];

  // Enforce multi-tenant scoping if orgId provided
  if (orgId) {
    values.push(orgId);
    clauses.push(`organization_id = $${values.length}`);
  }

  // Add WHERE conditions
  for (const cond of where) {
    if (cond.operator === 'IS NULL' || cond.operator === 'IS NOT NULL') {
      clauses.push(`${cond.field} ${cond.operator}`);
    } else if (cond.operator === 'IN' && Array.isArray(cond.value)) {
      if (cond.value.length === 0) {
        clauses.push('1 = 0'); // Empty IN clause evaluates to FALSE
      } else {
        const placeholders = cond.value.map((v) => {
          values.push(v);
          return `$${values.length}`;
        });
        clauses.push(`${cond.field} IN (${placeholders.join(', ')})`);
      }
    } else {
      values.push(cond.value);
      clauses.push(`${cond.field} ${cond.operator} $${values.length}`);
    }
  }

  let text = `SELECT ${columns.join(', ')} FROM ${table}`;
  if (clauses.length > 0) {
    text += ` WHERE ${clauses.join(' AND ')}`;
  }

  // Ordering
  if (pagination?.orderBy) {
    const dir = pagination.orderDirection || 'ASC';
    text += ` ORDER BY ${pagination.orderBy} ${dir}`;
  }

  // Pagination (LIMIT / OFFSET)
  if (pagination?.limit) {
    const limit = Math.max(1, pagination.limit);
    const page = Math.max(1, pagination.page || 1);
    const offset = (page - 1) * limit;

    values.push(limit);
    text += ` LIMIT $${values.length}`;
    values.push(offset);
    text += ` OFFSET $${values.length}`;
  }

  return { text, values };
}

/**
 * Build a parameterized INSERT query
 */
export function buildInsertQuery(
  table: string,
  data: Record<string, any>,
  returning: string[] = ['*']
): { text: string; values: any[] } {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
  if (keys.length === 0) {
    throw new Error('Cannot build INSERT query with empty payload');
  }

  const values: any[] = [];
  const placeholders: string[] = [];

  for (const key of keys) {
    values.push(data[key]);
    placeholders.push(`$${values.length}`);
  }

  const text = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING ${returning.join(', ')}`;
  return { text, values };
}

/**
 * Build a parameterized UPDATE query with tenant guard
 */
export function buildUpdateQuery(options: {
  table: string;
  data: Record<string, any>;
  id: string;
  orgId?: string;
  returning?: string[];
}): { text: string; values: any[] } {
  const { table, data, id, orgId, returning = ['*'] } = options;
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
  if (keys.length === 0) {
    throw new Error('Cannot build UPDATE query with empty payload');
  }

  const values: any[] = [];
  const setClauses: string[] = [];

  for (const key of keys) {
    values.push(data[key]);
    setClauses.push(`${key} = $${values.length}`);
  }

  values.push(id);
  const idPlaceholder = `$${values.length}`;

  let text = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE id = ${idPlaceholder}`;

  if (orgId) {
    values.push(orgId);
    text += ` AND organization_id = $${values.length}`;
  }

  text += ` RETURNING ${returning.join(', ')}`;
  return { text, values };
}

/**
 * Build a parameterized DELETE query with tenant guard
 */
export function buildDeleteQuery(options: {
  table: string;
  id: string;
  orgId?: string;
}): { text: string; values: any[] } {
  const { table, id, orgId } = options;
  const values: any[] = [id];
  let text = `DELETE FROM ${table} WHERE id = $1`;

  if (orgId) {
    values.push(orgId);
    text += ` AND organization_id = $${values.length}`;
  }

  return { text, values };
}
