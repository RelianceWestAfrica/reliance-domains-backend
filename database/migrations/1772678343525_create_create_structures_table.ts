import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('structures', (table) => {
      table.increments('id')
      table.string('name', 255).notNullable()
      table.string('code', 100).nullable()
      table.boolean('actif').defaultTo(true)
      table.timestamps(true, true)
    })

    // Insérer les structures par défaut
    await this.db.table('structures').multiInsert([
      { name: 'Reliance West Africa', code: 'RWA', actif: true },
      { name: 'SONATUR', code: 'SONATUR', actif: true },
    ])
  }

  async down() {
    this.schema.dropTable('structures')
  }
}
