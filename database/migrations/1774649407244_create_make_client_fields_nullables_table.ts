import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'clients'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('gender', 10).nullable().alter()
      table.string('phone', 20).nullable().alter()
      table.string('email', 100).nullable().alter()
      table.string('address', 255).nullable().alter()
      table.string('nationality', 50).nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('gender', 10).notNullable().alter()
      table.string('phone', 20).notNullable().alter()
      table.string('email', 100).notNullable().alter()
      table.string('address', 255).notNullable().alter()
      table.string('nationality', 50).notNullable().alter()
    })
  }
}
