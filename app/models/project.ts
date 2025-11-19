// app/models/project.ts
import {BaseModel, belongsTo, column, hasMany} from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Country from '#models/country'
import type {BelongsTo, HasMany} from '@adonisjs/lucid/types/relations'
import ProjectImage from "#models/project_image";

export default class Project extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare type: 'RESIDENTIEL' | 'VILLA' | 'MIXTE'

  @column()
  declare status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

  @column()
  declare city: string

  @column({ columnName: 'country_id' })
  declare countryId: number

  @belongsTo(() => Country)
  declare country: BelongsTo<typeof Country>

  @hasMany(() => ProjectImage)
  declare images: HasMany<typeof ProjectImage>

  @column({ columnName: 'residences_count' })
  declare residencesCount: number

  @column({ columnName: 'properties_count' })
  declare propertiesCount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
