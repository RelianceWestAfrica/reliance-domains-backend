// app/controllers/residences_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Residence from '#models/residence'
import {
  createResidenceValidator,
  updateResidenceValidator,
} from '#validators/residence'

export default class ResidencesController {
  /**
   * GET /api/residences
   * Filtres : ?q=texte&hId=1&type=IMMEUBLE&status=PUBLISHED
   */
  async index({ request, auth }: HttpContext) {
    const { q, domainId, type, status } = request.qs()
    const user = auth.user

    if (!user) {
      return { message: 'Utilisateur non authentifié' }
    }

    // Projets accessibles
    let allowedProjectIds: any
    if (user.role === 'SUPERADMIN') {
      allowedProjectIds = null
    } else {
      const allowedProjects = await user.related('allowedProjects').query()
      allowedProjectIds = allowedProjects.map((p: any) => p.id)
    }

    const query = Residence.query()
      .preload('domain')
      .orderBy('created_at', 'desc')

    if (allowedProjectIds) {
      query.whereHas('domain', (domainQuery) => {
        domainQuery.whereIn('project_id', allowedProjectIds)
      })
    }
    if (q) query.whereILike('title', `%${q}%`)
    if (domainId) query.where('domain_id', Number(domainId))
    if (type) query.where('type', type)
    if (status) query.where('status', status)

    return query
  }


  /**
   * POST /api/residences
   */
  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createResidenceValidator)

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
  async show({ params }: HttpContext) {
    const residence = await Residence.query()
      .where('id', params.id)
      .preload('domain')
      .firstOrFail()

    return residence
  }

  /**
   * PUT /api/residences/:id
   */
  async update({ params, request }: HttpContext) {
    const residence = await Residence.findOrFail(params.id)
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
  async destroy({ params, response }: HttpContext) {
    const residence = await Residence.findOrFail(params.id)
    await residence.delete()

    return response.noContent()
  }
}
