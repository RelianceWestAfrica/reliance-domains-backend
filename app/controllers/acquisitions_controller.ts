// import type { HttpContext } from '@adonisjs/core/http'


import Acquisition from "#models/acquisition";
import Property from "#models/property";
import { updatePropertyValidator } from '#validators/property'
import type {HttpContext} from "@adonisjs/core/http";

export default class AcquisitionsController {
  private mapStatus(status: string) {
    return {
      UNDER_DISCUSSION: 'Sous discussion',
      RESERVED: 'Réservée',
      SOLD: 'Soldée'
    }[status]
  }


  public async index() {
    const acquisitions = await Acquisition
      .query()
      .preload('property')
      .preload('client')

    // Retourner les objets liés complets
    return acquisitions.map(a => ({
      id: a.id,

      property: a.property,   // <-- ici on retourne tout l'objet property
      client: a.client,       // <-- ici on retourne tout l'objet client

      commercialName: a.agent,

      amount: a.amount,
      amountType: a.paymentType === 'TOTAL' ? 'Total' : 'Avance',

      status: this.mapStatus(a.status),

      dateAcquisition: a.dateAcquisition,

      contract: a.contract || null  // tu peux renvoyer l'objet contract complet
    }))
  }


  public async store({ request, response }: HttpContext) {
    const data = request.only([
      'property_id',
      'client_id',
      'agent',
      'amount',
      'payment_type',
      'status',
      'date',
      'contract'
    ])

    const acquisition = await Acquisition.create({
      propertyId: data.property_id,
      clientId: data.client_id,
      agent: data.agent,
      amount: data.amount,
      paymentType: data.payment_type,
      status: data.status,
      dateAcquisition: data.date,
      contract: data.contract
    })

    const property = await Property.findOrFail(data.property_id)
    // const payload = await request.validateUsing(updatePropertyValidator)

    property.merge({
      status: data.status,
    })

    await property.save()

    await acquisition.load('client')
    await acquisition.load('property')

    return response.created(acquisition)
  }
}
