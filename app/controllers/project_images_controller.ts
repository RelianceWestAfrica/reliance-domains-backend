// app/controllers/project_images_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Project from '#models/project'
import ProjectImage from '#models/project_image'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'

export default class ProjectImagesController {
  /**
   * POST /api/projects/:id/images
   * Body: multipart/form-data avec images[]
   */
  async store({ params, request, response }: HttpContext) {
    const project = await Project.findOrFail(params.id)

    const images = request.files('images', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (images.length === 0) {
      return response.badRequest({ message: 'Aucune image fournie' })
    }

    const savedImages: ProjectImage[] = []

    for (const file of images) {
      if (!file.isValid) {
        // tu peux loguer file.errors si tu veux
        continue
      }

      const fileName = `${cuid()}.${file.extname}`

      // on enregistre dans /uploads/projects (dans le dossier du projet)
      await file.move(app.makePath('uploads/projects'), {
        name: fileName,
      })

      const img = await ProjectImage.create({
        projectId: project.id,
        filePath: `uploads/projects/${fileName}`,
        isCover: false,
        position: 0,
      })

      savedImages.push(img)
    }

    return response.created(savedImages)
  }

  /**
   * GET /api/projects/:id/images
   */
  async index({ params }: HttpContext) {
    const project = await Project.query()
      .where('id', params.id)
      .preload('images', (q) => q.orderBy('position', 'asc'))
      .firstOrFail()

    return project.images
  }

  /**
   * DELETE /api/projects/images/:imageId
   */
  async destroy({ params, response }: HttpContext) {
    const image = await ProjectImage.findOrFail(params.imageId)
    await image.delete()

    return response.noContent()
  }
}
