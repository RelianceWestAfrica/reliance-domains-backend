import { BaseModel, column, belongsTo, computed } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Acquisition from './acquisition.js'
import User from './user.js'

export type ContractStatus = 'SIGNED' | 'READY'

export type ContractType = 'GESTION_LOCATIVE' | 'RESERVATION' | 'VENTE'

export default class Contract extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare acquisitionId: number

  @column()
  declare filePath: string

  @column()
  declare contractType: ContractType // Utilise le type

  @column()
  declare status: ContractStatus // Utilise le type

  @column()
  declare userId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Acquisition)
  declare acquisition: BelongsTo<typeof Acquisition>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @computed()
  public get contractTypeLabel() {
    return {
      RESERVATION: 'Réservation',
      GESTION_LOCATIVE: 'Gestion locative',
      VENTE: 'Vente',
    }[this.contractType]
  }

  @computed()
  public get contractStatusLabel() {
    return {
      READY: 'Prêt à être signé',
      SIGNED: 'Signé',
    }[this.status]
  }
}
