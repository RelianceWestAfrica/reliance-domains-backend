import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('clients', (table) => {
      table.date('birth_date').nullable()
      table.string('birth_place', 255).nullable()
      table.string('profession', 255).nullable()
    })
  }

  async down() {
    this.schema.alterTable('clients', (table) => {
      table.dropColumn('birth_date')
      table.dropColumn('birth_place')
      table.dropColumn('profession')
    })
  }
}
