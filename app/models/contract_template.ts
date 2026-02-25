import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Project from './project.js'
import Contract from './contract.js'

export default class ContractTemplate extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare projectId: number

  @column()
  declare type: string

  @column()
  declare label: string

  @column()
  declare docxPath: string | null

  @column()
  declare pdfPath: string | null

  @column()
  declare variables: string | null

  @column()
  declare actif: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  @hasMany(() => Contract)
  declare contracts: HasMany<typeof Contract>
}
