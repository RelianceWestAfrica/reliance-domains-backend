// app/controllers/residence_floors_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import ResidenceFloor from '#models/residence_floor'
import Residence from '#models/residence'
import {
  createResidenceFloorValidator,
  updateResidenceFloorValidator,
} from '#validators/residence_floor'
import Property from "#models/property";
import Acquisition from "#models/acquisition";

export default class ResidenceFloorsController {
  /**
   * GET /api/floors
   * Filtres : ?residenceId=1&q=Rez&level=0
   */
  async index({ request, auth }: HttpContext) {
    const { q, residenceId, level } = request.qs()
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
    
    const query = ResidenceFloor.query()
      .preload('residence', (rQuery) => rQuery.preload('domain'))
      .orderBy('level', 'asc')

    if (allowedProjectIds) {
      query.whereHas('residence', (resQuery) => {
        resQuery.whereHas('domain', (domainQuery) => {
          domainQuery.whereIn('project_id', allowedProjectIds)
        })
      })
    }

    if (residenceId) query.where('residence_id', Number(residenceId))
    if (q) query.whereILike('name', `%${q}%`)
    if (level !== undefined) query.where('level', Number(level))

    return query
  }

  /**
   * POST /api/floors
   */
  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createResidenceFloorValidator)

    // Vérifier que la résidence existe
    await Residence.findOrFail(payload.residenceId)

    // Contrôle business : disponibles <= unités
    if (payload.availableUnits > payload.unitsCount) {
      return response.unprocessableEntity({
        message: 'Les unités disponibles ne peuvent pas dépasser le nombre total d’unités',
      })
    }

    try {
      const floor = await ResidenceFloor.create({
        residenceId: payload.residenceId,
        name: payload.name,
        level: payload.level,
        description: payload.description ?? null,
        unitsCount: payload.unitsCount,
        availableUnits: payload.availableUnits,
      })

      await floor.load('residence')

      return response.created(floor)
    } catch (error) {
      // Gestion d’unicité (residence_id + level)
      if ((error as any).code === 'ER_DUP_ENTRY' || (error as any).code === '23505') {
        return response.conflict({
          message: 'Ce niveau existe déjà pour cette résidence',
        })
      }
      throw error
    }
  }

  /**
   * GET /api/floors/:id
   */
  async show({ params }: HttpContext) {
    const floor = await ResidenceFloor.query()
      .where('id', params.id)
      .preload('residence')
      .firstOrFail()

    return floor
  }

  public async showByIdResidence({ params }: HttpContext) {
    const floors = await ResidenceFloor
      .query()
      .where('residence_id', params.id)
      .orderBy('id', 'asc')
      .preload('residence')

    const properties = await Property
      .all()

    const acquisitions = (await Acquisition
        .query()
        .orderBy('created_at', 'desc')
        .preload('client')
    ).map(a => a.serialize())

    console.log(acquisitions)

    const result = floors.map((floor) => {
      return {
        ...floor.serialize(),
        properties: properties
          .filter(property => property.residenceFloorId === floor.id)
          .map(property => {
            // filtrer les acquisitions liées à ce property
            const propertyAcquisitions = acquisitions
              .filter(acq => acq.propertyId === property.$original.id)
              .sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              )

            return {
              ...property.$original,
              lastAcquisition: propertyAcquisitions[0] || null,
            }
          }),
      }
    })

    return result
  }

  /**
   * PUT /api/floors/:id
   */
  async update({ params, request, response }: HttpContext) {
    const floor = await ResidenceFloor.findOrFail(params.id)
    const payload = await request.validateUsing(updateResidenceFloorValidator)

    if (payload.residenceId) {
      await Residence.findOrFail(payload.residenceId)
    }

    const unitsCount = payload.unitsCount ?? floor.unitsCount
    const availableUnits = payload.availableUnits ?? floor.availableUnits

    if (availableUnits > unitsCount) {
      return response.unprocessableEntity({
        message: 'Les unités disponibles ne peuvent pas dépasser le nombre total d’unités',
      })
    }

    floor.merge({
      residenceId: payload.residenceId ?? floor.residenceId,
      name: payload.name ?? floor.name,
      level: payload.level ?? floor.level,
      description: payload.description ?? floor.description,
      unitsCount,
      availableUnits,
    })

    try {
      await floor.save()
      await floor.load('residence')
      return floor
    } catch (error) {
      if ((error as any).code === 'ER_DUP_ENTRY' || (error as any).code === '23505') {
        return response.conflict({
          message: 'Ce niveau existe déjà pour cette résidence',
        })
      }
      throw error
    }
  }

  /**
   * DELETE /api/floors/:id
   */
  async destroy({ params, response }: HttpContext) {
    const floor = await ResidenceFloor.findOrFail(params.id)
    await floor.delete()

    return response.noContent()
  }
}
