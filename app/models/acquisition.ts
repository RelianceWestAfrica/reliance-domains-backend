import {BaseModel, belongsTo, column, computed} from "@adonisjs/lucid/orm";
import Property from "#models/property";
import Client from "#models/client";


export type AcquisitionStatus =
  | 'UNDER_DISCUSSION'
  | 'RESERVED'
  | 'SOLD'

export type PaymentType =
  | 'TOTAL'
  | 'ADVANCE'

export default class Acquisition extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public propertyId: number

  @column()
  public clientId: number

  @column()
  public amount: number

  @column()
  public agent: string

  @column()
  public contract: string

  @column()
  public paymentType: PaymentType

  @column()
  public status: AcquisitionStatus

  @column.date()
  public dateAcquisition

  /* ================= RELATIONS ================= */

  @belongsTo(() => Property)
  public property

  @belongsTo(() => Client)
  public client

  /* ================= COMPUTED ================= */

  @computed()
  public get hasContract() {
    return this.status !== 'UNDER_DISCUSSION'
  }

  @computed()
  public get statusLabel() {
    return {
      UNDER_DISCUSSION: 'Sous discussion',
      RESERVED: 'Réservée',
      SOLD: 'Soldée'
    }[this.status]
  }

  @computed()
  public get paymentLabel() {
    return this.paymentType === 'TOTAL' ? 'Total' : 'Avance'
  }
}
