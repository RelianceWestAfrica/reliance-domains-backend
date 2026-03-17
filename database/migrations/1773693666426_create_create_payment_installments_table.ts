import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payment_installments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('plan_id').unsigned().notNullable()
        .references('id').inTable('payment_plans').onDelete('CASCADE')
      table.integer('order').notNullable()
      table.string('label', 255).notNullable()
      table.decimal('percent', 5, 2).nullable()       // null si CUSTOM
      table.decimal('amount_due', 15, 2).notNullable()
      table.decimal('amount_paid', 15, 2).notNullable().defaultTo(0)
      table.date('due_date').nullable()
      table.date('paid_at').nullable()
      table.enum('status', ['PENDING', 'PAID', 'LATE', 'PARTIAL'])
        .notNullable().defaultTo('PENDING')
      table.enum('payment_method', [
        'Espèces', 'Chèque', 'Carte bancaire',
        'Virement bancaire', 'Mobile Money', 'Autre'
      ]).nullable()
      table.text('notes').nullable()
      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
