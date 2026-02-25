import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contracts'

  async up() {
    this.schema.dropTableIfExists(this.tableName)
  }

  async down() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('acquisition_id').unsigned()
        .references('id').inTable('acquisitions')
        .onDelete('CASCADE')
      table.string('file_path').notNullable()
      table.enum('contract_type', ['RESERVATION', 'GESTION_LOCATIVE', 'VENTE']).notNullable().defaultTo('RESERVATION')
      table.enum('status', ['SIGNED', 'READY']).notNullable().defaultTo('READY')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('created_at').nullable()
      table.timestamp('updated_at').nullable()
    })
  }
}
