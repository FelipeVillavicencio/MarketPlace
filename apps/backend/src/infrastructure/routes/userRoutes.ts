import { Router } from 'express'
import { UserController } from '../controllers/UserController'
import { requireAuth, requireAdmin } from '../middlewares/auth'

const router = Router()
const controller = new UserController()

router.get('/', requireAuth, requireAdmin, controller.getAll)
router.get('/:id', requireAuth, requireAdmin, controller.getById)
router.post('/', requireAuth, requireAdmin, controller.create)
router.put('/:id', requireAuth, requireAdmin, controller.update)
router.delete('/:id', requireAuth, requireAdmin, controller.delete)

export default router
