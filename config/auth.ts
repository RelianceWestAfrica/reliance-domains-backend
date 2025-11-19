// config/auth.ts
import { defineConfig } from '@adonisjs/auth'
import { tokensGuard, tokensUserProvider } from '@adonisjs/auth/access_tokens'

const authConfig = defineConfig({
  default: 'api',

  guards: {
    api: tokensGuard({
      provider: tokensUserProvider({
        model: () => import('#models/user'),
        // nom de la propriété statique sur User
        tokens: 'accessTokens',
      }),
    }),
  },
})

export default authConfig
