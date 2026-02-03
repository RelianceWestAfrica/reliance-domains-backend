import { BaseSeeder } from '@adonisjs/lucid/seeders'
import AccessCode from '#models/access_code'

export default class AccessCodeSeeder extends BaseSeeder {
  public async run() {
    const accessCodes = [
      {
        code: 'TG_RWAI1',
        label: 'RWA Togo',
        role: 'ADMIN' as const,
        is_active: true,
        max_uses: null,
        used_count: 0,
        expires_at: null,
      },
      {
        code: 'GH_RWAI2',
        label: 'RWA Ghana',
        role: 'ADMIN' as const,
        is_active: true,
        max_uses: null,
        used_count: 0,
        expires_at: null,
      },
      {
        code: 'BF_RWAI3',
        label: 'RWA Burkina Faso',
        role: 'ADMIN' as const,
        is_active: true,
        max_uses: null,
        used_count: 0,
        expires_at: null,
      },
    ]

    for (const data of accessCodes) {
      const existing = await AccessCode.query().where('code', data.code).first()

      if (existing) {
        console.log(`↷ Déjà existant : ${data.label} (code: ${data.code}) → SKIP`)
        continue
      }

      // On laisse Adonis gérer created_at et updated_at automatiquement
      // ou on peut les définir explicitement si besoin :
      await AccessCode.create({
        ...data
      })

      console.log(`✔ Créé : ${data.label} (code: ${data.code})`)
    }
  }
}
