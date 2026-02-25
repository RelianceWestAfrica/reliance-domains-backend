import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import ContractTemplate from './contract_template.js'
import Acquisition from './acquisition.js'
import Client from './client.js'
import Project from './project.js'
import User from './user.js'
import ContractDocument from './contract_document.js'

export default class Contract extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare acquisitionId: number

  @column()
  declare contractTemplateId: number

  @column()
  declare clientId: number

  @column()
  declare projectId: number

  @column()
  declare userId: number | null

  @column()
  declare type: string

  @column()
  declare status: 'DRAFT' | 'GENERATED' | 'SENT' | 'SIGNED'

  @column()
  declare generatedDocxPath: string | null

  @column()
  declare generatedPdfPath: string | null

  @column()
  declare signedDocumentPath: string | null

  @column()
  declare identityDocumentPath: string | null

  @column.dateTime()
  declare generatedAt: DateTime | null

  @column.dateTime()
  declare signedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => ContractTemplate)
  declare template: BelongsTo<typeof ContractTemplate>

  @belongsTo(() => Acquisition)
  declare acquisition: BelongsTo<typeof Acquisition>

  @belongsTo(() => Client)
  declare client: BelongsTo<typeof Client>

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => ContractDocument)
  declare documents: HasMany<typeof ContractDocument>
}
