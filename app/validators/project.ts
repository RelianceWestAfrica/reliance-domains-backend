// app/validators/project.ts
import vine from '@vinejs/vine'

export const createProjectValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2),
    description: vine.string().trim().optional(),
    type: vine.enum(['RESIDENTIEL', 'VILLA', 'MIXTE'] as const),
    status: vine.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).optional(),
    city: vine.string().trim().minLength(2),
    countryId: vine.number().positive(),
    heroImageUrl: vine.string().url().optional(),
    residencesCount: vine.number().min(0).optional(),
    propertiesCount: vine.number().min(0).optional(),
  })
)

export const updateProjectValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).optional(),
    description: vine.string().trim().optional(),
    type: vine.enum(['RESIDENTIEL', 'VILLA', 'MIXTE'] as const).optional(),
    status: vine.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).optional(),
    city: vine.string().trim().minLength(2).optional(),
    countryId: vine.number().positive().optional(),
    heroImageUrl: vine.string().url().optional(),
    residencesCount: vine.number().min(0).optional(),
    propertiesCount: vine.number().min(0).optional(),
  })
)
