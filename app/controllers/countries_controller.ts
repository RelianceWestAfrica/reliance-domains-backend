// app/controllers/countries_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Country from '#models/country'
import { createCountryValidator, updateCountryValidator } from '#validators/country'

export default class CountriesController {
  /**
   * GET /api/countries
   * Liste de tous les pays
   */
  async index({}: HttpContext) {
    const countries = await Country.query().orderBy('name', 'asc')
    return countries
  }

  /**
   * POST /api/countries
   * Création d'un pays
   */
  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createCountryValidator)

    // On empêche les doublons sur iso2
    const existing = await Country.findBy('iso2', payload.iso2)
    if (existing) {
      return response.conflict({
        message: 'Un pays avec ce code ISO2 existe déjà',
      })
    }

    const country = await Country.create({
      name: payload.name,
      iso2: payload.iso2,
      phoneCode: payload.phoneCode,
      flagEmoji: payload.flagEmoji ?? null,
    })

    return response.created(country)
  }

  /**
   * GET /api/countries/:id
   * Détail d'un pays
   */
  async show({ params }: HttpContext) {
    const country = await Country.findOrFail(params.id)
    return country
  }

  /**
   * PUT /api/countries/:id
   * Mise à jour d'un pays
   */
  async update({ params, request, response }: HttpContext) {
    const country = await Country.findOrFail(params.id)
    const payload = await request.validateUsing(updateCountryValidator)

    // si iso2 changé, vérifier l'unicité
    if (payload.iso2 && payload.iso2 !== country.iso2) {
      const exists = await Country.findBy('iso2', payload.iso2)
      if (exists) {
        return response.conflict({
          message: 'Un pays avec ce code ISO2 existe déjà',
        })
      }
    }

    country.merge({
      name: payload.name ?? country.name,
      iso2: payload.iso2 ?? country.iso2,
      phoneCode: payload.phoneCode ?? country.phoneCode,
      flagEmoji: payload.flagEmoji ?? country.flagEmoji,
    })

    await country.save()

    return country
  }

  /**
   * DELETE /api/countries/:id
   * Suppression d'un pays
   */
  async destroy({ params, response }: HttpContext) {
    const country = await Country.findOrFail(params.id)
    await country.delete()

    return response.noContent()
  }
}
