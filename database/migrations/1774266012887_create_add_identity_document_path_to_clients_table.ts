import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'clients'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('identity_document_path', 500).nullable().after('identity_issued_at')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('identity_document_path', 500).nullable().after('identity_issued_at')
    })
  }
}
