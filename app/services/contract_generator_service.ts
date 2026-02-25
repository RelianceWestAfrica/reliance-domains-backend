import fs from 'node:fs'
import path from 'node:path'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import app from '@adonisjs/core/services/app'
import { DateTime } from 'luxon'

export default class ContractGeneratorService {

  async generate(
    templatePath: string,
    variables: Record<string, any>,
    outputFileName: string
  ): Promise<string> {

    // Lire le template .docx
    const fullTemplatePath = app.makePath('storage', templatePath)

    if (!fs.existsSync(fullTemplatePath)) {
      throw new Error(`Template introuvable : ${fullTemplatePath}`)
    }

    const content = fs.readFileSync(fullTemplatePath, 'binary')

    // Remplir les variables dans le template
    const zip = new PizZip(content)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })

    doc.render(variables)

    // Créer le dossier de sortie si inexistant
    const outputDir = app.makePath('storage', 'contracts', 'generated')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Écrire le fichier généré
    const buf = doc.getZip().generate({ type: 'nodebuffer' })
    const outputPath = path.join(outputDir, outputFileName)
    fs.writeFileSync(outputPath, buf)

    return `contracts/generated/${outputFileName}`
  }

  buildVariables(acquisition: any): Record<string, any> {
    const now = DateTime.now().setLocale('fr')

    return {
      // Client
      CLIENT_NOM: acquisition.client?.lastName?.toUpperCase() ?? '',
      CLIENT_PRENOM: acquisition.client?.firstName ?? '',
      CLIENT_NOM_COMPLET: `${acquisition.client?.firstName} ${acquisition.client?.lastName?.toUpperCase()}`,
      CLIENT_EMAIL: acquisition.client?.email ?? '',
      CLIENT_TELEPHONE: acquisition.client?.phone ?? '',
      CLIENT_ADRESSE: acquisition.client?.address ?? '',
      CLIENT_NATIONALITE: acquisition.client?.nationality ?? '',
      CLIENT_GENRE: acquisition.client?.gender ?? '',

      // Propriété
      PROPRIETE_TITRE: acquisition.property?.title ?? '',
      PROPRIETE_TYPE: acquisition.property?.type ?? '',
      PROPRIETE_SURFACE: acquisition.property?.surface ?? '',
      PROPRIETE_PRIX: new Intl.NumberFormat('fr-FR').format(acquisition.property?.price ?? 0),
      PROPRIETE_PRIX_LETTRES: acquisition.property?.price ?? '',
      PROPRIETE_ETAGE: acquisition.property?.floor?.name ?? '',
      PROPRIETE_RESIDENCE: acquisition.property?.residence?.title ?? '',
      PROPRIETE_NB_PIECES: acquisition.property?.roomsCount ?? '',

      // Projet
      PROJET_NOM: acquisition.property?.project?.name ?? '',
      PROJET_VILLE: acquisition.property?.project?.city ?? '',
      PROJET_PAYS: acquisition.property?.project?.country?.name ?? '',

      // Acquisition
      MONTANT_ACQUISITION: new Intl.NumberFormat('fr-FR').format(acquisition.amount ?? 0),
      COMMERCIAL: acquisition.commercialName ?? '',
      DATE_ACQUISITION: DateTime.fromISO(acquisition.dateAcquisition).setLocale('fr').toFormat('dd MMMM yyyy'),

      // Date du jour
      DATE_JOUR: now.toFormat('dd MMMM yyyy'),
      DATE_JOUR_COURT: now.toFormat('dd/MM/yyyy'),
      ANNEE: now.toFormat('yyyy'),
      MOIS: now.toFormat('MMMM'),
    }
  }
}
