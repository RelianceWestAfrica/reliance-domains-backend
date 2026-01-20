import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Residence from '#models/residence'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Property from "#models/property";

export default class ResidenceFloor extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare level: number

  @column()
  declare description: string | null

  @column({ columnName: 'units_count' })
  declare unitsCount: number

  @column({ columnName: 'available_units' })
  declare availableUnits: number

  @column({ columnName: 'residence_id' })
  declare residenceId: number

  @belongsTo(() => Residence)
  declare residence: BelongsTo<typeof Residence>

  @belongsTo(() => Property)
  declare properties: BelongsTo<typeof Property>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
