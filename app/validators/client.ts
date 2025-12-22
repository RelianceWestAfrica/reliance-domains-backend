import vine from '@vinejs/vine'

// Création d'un client
export const createClientValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim().maxLength(50),
    lastName: vine.string().trim().maxLength(50),
    gender: vine.enum(['Homme', 'Femme']),
    phone: vine.string().trim().maxLength(20),
    email: vine.string().trim().email().maxLength(100),
    address: vine.string().trim().maxLength(255),
    nationality: vine.string().trim().maxLength(50),
    acquisitions: vine.number().optional(),
  })
)

// Mise à jour d'un client
export const updateClientValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim().maxLength(50).optional(),
    lastName: vine.string().trim().maxLength(50).optional(),
    gender: vine.enum(['Homme', 'Femme']).optional(),
    phone: vine.string().trim().maxLength(20).optional(),
    email: vine.string().trim().email().maxLength(100).optional(),
    address: vine.string().trim().maxLength(255).optional(),
    nationality: vine.string().trim().maxLength(50).optional(),
    acquisitions: vine.number().optional(),
  })
)
