import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('properties', (table) => {
      table.string('type', 100).notNullable().defaultTo('APARTMENT').alter()
    })
  }

  async down() {
    this.schema.alterTable('properties', (table) => {
      table
        .enu('type', ['STUDIO', 'APARTMENT', 'VILLA', 'SHOP', 'OFFICE', 'OTHER'])
        .notNullable()
        .defaultTo('APARTMENT')
        .alter()
    })
  }
}
