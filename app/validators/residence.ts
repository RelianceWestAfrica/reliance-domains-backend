// app/validators/residence.ts
import vine from '@vinejs/vine'

export const createResidenceValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(2),
    type: vine.enum(['IMMEUBLE', 'VILLAS', 'AUTRE'] as const),
    domainId: vine.number().positive(),
    description: vine.string().trim().minLength(10),
    floorsCount: vine.number().min(1),
    unitsCount: vine.number().min(1),
    imageUrl: vine.string().url().optional(),
    // checkbox "Publier la résidence"
    publish: vine.boolean().optional(),
  })
)

export const updateResidenceValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(2).optional(),
    type: vine.enum(['IMMEUBLE', 'VILLAS', 'AUTRE'] as const).optional(),
    domainId: vine.number().positive().optional(),
    description: vine.string().trim().minLength(10).optional(),
    floorsCount: vine.number().min(1).optional(),
    unitsCount: vine.number().min(1).optional(),
    imageUrl: vine.string().url().optional(),
    status: vine.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).optional(),
  })
)
