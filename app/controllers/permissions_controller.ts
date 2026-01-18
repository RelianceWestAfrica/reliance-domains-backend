import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import UserProjectPermission from '#models/user_project_permission'
import Project from '#models/project'
import { assignProjectsValidator } from '#validators/permission'

export default class PermissionsController {
  async index({ auth, response }: HttpContext) {
    const user = auth.user as User

    if (user.role !== 'SUPERADMIN') {
      return response.forbidden({ message: 'Accès refusé. Réservé aux SUPERADMIN.' })
    }

    const permissions = await UserProjectPermission.query()
      .preload('user')
      .preload('project')

    return response.ok(permissions)
  }

  async getUserPermissions({ auth, params, response }: HttpContext) {
    const user = auth.user as User

    if (user.role !== 'SUPERADMIN') {
      return response.forbidden({ message: 'Accès refusé. Réservé aux SUPERADMIN.' })
    }

    const targetUser = await User.findOrFail(params.userId)
    await targetUser.load('allowedProjects')

    return response.ok({
      user: {
        id: targetUser.id,
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        role: targetUser.role,
      },
      allowedProjects: targetUser.allowedProjects,
    })
  }

  async assignProjects({ auth, request, response }: HttpContext) {
    const user = auth.user as User

    if (user.role !== 'SUPERADMIN') {
      return response.forbidden({ message: 'Accès refusé. Réservé aux SUPERADMIN.' })
    }

    const payload = await request.validateUsing(assignProjectsValidator)
    const { userId, projectIds } = payload

    const targetUser = await User.findOrFail(userId)

    if (targetUser.role === 'SUPERADMIN') {
      return response.badRequest({
        message: 'Impossible d\'attribuer des projets à un SUPERADMIN'
      })
    }

    if (!['COMMERCIAL', 'ADMIN'].includes(targetUser.role)) {
      return response.badRequest({
        message: 'Les autorisations ne peuvent être attribuées qu\'aux utilisateurs COMMERCIAL et ADMIN'
      })
    }

    const projects = await Project.query().whereIn('id', projectIds)

    if (projects.length !== projectIds.length) {
      return response.badRequest({ message: 'Un ou plusieurs projets n\'existent pas' })
    }

    await targetUser.related('allowedProjects').sync(projectIds)

    await targetUser.load('allowedProjects')

    return response.ok({
      message: 'Autorisations mises à jour avec succès',
      user: {
        id: targetUser.id,
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        role: targetUser.role,
      },
      allowedProjects: targetUser.allowedProjects,
    })
  }

  async removeProject({ auth, params, response }: HttpContext) {
    const user = auth.user as User

    if (user.role !== 'SUPERADMIN') {
      return response.forbidden({ message: 'Accès refusé. Réservé aux SUPERADMIN.' })
    }

    const { userId, projectId } = params

    const targetUser = await User.findOrFail(userId)

    await targetUser.related('allowedProjects').detach([projectId])

    return response.ok({ message: 'Autorisation retirée avec succès' })
  }

  async getEligibleUsers({ auth, response }: HttpContext) {
    const user = auth.user as User

    if (user.role !== 'SUPERADMIN') {
      return response.forbidden({ message: 'Accès refusé. Réservé aux SUPERADMIN.' })
    }

    const users = await User.query()
      .whereIn('role', ['COMMERCIAL', 'ADMIN'])
      .preload('allowedProjects')

    return response.ok(users)
  }
}
