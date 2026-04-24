const express = require('express');
const {
    getIngredients,
    getLowStockIngredients,
    createIngredient,
    updateIngredient,
    deleteIngredient
} = require('../controllers/ingredientController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('admin', 'staff'));
router.get('/low-stock', getLowStockIngredients);
router.get('/', getIngredients);
router.post('/', createIngredient);
router.put('/:id', updateIngredient);
router.delete('/:id', authorize('admin'), deleteIngredient);

module.exports = router;
