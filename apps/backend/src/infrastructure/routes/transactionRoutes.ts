import { Router } from 'express'
import { TransactionController } from '../controllers/TransactionController'
import { requireAuth, requireAdmin } from '../middlewares/auth'

const router = Router()
const controller = new TransactionController()

router.get('/', requireAuth, requireAdmin, controller.getAll)
router.get('/:id', requireAuth, requireAdmin, controller.getById)
router.post('/', requireAuth, controller.create)
router.patch('/:id/status', requireAuth, requireAdmin, controller.updateStatus)

export default router
