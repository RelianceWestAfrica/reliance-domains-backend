// start/routes.ts
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

import AuthController from '#controllers/auth_controller'
import AccessCodeController from "#controllers/access_codes_controller";
import CountriesController from "#controllers/countries_controller";
import ProjectsController from "#controllers/projects_controller";
import ProjectImagesController from "#controllers/project_images_controller";
import ResidencesController from "#controllers/residences_controller";
import ResidenceFloorsController from "#controllers/residence_floors_controller";
import PropertiesController from "#controllers/properties_controller";
import ClientsController from "#controllers/clients_controller";
import DomainsController from "#controllers/domains_controller";

/**
 * Petit endpoint de test
 * GET /api/health
 */
router.get('/api/health', () => {
  return { status: 'ok' }
})

/**
 * AUTH CLASSIQUE (email + mot de passe)
 * Prefix : /api/auth
 */
router
  .group(() => {
    // POST /api/auth/register
    router.post('register', [AuthController, 'register'])

    // POST /api/auth/login
    router.post('login', [AuthController, 'login'])

    // GET /api/auth/me (token obligatoire)
    router.get('me', [AuthController, 'me']).use(middleware.auth())

    // POST /api/auth/logout (token obligatoire)
    router.post('logout', [AuthController, 'logout']).use(middleware.auth())
  })
  .prefix('/api/auth')

/**
 * LOGIN PAR CODE D’ACCÈS
 * Prefix : /api/access-code
 */
router.post('/api/access-code/login', [AccessCodeController, 'login'])

/***
 GESTION DE PAYS
   */
router
  .group(() => {
    router.get('/', [CountriesController, 'index'])
    router.post('/', [CountriesController, 'store'])
    router.get('/:id', [CountriesController, 'show'])
    router.put('/:id', [CountriesController, 'update'])
    router.delete('/:id', [CountriesController, 'destroy'])
  })
  .prefix('/api/countries')
  .use(middleware.auth()) // à garder ou enlever selon ton besoin


/***
 GESTION DE PROJETS
 */
router
  .group(() => {
    router.get('/', [ProjectsController, 'index'])      // liste + filtres
    router.post('/', [ProjectsController, 'store'])     // créer
    router.get('/:id', [ProjectsController, 'show'])    // détail
    router.put('/:id', [ProjectsController, 'update'])  // mise à jour
    router.delete('/:id', [ProjectsController, 'destroy']) // supprimer
  })
  .prefix('/api/projects')
  .use(middleware.auth())

/***
 GESTION DE IMAGES
 */
router
  .group(() => {
    // Upload multiple images
    router.post('/:id/images', [ProjectImagesController, 'store'])

    // Lister les images d'un projet
    router.get('/:id/images', [ProjectImagesController, 'index'])

    // Supprimer une image
    router.delete('/images/:imageId', [ProjectImagesController, 'destroy'])
  })
  .prefix('/api/projects')
  .use(middleware.auth())

/***
 GESTION DE RESIDENCES
 */
router
  .group(() => {
    router.get('/', [ResidencesController, 'index'])      // liste + filtres
    router.post('/', [ResidencesController, 'store'])     // créer
    router.get('/:id', [ResidencesController, 'show'])    // détail
    router.put('/:id', [ResidencesController, 'update'])  // modifier
    router.delete('/:id', [ResidencesController, 'destroy']) // supprimer
  })
  .prefix('/api/residences')
  .use(middleware.auth())

/***
 GESTION DE RESIDENCES_FLOOR
 */
router
  .group(() => {
    router.get('/', [ResidenceFloorsController, 'index'])      // liste + filtres
    router.post('/', [ResidenceFloorsController, 'store'])     // créer un palier
    router.get('/:id', [ResidenceFloorsController, 'show'])    // détail
    router.put('/:id', [ResidenceFloorsController, 'update'])  // modifier
    router.delete('/:id', [ResidenceFloorsController, 'destroy']) // supprimer
  })
  .prefix('/api/floors')
  .use(middleware.auth())


/***
 GESTION DE PROPERTIES
 */
router
  .group(() => {
    router.get('/', [PropertiesController, 'index'])      // liste + filtres
    router.post('/', [PropertiesController, 'store'])     // création
    router.get('/:id', [PropertiesController, 'show'])    // détail
    router.put('/:id', [PropertiesController, 'update'])  // mise à jour
    router.delete('/:id', [PropertiesController, 'destroy']) // suppression
  })
  .prefix('/api/properties')
  .use(middleware.auth())

router.group(() => {
  router.get('/', [ClientsController, 'index'])      // liste + filtres
  router.post('/', [ClientsController, 'store'])     // création
  router.get('/:id', [ClientsController, 'show'])    // détail
  router.put('/:id', [ClientsController, 'update'])  // mise à jour
  router.delete('/:id', [ClientsController, 'destroy'])
}).prefix('api/clients').use(middleware.auth())

router.group(() => {
  router.get('/', [DomainsController, 'index'])
  router.post('/', [DomainsController, 'store'])
  router.get('/:id', [DomainsController, 'show'])
  router.put('/:id', [DomainsController, 'update'])
  router.delete('/:id', [DomainsController, 'destroy'])
}).prefix('api/domains')


