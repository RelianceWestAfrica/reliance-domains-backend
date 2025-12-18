// app/controllers/projects_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Project from '#models/project'
import {
  createProjectValidator,
  updateProjectValidator,
} from '#validators/project'

export default class ProjectsController {
  /**
   * GET /api/projects
   * Filtres possibles : ?q=texte&status=PUBLISHED&countryId=1
   */
  async index({ request }: HttpContext) {
    const { q, status, countryId } = request.qs()

    const query = Project.query().preload('country').orderBy('created_at', 'desc')

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
  async show({ params }: HttpContext) {
    const project = await Project.query()
      .where('id', params.id)
      .preload('country')
      .firstOrFail()

    return project
  }

  /**
   * PUT /api/projects/:id
   */
  async update({ params, request }: HttpContext) {
    const project = await Project.findOrFail(params.id)
    const payload = await request.validateUsing(updateProjectValidator)

    project.merge({
      name: payload.name ?? project.name,
      description: payload.description ?? project.description,
      type: payload.type ?? project.type,
      status: payload.status ?? project.status,
      city: payload.city ?? project.city,
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
  async destroy({ params, response }: HttpContext) {
    const project = await Project.findOrFail(params.id)
    await project.delete()

    return response.noContent()
  }
}
