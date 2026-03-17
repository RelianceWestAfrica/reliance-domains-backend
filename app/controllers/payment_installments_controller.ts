// app/controllers/payment_installments_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import PaymentInstallment from '#models/payment_installment'
import InstallmentReceipt from '#models/installment_receipt'
import PaymentPlan from '#models/payment_plan'

export default class PaymentInstallmentsController {

  // PUT /api/installments/:id — Marquer paiement / mise à jour
  async update({ params, request, response }: HttpContext) {
    const installment = await PaymentInstallment.findOrFail(params.id)
    const body = request.body()

    const amountPaid = body.amountPaid ?? installment.amountPaid

    // Calculer le statut automatiquement
    let status = installment.status
    if (amountPaid >= installment.amountDue) {
      status = 'PAID'
    } else if (amountPaid > 0 && amountPaid < installment.amountDue) {
      status = 'PARTIAL'
    }

    installment.merge({
      amountPaid,
      status,
      paidAt: body.paidAt ?? installment.paidAt,
      paymentMethod: body.paymentMethod ?? installment.paymentMethod,
      dueDate: body.dueDate ?? installment.dueDate,
      notes: body.notes ?? installment.notes,
    })

    await installment.save()

    // Vérifier si toutes les échéances du plan sont payées → mettre à jour le plan
    await this.syncPlanStatus(installment.planId)

    await installment.load('receipts')
    return response.ok(installment)
  }

  // POST /api/installments/:id/receipts — Upload facture
  async addReceipt({ params, request, response }: HttpContext) {
    const installment = await PaymentInstallment.findOrFail(params.id)
    const body = request.body()

    const receipt = await InstallmentReceipt.create({
      installmentId: installment.id,
      fileUrl: body.fileUrl,
      originalName: body.originalName ?? null,
    })

    return response.created(receipt)
  }

  // DELETE /api/installments/receipts/:receiptId — Supprimer facture
  async deleteReceipt({ params, response }: HttpContext) {
    const receipt = await InstallmentReceipt.findOrFail(params.receiptId)
    await receipt.delete()
    return response.noContent()
  }

  // ─── Helper : sync statut global du plan ─────────────────────────────────
  private async syncPlanStatus(planId: number) {
    const plan = await PaymentPlan.findOrFail(planId)
    const installments = await PaymentInstallment.query().where('plan_id', planId)

    const allPaid = installments.every(i => i.status === 'PAID')
    if (allPaid) {
      plan.status = 'COMPLETED'
      await plan.save()
    }
  }
}
