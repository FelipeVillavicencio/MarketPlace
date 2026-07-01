import { Router } from 'express'
import { ProductController } from '../controllers/ProductController'
import { requireAuth, requireAdmin } from '../middlewares/auth'

const router = Router()
const controller = new ProductController()

router.get('/', controller.getAll)
router.get('/:slug', controller.getBySlug)
router.post('/', requireAuth, requireAdmin, controller.create)
router.put('/:id', requireAuth, requireAdmin, controller.update)
router.delete('/:id', requireAuth, requireAdmin, controller.delete)

export default router
