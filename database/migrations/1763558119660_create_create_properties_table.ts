// database/migrations/xxxx_create_properties_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'properties'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('title').notNullable() // Ex: Appartement 3P - A101

      table.integer('floor_id').unsigned().notNullable().references('id').inTable('residence_floors').onDelete('CASCADE')

      table
        .enu('type', ['STUDIO', 'APARTMENT', 'VILLA', 'SHOP', 'OFFICE', 'OTHER'])
        .notNullable()
        .defaultTo('APARTMENT') // pour "appartement", "villa", "magasin" etc.

      table
        .integer('project_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('projects')
        .onDelete('CASCADE')

      table
        .integer('residence_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('residences')
        .onDelete('CASCADE')

      table
        .enu('status', ['AVAILABLE', 'UNDER_DISCUSSION', 'RESERVED', 'SOLD'])
        .notNullable()
        .defaultTo('AVAILABLE')

      table.integer('rooms_count').notNullable().defaultTo(1)    // Nombre de pièces
      table.integer('kitchens_count').notNullable().defaultTo(0) // Nombre de cuisines

      table.decimal('surface', 10, 2).notNullable().defaultTo(0) // m²
      table.decimal('price', 15, 2).notNullable().defaultTo(0)   // FCFA

      table.string('image_url').nullable()

      table.boolean('has_balcony').notNullable().defaultTo(false)
      table.boolean('is_furnished').notNullable().defaultTo(false)

      // visibilité sur le site / portail
      table.boolean('is_published').notNullable().defaultTo(false)

      table.timestamp('created_at', { useTz: true }).nullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
