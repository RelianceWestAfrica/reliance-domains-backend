// app/controllers/properties_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Property from '#models/property'
import Residence from '#models/residence'
import {
  createPropertyValidator,
  updatePropertyValidator,
} from '#validators/property'

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

    // 1) contrôler que la résidence existe
    await Residence.findOrFail(payload.residenceId)

    // 2) préparer les flags
    const isPublished = payload.publish ?? false

    const property = await Property.create({
      title: payload.title,
      type: payload.type,
      residenceId: payload.residenceId,
      status: payload.status,
      roomsCount: payload.roomsCount,
      kitchensCount: payload.kitchensCount,
      surface: payload.surface,
      price: payload.price,
      imageUrl: payload.imageUrl ?? null,
      hasBalcony: payload.hasBalcony ?? false,
      isFurnished: payload.isFurnished ?? false,
      isPublished,
    })

    await property.load('residence')

    return response.created(property)
  }

  /**
   * GET /api/properties/:id
   */
  async show({ params }: HttpContext) {
    const property = await Property.query()
      .where('id', params.id)
      .preload('residence')
      .firstOrFail()

    return property
  }

  /**
   * PUT /api/properties/:id
   */
  async update({ params, request, response }: HttpContext) {
    const property = await Property.findOrFail(params.id)
    const payload = await request.validateUsing(updatePropertyValidator)

    if (payload.residenceId) {
      await Residence.findOrFail(payload.residenceId)
    }

    property.merge({
      title: payload.title ?? property.title,
      type: payload.type ?? property.type,
      residenceId: payload.residenceId ?? property.residenceId,
      status: payload.status ?? property.status,
      roomsCount: payload.roomsCount ?? property.roomsCount,
      kitchensCount: payload.kitchensCount ?? property.kitchensCount,
      surface: payload.surface ?? property.surface,
      price: payload.price ?? property.price,
      imageUrl: payload.imageUrl ?? property.imageUrl,
      hasBalcony: payload.hasBalcony ?? property.hasBalcony,
      isFurnished: payload.isFurnished ?? property.isFurnished,
      isPublished: payload.isPublished ?? property.isPublished,
    })

    await property.save()
    await property.load('residence')

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
