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

    // ← Vérifier AVANT le move
    if (!file.isValid) {
      throw new Error(file.errors.map(e => e.message).join(', '))
    }

    const templateDir = app.makePath('storage', 'contract-templates', `project_${projectId}`)
    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true })
    }

    const fileName = `template_${type}_${Date.now()}.docx`
    // ${file.extname}

    console.log('=== UPLOAD TEMPLATE DEBUG ===')
    console.log('templateDir:', templateDir)
    console.log('file.tmpPath:', file.tmpPath)
    console.log('file.isValid:', file.isValid)
    console.log('file.errors:', file.errors)

    await file.move(templateDir, { name: fileName, overwrite: true })

    console.log('Après move - file.isValid:', file.isValid)
    console.log('Après move - file.errors:', file.errors)
    console.log('File exists after move:', fs.existsSync(path.join(templateDir, fileName)))

    // ← Vérifier APRÈS le move aussi
    if (!file.isValid) {
      throw new Error(file.errors.map(e => e.message).join(', '))
    }

    const relativePath = `contract-templates/project_${projectId}/${fileName}`

    const existing = await ContractTemplate.query()
      .where('project_id', projectId)
      .where('type', type)
      .first()

    if (existing) {
      this.deleteFile(existing.docxPath)
      existing.label = label
      existing.docxPath = relativePath
      existing.actif = true
      await existing.save()
      return existing
    }

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
      CLIENT_DATE_NAISSANCE: 'Date de naissance du client',
      CLIENT_LIEU_NAISSANCE: 'Lieu de naissance du client',
      CLIENT_DATE_LIEU_NAISSANCE: 'Date et lieu de naissance combinés',
      CLIENT_PROFESSION: 'Profession du client',
      CLIENT_IDENTITE: 'N° Pièce d\'identité ou RCCM du client',

      // Propriété
      PROPRIETE_CODE: 'Code de l\'unité (ex: A0101, B0203)',
      PROPRIETE_TITRE: 'Titre complet de la propriété',
      PROPRIETE_TYPE: 'Type de propriété (APARTMENT, VILLA, SHOP...)',
      PROPRIETE_SURFACE: 'Surface en m²',
      PROPRIETE_ETAGE: 'Étage de la propriété (palier)',
      PROPRIETE_PRIX: 'Prix formaté en FCFA (ex: 247 950 000 FCFA)',
      PROPRIETE_PRIX_LETTRES: 'Prix en toutes lettres + chiffres (ex: Deux cent... (247 950 000) FCFA)',
      PROPRIETE_NB_PIECES: 'Nombre de pièces',
      BATIMENT: 'Bâtiment — extrait du titre de la résidence (avant le " - ")',
      ETAGE: 'Nom de l\'étage / palier',

      // Projet
      PROJET_NOM: 'Nom du projet',
      PROJET_VILLE: 'Ville du projet',
      PROJET_PAYS: 'Pays du projet',

      // Acquisition
      MONTANT_ACQUISITION: 'Montant versé lors de l\'acquisition (formaté)',
      COMMERCIAL: 'Nom du commercial / agent',
      DATE_ACQUISITION: 'Date de l\'acquisition (format long ex: 11 février 2026)',
      STRUCTURE_NOM: 'Nom complet de la structure procédant à l\'opération',
      STRUCTURE_CODE: 'Code court de la structure (ex: RWA, SONATUR)',

      // Référence
      REFERENCE_CONTRAT: 'Référence complète du contrat (ex: ZAFARAPLAZZA/RES/2026/A0101/RWA)',

      // Dates
      DATE_JOUR: 'Date du jour format long (ex: 5 mars 2026)',
      DATE_JOUR_COURT: 'Date du jour format court (ex: 05/03/2026)',
      ANNEE: 'Année en cours (ex: 2026)',
      MOIS: 'Mois en cours (ex: mars)',
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
