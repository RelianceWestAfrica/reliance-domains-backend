import { BaseSchema } from '@adonisjs/lucid/schema'

export default class UpdatePropertiesAddProjectAndFloor extends BaseSchema {
  protected tableName = 'properties'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {

      /**
       * 1. residence_id devient nullable
       */
      table
        .integer('residence_id')
        .unsigned()
        .nullable()
        .alter()

      /**
       * 2. Ajout residence_floor_id (FK nullable)
       */
      table
        .integer('residence_floor_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('residence_floors')
        .onDelete('SET NULL')

      /**
       * 3. Ajout image_plan
       */
      table.string('image_plan').nullable()

      /**
       * 4. Ajout project_id (FK NOT NULL)
       */
      table
        .integer('project_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('projects')
        .onDelete('CASCADE')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['residence_floor_id'])
      table.dropColumn('residence_floor_id')

      table.dropColumn('image_plan')

      table.dropForeign(['project_id'])
      table.dropColumn('project_id')

      table
        .integer('residence_id')
        .unsigned()
        .notNullable()
        .alter()
    })
  }
}
