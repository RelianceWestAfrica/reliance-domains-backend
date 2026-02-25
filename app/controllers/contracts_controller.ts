import type { HttpContext } from '@adonisjs/core/http'
import Contract from '#models/contract'
import ContractTemplate from '#models/contract_template'
import Acquisition from '#models/acquisition'
import ContractGeneratorService from '#services/contract_generator_service'
import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs'

export default class ContractsController {

  /**
   * Liste des contrats d'une acquisition
   */
  async index({ request, response, auth }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('Utilisateur non authentifié')

    const acquisitionId = request.input('acquisition_id')

    const contracts = await Contract.query()
      .where('acquisition_id', acquisitionId)
      .preload('template')
      .preload('client')
      .orderBy('created_at', 'desc')

    return response.json(contracts)
  }

  /**
   * Templates disponibles pour un projet
   */
  async templates({ params, response, auth }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('Utilisateur non authentifié')

    const templates = await ContractTemplate.query()
      .where('project_id', params.projectId)
      .where('actif', true)
      .orderBy('label', 'asc')

    return response.json(templates)
  }

  /**
   * Générer un contrat depuis un template
   */
  async generate({ params, response, auth }: HttpContext) {
    if (!auth.user) return response.unauthorized('Utilisateur non authentifié')

    const user = auth.user

    const { acquisitionId, templateId } = params

    const acquisition = await Acquisition.query()
      .where('id', acquisitionId)
      .preload('client')
      .preload('property', q => {
        q.preload('floor')
        q.preload('residence')
        q.preload('project', (p: any) => p.preload('country'))
      })
      .firstOrFail()

    const template = await ContractTemplate.findOrFail(templateId)

    if (!template.docxPath) {
      return response.badRequest('Ce template ne possède pas de fichier .docx')
    }

    const generator = new ContractGeneratorService()
    const variables = generator.buildVariables(acquisition)

    const fileName = `contrat_${template.type}_${acquisition.client.lastName}_${Date.now()}.docx`
    const generatedPath = await generator.generate(template.docxPath, variables, fileName)

    const contract = await Contract.create({
      acquisitionId: acquisition.id,
      contractTemplateId: template.id,
      clientId: acquisition.clientId,
      projectId: acquisition.property.projectId,
      userId: (user as any).id,
      type: template.type,
      status: 'GENERATED',
      generatedDocxPath: generatedPath,
      generatedAt: DateTime.now(),
    })

    await contract.load('template')
    await contract.load('client')

    return response.json(contract)
  }

  /**
   * Affiche un contrat
   */
  async show({ params, response, auth }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('Utilisateur non authentifié')

    const contract = await Contract.query()
      .where('id', params.id)
      .preload('template')
      .preload('client')
      .preload('acquisition')
      .firstOrFail()

    return response.json(contract)
  }

  /**
   * Upload contrat signé
   */
  async uploadSigned({ params, request, response, auth }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('Utilisateur non authentifié')

    const contract = await Contract.findOrFail(params.id)

    const file = request.file('signed_document', {
      extnames: ['pdf', 'docx'],
      size: '10mb'
    })

    if (!file) return response.badRequest('Fichier manquant')

    const fileName = `signed_${contract.id}_${Date.now()}.${file.extname}`

    await file.move(app.makePath('storage/contracts/signed'), {
      name: fileName
    })

    if (!file.isValid) {
      return response.badRequest(file.errors)
    }

    contract.signedDocumentPath = `contracts/signed/${fileName}`
    contract.status = 'SIGNED'
    contract.signedAt = DateTime.now()
    await contract.save()

    return response.json(contract)
  }

  /**
   * Upload pièce d'identité
   */
  async uploadIdentity({ params, request, response, auth }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('Utilisateur non authentifié')

    const contract = await Contract.findOrFail(params.id)

    const file = request.file('identity_document', {
      extnames: ['pdf', 'jpg', 'jpeg', 'png'],
      size: '10mb'
    })

    if (!file) return response.badRequest('Fichier manquant')

    const fileName = `id_${contract.clientId}_${Date.now()}.${file.extname}`

    await file.move(app.makePath('storage/contracts/identity'), {
      name: fileName
    })

    if (!file.isValid) {
      return response.badRequest(file.errors)
    }

    contract.identityDocumentPath = `contracts/identity/${fileName}`
    await contract.save()

    return response.json(contract)
  }

  /**
   * Télécharger le contrat généré
   */
  async download({ params, response, auth }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('Utilisateur non authentifié')

    const contract = await Contract.findOrFail(params.id)

    if (!contract.generatedDocxPath) {
      return response.notFound('Aucun fichier généré pour ce contrat')
    }

    const filePath = app.makePath('storage', contract.generatedDocxPath)

    if (!fs.existsSync(filePath)) {
      return response.notFound('Fichier introuvable sur le serveur')
    }

    return response.download(filePath)
  }

  /**
   * Télécharger le contrat signé
   */
  async downloadSigned({ params, response, auth }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('Utilisateur non authentifié')

    const contract = await Contract.findOrFail(params.id)

    if (!contract.signedDocumentPath) {
      return response.notFound('Aucun contrat signé pour ce contrat')
    }

    const filePath = app.makePath('storage', contract.signedDocumentPath)

    if (!fs.existsSync(filePath)) {
      return response.notFound('Fichier introuvable sur le serveur')
    }

    return response.download(filePath)
  }

  /**
   * Supprimer un contrat
   */
  async destroy({ params, response, auth }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('Utilisateur non authentifié')

    const contract = await Contract.findOrFail(params.id)

    // Supprimer les fichiers physiques
    const paths = [
      contract.generatedDocxPath,
      contract.generatedPdfPath,
      contract.signedDocumentPath,
      contract.identityDocumentPath,
    ]

    for (const filePath of paths) {
      if (filePath) {
        const fullPath = app.makePath('storage', filePath)
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath)
        }
      }
    }

    await contract.delete()

    return response.json({ message: 'Contrat supprimé avec succès' })
  }
}
