import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddEntrepriseAndAdresseToProjects extends BaseSchema {
  protected tableName = 'projects'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('entreprise').nullable()
      table.string('adresse').nullable()
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('entreprise')
      table.dropColumn('adresse')
    })
  }
}
