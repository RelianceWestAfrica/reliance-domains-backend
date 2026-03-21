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

  private numberToWords(n: number): string {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf']
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt']

  if (n === 0) return 'zéro'
  if (n < 0) return 'moins ' + this.numberToWords(-n)

  let result = ''

  if (n >= 1_000_000_000) {
    result += this.numberToWords(Math.floor(n / 1_000_000_000)) + ' milliard '
    n %= 1_000_000_000
  }
  if (n >= 1_000_000) {
    result += this.numberToWords(Math.floor(n / 1_000_000)) + ' million '
    n %= 1_000_000
  }
  if (n >= 1_000) {
    const thousands = Math.floor(n / 1_000)
    result += (thousands === 1 ? 'mille ' : this.numberToWords(thousands) + ' mille ')
    n %= 1_000
  }
  if (n >= 100) {
    const hundreds = Math.floor(n / 100)
    result += (hundreds === 1 ? 'cent ' : units[hundreds] + ' cent ')
    n %= 100
  }
  if (n >= 20) {
    const ten = Math.floor(n / 10)
    const unit = n % 10
    if (ten === 7 || ten === 9) {
      result += tens[ten] + '-' + units[10 + unit] + ' '
    } else if (ten === 8) {
      result += (unit === 0 ? 'quatre-vingts ' : 'quatre-vingt-' + units[unit] + ' ')
    } else {
      result += tens[ten] + (unit > 0 ? (unit === 1 && ten !== 8 ? '-et-un ' : '-' + units[unit] + ' ') : ' ')
    }
  } else if (n > 0) {
    result += units[n] + ' '
  }

  return result.trim()
}

  buildVariables(acquisition: any): Record<string, any> {
    const now = DateTime.now().setLocale('fr')

    const prix = acquisition.property?.price ?? 0
    const prixFormate = new Intl.NumberFormat('fr-FR').format(prix)
    const prixLettres = this.numberToWords(prix)

    // Capitaliser première lettre
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

    // Extraire le code de l'unité (avant le " - ")
    const propertyCode = acquisition.property?.title?.split(' - ')[0]?.trim() ?? ''

    // Code court de la structure
    const structureCode: Record<string, string> = {
      'Reliance West Africa': 'RWA',
      'SONATUR': 'SONATUR',
    }
    const structure = acquisition.structureName ?? ''
    const structureShort = structureCode[structure] ?? structure.toUpperCase().replace(/\s/g, '')

    // Référence contrat
    const year = new Date().getFullYear()
    const projectCode = acquisition.property?.project?.name?.toUpperCase().replace(/\s/g, '') ?? ''
    const reference = `${projectCode}/RES/${year}/${propertyCode}/${structureShort}`

    // Résidence et étage depuis la propriété
    const residence = acquisition.property?.residence
    // const floor = acquisition.property?.floor
    const floor = acquisition.property?.residenceFloor

    // Extraire le bâtiment (avant le " - " du titre de la résidence)
    const batiment = residence?.title?.split(' - ')[0]?.trim() ?? ''

    // Étage
    const etage = floor?.name ?? ''

    // Client — nouveaux champs
    const birthDate = acquisition.client?.birthDate
      ? new Date(acquisition.client.birthDate).toLocaleDateString('fr-FR', {
          day: 'numeric', month: 'long', year: 'numeric'
        })
      : ''
    const birthPlace = acquisition.client?.birthPlace ?? ''
    const profession = acquisition.client?.profession ?? ''

    const depositAmount = acquisition.property?.project?.depositAmount ?? 0


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
      PROPRIETE_PRIX: `${prixFormate} FCFA`,
      PROPRIETE_PRIX_LETTRES: `${capitalize(prixLettres)} (${prixFormate}) FCFA`,
      PROPRIETE_ETAGE: acquisition.property?.residenceFloor?.name ?? '',
      PROPRIETE_RESIDENCE: acquisition.property?.residence?.title ?? '',
      PROPRIETE_NB_PIECES: acquisition.property?.roomsCount ?? '',

      // Projet
      PROJET_NOM: acquisition.property?.project?.name ?? '',
      PROJET_VILLE: acquisition.property?.project?.city ?? '',
      PROJET_PAYS: acquisition.property?.project?.country?.name ?? '',

      // Acquisition
      // Acompte sur le projet
      ACOMPTE: new Intl.NumberFormat('fr-FR').format(depositAmount),
      ACOMPTE_LETTRES: ContractGeneratorService.numberToWords(depositAmount),

      MONTANT_ACQUISITION: new Intl.NumberFormat('fr-FR').format(acquisition.amount ?? 0),
      // COMMERCIAL: acquisition.commercialName ?? '',
      COMMERCIAL: acquisition.agent ?? acquisition.commercialName ?? '',
      // DATE_ACQUISITION: DateTime.fromISO(acquisition.dateAcquisition).setLocale('fr').toFormat('dd MMMM yyyy'),
      DATE_ACQUISITION: acquisition.dateAcquisition
        ? DateTime.fromISO(acquisition.dateAcquisition).setLocale('fr').toFormat('dd MMMM yyyy')
        : now.toFormat('dd MMMM yyyy'),

      // Date du jour
      DATE_JOUR: now.toFormat('dd MMMM yyyy'),
      DATE_JOUR_COURT: now.toFormat('dd/MM/yyyy'),
      ANNEE: now.toFormat('yyyy'),
      MOIS: now.toFormat('MMMM'),

      PROPRIETE_CODE: propertyCode,
      REFERENCE_CONTRAT: reference,
      STRUCTURE_NOM: structure,
      STRUCTURE_CODE: structureShort,

      // Ajoute dans l'objet variables :
      CLIENT_DATE_NAISSANCE: birthDate,
      CLIENT_LIEU_NAISSANCE: birthPlace,
      CLIENT_DATE_LIEU_NAISSANCE: birthDate && birthPlace ? `${birthDate} à ${birthPlace}` : birthDate || birthPlace,
      CLIENT_PROFESSION: profession,
      CLIENT_IDENTITE: acquisition.client?.identityNumber ?? '',
      BATIMENT: batiment,
      ETAGE: acquisition.property?.residenceFloor?.name ?? '',

    }
  }
}
