const db = require('../knex');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const knex = require('../knex');

async function sendVerificationEmail(email, url) {
    const transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: 'ba8166d73ff296',
            pass: '1ba990fdec7181'
        }
    });
    const mailOptions = {
        from: 'noreply@your-domain.com',
        to: email,
        subject: 'Подтверждение регистрации',
        text: `Пожалуйста, перейдите по ссылке для подтверждения вашего аккаунта: ${url}`
    };
    await transporter.sendMail(mailOptions);
}

class UserController {
    async register(req, res) {
        try {
        const { email, password, name } = req.body;
        const errors = validationResult(req);


        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
                message: 'Некорректные данные регистрации',
                status: 'error',
            });
        }

        // Проверка на существование пользователя
        const existingUser = await knex('users').where({ email }).first();
        if (existingUser) {
            return res.status(400).json({ message: 'Пользователь уже существует', status: 'error' });
        }

        // Хэширование пароля
        const hashedPassword = await bcrypt.hash(password, 12);
        const verificationCode = crypto.randomBytes(20).toString('hex'); // Генерация уникального кода

        // Вставка нового пользователя
        await knex('users').insert({
            email: email,
            password: hashedPassword,
            username: name,
            verificationcode: verificationCode,
            isverified: false
        });

        const verificationUrl = `http://${process.env.DB_HOST}/verify?code=${verificationCode}`; // Укажите свой домен и правильный роут

        // Функция отправки email (реализуйте по своему усмотрению)
        await sendVerificationEmail(email, verificationUrl);

    
        // Ответ об успешной регистрации
        res.status(201).json({ message: 'Пользователь успешно зарегистрирован', status: 'success' });
        }
        catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Произошла ошибка' });
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const errors = validationResult(req);

            
    
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: 'Некорректные данные авторизации',
                    status: 'error',
                });
            }
    
            // Проверка на существование пользователя
            const user = await knex('users').where({ email }).first();
    
            if (!user) {
                return res.status(400).json({ message: 'Пользователь не существует', status: 'error' });
            }

            if (!user.isverified) {
                return res.status(400).json({ message: 'Аккаунт не подтвержден. Пожалуйста, проверьте вашу электронную почту.', status: 'error' });
            }
    
            // Проверка пароля
            const isValidPassword = await bcrypt.compare(password, user.password);
            console.log(isValidPassword, password, user.password, 'isValid')
            if (!isValidPassword) {
                return res.status(401).json({ message: 'Некорректные данные авторизации', status: 'error' });
            }
    
            // Генерация токена
            const token = jwt.sign({ userId: user.id }, 'your_secret_key', { expiresIn: '1h' });
    
            // Отправка ответа
            res.status(200).json({ message: 'Успешно', token: token, status: 'success' });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async verify(req, res){
        try {
            const { code } = req.query;
            const user = await knex('users').where({ verificationcode: code }).first();
    
            if (!user) {
                return res.status(400).json({ message: 'Неверный код подтверждения', status: 'error' });
            }
    
            await knex('users').where({ id: user.id }).update({ isverified: true, verificationcode: null });
            res.status(200).json({ message: 'Аккаунт успешно подтвержден', status: 'success' });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}


module.exports = new UserController();