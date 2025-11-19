import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'access_codes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('code', 100).notNullable().unique()
      table.string('label', 255).notNullable()
      table.enum('role', ['COMMERCIAL', 'ADMIN', 'SUPERADMIN']).notNullable()
      table.boolean('is_active').defaultTo(true)
      table.integer('max_uses').nullable()
      table.integer('used_count').defaultTo(0)
      table.timestamp('expires_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).nullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
