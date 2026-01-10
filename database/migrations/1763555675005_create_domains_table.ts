import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'domains'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('title').notNullable()

      table
        .enu('domain_type', [
          'residential',
          'hospital',
          'commercial',
          'mixed',
          'industrial',
          'villa',
          'office',
        ])
        .notNullable()

      table
        .integer('project_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('projects')
        .onDelete('CASCADE')

      table.text('description').notNullable()

      table
        .integer('residences_count')
        .notNullable()
        .defaultTo(0)

      table.string('image_url').nullable()

      table.boolean('published').notNullable().defaultTo(false)

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
