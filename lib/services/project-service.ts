/**
 * =============================================================================
 * Innoventix Platform v2 — Project Management Service
 * =============================================================================
 * Business logic layer for Projects, Tasks, Deliverables, Template Scaffolding,
 * and Project Lifecycle Operations.
 */

import { projectRepo } from '../db/repositories/project-repo';
import { auditRepo } from '../db/repositories/audit-repo';
import { query, queryOne } from '../db';
import { NotFoundError, ValidationError } from '../utils/error-handler';
import { Project, Task, Deliverable, TaskStatus, PaginationOptions } from '../types/database';

export class ProjectService {
  /**
   * Get project by ID scoped to organization
   */
  async getProject(projectId: string, orgId: string): Promise<Project> {
    const project = await projectRepo.findById(projectId, orgId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    return project;
  }

  /**
   * Create a new project
   */
  async createProject(
    orgId: string,
    actorUserId: string,
    data: {
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
    }
  ): Promise<Project> {
    const project = await projectRepo.create(orgId, data);

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'PROJECT_CREATED',
      resourceType: 'project',
      resourceId: project.id,
      metadata: { title: project.title, clientId: project.client_id },
    });

    return project;
  }

  /**
   * Update project details
   */
  async updateProject(
    projectId: string,
    orgId: string,
    actorUserId: string,
    data: Partial<Omit<Project, 'id' | 'organization_id' | 'created_at'>>
  ): Promise<Project> {
    await this.getProject(projectId, orgId);
    const updated = await projectRepo.update(projectId, orgId, data);
    if (!updated) {
      throw new NotFoundError('Project not found');
    }

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'PROJECT_UPDATED',
      resourceType: 'project',
      resourceId: projectId,
      metadata: data,
    });

    return updated;
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string, orgId: string, actorUserId: string): Promise<boolean> {
    const project = await this.getProject(projectId, orgId);
    await query('DELETE FROM projects WHERE id = $1 AND organization_id = $2', [projectId, orgId]);

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'PROJECT_DELETED',
      resourceType: 'project',
      resourceId: projectId,
      metadata: { title: project.title },
    });

    return true;
  }

  /**
   * List projects with pagination and filters
   */
  async listProjects(
    orgId: string,
    options?: PaginationOptions & { clientId?: string; status?: string; search?: string }
  ) {
    return await projectRepo.list(orgId, options);
  }

  /**
   * Get tasks for a project
   */
  async getTasks(projectId: string, orgId: string) {
    await this.getProject(projectId, orgId);
    return await projectRepo.getTasks(projectId, orgId);
  }

  /**
   * Create a new task
   */
  async createTask(
    orgId: string,
    actorUserId: string,
    data: {
      projectId: string;
      title: string;
      description?: string | null;
      priority?: any;
      assignedTo?: string | null;
      dueDate?: Date | string | null;
    }
  ): Promise<Task> {
    await this.getProject(data.projectId, orgId);
    const task = await projectRepo.createTask(orgId, data);

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'TASK_CREATED',
      resourceType: 'task',
      resourceId: task.id,
      metadata: { title: task.title, projectId: task.project_id },
    });

    return task;
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    taskId: string,
    orgId: string,
    actorUserId: string,
    status: TaskStatus
  ): Promise<Task> {
    const updated = await projectRepo.updateTask(taskId, orgId, { status });
    if (!updated) {
      throw new NotFoundError('Task not found');
    }

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'TASK_STATUS_UPDATED',
      resourceType: 'task',
      resourceId: taskId,
      metadata: { newStatus: status },
    });

    return updated;
  }

  /**
   * Update full task details
   */
  async updateTask(
    taskId: string,
    orgId: string,
    actorUserId: string,
    data: Partial<Omit<Task, 'id' | 'organization_id' | 'created_at'>>
  ): Promise<Task> {
    const updated = await projectRepo.updateTask(taskId, orgId, data);
    if (!updated) {
      throw new NotFoundError('Task not found');
    }

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'TASK_UPDATED',
      resourceType: 'task',
      resourceId: taskId,
      metadata: data,
    });

    return updated;
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string, orgId: string, actorUserId: string): Promise<boolean> {
    const res = await query('DELETE FROM tasks WHERE id = $1 AND organization_id = $2', [taskId, orgId]);
    if ((res.rowCount ?? 0) === 0) {
      throw new NotFoundError('Task not found');
    }

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'TASK_DELETED',
      resourceType: 'task',
      resourceId: taskId,
    });

    return true;
  }

  /**
   * Get deliverables for a project
   */
  async getDeliverables(projectId: string, orgId: string) {
    await this.getProject(projectId, orgId);
    return await projectRepo.getDeliverables(projectId, orgId);
  }

  /**
   * Create a deliverable for a project
   */
  async createDeliverable(
    orgId: string,
    actorUserId: string,
    data: {
      projectId: string;
      title: string;
      fileUrl?: string | null;
      driveLink?: string | null;
    }
  ): Promise<Deliverable> {
    await this.getProject(data.projectId, orgId);
    const deliverable = await projectRepo.createDeliverable(orgId, data);

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'DELIVERABLE_CREATED',
      resourceType: 'deliverable',
      resourceId: deliverable.id,
      metadata: { title: deliverable.title, projectId: deliverable.project_id },
    });

    return deliverable;
  }

  /**
   * Update or review deliverable status (e.g. approved / rejected)
   */
  async updateDeliverable(
    deliverableId: string,
    orgId: string,
    actorUserId: string,
    data: { status?: 'pending' | 'in_review' | 'approved' | 'rejected'; feedback?: string }
  ) {
    const res = await query(
      `UPDATE deliverables 
       SET status = COALESCE($1, status), 
           feedback = COALESCE($2, feedback), 
           updated_at = NOW() 
       WHERE id = $3 AND organization_id = $4 
       RETURNING *`,
      [data.status, data.feedback, deliverableId, orgId]
    );

    const deliverable = res.rows[0];
    if (!deliverable) {
      throw new NotFoundError('Deliverable not found');
    }

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'DELIVERABLE_UPDATED',
      resourceType: 'deliverable',
      resourceId: deliverableId,
      metadata: data,
    });

    return deliverable;
  }

  /**
   * List all project templates
   */
  async listTemplates(orgId: string) {
    const res = await query(
      'SELECT * FROM project_templates WHERE organization_id = $1 OR is_public = true ORDER BY name ASC',
      [orgId]
    );
    return res.rows;
  }

  /**
   * Create a new project template
   */
  async createTemplate(
    orgId: string,
    actorUserId: string,
    data: {
      name: string;
      description?: string;
      category?: string;
      isPublic?: boolean;
    }
  ) {
    const res = await query(
      `INSERT INTO project_templates (organization_id, name, description, category, is_public)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [orgId, data.name, data.description || null, data.category || 'General', data.isPublic ?? false]
    );
    const template = res.rows[0];

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'PROJECT_TEMPLATE_CREATED',
      resourceType: 'project_template',
      resourceId: template.id,
      metadata: { name: template.name },
    });

    return template;
  }

  /**
   * Instantiate project from template
   */
  async createFromTemplate(
    orgId: string,
    actorUserId: string,
    templateId: string,
    clientId: string,
    projectName: string,
    startDate?: Date
  ): Promise<Project> {
    const project = await projectRepo.createFromTemplate(
      orgId,
      templateId,
      clientId,
      projectName,
      startDate
    );

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'PROJECT_CREATED_FROM_TEMPLATE',
      resourceType: 'project',
      resourceId: project.id,
      metadata: { templateId, projectName },
    });

    return project;
  }
}

export const projectService = new ProjectService();
