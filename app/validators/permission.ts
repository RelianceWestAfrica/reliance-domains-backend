import vine from '@vinejs/vine'

export const assignProjectsValidator = vine.compile(
  vine.object({
    userId: vine.number().positive(),
    projectIds: vine.array(vine.number().positive()).minLength(1),
  })
)
