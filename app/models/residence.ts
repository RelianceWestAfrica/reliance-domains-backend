// app/models/residence.ts
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Project from '#models/project'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Residence extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare type: 'IMMEUBLE' | 'VILLAS' | 'AUTRE'

  @column({ columnName: 'project_id' })
  declare projectId: number

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  @column()
  declare description: string

  @column({ columnName: 'floors_count' })
  declare floorsCount: number

  @column({ columnName: 'units_count' })
  declare unitsCount: number

  @column({ columnName: 'image_url' })
  declare imageUrl: string | null

  @column()
  declare status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
