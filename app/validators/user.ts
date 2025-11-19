// app/validators/auth_validator.ts
import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string().minLength(6),
    firstName: vine.string().optional(),
    lastName: vine.string().optional(),
    role: vine.enum(['COMMERCIAL', 'ADMIN', 'SUPERADMIN'] as const).optional(),
    accessCode: vine.string().optional(), // ex : code d’accès lié à l’utilisateur
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string(),
  })
)

export const accessCodeValidator = vine.compile(
  vine.object({
    code: vine.string(),
  })
)
