import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Client extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public firstName: string

  @column()
  public lastName: string

  @column()
  public gender: 'Homme' | 'Femme'

  @column()
  public phone: string

  @column()
  public email: string

  @column()
  public address: string

  @column()
  public nationality: string

  @column()
  public acquisitions: number
}
