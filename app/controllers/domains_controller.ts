// app/Controllers/Http/DomainsController.ts
import type { HttpContext } from '@adonisjs/core/http'
import Domain from "#models/domain";
import PermissionService from '#services/permission_service'

export default class DomainsController {
  // LIST
  async index({ request, auth }: HttpContext) {
    const user = auth.user!
    const projectId = request.input('project_id')

    const query = Domain.query()

    if (projectId) {
      query.where('project_id', projectId)
    }

    await PermissionService.filterByProjectAccess(user, query)

    return query
  }

  // CREATE
  async store({ request, auth }: HttpContext) {
    const user = auth.user!
    const payload = request.only([
      'title',
      'domain_type',
      'project_id',
      'description',
      'image_url',
      'published',
    ])

    if (payload.project_id) {
      const canAccess = await PermissionService.canAccessProject(user, payload.project_id)
      if (!canAccess) {
        throw new Error('Vous n\'avez pas accès à ce projet')
      }
    }

    return Domain.create(payload)
  }

  // SHOW
  async show({ params, auth }: HttpContext) {
    const user = auth.user!
    const domain = await Domain.query()
      .where('id', params.id)
      .firstOrFail()

    const canAccess = await PermissionService.canAccessProject(user, domain.projectId)
    if (!canAccess) {
      throw new Error('Vous n\'avez pas accès à ce domaine')
    }

    return domain
  }

  // UPDATE
  async update({ params, request, auth }: HttpContext) {
    const user = auth.user!
    const domain = await Domain.findOrFail(params.id)

    const canAccess = await PermissionService.canAccessProject(user, domain.projectId)
    if (!canAccess) {
      throw new Error('Vous n\'avez pas accès à ce domaine')
    }

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
  async destroy({ params, auth }: HttpContext) {
    const user = auth.user!
    const domain = await Domain.findOrFail(params.id)

    const canAccess = await PermissionService.canAccessProject(user, domain.projectId)
    if (!canAccess) {
      throw new Error('Vous n\'avez pas accès à ce domaine')
    }

    await domain.delete()

    return { success: true }
  }
}
