import { Router } from 'express'
import { TransactionController } from '../controllers/TransactionController'
import { requireAuth, requireAdmin } from '../middlewares/auth'

const router = Router()
const controller = new TransactionController()

router.get('/', requireAuth, requireAdmin, (req, res, next) => controller.getAll(req, res, next))
router.get('/:id', requireAuth, requireAdmin, (req, res, next) => controller.getById(req, res, next))
router.post('/', requireAuth, (req, res, next) => controller.create(req, res, next))
router.patch('/:id/status', requireAuth, requireAdmin, (req, res, next) => controller.updateStatus(req, res, next))

export default router
