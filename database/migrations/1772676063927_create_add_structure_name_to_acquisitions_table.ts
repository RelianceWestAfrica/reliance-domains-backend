import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('acquisitions', (table) => {
      table.string('structure_name', 255).nullable()
    })
  }

  async down() {
    this.schema.alterTable('acquisitions', (table) => {
      table.dropColumn('structure_name')
    })
  }
}
