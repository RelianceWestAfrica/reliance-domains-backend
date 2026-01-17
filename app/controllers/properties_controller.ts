// app/controllers/properties_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Property from '#models/property'
import Residence from '#models/residence'
import {
  createPropertyValidator,
  updatePropertyValidator,
} from '#validators/property'
import Project from "#models/project";
import ResidenceFloor from "#models/residence_floor";

export default class PropertiesController {
  /**
   * GET /api/properties
   * Filtres : ?q=&type=&status=&residenceId=&minPrice=&maxPrice=&minSurface=&maxSurface=
   */
  async index({ request }: HttpContext) {
    const {
      q,
      type,
      status,
      residenceId,
      minPrice,
      maxPrice,
      minSurface,
      maxSurface,
    } = request.qs()

    const query = Property.query()
      .preload('residence')
      .orderBy('created_at', 'desc')

    if (q) {
      query.whereILike('title', `%${q}%`)
    }

    if (type) {
      query.where('type', type)
    }

    if (status) {
      query.where('status', status)
    }

    if (residenceId) {
      query.where('residence_id', Number(residenceId))
    }

    if (minPrice) {
      query.where('price', '>=', Number(minPrice))
    }
    if (maxPrice) {
      query.where('price', '<=', Number(maxPrice))
    }

    if (minSurface) {
      query.where('surface', '>=', Number(minSurface))
    }
    if (maxSurface) {
      query.where('surface', '<=', Number(maxSurface))
    }

    const properties = await query
    return properties
  }

  /**
   * POST /api/properties
   * Création d'une propriété
   */
  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createPropertyValidator)

    // FK obligatoires
    await Project.findOrFail(payload.projectId)

    // FK optionnelles
    if (payload.residenceId) {
      await Residence.findOrFail(payload.residenceId)
    }

    if (payload.residenceFloorId) {
      await ResidenceFloor.findOrFail(payload.residenceFloorId)
    }

    const property = await Property.create({
      title: payload.title,
      type: payload.type,
      projectId: payload.projectId,
      residenceId: payload.residenceId ?? null,
      residenceFloorId: payload.residenceFloorId ?? null,
      status: payload.status,
      roomsCount: payload.roomsCount,
      kitchensCount: payload.kitchensCount,
      surface: payload.surface,
      price: payload.price,
      imageUrl: payload.imageUrl ?? null,
      imagePlan: payload.imagePlan ?? null,
      hasBalcony: payload.hasBalcony ?? false,
      isFurnished: payload.isFurnished ?? false,
      isPublished: payload.publish ?? false,
    })

    await property.load((loader) => {
      loader.load('residence')
      loader.load('residenceFloor')
      loader.load('project')
    })

    return response.created(property)
  }

  /**
   * GET /api/properties/:id
   */
  async show({ params }: HttpContext) {
    return await Property.query()
      .where('id', params.id)
      .preload('residence')
      .preload('residenceFloor')
      .preload('project')
      .firstOrFail()
  }


  /**
   * PUT /api/properties/:id
   */
  async update({ params, request, response }: HttpContext) {
    const property = await Property.findOrFail(params.id)
    const payload = await request.validateUsing(updatePropertyValidator)

    if (payload.projectId) {
      await Project.findOrFail(payload.projectId)
    }

    if (payload.residenceId) {
      await Residence.findOrFail(payload.residenceId)
    }

    if (payload.residenceFloorId) {
      await ResidenceFloor.findOrFail(payload.residenceFloorId)
    }

    property.merge({
      title: payload.title,
      type: payload.type,
      projectId: payload.projectId,
      residenceId: payload.residenceId ?? null,
      residenceFloorId: payload.residenceFloorId ?? null,
      status: payload.status,
      roomsCount: payload.roomsCount,
      kitchensCount: payload.kitchensCount,
      surface: payload.surface,
      price: payload.price,
      imageUrl: payload.imageUrl,
      imagePlan: payload.imagePlan,
      hasBalcony: payload.hasBalcony,
      isFurnished: payload.isFurnished,
      isPublished: payload.isPublished,
    })

    await property.save()

    await property.load((loader) => {
      loader.load('residence')
      loader.load('residenceFloor')
      loader.load('project')
    })

    return response.ok(property)
  }


  /**
   * DELETE /api/properties/:id
   */
  async destroy({ params, response }: HttpContext) {
    const property = await Property.findOrFail(params.id)
    await property.delete()

    return response.noContent()
  }
}
