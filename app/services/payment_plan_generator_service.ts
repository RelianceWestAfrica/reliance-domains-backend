// app/services/payment_plan_generator_service.ts
import PaymentPlan from '#models/payment_plan'
// import { createReport } from 'docx-templater'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import ProjectPaymentConfig from '#models/project_payment_config'

export default class PaymentPlanGeneratorService {

  static numberToWords(n: number): string {
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

  static async buildVariables(plan: PaymentPlan): Promise<Record<string, string>> {
    await plan.load('acquisition', (q) => {
      q.preload('client')
      q.preload('property', (pq) => {
        pq.preload('project')
        pq.preload('residence')
        pq.preload('residenceFloor')
      })
    })
    await plan.load('installments')

    const client = plan.acquisition?.client
    const property = plan.acquisition?.property
    const project = property?.project
    const floor = property?.residenceFloor
    const residence = property?.residence

    const batiment = residence?.title?.split(' - ')[0]?.trim() ?? ''
    const etage = floor?.name ?? ''

    const totalAmount = Number(plan.totalAmount)
    const depositAmount = Number(plan.depositAmount)

    const now = new Date()
    const dateJour = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    const dateJourCourt = now.toLocaleDateString('fr-FR')
    const annee = String(now.getFullYear())

    const vars: Record<string, string> = {
      // Client
      CLIENT_NOM: client?.lastName ?? '',
      CLIENT_PRENOM: client?.firstName ?? '',
      CLIENT_NOM_COMPLET: `${client?.firstName ?? ''} ${client?.lastName ?? ''}`.trim(),
      CLIENT_EMAIL: client?.email ?? '',
      CLIENT_TELEPHONE: client?.phone ?? '',
      CLIENT_ADRESSE: client?.address ?? '',
      CLIENT_NATIONALITE: client?.nationality ?? '',
      CLIENT_IDENTITE: client?.identityNumber ?? '',

      // Propriété
      PROPRIETE_TITRE: property?.title ?? '',
      PROPRIETE_TYPE: property?.type ?? '',
      PROPRIETE_SURFACE: property?.surface ? String(Math.round(Number(property.surface))) : '',
      PROPRIETE_ETAGE: etage,
      BATIMENT: batiment,

      // Projet
      PROJET_NOM: project?.title ?? '',
      PROJET_VILLE: project?.city ?? '',

      // Montants
      MONTANT_TOTAL: new Intl.NumberFormat('fr-FR').format(totalAmount),
      MONTANT_TOTAL_LETTRES: PaymentPlanGeneratorService.numberToWords(totalAmount),
      ACOMPTE: new Intl.NumberFormat('fr-FR').format(depositAmount),
      ACOMPTE_LETTRES: PaymentPlanGeneratorService.numberToWords(depositAmount),

      // Dates
      DATE_JOUR: dateJour,
      DATE_JOUR_COURT: dateJourCourt,
      ANNEE: annee,
      REFERENCE_PLAN: `PLAN-${project?.title?.replace(/\s+/g, '-').toUpperCase()}-${plan.id}`,
      DATE_BUTOIR: plan.deadlineDate ?? '',
    }

    // Versements selon le mode
    const installments = plan.installments ?? []
    installments.forEach((inst, i) => {
      const n = i + 1
      const amount = Number(inst.amountDue)
      vars[`VERSEMENT_${n}_MONTANT`] = new Intl.NumberFormat('fr-FR').format(amount)
      vars[`VERSEMENT_${n}_MONTANT_LETTRES`] = PaymentPlanGeneratorService.numberToWords(amount)
      vars[`VERSEMENT_${n}_LABEL`] = inst.label ?? ''
      vars[`VERSEMENT_${n}_STATUT`] = inst.status ?? ''
      vars[`VERSEMENT_${n}_ECHEANCE`] = inst.dueDate ?? ''
    })

    return vars
  }

  static async generate(planId: number): Promise<string> {
    const plan = await PaymentPlan.query()
      .where('id', planId)
      .preload('installments')
      .preload('acquisition', (q) => {
        q.preload('client')
        q.preload('property', (pq) => {
          pq.preload('project')
          pq.preload('residence')
          pq.preload('residenceFloor')
        })
      })
      .firstOrFail()

    // Récupérer le template selon le mode
    const projectId = plan.acquisition?.property?.projectId
    const config = await ProjectPaymentConfig.query()
      .where('project_id', projectId)
      .firstOrFail()

    let templateUrl: string | null = null
    if (plan.mode === 'CASH') templateUrl = config.cashTemplateUrl
    else if (plan.mode === 'PHASED') templateUrl = config.phasedTemplateUrl
    else if (plan.mode === 'CUSTOM') templateUrl = config.customTemplateUrl

    if (!templateUrl) {
      throw new Error(`Aucun template .docx configuré pour le mode ${plan.mode} du projet`)
    }

    // Télécharger le template
    const templateResponse = await axios.get(templateUrl, { responseType: 'arraybuffer' })
    const templateBuffer = Buffer.from(templateResponse.data)

    // Générer le document
    const zip = new PizZip(templateBuffer)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })

    const variables = await PaymentPlanGeneratorService.buildVariables(plan)
    doc.render(variables)

    const output = doc.getZip().generate({ type: 'nodebuffer' })

    // Sauvegarder
    const outputDir = path.join(process.cwd(), 'storage', 'payment-plans', 'generated')
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

    const fileName = `plan_paiement_${planId}_${Date.now()}.docx`
    const filePath = path.join(outputDir, fileName)
    fs.writeFileSync(filePath, output)

    // Mettre à jour le plan avec l'URL
    const fileUrl = `/storage/payment-plans/generated/${fileName}`
    plan.docxUrl = fileUrl
    await plan.save()

    return fileUrl
  }

  static getAvailableVariables(): Record<string, string> {
  return {
    // Client
    'CLIENT_NOM': 'Nom du client',
    'CLIENT_PRENOM': 'Prénom du client',
    'CLIENT_NOM_COMPLET': 'Nom complet du client',
    'CLIENT_EMAIL': 'Email du client',
    'CLIENT_TELEPHONE': 'Téléphone du client',
    'CLIENT_ADRESSE': 'Adresse du client',
    'CLIENT_NATIONALITE': 'Nationalité du client',
    'CLIENT_IDENTITE': 'N° pièce d\'identité du client',

    // Propriété
    'PROPRIETE_TITRE': 'Titre de la propriété',
    'PROPRIETE_TYPE': 'Type de la propriété',
    'PROPRIETE_SURFACE': 'Surface en m²',
    'PROPRIETE_ETAGE': 'Étage / palier',
    'BATIMENT': 'Bâtiment',

    // Projet
    'PROJET_NOM': 'Nom du projet',
    'PROJET_VILLE': 'Ville du projet',

    // Montants
    'MONTANT_TOTAL': 'Montant total en chiffres',
    'MONTANT_TOTAL_LETTRES': 'Montant total en lettres',
    'ACOMPTE': 'Montant de l\'acompte en chiffres',
    'ACOMPTE_LETTRES': 'Montant de l\'acompte en lettres',

    // Versements
    'VERSEMENT_1_MONTANT': '1er versement en chiffres',
    'VERSEMENT_1_MONTANT_LETTRES': '1er versement en lettres',
    'VERSEMENT_1_LABEL': 'Label du 1er versement',
    'VERSEMENT_1_ECHEANCE': 'Date d\'échéance du 1er versement',

    'VERSEMENT_2_MONTANT': '2ème versement en chiffres',
    'VERSEMENT_2_MONTANT_LETTRES': '2ème versement en lettres',
    'VERSEMENT_2_LABEL': 'Label du 2ème versement',
    'VERSEMENT_2_ECHEANCE': 'Date d\'échéance du 2ème versement',

    'VERSEMENT_3_MONTANT': '3ème versement en chiffres',
    'VERSEMENT_3_MONTANT_LETTRES': '3ème versement en lettres',
    'VERSEMENT_3_LABEL': 'Label du 3ème versement',
    'VERSEMENT_3_ECHEANCE': 'Date d\'échéance du 3ème versement',

    // Dates
    'DATE_JOUR': 'Date du jour (ex: 20 mars 2026)',
    'DATE_JOUR_COURT': 'Date courte (ex: 20/03/2026)',
    'ANNEE': 'Année en cours',
    'DATE_BUTOIR': 'Date butoir du plan',

    // Référence
    'REFERENCE_PLAN': 'Référence unique du plan de paiement',
  }
}
}
