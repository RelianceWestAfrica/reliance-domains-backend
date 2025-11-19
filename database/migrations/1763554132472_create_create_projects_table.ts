// database/migrations/xxxx_create_projects_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'projects'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('name').notNullable()
      table.text('description').nullable()

      table
        .enu('type', ['RESIDENTIEL', 'VILLA', 'MIXTE'])
        .notNullable()
        .defaultTo('RESIDENTIEL')

      table
        .enu('status', ['DRAFT', 'PUBLISHED', 'ARCHIVED'])
        .notNullable()
        .defaultTo('DRAFT')

      table.string('city').notNullable()

      table
        .integer('country_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('countries')
        .onDelete('CASCADE')

      table.string('hero_image_url').nullable()

      table.integer('residences_count').notNullable().defaultTo(0)
      table.integer('properties_count').notNullable().defaultTo(0)

      table.timestamp('created_at', { useTz: true }).nullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
