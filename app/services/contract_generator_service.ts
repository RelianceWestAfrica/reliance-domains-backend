

export default class ContractGenerator {
  // public static async generate(acquisition: any) {
  //   const fileName = `contract-${acquisition.id}.pdf`
  //   const filePath = Application.tmpPath(`contracts/${fileName}`)
  //
  //   const doc = new PDFDocument()
  //   doc.pipe(fs.createWriteStream(filePath))
  //
  //   doc.fontSize(20).text('CONTRAT D’ACQUISITION', { align: 'center' })
  //   doc.moveDown()
  //
  //   doc.fontSize(12)
  //   doc.text(`Client : ${acquisition.client.fullName}`)
  //   doc.text(`Propriété : ${acquisition.property.title}`)
  //   doc.text(`Commercial : ${acquisition.agent.fullName}`)
  //   doc.text(`Montant : ${acquisition.amount} FCFA`)
  //   doc.text(`Paiement : ${acquisition.paymentType}`)
  //   doc.text(`Date : ${acquisition.dateAcquisition}`)
  //
  //   doc.moveDown(2)
  //   doc.text('Signature Client : ____________________')
  //   doc.text('Signature Société : ____________________')
  //
  //   doc.end()
  //
  //   return fileName
  // }
}
