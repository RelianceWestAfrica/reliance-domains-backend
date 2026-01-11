import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'acquisitions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('property_id').unsigned().references('id').inTable('properties')
      table.integer('client_id').unsigned().references('id').inTable('clients')

      table.bigInteger('amount').notNullable()
      table.string('agent').notNullable()
      table.string('contract').notNullable()
      table.enum('payment_type', ['TOTAL', 'ADVANCE']).notNullable()

      table.enum('status', [
        'UNDER_DISCUSSION',
        'RESERVED',
        'SOLD'
      ]).notNullable()

      table.date('date_acquisition').notNullable()

      table.timestamp('created_at').nullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
