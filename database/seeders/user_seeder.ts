import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class UserSeeder extends BaseSeeder {
  public async run() {
    const users = [
      {
        email: 'admin@example.com',
        password: 'secret123', // sera hashé automatiquement
        first_name: 'Admin',
        last_name: 'Principal',
        role: 'SUPERADMIN' as const,
        is_active: true,
      },
      {
        email: 'commercial@example.com',
        password: 'secret123',
        first_name: 'Jean',
        last_name: 'Dupont',
        role: 'COMMERCIAL' as const,
        is_active: true,
      },
      {
        email: 'manager@example.com',
        password: 'secret123',
        first_name: 'Marie',
        last_name: 'Martin',
        role: 'ADMIN' as const,
        is_active: true,
      },
    ]

    for (const userData of users) {
      const existingUser = await User.query().where('email', userData.email).first()

      if (existingUser) {
        console.log(`↷ Utilisateur déjà existant : ${userData.email} → SKIP`)
        continue
      }

      // Le mot de passe sera automatiquement hashé grâce au mutator du modèle User
      await User.create(userData)

      console.log(`✔ Utilisateur créé : ${userData.email} (${userData.role})`)
    }
  }
}
