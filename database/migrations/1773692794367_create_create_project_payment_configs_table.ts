import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'project_payment_configs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('project_id').unsigned().notNullable().unique()
        .references('id').inTable('projects').onDelete('CASCADE')
      table.decimal('deposit_amount', 15, 2).notNullable().defaultTo(0)

      // Mode CASH
      table.json('cash_steps').nullable()
      table.string('cash_template_url', 255).nullable()

      // Mode TRIPHASÉ (toujours 3 versements)
      table.json('phased_steps').nullable()
      table.string('phased_template_url', 255).nullable()

      // Mode PERSONNALISÉ
      table.string('custom_template_url', 255).nullable()

      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
