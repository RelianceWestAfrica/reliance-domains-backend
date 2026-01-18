// app/controllers/projects_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Project from '#models/project'
import {
  createProjectValidator,
  updateProjectValidator,
} from '#validators/project'
import User from '#models/user'

export default class ProjectsController {
  /**
   * GET /api/projects
   * Filtres possibles : ?q=texte&status=PUBLISHED&countryId=1
   */
  async index({ request, auth }: HttpContext) {
    const user = auth.user as User
    const { q, status, countryId } = request.qs()

    const query = Project.query().preload('country').orderBy('created_at', 'desc')

    if (user.role !== 'SUPERADMIN') {
      await user.load('allowedProjects')
      const allowedProjectIds = user.allowedProjects.map((p: any) => p.id)

      if (allowedProjectIds.length === 0) {
        return []
      }

      query.whereIn('id', allowedProjectIds)
    }

    if (q) {
      query.whereILike('name', `%${q}%`)
    }

    if (status) {
      query.where('status', status)
    }

    if (countryId) {
      query.where('country_id', Number(countryId))
    }

    const projects = await query
    return projects
  }

  /**
   * POST /api/projects
   */
  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createProjectValidator)

    const project = await Project.create({
      name: payload.name,
      description: payload.description ?? null,
      type: payload.type,
      status: payload.status ?? 'DRAFT',
      city: payload.city,
      entreprise: payload.entreprise,
      adresse: payload.adresse,
      countryId: payload.countryId,
      heroImageUrl: payload.heroImageUrl,
      residencesCount: payload.residencesCount ?? 0,
      propertiesCount: payload.propertiesCount ?? 0,
    })

    await project.load('country')

    return response.created(project)
  }

  /**
   * GET /api/projects/:id
   */
  async show({ params, auth }: HttpContext) {
    const user = auth.user as User
    const query = Project.query()
      .where('id', params.id)
      .preload('country')

    if (user.role !== 'SUPERADMIN') {
      await user.load('allowedProjects')
      const allowedProjectIds = user.allowedProjects.map((p: any) => p.id)
      query.whereIn('id', allowedProjectIds)
    }

    const project = await query.firstOrFail()
    return project
  }

  /**
   * PUT /api/projects/:id
   */
  async update({ params, request, auth }: HttpContext) {
    const user = auth.user as User
    const project = await Project.findOrFail(params.id)

    if (user.role !== 'SUPERADMIN') {
      await user.load('allowedProjects')
      const allowedProjectIds = user.allowedProjects.map((p) => p.id)

      if (!allowedProjectIds.includes(project.id)) {
        throw new Error('Vous n\'avez pas accès à ce projet')
      }
    }

    const payload = await request.validateUsing(updateProjectValidator)

    project.merge({
      name: payload.name ?? project.name,
      description: payload.description ?? project.description,
      type: payload.type ?? project.type,
      status: payload.status ?? project.status,
      city: payload.city ?? project.city,
      entreprise: payload.entreprise ?? project.entreprise,
      adresse: payload.adresse ?? project.adresse,
      countryId: payload.countryId ?? project.countryId,
      heroImageUrl: payload.heroImageUrl ?? project.heroImageUrl,
      residencesCount: payload.residencesCount ?? project.residencesCount,
      propertiesCount: payload.propertiesCount ?? project.propertiesCount,
    })

    await project.save()
    await project.load('country')

    return project
  }

  /**
   * DELETE /api/projects/:id
   */
  async destroy({ params, response, auth }: HttpContext) {
    const user = auth.user as User
    const project = await Project.findOrFail(params.id)

    if (user.role !== 'SUPERADMIN') {
      await user.load('allowedProjects')
      const allowedProjectIds = user.allowedProjects.map((p: any) => p.id)

      if (!allowedProjectIds.includes(project.id)) {
        throw new Error('Vous n\'avez pas accès à ce projet')
      }
    }

    await project.delete()

    return response.noContent()
  }
}
