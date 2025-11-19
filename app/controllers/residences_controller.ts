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
   * Filtres : ?q=texte&projectId=1&type=IMMEUBLE&status=PUBLISHED
   */
  async index({ request }: HttpContext) {
    const { q, projectId, type, status } = request.qs()

    const query = Residence.query()
      .preload('project')
      .orderBy('created_at', 'desc')

    if (q) {
      query.whereILike('title', `%${q}%`)
    }

    if (projectId) {
      query.where('project_id', Number(projectId))
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
  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createResidenceValidator)

    const residence = await Residence.create({
      title: payload.title,
      type: payload.type,
      projectId: payload.projectId,
      description: payload.description,
      floorsCount: payload.floorsCount,
      unitsCount: payload.unitsCount,
      imageUrl: payload.imageUrl ?? null,
      status: payload.publish ? 'PUBLISHED' : 'DRAFT',
    })

    await residence.load('project')

    return response.created(residence)
  }

  /**
   * GET /api/residences/:id
   */
  async show({ params }: HttpContext) {
    const residence = await Residence.query()
      .where('id', params.id)
      .preload('project')
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
      projectId: payload.projectId ?? residence.projectId,
      description: payload.description ?? residence.description,
      floorsCount: payload.floorsCount ?? residence.floorsCount,
      unitsCount: payload.unitsCount ?? residence.unitsCount,
      imageUrl: payload.imageUrl ?? residence.imageUrl,
      status: payload.status ?? residence.status,
    })

    await residence.save()
    await residence.load('project')

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
