import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

import Residence from '#models/residence'
import Project from '#models/project'
import ResidenceFloor from '#models/residence_floor'

import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Property extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare type: 'APARTMENT' | 'VILLA' | 'SHOP' | 'OFFICE' | 'OTHER'

  /**
   * FK Residence (nullable)
   */
  @column({ columnName: 'residence_id' })
  declare residenceId: number | null

  @belongsTo(() => Residence)
  declare residence: BelongsTo<typeof Residence>

  /**
   * FK Residence Floor (nullable)
   */
  @column({ columnName: 'floor_id' })
  declare residenceFloorId: number | null

  @belongsTo(() => ResidenceFloor)
  declare residenceFloor: BelongsTo<typeof ResidenceFloor>

  /**
   * FK Project (NOT NULL)
   */
  @column({ columnName: 'project_id' })
  declare projectId: number

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  @column()
  declare status: 'AVAILABLE' | 'UNDER_DISCUSSION' | 'RESERVED' | 'SOLD'

  @column({ columnName: 'rooms_count' })
  declare roomsCount: number

  @column({ columnName: 'kitchens_count' })
  declare kitchensCount: number

  @column()
  declare surface: number

  @column()
  declare price: number

  @column({ columnName: 'image_url' })
  declare imageUrl: string | null

  @column({ columnName: 'image_plan' })
  declare imagePlan: string | null

  @column({ columnName: 'has_balcony' })
  declare hasBalcony: boolean

  @column({ columnName: 'is_furnished' })
  declare isFurnished: boolean

  @column({ columnName: 'is_published' })
  declare isPublished: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
