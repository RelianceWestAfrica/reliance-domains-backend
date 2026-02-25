import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contract_documents'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('contract_id').unsigned()
        .references('id').inTable('contracts')
        .onDelete('CASCADE')
        .notNullable()
      table.integer('client_id').unsigned()
        .references('id').inTable('clients')
        .onDelete('CASCADE')
        .notNullable()
      table.enum('document_type', [
        'GENERATED_DOCX',    // contrat généré (souche .docx)
        'GENERATED_PDF',     // contrat généré (souche .pdf)
        'SIGNED_DOCUMENT',   // contrat signé
        'IDENTITY_DOCUMENT', // pièce d'identité
      ]).notNullable()
      table.string('file_path', 500).notNullable()
      table.string('file_name', 255).notNullable()
      table.string('mime_type', 100).nullable()
      table.integer('file_size').nullable()            // taille en octets
      table.timestamp('uploaded_at').nullable()
      table.timestamp('created_at').nullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
