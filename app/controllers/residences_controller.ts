// app/controllers/residences_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Residence from '#models/residence'
import {
  createResidenceValidator,
  updateResidenceValidator,
} from '#validators/residence'
import Domain from '#models/domain'
import PermissionService from '#services/permission_service'
import User from '#models/user'

export default class ResidencesController {
  /**
   * GET /api/residences
   * Filtres : ?q=texte&hId=1&type=IMMEUBLE&status=PUBLISHED
   */
  async index({ request, auth }: HttpContext) {
    const user = auth.user as User
    const { q, domainId, type, status } = request.qs()

    const query = Residence.query()
      .preload('domain')
      .orderBy('created_at', 'desc')

    if (user.role !== 'SUPERADMIN') {
      const allowedProjectIds = await PermissionService.getAllowedProjectIds(user)

      if (allowedProjectIds.length === 0) {
        return []
      }

      const allowedDomains = await Domain.query()
        .whereIn('project_id', allowedProjectIds)
        .select('id')

      const allowedDomainIds = allowedDomains.map(d => d.id)

      if (allowedDomainIds.length === 0) {
        return []
      }

      query.whereIn('domain_id', allowedDomainIds)
    }

    if (q) {
      query.whereILike('title', `%${q}%`)
    }

    if (domainId) {
      query.where('domainId', Number(domainId))
    }

    if (type) {
      query.where('type', type)
    }

    if (status) {
      query.where('status', status)
    }

    const residences = await query
    return residences
  }

  /**
   * POST /api/residences
   */
  async store({ request, response, auth }: HttpContext) {
    const user = auth.user as User
    const payload = await request.validateUsing(createResidenceValidator)

    const domain = await Domain.findOrFail(payload.domainId)
    const canAccess = await PermissionService.canAccessProject(user, domain.projectId)

    if (!canAccess) {
      return response.forbidden({ message: 'Vous n\'avez pas accès à ce domaine' })
    }

    const residence = await Residence.create({
      title: payload.title,
      type: payload.type,
      domainId: payload.domainId,
      description: payload.description,
      floorsCount: payload.floorsCount,
      unitsCount: payload.unitsCount,
      imageUrl: payload.imageUrl ?? null,
      status: payload.publish ? 'PUBLISHED' : 'DRAFT',
    })

    await residence.load('domain')

    return response.created(residence)
  }

  /**
   * GET /api/residences/:id
   */
  async show({ params, auth }: HttpContext) {
    const user = auth.user as User
    const residence = await Residence.query()
      .where('id', params.id)
      .preload('domain')
      .firstOrFail()

    const domain = await Domain.findOrFail(residence.domainId)
    const canAccess = await PermissionService.canAccessProject(user, domain.projectId)

    if (!canAccess) {
      throw new Error('Vous n\'avez pas accès à cette résidence')
    }

    return residence
  }

  /**
   * PUT /api/residences/:id
   */
  async update({ params, request, auth }: HttpContext) {
    const user = auth.user as User
    const residence = await Residence.findOrFail(params.id)

    const domain = await Domain.findOrFail(residence.domainId)
    const canAccess = await PermissionService.canAccessProject(user, domain.projectId)

    if (!canAccess) {
      throw new Error('Vous n\'avez pas accès à cette résidence')
    }

    const payload = await request.validateUsing(updateResidenceValidator)

    residence.merge({
      title: payload.title ?? residence.title,
      type: payload.type ?? residence.type,
      domainId: payload.domainId ?? residence.domainId,
      description: payload.description ?? residence.description,
      floorsCount: payload.floorsCount ?? residence.floorsCount,
      unitsCount: payload.unitsCount ?? residence.unitsCount,
      imageUrl: payload.imageUrl ?? residence.imageUrl,
      status: payload.status ?? residence.status,
    })

    await residence.save()
    await residence.load('domain')

    return residence
  }

  /**
   * DELETE /api/residences/:id
   */
  async destroy({ params, response, auth }: HttpContext) {
    const user = auth.user as User
    const residence = await Residence.findOrFail(params.id)

    const domain = await Domain.findOrFail(residence.domainId)
    const canAccess = await PermissionService.canAccessProject(user, domain.projectId)

    if (!canAccess) {
      return response.forbidden({ message: 'Vous n\'avez pas accès à cette résidence' })
    }

    await residence.delete()

    return response.noContent()
  }
}
