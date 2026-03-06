import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'property_types'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 255).notNullable()
      table.boolean('actif').defaultTo(true)
      table.timestamps(true, true)
    })

    this.defer(async (db) => {
      await db.table(this.tableName).multiInsert([
        { name: 'APARTMENT', actif: true },
        { name: 'STUDIO', actif: true },
        { name: 'VILLA', actif: true },
        { name: 'SHOP', actif: true },
        { name: 'OFFICE', actif: true },
        { name: 'OTHER', actif: true },
      ])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
