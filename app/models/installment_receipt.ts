// app/models/installment_receipt.ts
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import PaymentInstallment from '#models/payment_installment'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class InstallmentReceipt extends BaseModel {
  static table = 'installment_receipts'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare installmentId: number

  @column()
  declare fileUrl: string

  @column()
  declare originalName: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => PaymentInstallment, { foreignKey: 'installmentId' })
  declare installment: BelongsTo<typeof PaymentInstallment>
}
