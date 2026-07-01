import { Router } from 'express'
import { UserController } from '../controllers/UserController'
import { requireAuth } from '../middlewares/auth'

const router = Router()
const controller = new UserController()

router.get('/', requireAuth, (req, res, next) => controller.getAll(req, res, next))
router.get('/:id', requireAuth, (req, res, next) => controller.getById(req, res, next))
router.put('/:id', requireAuth, (req, res, next) => controller.update(req, res, next))
router.delete('/:id', requireAuth, (req, res, next) => controller.delete(req, res, next))

export default router
