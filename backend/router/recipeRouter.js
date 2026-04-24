const express = require('express');
const {
    getRecipes,
    getRecipeByProduct,
    createRecipe,
    updateRecipe,
    deleteRecipe
} = require('../controllers/recipeController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('admin', 'staff'));
router.get('/', getRecipes);
router.get('/product/:productId', getRecipeByProduct);
router.post('/', createRecipe);
router.put('/:id', updateRecipe);
router.delete('/:id', authorize('admin'), deleteRecipe);

module.exports = router;
