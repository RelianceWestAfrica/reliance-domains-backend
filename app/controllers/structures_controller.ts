import type { HttpContext } from '@adonisjs/core/http'
import Structure from '#models/structure'

export default class StructuresController {
  async index({ response, auth }: HttpContext) {
    if (!auth.user) return response.unauthorized()
    const structures = await Structure.query().where('actif', true).orderBy('name')
    return response.json(structures)
  }

  async store({ request, response, auth }: HttpContext) {
    if (!auth.user) return response.unauthorized()
    const { name, code } = request.only(['name', 'code'])
    const structure = await Structure.create({ name, code: code ?? name.toUpperCase().replace(/\s/g, ''), actif: true })
    return response.json(structure)
  }

  async destroy({ params, response, auth }: HttpContext) {
    if (!auth.user) return response.unauthorized()
    const structure = await Structure.findOrFail(params.id)
    structure.actif = false
    await structure.save()
    return response.json({ message: 'Structure désactivée' })
  }
}
