// database/migrations/xxxx_create_residence_floors_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'residence_floors'

  async up() {
    this.schema.createTable('residence_floors', (table) => {
      table.increments('id')

      // 👉 FK vers la résidence
      table
        .integer('residence_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('residences')
        .onDelete('CASCADE')

      table.string('name').notNullable()       // Rez-de-chaussée
      table.integer('level').notNullable()     // 0, 1, 2...
      table.text('description').nullable()
      table.integer('units_count').notNullable().defaultTo(0)
      table.integer('available_units').notNullable().defaultTo(0)

      table.unique(['residence_id', 'level'])  // unique par résidence

      table.timestamp('created_at', { useTz: true }).nullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })

  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
