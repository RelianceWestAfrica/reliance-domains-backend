// database/migrations/xxxx_create_residences_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'residences'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('title').notNullable()
      table
        .enu('type', ['IMMEUBLE', 'VILLAS', 'AUTRE'])
        .notNullable()
        .defaultTo('IMMEUBLE')

      table
        .integer('project_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('projects')
        .onDelete('CASCADE')

      table.text('description').notNullable()

      table.integer('floors_count').notNullable().defaultTo(1)
      table.integer('units_count').notNullable().defaultTo(1)

      table.string('image_url').nullable()

      table
        .enu('status', ['DRAFT', 'PUBLISHED', 'ARCHIVED'])
        .notNullable()
        .defaultTo('DRAFT')

      table.timestamp('created_at', { useTz: true }).nullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
