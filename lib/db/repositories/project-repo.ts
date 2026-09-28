/**
 * =============================================================================
 * Innoventix Platform v2 — Project Management Repository
 * =============================================================================
 * Domain data access layer for Multi-Tenant Projects, Tasks, Deliverables & Templates.
 */

import { query, queryOne, transaction } from '../index';
import { buildSelectQuery, buildInsertQuery, buildUpdateQuery, buildDeleteQuery, PaginationOptions } from '../query-builder';
import { Project, Task, Deliverable, ProjectStatus, TaskStatus, TaskPriority, DeliverableStatus } from '../../types/database';

export class ProjectRepository {
  /**
   * Find a project by UUID strictly scoped to an organization
   */
  async findById(id: string, orgId: string): Promise<Project | null> {
    try {
      return await queryOne<Project>(
        'SELECT * FROM projects WHERE id = $1 AND organization_id = $2',
        [id, orgId]
      );
    } catch (error) {
      console.error(`[ProjectRepository.findById] Error fetching project ${id} for org ${orgId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new project within an organization
   */
  async create(orgId: string, data: {
    title: string;
    clientId: string;
    description?: string | null;
    type?: string | null;
    amount?: number | null;
    currency?: string;
    status?: string;
    priority?: string;
    startDate?: Date | string | null;
    deadline?: Date | string | null;
  }): Promise<Project> {
    try {
      const insertData = {
        organization_id: orgId,
        client_id: data.clientId,
        title: data.title.trim(),
        description: data.description || null,
        type: data.type || 'Combined',
        amount: data.amount || 0.00,
        currency: data.currency || 'USD',
        status: data.status || 'brief_received',
        priority: data.priority || 'medium',
        start_date: data.startDate || null,
        deadline: data.deadline || null,
      };

      const q = buildInsertQuery('projects', insertData);
      const res = await query<Project>(q.text, q.values);
      return res.rows[0];
    } catch (error) {
      console.error('[ProjectRepository.create] Error creating project:', error);
      throw error;
    }
  }

  /**
   * Update project details with tenant guard
   */
  async update(
    id: string,
    orgId: string,
    data: Partial<Omit<Project, 'id' | 'organization_id' | 'created_at'>>
  ): Promise<Project | null> {
    try {
      const updateData: Record<string, any> = { ...data, updated_at: new Date() };

      const q = buildUpdateQuery({
        table: 'projects',
        data: updateData,
        id,
        orgId,
      });

      const res = await query<Project>(q.text, q.values);
      return res.rows[0] || null;
    } catch (error) {
      console.error(`[ProjectRepository.update] Error updating project ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a project with tenant guard
   */
  async delete(id: string, orgId: string): Promise<boolean> {
    try {
      const q = buildDeleteQuery({ table: 'projects', id, orgId });
      const res = await query(q.text, q.values);
      return (res.rowCount ?? 0) > 0;
    } catch (error) {
      console.error(`[ProjectRepository.delete] Error deleting project ${id}:`, error);
      throw error;
    }
  }

  /**
   * List projects with optional client/status filter & pagination
   */
  async list(
    orgId: string,
    options?: PaginationOptions & {
      clientId?: string;
      status?: string;
      search?: string;
    }
  ): Promise<{ projects: Project[]; total: number }> {
    try {
      const where: any[] = [];
      if (options?.clientId) {
        where.push({ field: 'client_id', operator: '=', value: options.clientId });
      }
      if (options?.status) {
        where.push({ field: 'status', operator: '=', value: options.status });
      }
      if (options?.search) {
        where.push({ field: 'title', operator: 'ILIKE', value: `%${options.search}%` });
      }

      const selectQ = buildSelectQuery({
        table: 'projects',
        orgId,
        where,
        pagination: options || { page: 1, limit: 20, orderBy: 'created_at', orderDirection: 'DESC' },
      });

      const countSql = `SELECT COUNT(*) as count FROM projects WHERE organization_id = $1 ${
        options?.clientId ? 'AND client_id = $2' : ''
      }`;
      const countParams = options?.clientId ? [orgId, options.clientId] : [orgId];

      const [dataRes, countRes] = await Promise.all([
        query<Project>(selectQ.text, selectQ.values),
        queryOne<{ count: string }>(countSql, countParams),
      ]);

      return {
        projects: dataRes.rows,
        total: parseInt(countRes?.count || '0', 10),
      };
    } catch (error) {
      console.error('[ProjectRepository.list] Error listing projects:', error);
      throw error;
    }
  }

  /**
   * Get all tasks for a project
   */
  async getTasks(projectId: string, orgId: string): Promise<Task[]> {
    try {
      const sql = `
        SELECT * FROM tasks 
        WHERE project_id = $1 AND organization_id = $2 
        ORDER BY created_at ASC
      `;
      const res = await query<Task>(sql, [projectId, orgId]);
      return res.rows;
    } catch (error) {
      console.error(`[ProjectRepository.getTasks] Error fetching tasks for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Create a task
   */
  async createTask(orgId: string, data: {
    projectId: string;
    title: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedTo?: string | null;
    dueDate?: Date | string | null;
  }): Promise<Task> {
    try {
      const insertData = {
        organization_id: orgId,
        project_id: data.projectId,
        title: data.title.trim(),
        description: data.description || null,
        status: data.status || 'todo',
        priority: data.priority || 'medium',
        assigned_to: data.assignedTo || null,
        due_date: data.dueDate || null,
      };

      const q = buildInsertQuery('tasks', insertData);
      const res = await query<Task>(q.text, q.values);
      return res.rows[0];
    } catch (error) {
      console.error('[ProjectRepository.createTask] Error creating task:', error);
      throw error;
    }
  }

  /**
   * Update task status / details
   */
  async updateTask(
    taskId: string,
    orgId: string,
    data: Partial<Omit<Task, 'id' | 'organization_id' | 'created_at'>>
  ): Promise<Task | null> {
    try {
      const updateData: Record<string, any> = { ...data, updated_at: new Date() };
      const q = buildUpdateQuery({
        table: 'tasks',
        data: updateData,
        id: taskId,
        orgId,
      });

      const res = await query<Task>(q.text, q.values);
      return res.rows[0] || null;
    } catch (error) {
      console.error(`[ProjectRepository.updateTask] Error updating task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Get all deliverables for a project
   */
  async getDeliverables(projectId: string, orgId: string): Promise<Deliverable[]> {
    try {
      const sql = `
        SELECT * FROM deliverables 
        WHERE project_id = $1 AND organization_id = $2 
        ORDER BY created_at ASC
      `;
      const res = await query<Deliverable>(sql, [projectId, orgId]);
      return res.rows;
    } catch (error) {
      console.error(`[ProjectRepository.getDeliverables] Error fetching deliverables:`, error);
      throw error;
    }
  }

  /**
   * Create a deliverable
   */
  async createDeliverable(orgId: string, data: {
    projectId: string;
    title: string;
    fileUrl?: string | null;
    driveLink?: string | null;
    status?: string;
  }): Promise<Deliverable> {
    try {
      const insertData = {
        organization_id: orgId,
        project_id: data.projectId,
        title: data.title.trim(),
        file_url: data.fileUrl || null,
        drive_link: data.driveLink || null,
        status: data.status || 'pending',
      };

      const q = buildInsertQuery('deliverables', insertData);
      const res = await query<Deliverable>(q.text, q.values);
      return res.rows[0];
    } catch (error) {
      console.error('[ProjectRepository.createDeliverable] Error creating deliverable:', error);
      throw error;
    }
  }

  /**
   * Instantiate a project from a reusable template with task offsets
   */
  async createFromTemplate(
    orgId: string,
    templateId: string,
    clientId: string,
    projectName: string,
    startDate: Date = new Date()
  ): Promise<Project> {
    return await transaction(async (client) => {
      // 1. Fetch template
      const templateRes = await client.query(
        'SELECT * FROM project_templates WHERE id = $1 AND organization_id = $2',
        [templateId, orgId]
      );
      if (templateRes.rows.length === 0) {
        throw new Error('Project template not found');
      }
      const template = templateRes.rows[0];

      // 2. Create project
      const projectInsert = buildInsertQuery('projects', {
        organization_id: orgId,
        client_id: clientId,
        title: projectName,
        description: template.description,
        status: 'brief_received',
        start_date: startDate,
      });
      const projectRes = await client.query<Project>(projectInsert.text, projectInsert.values);
      const project = projectRes.rows[0];

      // 3. Fetch template tasks
      const tasksRes = await client.query(
        'SELECT * FROM project_template_tasks WHERE template_id = $1 ORDER BY order_index ASC',
        [templateId]
      );

      // 4. Create tasks with calculated offset due dates
      for (const t of tasksRes.rows) {
        const dueDate = new Date(startDate.getTime() + (t.days_offset || 0) * 86400000);
        await client.query(
          `INSERT INTO tasks (organization_id, project_id, title, description, priority, due_date, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'todo')`,
          [orgId, project.id, t.title, t.description, t.priority || 'medium', dueDate]
        );
      }

      return project;
    });
  }
}

export const projectRepo = new ProjectRepository();
