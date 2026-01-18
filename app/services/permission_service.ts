import User from '#models/user'

export default class PermissionService {
  static async getAllowedProjectIds(user: User): Promise<number[]> {
    if (user.role === 'SUPERADMIN') {
      return []
    }

    await user.load('allowedProjects')
    return user.allowedProjects.map((p) => p.id)
  }

  static async canAccessProject(user: User, projectId: number): Promise<boolean> {
    if (user.role === 'SUPERADMIN') {
      return true
    }

    const allowedProjectIds = await this.getAllowedProjectIds(user)
    return allowedProjectIds.includes(projectId)
  }

  static async filterByProjectAccess<T extends { projectId?: number }>(
    user: User,
    query: any
  ): Promise<any> {
    if (user.role === 'SUPERADMIN') {
      return query
    }

    const allowedProjectIds = await this.getAllowedProjectIds(user)

    if (allowedProjectIds.length === 0) {
      query.where('id', -1)
      return query
    }

    query.whereIn('project_id', allowedProjectIds)
    return query
  }
}
