import type { HttpContext } from '@adonisjs/core/http'
import ContractTemplateService from '#services/contract_template_service'

export default class ContractTemplatesController {

  /**
   * Liste des templates d'un projet
   */
  async index({ params, response, auth }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('Utilisateur non authentifié')

    const service = new ContractTemplateService()
    const templates = await service.getProjectTemplates(params.projectId)

    return response.json(templates)
  }

  /**
   * Upload d'un template .docx
   */
  async store({ params, request, response, auth }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('Utilisateur non authentifié')

    const file = request.file('template_file', {
      extnames: ['docx'],
      size: '20mb'
    })

    if (!file) return response.badRequest('Fichier .docx manquant')

    const type = request.input('type')
    const label = request.input('label')

    if (!type || !label) {
      return response.badRequest('Le type et le label sont obligatoires')
    }

    const service = new ContractTemplateService()
    const template = await service.uploadTemplate(
      Number(params.projectId),
      type,
      label,
      file
    )

    return response.json(template)
  }

  /**
   * Activer / désactiver un template
   */
  async toggle({ params, response, auth }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('Utilisateur non authentifié')

    const service = new ContractTemplateService()
    const template = await service.toggleActif(params.id)

    return response.json(template)
  }

  /**
   * Variables disponibles pour les templates
   */
  async variables({ response, auth }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('Utilisateur non authentifié')

    const service = new ContractTemplateService()
    return response.json(service.getAvailableVariables())
  }

  /**
   * Supprimer un template
   */
  async destroy({ params, response, auth }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized('Utilisateur non authentifié')

    const service = new ContractTemplateService()
    await service.deleteTemplate(params.id)

    return response.json({ message: 'Template supprimé avec succès' })
  }
}
