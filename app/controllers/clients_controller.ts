import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client'
import { createClientValidator, updateClientValidator } from '#validators/client'

export default class ClientsController {
  /**
   * GET /api/clients
   * Liste de tous les clients
   */
  async index({}: HttpContext) {
    const clients = await Client.query().orderBy('lastName', 'asc')
    return clients
  }

  /**
   * POST /api/clients
   * Création d'un client
   */
  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createClientValidator)

    // Exemple: empêcher doublon sur email si pertinent
    // const existing = await Client.findBy('email', payload.email)
    // if (existing) {
    //   return response.conflict({ message: 'Un client avec cet email existe déjà' })
    // }

    const client = await Client.create({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      address: payload.address ?? null,
      nationality: payload.nationality ?? null,
    })

    return response.created(client)
  }

  /**
   * GET /api/clients/:id
   * Détail d'un client
   */
  async show({ params }: HttpContext) {
    const client = await Client.findOrFail(params.id)
    return client
  }

  /**
   * PUT /api/clients/:id
   * Mise à jour d'un client
   */
  async update({ params, request, response }: HttpContext) {
    const client = await Client.findOrFail(params.id)
    const payload = await request.validateUsing(updateClientValidator)

    // Exemple: vérifier l'unicité email si changé
    if (payload.email && payload.email !== client.email) {
      const exists = await Client.findBy('email', payload.email)
      if (exists) {
        return response.conflict({ message: 'Un client avec cet email existe déjà' })
      }
    }

    client.merge({
      firstName: payload.firstName ?? client.firstName,
      lastName: payload.lastName ?? client.lastName,
      email: payload.email ?? client.email,
      phone: payload.phone ?? client.phone,
      address: payload.address ?? client.address,
      nationality: payload.nationality ?? client.nationality,
    })

    await client.save()
    return client
  }

  /**
   * DELETE /api/clients/:id
   * Suppression d'un client
   */
  async destroy({ params, response }: HttpContext) {
    const client = await Client.findOrFail(params.id)
    await client.delete()
    return response.noContent()
  }
}
