// app/controllers/payment_installments_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import PaymentInstallment from '#models/payment_installment'
import InstallmentReceipt from '#models/installment_receipt'
import PaymentPlan from '#models/payment_plan'
import fs from 'node:fs'
import app from '@adonisjs/core/services/app'

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

    // Remonter jusqu'au projet via plan → acquisition → property → project
    const plan = await PaymentPlan.query()
      .where('id', installment.planId)
      .preload('acquisition', (q) => {
        q.preload('property', (pq) => pq.preload('project'))
      })
      .firstOrFail()

    const projectName = plan.acquisition?.property?.project?.title
      ?.replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      ?? 'unknown_project'

    const file = request.file('receipt_file', { size: '20mb' })
    const originalName = request.input('original_name')

    if (!file) return response.badRequest({ message: 'Fichier manquant' })

    const fileName = `receipt_${installment.id}_${Date.now()}${file.extname ? '.' + file.extname : ''}`
    const uploadDir = `storage/installment-receipts/${projectName}`

    await file.move(uploadDir, { name: fileName, overwrite: true })

    if (file.state !== 'moved') {
      return response.internalServerError({ message: 'Erreur lors du déplacement du fichier' })
    }

    const fileUrl = `/${uploadDir}/${fileName}`

    const receipt = await InstallmentReceipt.create({
      installmentId: installment.id,
      fileUrl,
      originalName: originalName ?? file.clientName ?? null,
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

  // GET /api/installments/receipts/:receiptId/view
  async viewReceipt({ params, response }: HttpContext) {
    const receipt = await InstallmentReceipt.findOrFail(params.receiptId)
    const filePath = app.makePath(receipt.fileUrl.replace(/^\//, ''))

    if (!fs.existsSync(filePath)) {
      return response.notFound({ message: 'Fichier introuvable' })
    }

    return response.download(filePath)
  }
}
