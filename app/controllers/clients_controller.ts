import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client'
import { createClientValidator, updateClientValidator } from '#validators/client'
import fs from 'node:fs'
import app from '@adonisjs/core/services/app'

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
      birthDate: payload.birth_date ?? null,
      birthPlace: payload.birth_place ?? null,
      profession: payload.profession ?? null,
      identityNumber: payload.identity_number ?? null,
      identityType: payload.identity_type ?? null,
      identityIssuedAt: payload.identity_issued_at ?? null,
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
      birthDate: payload.birth_date ?? client.birthDate,
      birthPlace: payload.birth_place ?? client.birthPlace,
      profession: payload.profession ?? client.profession,
      identityNumber: payload.identity_number ?? client.identityNumber,
      identityType: payload.identity_type ?? null,
      identityIssuedAt: payload.identity_issued_at ?? null,
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

  async uploadIdentityDocument({ params, request, response }: HttpContext) {
    const client = await Client.findOrFail(params.id)

    const file = request.file('identity_document', {
      size: '10mb',
      extnames: ['pdf', 'jpg', 'jpeg', 'png'],
    })

    if (!file) return response.badRequest({ message: 'Fichier manquant' })

    const fileName = `identity_${client.id}_${Date.now()}.${file.extname}`
    const uploadDir = `storage/clients/identity-documents`

    await file.move(uploadDir, { name: fileName, overwrite: true })

    if (file.state !== 'moved') {
      return response.internalServerError({ message: 'Erreur lors du déplacement du fichier' })
    }

    client.identityDocumentPath = `${uploadDir}/${fileName}`
    await client.save()

    return response.ok({ path: client.identityDocumentPath })
  }

  async downloadIdentityDocument({ params, response, auth }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('Non authentifié')

    const client = await Client.findOrFail(params.id)

    if (!client.identityDocumentPath) {
      return response.notFound({ message: 'Aucune pièce d\'identité enregistrée' })
    }

    const filePath = app.makePath(client.identityDocumentPath)

    if (!fs.existsSync(filePath)) {
      return response.notFound({ message: 'Fichier introuvable' })
    }

    return response.download(filePath)
  }
}
