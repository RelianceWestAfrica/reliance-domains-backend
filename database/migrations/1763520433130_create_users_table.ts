// database/migrations/xxxx_users.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Users extends BaseSchema {
  protected tableName = 'users'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('email', 255).notNullable().unique()
      table.string('password', 180).notNullable()
      table.string('first_name', 100).nullable()
      table.string('last_name', 100).nullable()
      table.enum('role', ['COMMERCIAL', 'ADMIN', 'SUPERADMIN']).defaultTo('COMMERCIAL')
      table.boolean('is_active').defaultTo(true)
      table.timestamp('last_login_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).nullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
