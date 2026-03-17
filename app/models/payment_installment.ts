// app/models/payment_installment.ts
import { BaseModel, belongsTo, hasMany, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import PaymentPlan from '#models/payment_plan'
import InstallmentReceipt from '#models/installment_receipt'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class PaymentInstallment extends BaseModel {
  static table = 'payment_installments'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare planId: number

  @column()
  declare order: number

  @column()
  declare label: string

  @column()
  declare percent: number | null

  @column()
  declare amountDue: number

  @column()
  declare amountPaid: number

  @column()
  declare dueDate: string | null

  @column()
  declare paidAt: string | null

  @column()
  declare status: 'PENDING' | 'PAID' | 'LATE' | 'PARTIAL'

  @column()
  declare paymentMethod: string | null

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => PaymentPlan, { foreignKey: 'planId' })
  declare plan: BelongsTo<typeof PaymentPlan>

  @hasMany(() => InstallmentReceipt, { foreignKey: 'installmentId' })
  declare receipts: HasMany<typeof InstallmentReceipt>
}
