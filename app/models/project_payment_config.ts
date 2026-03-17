// app/models/project_payment_config.ts
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Project from '#models/project'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class ProjectPaymentConfig extends BaseModel {
  static table = 'project_payment_configs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare projectId: number

  @column()
  declare depositAmount: number

  // Mode CASH
  @column({
    prepare: (v) => JSON.stringify(v),
    consume: (v) => (typeof v === 'string' ? JSON.parse(v) : v),
  })
  declare cashSteps: Array<{
    order: number
    label: string
    percent: number
    trigger: string
  }> | null

  @column()
  declare cashTemplateUrl: string | null

  // Mode TRIPHASÉ
  @column({
    prepare: (v) => JSON.stringify(v),
    consume: (v) => (typeof v === 'string' ? JSON.parse(v) : v),
  })
  declare phasedSteps: Array<{
    order: number
    label: string
    percent: number
    trigger: string
  }> | null

  @column()
  declare phasedTemplateUrl: string | null

  // Mode PERSONNALISÉ
  @column()
  declare customTemplateUrl: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>
}
