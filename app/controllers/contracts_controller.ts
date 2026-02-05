import Contract from "#models/contract";
import User from "#models/user";
import { cwd } from 'node:process'
import { join } from 'node:path'
import { access } from 'node:fs/promises'
import type {HttpContext} from "@adonisjs/core/http";

export default class ContractsController {
  public async index() {
    const contracts = await Contract
      .query()
      .preload('acquisition')
      .preload('user')

    return contracts.map(c => ({
      id: c.id,
      acquisitionId: c.acquisitionId,
      filePath: c.filePath,
      contractType: c.contractType,
      contractTypeLabel: c.contractTypeLabel,
      status: c.status,
      statusLabel: c.contractStatusLabel,
      userId: c.userId,
      createdAt: c.createdAt.toISO(),
      updatedAt: c.updatedAt.toISO(),
      pdfUrl: `/api/contracts/${c.id}/download`,
      acquisition: c.acquisition,
      user: c.user,
    }))
  }

  public async store({ request, response, auth }: HttpContext) {
    const data = request.only([
      'acquisition_id',
      'file_path',
      'contract_type',
      'status',
    ])

    const user = await auth.authenticate() as User

    const contract = await Contract.create({
      acquisitionId: data.acquisition_id,
      filePath: data.file_path,
      contractType: data.contract_type,
      status: data.status || 'READY',
      userId: user.id,
    })

    await contract.load('acquisition')
    await contract.load('user')

    return response.created(contract)
  }

  /**
   * PUT/PATCH /api/contracts/:id
   * Mise à jour d'un contrat
   */
  public async update({ params, request, response }: HttpContext) {
    const contract = await Contract.findOrFail(params.id)

    const data = request.only([
      'acquisition_id',
      'file_path',
      'contract_type',
      'status',
    ])

    // Mise à jour
    contract.merge({
      ...(data.acquisition_id && { acquisitionId: data.acquisition_id }),
      ...(data.file_path && { filePath: data.file_path }),
      ...(data.contract_type && { contractType: data.contract_type }),
      ...(data.status && { status: data.status }),
    })

    await contract.save()

    await contract.load('acquisition')
    await contract.load('user')

    return response.ok(contract)
  }

  /**
   * GET /api/contracts/:id/download
   * Téléchargement du fichier contrat
   */
  public async download({ params, response }: HttpContext) {
    const contract = await Contract.findOrFail(params.id)
    const filePath = join(cwd(), contract.filePath)

    try {
      await access(filePath)
      return response.download(filePath)
    } catch (error) {
      return response.notFound({ message: 'Fichier introuvable' })
    }
  }

  /**
   * DELETE /api/contracts/:id
   * Suppression d'un contrat
   */
  async destroy({ params, response }: HttpContext) {
    const contract = await Contract.findOrFail(params.id)
    await contract.delete()
    return response.noContent()
  }
}
