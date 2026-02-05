import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contracts'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.enum('contract_type', ['RESERVATION', 'GESTION_LOCATIVE', 'VENTE']).notNullable().defaultTo('RESERVATION')
      table.enum('status', ['SIGNED', 'READY']).notNullable().defaultTo('READY')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('contract_type')
      table.dropColumn('status')
      table.dropColumn('user_id')
    })
  }
}
