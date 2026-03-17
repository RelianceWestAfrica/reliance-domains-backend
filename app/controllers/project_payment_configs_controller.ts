// app/controllers/project_payment_configs_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import ProjectPaymentConfig from '#models/project_payment_config'
import Project from '#models/project'

export default class ProjectPaymentConfigsController {

  // GET /api/payment-configs/:projectId
  async showByProject({ params, response }: HttpContext) {
    const config = await ProjectPaymentConfig.query()
      .where('project_id', params.projectId)
      .preload('project')
      .first()

    if (!config) {
      return response.notFound({ message: 'Aucune configuration trouvée pour ce projet' })
    }

    return response.ok(config)
  }

  // POST /api/payment-configs
  async store({ request, response }: HttpContext) {
    const body = request.body()

    await Project.findOrFail(body.projectId)

    // Vérifier qu'il n'en existe pas déjà une
    const existing = await ProjectPaymentConfig.findBy('project_id', body.projectId)
    if (existing) {
      return response.conflict({ message: 'Une configuration existe déjà pour ce projet' })
    }

    const config = await ProjectPaymentConfig.create({
      projectId: body.projectId,
      depositAmount: body.depositAmount,
      cashSteps: body.cashSteps ?? null,
      cashTemplateUrl: body.cashTemplateUrl ?? null,
      phasedSteps: body.phasedSteps ?? null,
      phasedTemplateUrl: body.phasedTemplateUrl ?? null,
      customTemplateUrl: body.customTemplateUrl ?? null,
    })

    await config.load('project')
    return response.created(config)
  }

  // PUT /api/payment-configs/:projectId
  async updateByProject({ params, request, response }: HttpContext) {
    const config = await ProjectPaymentConfig.query()
      .where('project_id', params.projectId)
      .firstOrFail()

    const body = request.body()

    config.merge({
      depositAmount: body.depositAmount ?? config.depositAmount,
      cashSteps: body.cashSteps ?? config.cashSteps,
      cashTemplateUrl: body.cashTemplateUrl ?? config.cashTemplateUrl,
      phasedSteps: body.phasedSteps ?? config.phasedSteps,
      phasedTemplateUrl: body.phasedTemplateUrl ?? config.phasedTemplateUrl,
      customTemplateUrl: body.customTemplateUrl ?? config.customTemplateUrl,
    })

    await config.save()
    await config.load('project')
    return response.ok(config)
  }
}
