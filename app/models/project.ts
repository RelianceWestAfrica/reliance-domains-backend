// app/models/project.ts
import {BaseModel, belongsTo, column, manyToMany} from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Country from '#models/country'
import type {BelongsTo, ManyToMany} from '@adonisjs/lucid/types/relations'
import User from "#models/user";

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

  @column()
  declare entreprise: string | null

  @column()
  declare adresse: string | null

  @column({ columnName: 'country_id' })
  declare countryId: number

  @belongsTo(() => Country)
  declare country: BelongsTo<typeof Country>

  @column()
  declare heroImageUrl: string

  @column({ columnName: 'residences_count' })
  declare residencesCount: number

  @column({ columnName: 'properties_count' })
  declare propertiesCount: number

  @manyToMany(() => User, {
    pivotTable: 'user_project_permissions',
    localKey: 'id',
    pivotForeignKey: 'project_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'user_id',
  })
  declare users: ManyToMany<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime


  public static accessibleBy(user: User) {
    if (user.role === 'SUPERADMIN') {
      return this.query()
    }

    return this.query().whereHas('users', (query) => {
      query.where('users.id', user.id)
    })
  }
}
