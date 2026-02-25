// app/Controllers/Http/DomainsController.ts
import type { HttpContext } from '@adonisjs/core/http'
import Domain from "#models/domain";

export default class DomainsController {
  // LIST
  async index({ request, auth }: HttpContext) {
    const user = auth.user

    if (!user) {
      return { message: 'Utilisateur non authentifié' }
    }

    const projectId = request.input('project_id')

    // Projets accessibles
    let allowedProjectIds: any
    if (user.role === 'SUPERADMIN') {
      allowedProjectIds = null
    } else {
      const allowedProjects = await user.related('allowedProjects').query()
      allowedProjectIds = allowedProjects.map((p: any) => p.id)
    }

    const query = Domain.query().orderBy('created_at', 'desc')

    if (allowedProjectIds) query.whereIn('project_id', allowedProjectIds)
    if (projectId) query.where('project_id', projectId)

    return query
  }

  // CREATE
  async store({ request }: HttpContext) {
    const payload = request.only([
      'title',
      'domain_type',
      'project_id',
      'description',
      'residencesCount',
      'image_url',
      'published',
    ])

    return Domain.create(payload)
  }

  // SHOW
  async show({ params }: HttpContext) {
    return Domain.query()
      .where('id', params.id)
      .firstOrFail()
  }

  // UPDATE
  async update({ params, request }: HttpContext) {
    const domain = await Domain.findOrFail(params.id)

    const payload = request.only([
      'title',
      'domain_type',
      'description',
      'image_url',
      'published',
    ])

    domain.merge(payload)
    await domain.save()

    return domain
  }

  // DELETE
  async destroy({ params }: HttpContext) {
    const domain = await Domain.findOrFail(params.id)
    await domain.delete()

    return { success: true }
  }
}
