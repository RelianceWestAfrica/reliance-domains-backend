import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payment_plans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('acquisition_id').unsigned().notNullable().unique()
        .references('id').inTable('acquisitions').onDelete('CASCADE')
      table.enum('mode', ['CASH', 'PHASED', 'CUSTOM']).notNullable()
      table.decimal('total_amount', 15, 2).notNullable()
      table.decimal('deposit_amount', 15, 2).notNullable().defaultTo(0)
      table.date('deposit_paid_at').nullable()
      table.enum('deposit_payment_method', [
        'Espèces', 'Chèque', 'Carte bancaire',
        'Virement bancaire', 'Mobile Money', 'Autre'
      ]).nullable()
      table.string('deposit_receipt_url', 255).nullable()
      table.decimal('discount_amount', 15, 2).nullable().defaultTo(0)
      table.string('discount_note', 255).nullable()
      table.enum('status', ['IN_PROGRESS', 'COMPLETED', 'DEFAULTED'])
        .notNullable().defaultTo('IN_PROGRESS')
      table.date('deadline_date').nullable()
      table.string('docx_url', 255).nullable()
      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
