const Router = require('express')
const router = new Router()

const postController = require('../controllers/post.controller')

// Получение всех постов
router.get(
    '/posts',
    postController.getAllPosts
);

// Создание нового поста
router.post(
    '/create-post',
    postController.createPost
);

// Получение поста по ID
router.get(
    '/posts/:id',
    postController.getPostById
);

router.post(
    '/posts/filtered',
    postController.getFilteredPosts
)

// Получение всех доступных ролей
router.get(
    '/roles',
    postController.getRoles
)

// Получение всех доступных целей
router.get(
    '/goals',
    postController.getGoals
)

module.exports = router;
 