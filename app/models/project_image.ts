// app/models/project_image.ts
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Project from '#models/project'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class ProjectImage extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'project_id' })
  declare projectId: number

  @column({ columnName: 'file_path' })
  declare filePath: string

  @column({ columnName: 'is_cover' })
  declare isCover: boolean

  @column()
  declare position: number

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
