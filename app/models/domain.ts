// app/Models/Domain.ts
import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
} from '@adonisjs/lucid/orm'

export default class Domain extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare domainType:
    | 'residential'
    | 'hospital'
    | 'commercial'
    | 'mixed'
    | 'industrial'
    | 'villa'
    | 'office'

  @column()
  declare projectId: number

  @column()
  declare description: string

  @column()
  declare residencesCount: number

  @column()
  declare imageUrl: string | null

  @column()
  declare published: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
