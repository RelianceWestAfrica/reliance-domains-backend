import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contracts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('acquisition_id').unsigned()
        .references('id').inTable('acquisitions')
        .onDelete('CASCADE')
        .notNullable()
      table.integer('contract_template_id').unsigned()
        .references('id').inTable('contract_templates')
        .onDelete('RESTRICT')
        .notNullable()
      table.integer('client_id').unsigned()
        .references('id').inTable('clients')
        .onDelete('RESTRICT')
        .notNullable()
      table.integer('project_id').unsigned()
        .references('id').inTable('projects')
        .onDelete('RESTRICT')
        .notNullable()
      table.integer('user_id').unsigned()
        .references('id').inTable('users')
        .onDelete('SET NULL')
        .nullable()
      table.string('type', 100).notNullable()
      table.enum('status', ['DRAFT', 'GENERATED', 'SENT', 'SIGNED']).defaultTo('DRAFT')
      table.string('generated_docx_path', 500).nullable()   // contrat généré (souche)
      table.string('generated_pdf_path', 500).nullable()    // contrat généré (souche PDF)
      table.string('signed_document_path', 500).nullable()  // contrat signé uploadé
      table.string('identity_document_path', 500).nullable() // pièce d'identité
      table.timestamp('generated_at').nullable()
      table.timestamp('signed_at').nullable()
      table.timestamp('created_at').nullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
