import { Router } from 'express'
import { UserController } from '../controllers/UserController'
import { requireAuth, requireAdmin } from '../middlewares/auth'

const router = Router()
const controller = new UserController()

router.get('/', requireAuth, requireAdmin, (req, res, next) => controller.getAll(req, res, next))
router.get('/:id', requireAuth, requireAdmin, (req, res, next) => controller.getById(req, res, next))
router.post('/', requireAuth, requireAdmin, (req, res, next) => controller.create(req, res, next))
router.put('/:id', requireAuth, requireAdmin, (req, res, next) => controller.update(req, res, next))
router.delete('/:id', requireAuth, requireAdmin, (req, res, next) => controller.delete(req, res, next))

export default router
