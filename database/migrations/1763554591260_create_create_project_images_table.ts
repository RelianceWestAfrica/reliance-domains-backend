// database/migrations/xxxx_create_project_images_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'project_images'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('project_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('projects')
        .onDelete('CASCADE')

      table.string('file_path').notNullable()   // chemin ou URL de l'image
      table.boolean('is_cover').notNullable().defaultTo(false)
      table.integer('position').notNullable().defaultTo(0)

      table.timestamp('created_at', { useTz: true }).nullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
