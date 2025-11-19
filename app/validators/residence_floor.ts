// app/validators/residence_floor.ts
import vine from '@vinejs/vine'

export const createResidenceFloorValidator = vine.compile(
  vine.object({
    residenceId: vine.number().positive(),
    name: vine.string().trim().minLength(2),
    level: vine.number().min(-10).max(300), // tu peux adapter
    description: vine.string().trim().optional(),
    unitsCount: vine.number().min(0),
    availableUnits: vine.number().min(0),
  })
)

export const updateResidenceFloorValidator = vine.compile(
  vine.object({
    residenceId: vine.number().positive().optional(),
    name: vine.string().trim().minLength(2).optional(),
    level: vine.number().min(-10).max(300).optional(),
    description: vine.string().trim().optional(),
    unitsCount: vine.number().min(0).optional(),
    availableUnits: vine.number().min(0).optional(),
  })
)
