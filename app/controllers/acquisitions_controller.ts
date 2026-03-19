// import type { HttpContext } from '@adonisjs/core/http'


import Acquisition from "#models/acquisition";
import Property from "#models/property";
import Client from "#models/client";
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

      // contract: a.contract || null  // tu peux renvoyer l'objet contract complet
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
      'structure_name',
      // 'contract'
    ])

    const acquisition = await Acquisition.create({
      propertyId: data.property_id,
      clientId: data.client_id,
      agent: data.agent,
      amount: data.amount,
      paymentType: data.payment_type,
      status: data.status,
      dateAcquisition: data.date,
      structureName: data.structure_name,
      // contract: data.contract
    })

    const property = await Property.findOrFail(data.property_id)
    // const payload = await request.validateUsing(updatePropertyValidator)

    property.merge({
      status: data.status,
    })

    // Incrémenter le compteur du client
    const client = await Client.findOrFail(data.client_id)
    client.acquisitions = (client.acquisitions ?? 0) + 1
    await client.save()

    await property.save()

    await acquisition.load('client')
    await acquisition.load('property')

    return response.created(acquisition)
  }

  public async destroy({ params, response }: HttpContext) {
    const acquisition = await Acquisition.findOrFail(params.id)

    // Décrémenter le compteur du client
    const client = await Client.findOrFail(acquisition.clientId)
    if (client.acquisitions > 0) {
      client.acquisitions = client.acquisitions - 1
      await client.save()
    }

    // Remettre la propriété en AVAILABLE
    const property = await Property.findOrFail(acquisition.propertyId)
    property.status = 'AVAILABLE'
    await property.save()

    await acquisition.delete()

    return response.json({ message: 'Acquisition supprimée' })
  }

  public async show({ params }: HttpContext) {
    const acquisition = await Acquisition.query()
      .where('id', params.id)
      .preload('property')
      .preload('client')
      .firstOrFail()

    return {
      id: acquisition.id,
      property: acquisition.property,
      client: acquisition.client,
      commercialName: acquisition.agent,
      amount: acquisition.amount,
      amountType: acquisition.paymentType === 'TOTAL' ? 'Total' : 'Avance',
      status: this.mapStatus(acquisition.status),
      dateAcquisition: acquisition.dateAcquisition,
      structureName: acquisition.structureName,
    }
  }

  public async update({ params, request, response }: HttpContext) {
    const acquisition = await Acquisition.findOrFail(params.id)

    const data = request.only([
      'property_id',
      'client_id',
      'agent',
      'amount',
      'payment_type',
      'status',
      'date',
      'structure_name',
    ])

    acquisition.merge({
      propertyId: data.property_id ?? acquisition.propertyId,
      clientId: data.client_id ?? acquisition.clientId,
      agent: data.agent ?? acquisition.agent,
      amount: data.amount ?? acquisition.amount,
      paymentType: data.payment_type ?? acquisition.paymentType,
      status: data.status ?? acquisition.status,
      dateAcquisition: data.date ?? acquisition.dateAcquisition,
      structureName: data.structure_name ?? acquisition.structureName,
    })

    await acquisition.save()

    // Mettre à jour le statut de la propriété si changé
    if (data.status) {
      const property = await Property.findOrFail(acquisition.propertyId)
      property.status = data.status
      await property.save()
    }

    await acquisition.load('property')
    await acquisition.load('client')

    return response.ok(acquisition)
  }

}
