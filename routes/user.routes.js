const Router = require('express')
const router = new Router()
const { body, withMessage } = require('express-validator');

const userController = require('../controllers/user.controller')

const registerChecks = [
    body('email').isEmail().withMessage('Incorrect email'),
    body('password').isLength({ min: 5 }).withMessage('Incorrect password'),
    body('name').isLength({ min: 2 }).withMessage('Incorrect name'),
]

const loginChecks = [
    body('email').isEmail().withMessage('Incorrect email'),
    body('password').isLength({ min: 5 }).withMessage('Incorrect password'),
]

router.post(
    '/register',
    [...registerChecks],
    userController.register
);

router.post(
    '/login',
    [...loginChecks],
    userController.login
);

router.get(
    '/verify',
    userController.verify
)

module.exports = router;