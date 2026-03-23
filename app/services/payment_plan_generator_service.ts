import fs from 'node:fs'
import path from 'node:path'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import app from '@adonisjs/core/services/app'
import { DateTime } from 'luxon'
import PaymentPlan from '#models/payment_plan'
import ProjectPaymentConfig from '#models/project_payment_config'

export default class PaymentPlanGeneratorService {

  // ─── Génération du document ────────────────────────────────────────────────
  static async generate(planId: number): Promise<string> {
    const plan = await PaymentPlan.query()
      .where('id', planId)
      .preload('installments', q => q.orderBy('order', 'asc'))
      .preload('acquisition', (q: any) => {
        q.preload('client')
        q.preload('property', (pq: any) => {
          pq.preload('project', (ppq: any) => ppq.preload('country'))
          pq.preload('residence')
          pq.preload('residenceFloor')
        })
      })
      .firstOrFail()

    const projectId = plan.acquisition?.property?.projectId
    const config = await ProjectPaymentConfig.query()
      .where('project_id', projectId)
      .firstOrFail()

    // Choisir le bon template selon le mode
    let templateRelativePath: string | null = null
    if (plan.mode === 'CASH') templateRelativePath = config.cashTemplateUrl
    else if (plan.mode === 'PHASED') templateRelativePath = config.phasedTemplateUrl
    else if (plan.mode === 'CUSTOM') templateRelativePath = config.customTemplateUrl

    if (!templateRelativePath) {
      throw new Error(`Aucun template .docx configuré pour le mode ${plan.mode} de ce projet`)
    }

    // Lire le template depuis le système de fichiers
    const fullTemplatePath = app.makePath(templateRelativePath.replace(/^\//, ''))

    if (!fs.existsSync(fullTemplatePath)) {
      throw new Error(`Fichier template introuvable : ${fullTemplatePath}`)
    }

    const content = fs.readFileSync(fullTemplatePath, 'binary')

    // Remplir les variables
    const zip = new PizZip(content)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '',
    })

    const variables = PaymentPlanGeneratorService.buildVariables(plan)
    doc.render(variables)

    // Créer le dossier de sortie
    const outputDir = app.makePath('storage', 'payment-plans', 'generated')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Nom du fichier généré
    const clientName = plan.acquisition?.client?.lastName?.toUpperCase() ?? 'CLIENT'
    const modeName = plan.mode
    const outputFileName = `plan_${modeName}_${clientName}_${Date.now()}.docx`
    const outputPath = path.join(outputDir, outputFileName)

    const buf = doc.getZip().generate({ type: 'nodebuffer' })
    fs.writeFileSync(outputPath, buf)

    const fileUrl = `payment-plans/generated/${outputFileName}`

    // Mettre à jour le plan avec l'URL du document généré
    plan.docxUrl = fileUrl
    await plan.save()

    return fileUrl
  }

  // ─── Construction des variables ───────────────────────────────────────────
  static buildVariables(plan: PaymentPlan): Record<string, any> {
    const now = DateTime.now().setLocale('fr')
    const acquisition = plan.acquisition
    const client = acquisition?.client
    const property = acquisition?.property
    const project = property?.project
    const residence = property?.residence
    const floor = property?.residenceFloor

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

    const totalAmount = Number(plan.totalAmount)
    const depositAmount = Number(plan.depositAmount)

    // Structure
    const structureCode: Record<string, string> = {
      'Reliance West Africa': 'RWA',
      'SONATUR': 'SONATUR',
    }

    const structure = (acquisition as any)?.structureName ?? ''
    console.log('structureName:', structure, '| acquisition keys:', Object.keys(acquisition ?? {}))
    const structureShort = structureCode[structure] ?? structure.toUpperCase().replace(/\s/g, '')

    // Code de l'unité
    const propertyCode = property?.title?.split(' - ')[0]?.trim() ?? ''

    // Bâtiment
    const batiment = residence?.title?.split(' - ')[0]?.trim() ?? ''
    const etage = floor?.name ?? ''

    // Référence plan
    const year = new Date().getFullYear()
    const projectCode = project?.title?.toUpperCase().replace(/\s/g, '') ?? ''
    const referencePlan = `PLAN-${projectCode}-${plan.mode}-${year}-${plan.id}`

    // Client
    const birthDate = client?.birthDate
      ? new Date(client.birthDate).toLocaleDateString('fr-FR', {
          day: 'numeric', month: 'long', year: 'numeric'
        })
      : ''
    const birthPlace = (client as any)?.birthPlace ?? ''

    const vars: Record<string, any> = {
      // Client
      CLIENT_NOM: client?.lastName?.toUpperCase() ?? '',
      CLIENT_PRENOM: client?.firstName ?? '',
      CLIENT_NOM_COMPLET: `${client?.firstName ?? ''} ${client?.lastName?.toUpperCase() ?? ''}`.trim(),
      CLIENT_EMAIL: client?.email ?? '',
      CLIENT_TELEPHONE: client?.phone ?? '',
      CLIENT_ADRESSE: (client as any)?.address ?? '',
      CLIENT_NATIONALITE: (client as any)?.nationality ?? '',
      CLIENT_IDENTITE: (client as any)?.identityNumber ?? '',
      CLIENT_DATE_NAISSANCE: birthDate,
      CLIENT_LIEU_NAISSANCE: birthPlace,
      CLIENT_DATE_LIEU_NAISSANCE: birthDate && birthPlace ? `${birthDate} à ${birthPlace}` : birthDate || birthPlace,
      CLIENT_PROFESSION: (client as any)?.profession ?? '',

      // Propriété
      PROPRIETE_CODE: propertyCode,
      PROPRIETE_TITRE: property?.title ?? '',
      PROPRIETE_TYPE: (property as any)?.type ?? '',
      PROPRIETE_SURFACE: property?.surface ? String(Math.round(Number(property.surface))) : '',
      PROPRIETE_ETAGE: etage,
      BATIMENT: batiment,

      // Projet & Structure
      PROJET_NOM: project?.title ?? '',
      PROJET_VILLE: (project as any)?.city ?? '',
      PROJET_PAYS: (project as any)?.country?.name ?? '',
      STRUCTURE_NOM: structure,
      STRUCTURE_CODE: structureShort,

      // Montants
      MONTANT_TOTAL: new Intl.NumberFormat('fr-FR').format(totalAmount),
      MONTANT_TOTAL_LETTRES: capitalize(PaymentPlanGeneratorService.numberToWords(totalAmount)),
      ACOMPTE: new Intl.NumberFormat('fr-FR').format(depositAmount),
      ACOMPTE_LETTRES: capitalize(PaymentPlanGeneratorService.numberToWords(depositAmount)),

      // Dates
      DATE_JOUR: now.toFormat('dd MMMM yyyy'),
      DATE_JOUR_COURT: now.toFormat('dd/MM/yyyy'),
      ANNEE: now.toFormat('yyyy'),
      DATE_BUTOIR: plan.deadlineDate ? DateTime.fromJSDate(new Date(plan.deadlineDate)).toFormat('dd/MM/yyyy') : '',
      REFERENCE_PLAN: referencePlan,
    }

    // Versements
    const installments = plan.installments ?? []
    installments.forEach((inst, i) => {
      const n = i + 1
      const amount = Number(inst.amountDue)
      vars[`VERSEMENT_${n}_MONTANT`] = new Intl.NumberFormat('fr-FR').format(amount)
      vars[`VERSEMENT_${n}_MONTANT_LETTRES`] = capitalize(PaymentPlanGeneratorService.numberToWords(amount))
      vars[`VERSEMENT_${n}_LABEL`] = inst.label ?? ''
      vars[`VERSEMENT_${n}_ECHEANCE`] = inst.dueDate ?? ''
      vars[`VERSEMENT_${n}_STATUT`] = inst.status ?? ''
    })

    return vars
  }

  // ─── Conversion nombre en lettres ─────────────────────────────────────────
  static numberToWords(n: number): string {
    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
      'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf']
    const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt']

    if (n === 0) return 'zéro'
    if (n < 0) return 'moins ' + PaymentPlanGeneratorService.numberToWords(-n)

    let result = ''

    if (n >= 1_000_000_000) {
      result += PaymentPlanGeneratorService.numberToWords(Math.floor(n / 1_000_000_000)) + ' milliard '
      n %= 1_000_000_000
    }
    if (n >= 1_000_000) {
      result += PaymentPlanGeneratorService.numberToWords(Math.floor(n / 1_000_000)) + ' million '
      n %= 1_000_000
    }
    if (n >= 1_000) {
      const thousands = Math.floor(n / 1_000)
      result += (thousands === 1 ? 'mille ' : PaymentPlanGeneratorService.numberToWords(thousands) + ' mille ')
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

  // ─── Variables disponibles ────────────────────────────────────────────────
  static getAvailableVariables(): Record<string, string> {
    return {
      CLIENT_NOM: 'Nom du client',
      CLIENT_PRENOM: 'Prénom du client',
      CLIENT_NOM_COMPLET: 'Nom complet du client',
      CLIENT_EMAIL: 'Email du client',
      CLIENT_TELEPHONE: 'Téléphone du client',
      CLIENT_ADRESSE: 'Adresse du client',
      CLIENT_NATIONALITE: 'Nationalité du client',
      CLIENT_IDENTITE: "N° pièce d'identité",
      CLIENT_DATE_NAISSANCE: 'Date de naissance',
      CLIENT_LIEU_NAISSANCE: 'Lieu de naissance',
      CLIENT_DATE_LIEU_NAISSANCE: 'Date et lieu de naissance combinés',
      CLIENT_PROFESSION: 'Profession',
      PROPRIETE_CODE: "Code de l'unité (ex: A0101)",
      PROPRIETE_TITRE: 'Titre de la propriété',
      PROPRIETE_TYPE: 'Type de la propriété',
      PROPRIETE_SURFACE: 'Surface en m²',
      PROPRIETE_ETAGE: 'Étage / palier',
      BATIMENT: 'Bâtiment',
      PROJET_NOM: 'Nom du projet',
      PROJET_VILLE: 'Ville du projet',
      PROJET_PAYS: 'Pays du projet',
      STRUCTURE_NOM: 'Nom complet de la structure',
      STRUCTURE_CODE: 'Code court de la structure (ex: RWA)',
      MONTANT_TOTAL: 'Montant total en chiffres',
      MONTANT_TOTAL_LETTRES: 'Montant total en lettres',
      ACOMPTE: "Acompte en chiffres",
      ACOMPTE_LETTRES: "Acompte en lettres",
      VERSEMENT_1_MONTANT: '1er versement en chiffres',
      VERSEMENT_1_MONTANT_LETTRES: '1er versement en lettres',
      VERSEMENT_1_LABEL: 'Label du 1er versement',
      VERSEMENT_1_ECHEANCE: "Échéance du 1er versement",
      VERSEMENT_2_MONTANT: '2ème versement en chiffres',
      VERSEMENT_2_MONTANT_LETTRES: '2ème versement en lettres',
      VERSEMENT_2_LABEL: 'Label du 2ème versement',
      VERSEMENT_2_ECHEANCE: "Échéance du 2ème versement",
      VERSEMENT_3_MONTANT: '3ème versement en chiffres',
      VERSEMENT_3_MONTANT_LETTRES: '3ème versement en lettres',
      VERSEMENT_3_LABEL: 'Label du 3ème versement',
      VERSEMENT_3_ECHEANCE: "Échéance du 3ème versement",
      DATE_JOUR: 'Date du jour (ex: 20 mars 2026)',
      DATE_JOUR_COURT: 'Date courte (ex: 20/03/2026)',
      ANNEE: 'Année en cours',
      DATE_BUTOIR: 'Date butoir du plan',
      REFERENCE_PLAN: 'Référence unique du plan',
    }
  }
}
