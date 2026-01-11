import {BaseModel, belongsTo, column} from "@adonisjs/lucid/orm";
import Acquisition from "#models/acquisition";


export default class Contract extends BaseModel {
  @column({ isPrimary: true })
  declare public id: number

  @column()
  declare public acquisitionId: number

  @column()
  declare public filePath: string

  @belongsTo(() => Acquisition)
  declare public acquisition: any
}
