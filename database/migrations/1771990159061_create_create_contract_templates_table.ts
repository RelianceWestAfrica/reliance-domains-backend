import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contract_templates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('project_id').unsigned()
        .references('id').inTable('projects')
        .onDelete('CASCADE')
        .notNullable()
      table.string('type', 100).notNullable()        // RESERVATION, VENTE, GESTION_LOCATIVE...
      table.string('label', 255).notNullable()        // Nom affiché
      table.string('docx_path', 500).nullable()       // Chemin du template .docx
      table.string('pdf_path', 500).nullable()        // Chemin du template .pdf
      table.text('variables').nullable()              // JSON des variables disponibles
      table.boolean('actif').defaultTo(true)
      table.timestamp('created_at').nullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
