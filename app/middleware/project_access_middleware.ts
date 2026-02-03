import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import User from '#models/user'

export default class ProjectAccessMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user as User | undefined

    // if (!user) {
    //   return ctx.response.unauthorized({ message: 'Utilisateur non authentifié' })
    // }

    if (user!.role === 'SUPERADMIN') {
      return next()
    }

    const projectId = ctx.request.input('project_id') ||
                      ctx.request.input('projectId') ||
                      ctx.params.projectId ||
                      ctx.params.project_id

    if (!projectId) {
      return next()
    }

    await user!.load('allowedProjects')
    const allowedProjectIds = user!.allowedProjects.map((p: any) => p.id)

    if (!allowedProjectIds.includes(Number(projectId))) {
      return ctx.response.forbidden({
        message: 'Vous n\'avez pas accès à ce projet'
      })
    }

    return next()
  }
}
