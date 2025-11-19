// app/validators/country.ts
import vine from '@vinejs/vine'

export const createCountryValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2),
    iso2: vine.string().trim().fixedLength(2).toUpperCase(),
    phoneCode: vine.string().trim().minLength(2), // ex: +225
    flagEmoji: vine.string().trim().optional(),   // ex: 🇨🇮
  })
)

export const updateCountryValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).optional(),
    iso2: vine.string().trim().fixedLength(2).toUpperCase().optional(),
    phoneCode: vine.string().trim().minLength(2).optional(),
    flagEmoji: vine.string().trim().optional(),
  })
)
