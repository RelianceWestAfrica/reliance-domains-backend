// app/models/payment_plan.ts
import { BaseModel, belongsTo, hasMany, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Acquisition from '#models/acquisition'
import PaymentInstallment from '#models/payment_installment'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class PaymentPlan extends BaseModel {
  static table = 'payment_plans'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare acquisitionId: number

  @column()
  declare mode: 'CASH' | 'PHASED' | 'CUSTOM'

  @column()
  declare totalAmount: number

  @column()
  declare depositAmount: number

  @column()
  declare depositPaidAt: string | null

  @column()
  declare depositPaymentMethod: string | null

  @column()
  declare depositReceiptUrl: string | null

  @column()
  declare discountAmount: number | null

  @column()
  declare discountNote: string | null

  @column()
  declare status: 'IN_PROGRESS' | 'COMPLETED' | 'DEFAULTED'

  @column()
  declare deadlineDate: string | null

  @column()
  declare docxUrl: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Acquisition)
  declare acquisition: BelongsTo<typeof Acquisition>

  @hasMany(() => PaymentInstallment, { foreignKey: 'planId' })
  declare installments: HasMany<typeof PaymentInstallment>
}
