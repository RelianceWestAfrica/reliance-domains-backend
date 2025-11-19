import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class AccessCode extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare label: string

  @column()
  declare role: 'COMMERCIAL' | 'ADMIN' | 'SUPERADMIN'

  @column()
  declare isActive: boolean

  @column()
  declare maxUses: number | null

  @column()
  declare usedCount: number

  @column.dateTime()
  declare expiresAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
