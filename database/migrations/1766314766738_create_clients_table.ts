import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'clients'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id') // id auto-increment
      table.string('first_name', 255).notNullable()
      table.string('last_name', 255).notNullable()
      table.enum('gender', ['Homme', 'Femme']).notNullable()
      table.string('phone', 50).notNullable().unique()
      table.string('email', 255).notNullable().unique()
      table.string('address', 255).notNullable()
      table.string('nationality', 100).notNullable()
      table.integer('acquisitions').defaultTo(0)

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
