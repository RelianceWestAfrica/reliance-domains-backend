import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Contract from './contract.js'
import Client from './client.js'

export default class ContractDocument extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare contractId: number

  @column()
  declare clientId: number

  @column()
  declare documentType: 'GENERATED_DOCX' | 'GENERATED_PDF' | 'SIGNED_DOCUMENT' | 'IDENTITY_DOCUMENT'

  @column()
  declare filePath: string

  @column()
  declare fileName: string

  @column()
  declare mimeType: string | null

  @column()
  declare fileSize: number | null

  @column.dateTime()
  declare uploadedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Contract)
  declare contract: BelongsTo<typeof Contract>

  @belongsTo(() => Client)
  declare client: BelongsTo<typeof Client>
}
