import { Router } from 'express'
import { ProductController } from '../controllers/ProductController'
import { requireAuth, requireAdmin } from '../middlewares/auth'

const router = Router()
const controller = new ProductController()

router.get('/', (req, res, next) => controller.getAll(req, res, next))
router.get('/:slug', (req, res, next) => controller.getBySlug(req, res, next))
router.post('/', requireAuth, requireAdmin, (req, res, next) => controller.create(req, res, next))
router.put('/:id', requireAuth, requireAdmin, (req, res, next) => controller.update(req, res, next))
router.delete('/:id', requireAuth, requireAdmin, (req, res, next) => controller.delete(req, res, next))

export default router
