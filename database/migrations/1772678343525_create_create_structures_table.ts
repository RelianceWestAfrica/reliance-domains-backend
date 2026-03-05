import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'structures'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 255).notNullable()
      table.string('code', 100).nullable()
      table.boolean('actif').defaultTo(true)
      table.timestamps(true, true)
    })

    // ← defer pour attendre que la table soit créée
    this.defer(async (db) => {
      await db.table(this.tableName).multiInsert([
        { name: 'Reliance West Africa', code: 'RWA', actif: true },
        { name: 'SONATUR', code: 'SONATUR', actif: true },
      ])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
