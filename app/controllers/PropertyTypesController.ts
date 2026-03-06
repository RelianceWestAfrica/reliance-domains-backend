import type { HttpContext } from '@adonisjs/core/http'
import PropertyType from '#models/property_type'

export default class PropertyTypesController {
  async index({ response }: HttpContext) {
    const types = await PropertyType.query().where('actif', true).orderBy('name')
    return response.json(types)
  }

  async store({ request, response }: HttpContext) {
    const { name } = request.only(['name'])
    const existing = await PropertyType.query().where('name', name).first()
    if (existing) {
      existing.actif = true
      await existing.save()
      return response.json(existing)
    }
    const type = await PropertyType.create({ name, actif: true })
    return response.json(type)
  }

  async destroy({ params, response }: HttpContext) {
    const type = await PropertyType.findOrFail(params.id)
    type.actif = false
    await type.save()
    return response.json({ message: 'Type désactivé' })
  }
}
