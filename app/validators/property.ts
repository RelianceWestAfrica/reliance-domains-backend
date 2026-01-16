// app/validators/property.ts
import vine from '@vinejs/vine'

export const createPropertyValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(3),
    type: vine.enum(['APARTMENT', 'VILLA', 'SHOP', 'OFFICE', 'OTHER'] as const),

    projectId: vine.number().positive(),

    residenceId: vine.number().positive().optional(),

    status: vine.enum(
      ['AVAILABLE', 'UNDER_DISCUSSION', 'RESERVED', 'SOLD'] as const
    ),

    roomsCount: vine.number().min(1),       // Nombre de pièces ≥ 1
    kitchensCount: vine.number().min(0),    // 0 ou plus
    surface: vine.number().min(1),          // m² ≥ 1
    price: vine.number().min(0),            // prix ≥ 0

    imageUrl: vine.string().url().optional(),

    hasBalcony: vine.boolean().optional(),
    isFurnished: vine.boolean().optional(),

    // Checkbox "Publier la propriété"
    publish: vine.boolean().optional(),
  })
)

export const updatePropertyValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(3).optional(),
    type: vine.enum(['APARTMENT', 'VILLA', 'SHOP', 'OFFICE', 'OTHER'] as const).optional(),
    
    projectId: vine.number().positive().optional(),

    residenceId: vine.number().positive().optional(),

    status: vine
      .enum(['AVAILABLE', 'UNDER_DISCUSSION', 'RESERVED', 'SOLD'] as const)
      .optional(),

    roomsCount: vine.number().min(1).optional(),
    kitchensCount: vine.number().min(0).optional(),
    surface: vine.number().min(1).optional(),
    price: vine.number().min(0).optional(),

    imageUrl: vine.string().url().optional(),

    hasBalcony: vine.boolean().optional(),
    isFurnished: vine.boolean().optional(),
    isPublished: vine.boolean().optional(),
  })
)
