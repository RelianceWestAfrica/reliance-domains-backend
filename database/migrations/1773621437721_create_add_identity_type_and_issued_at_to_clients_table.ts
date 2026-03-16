import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'clients'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('identity_type', 100).nullable().after('identity_number')
      table.date('identity_issued_at').nullable().after('identity_type')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('identity_type')
      table.dropColumn('identity_issued_at')
    })
  }
}
