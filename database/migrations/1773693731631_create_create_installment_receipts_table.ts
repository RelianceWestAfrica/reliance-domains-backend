import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'installment_receipts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('installment_id').unsigned().notNullable()
        .references('id').inTable('payment_installments').onDelete('CASCADE')
      table.string('file_url', 255).notNullable()
      table.string('original_name', 255).nullable()
      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
