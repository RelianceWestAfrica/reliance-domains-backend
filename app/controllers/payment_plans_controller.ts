// app/controllers/payment_plans_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import PaymentPlan from '#models/payment_plan'
import PaymentInstallment from '#models/payment_installment'
import Acquisition from '#models/acquisition'
import ProjectPaymentConfig from '#models/project_payment_config'
import PaymentPlanGeneratorService from '#services/payment_plan_generator_service'

export default class PaymentPlansController {

  // GET /api/payment-plans?acquisitionId=
  async index({ request }: HttpContext) {
    const { acquisitionId, projectId } = request.qs()

    const query = PaymentPlan.query()
      .preload('installments', (q) => {
        q.preload('receipts').orderBy('order', 'asc')
      })
      .preload('acquisition', (q) => {
        q.preload('client')
        q.preload('property', (pq) => pq.preload('project'))
      })
      .orderBy('created_at', 'desc')

    if (acquisitionId) query.where('acquisition_id', Number(acquisitionId))

    if (projectId) {
      query.whereHas('acquisition', (aq) => {
        aq.whereHas('property', (pq) => {
          pq.where('project_id', Number(projectId))
        })
      })
    }

    return query
  }

  // GET /api/payment-plans/:id
  async show({ params }: HttpContext) {
    return await PaymentPlan.query()
      .where('id', params.id)
      .preload('installments', (q) => {
        q.preload('receipts').orderBy('order', 'asc')
      })
      .preload('acquisition', (q) => {
        q.preload('client')
        q.preload('property', (pq) => pq.preload('project'))
      })
      .firstOrFail()
  }

  // GET /api/payment-plans/by-acquisition/:acquisitionId
  async showByAcquisition({ params, response }: HttpContext) {
    const plan = await PaymentPlan.query()
      .where('acquisition_id', params.acquisitionId)
      .preload('installments', (q) => {
        q.preload('receipts').orderBy('order', 'asc')
      })
      .preload('acquisition', (q) => {
        q.preload('client')
        q.preload('property', (pq) => pq.preload('project'))
      })
      .first()

    if (!plan) {
      return response.notFound({ message: 'Aucun plan de paiement pour cette acquisition' })
    }

    return response.ok(plan)
  }

  // POST /api/payment-plans — Création manuelle du plan
  async store({ request, response }: HttpContext) {
    const body = request.body()

    const acquisition = await Acquisition.query()
      .where('id', body.acquisitionId)
      .preload('property')
      .firstOrFail()

    // Vérifier qu'il n'y a pas déjà un plan
    const existing = await PaymentPlan.findBy('acquisition_id', body.acquisitionId)
    if (existing) {
      return response.conflict({ message: 'Un plan de paiement existe déjà pour cette acquisition' })
    }

    // Récupérer la config du projet
    const config = await ProjectPaymentConfig.query()
      .where('project_id', acquisition.property.projectId)
      .first()

    const depositAmount = config?.depositAmount ?? 0
    const totalAmount = Number(acquisition.amount)
    const mode = body.mode as 'CASH' | 'PHASED' | 'CUSTOM'

    // Créer le plan
    const plan = await PaymentPlan.create({
      acquisitionId: body.acquisitionId,
      mode,
      totalAmount,
      depositAmount,
      discountAmount: body.discountAmount ?? null,
      discountNote: body.discountNote ?? null,
      deadlineDate: body.deadlineDate ?? null,
      status: 'IN_PROGRESS',
    })

    // Générer les échéances selon le mode
    await this.generateInstallments(plan, mode, totalAmount, depositAmount, config, body.customSteps)

    await plan.load('installments')
    return response.created(plan)
  }

  // PUT /api/payment-plans/:id — Mise à jour plan (statut, deadline, docx, discount)
  async update({ params, request, response }: HttpContext) {
    const plan = await PaymentPlan.findOrFail(params.id)
    const body = request.body()

    plan.merge({
      status: body.status ?? plan.status,
      deadlineDate: body.deadlineDate ?? plan.deadlineDate,
      docxUrl: body.docxUrl ?? plan.docxUrl,
      discountAmount: body.discountAmount ?? plan.discountAmount,
      discountNote: body.discountNote ?? plan.discountNote,
      depositPaidAt: body.depositPaidAt ?? plan.depositPaidAt,
      depositPaymentMethod: body.depositPaymentMethod ?? plan.depositPaymentMethod,
      depositReceiptUrl: body.depositReceiptUrl ?? plan.depositReceiptUrl,
    })

    await plan.save()

    await plan.load('installments')
    return response.ok(plan)
  }

  // DELETE /api/payment-plans/:id
  async destroy({ params, response }: HttpContext) {
    const plan = await PaymentPlan.findOrFail(params.id)
    await plan.delete()
    return response.noContent()
  }

  // POST /api/payment-plans/:id/generate
  async generate({ params, response }: HttpContext) {
    try {
      const fileUrl = await PaymentPlanGeneratorService.generate(params.id)
      return response.ok({ url: fileUrl })
    } catch (e: any) {
      return response.badRequest({ message: e.message })
    }
  }

  // GET /api/payment-plans/variables
  async variables({ response }: HttpContext) {
    return response.ok(PaymentPlanGeneratorService.getAvailableVariables())
  }

  // ─── Helper : génère les échéances selon le mode ──────────────────────────
  private async generateInstallments(
    plan: PaymentPlan,
    mode: 'CASH' | 'PHASED' | 'CUSTOM',
    totalAmount: number,
    depositAmount: number,
    config: ProjectPaymentConfig | null,
    customSteps?: Array<{ label: string; amountDue: number; dueDate?: string; notes?: string }>
  ) {
    const installments: Partial<PaymentInstallment>[] = []

    if (mode === 'CASH') {
      // 1 seule échéance = total - acompte
      installments.push({
        planId: plan.id,
        order: 1,
        label: 'Paiement intégral',
        percent: 100,
        amountDue: totalAmount - depositAmount,
        amountPaid: 0,
        status: 'PENDING',
      })

    } else if (mode === 'PHASED') {
      const steps = config?.phasedSteps ?? []
      let order = 1
      for (const step of steps) {
        const amountDue = Math.round((step.percent / 100) * totalAmount)
        // Sur le 1er versement, déduire l'acompte déjà versé
        const adjustedAmount = order === 1 ? amountDue - depositAmount : amountDue
        installments.push({
          planId: plan.id,
          order,
          label: step.label,
          percent: step.percent,
          amountDue: adjustedAmount,
          amountPaid: 0,
          status: 'PENDING',
        })
        order++
      }

    } else if (mode === 'CUSTOM' && customSteps) {
      let order = 1
      for (const step of customSteps) {
        installments.push({
          planId: plan.id,
          order,
          label: step.label,
          percent: null,
          amountDue: step.amountDue,
          dueDate: step.dueDate ?? null,
          amountPaid: 0,
          notes: step.notes ?? null,
          status: 'PENDING',
        })
        order++
      }
    }

    await PaymentInstallment.createMany(installments)
  }
}
