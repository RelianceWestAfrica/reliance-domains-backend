import fs from 'node:fs'
import path from 'node:path'
import app from '@adonisjs/core/services/app'
import ContractTemplate from '#models/contract_template'
import { MultipartFile } from '@adonisjs/core/types/bodyparser'

export default class ContractTemplateService {

  /**
   * Upload et enregistre un template .docx pour un projet
   */
  async uploadTemplate(
    projectId: number,
    type: string,
    label: string,
    file: MultipartFile
  ): Promise<ContractTemplate> {

    // Créer le dossier de stockage des templates
    const templateDir = app.makePath('storage', 'contract-templates', `project_${projectId}`)
    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true })
    }

    const fileName = `template_${type}_${Date.now()}.${file.extname}`

    await file.move(templateDir, { name: fileName })

    if (!file.isValid) {
      throw new Error(file.errors.map(e => e.message).join(', '))
    }

    const relativePath = `contract-templates/project_${projectId}/${fileName}`

    // Vérifier si un template du même type existe déjà pour ce projet
    const existing = await ContractTemplate.query()
      .where('project_id', projectId)
      .where('type', type)
      .first()

    if (existing) {
      // Supprimer l'ancien fichier
      this.deleteFile(existing.docxPath)

      // Mettre à jour
      existing.label = label
      existing.docxPath = relativePath
      existing.actif = true
      await existing.save()
      return existing
    }

    // Créer un nouveau template
    const template = await ContractTemplate.create({
      projectId,
      type,
      label,
      docxPath: relativePath,
      actif: true,
    })

    return template
  }

  /**
   * Liste les templates d'un projet
   */
  async getProjectTemplates(projectId: number): Promise<ContractTemplate[]> {
    return ContractTemplate.query()
      .where('project_id', projectId)
      .orderBy('label', 'asc')
  }

  /**
   * Active ou désactive un template
   */
  async toggleActif(templateId: number): Promise<ContractTemplate> {
    const template = await ContractTemplate.findOrFail(templateId)
    template.actif = !template.actif
    await template.save()
    return template
  }

  /**
   * Supprime un template et son fichier
   */
  async deleteTemplate(templateId: number): Promise<void> {
    const template = await ContractTemplate.findOrFail(templateId)

    this.deleteFile(template.docxPath)
    this.deleteFile(template.pdfPath)

    await template.delete()
  }

  /**
   * Retourne les variables disponibles pour un template
   */
  getAvailableVariables(): Record<string, string> {
    return {
      // Client
      CLIENT_NOM: 'Nom du client (majuscules)',
      CLIENT_PRENOM: 'Prénom du client',
      CLIENT_NOM_COMPLET: 'Nom complet du client',
      CLIENT_EMAIL: 'Email du client',
      CLIENT_TELEPHONE: 'Téléphone du client',
      CLIENT_ADRESSE: 'Adresse du client',
      CLIENT_NATIONALITE: 'Nationalité du client',
      CLIENT_GENRE: 'Genre du client',

      // Propriété
      PROPRIETE_TITRE: 'Titre de la propriété',
      PROPRIETE_TYPE: 'Type de propriété (APARTMENT, VILLA, SHOP)',
      PROPRIETE_SURFACE: 'Surface en m²',
      PROPRIETE_PRIX: 'Prix formaté en FCFA',
      PROPRIETE_ETAGE: 'Nom de l\'étage',
      PROPRIETE_RESIDENCE: 'Nom de la résidence',
      PROPRIETE_NB_PIECES: 'Nombre de pièces',

      // Projet
      PROJET_NOM: 'Nom du projet',
      PROJET_VILLE: 'Ville du projet',
      PROJET_PAYS: 'Pays du projet',

      // Acquisition
      MONTANT_ACQUISITION: 'Montant de l\'acquisition formaté',
      COMMERCIAL: 'Nom du commercial',
      DATE_ACQUISITION: 'Date de l\'acquisition (format long)',

      // Dates
      DATE_JOUR: 'Date du jour (format long)',
      DATE_JOUR_COURT: 'Date du jour (format court)',
      ANNEE: 'Année en cours',
      MOIS: 'Mois en cours',
    }
  }

  /**
   * Supprime un fichier physique
   */
  private deleteFile(filePath: string | null): void {
    if (!filePath) return
    const fullPath = app.makePath('storage', filePath)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  }
}
