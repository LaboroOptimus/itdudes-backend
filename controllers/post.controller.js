const jwt = require('jsonwebtoken');
const knex = require('../knex');

class PostController {


    async getAllPosts(req, res) {
        try {
            // Валидация токена
            const token = req.headers.authorization?.split(" ")[1]; // Предполагается формат 'Bearer token'
            if (!token) {
                return res.status(401).json({ message: 'Токен не предоставлен', status: 'error' });
            }
    
            try {
                const decodedToken = jwt.verify(token, 'your_secret_key');
                // Здесь может быть дополнительная логика проверки наличия необходимых прав или ролей
            } catch (error) {
                return res.status(401).json({ message: 'Невалидный токен', status: 'error' });
            }
    
            const page = parseInt(req.query.page) || 1;
            const limit = 20;
            const offset = (page - 1) * limit;
    
            // Получение постов
            const posts = await knex('posts')
                .select('*')
                .offset(offset)
                .limit(limit);
    
            // Получение ID постов
            const postIds = posts.map(post => post.id);
    
            // Получение ролей для постов
            const roles = await knex('postroles')
                .join('roles', 'postroles.roleid', '=', 'roles.id')
                .whereIn('postroles.postid', postIds)
                .select('postroles.postid', 'roles.id as roleid', 'roles.title as roleTitle');
    
            // Получение целей для постов
            const goals = await knex('postgoals')
                .join('goals', 'postgoals.goalid', '=', 'goals.id')
                .whereIn('postgoals.postid', postIds)
                .select('postgoals.postid', 'goals.id as goalid', 'goals.title as goalTitle');
    
            // Получение данных для поля who_is_looking
            const whoIsLookingIds = [...new Set(posts.map(post => post.who_is_looking))];
            const whoIsLookingData = await knex('roles')
                .whereIn('id', whoIsLookingIds)
                .select('id', 'title');
    
            // Обогащение постов ролями, целями и данными для who_is_looking
            posts.forEach(post => {
                post.roles = roles.filter(role => role.postid === post.id).map(role => ({ id: role.roleid, title: role.roleTitle }));
                post.goals = goals.filter(goal => goal.postid === post.id).map(goal => ({ id: goal.goalid, title: goal.goalTitle }));
                post.who_is_looking = whoIsLookingData.filter(role => role.id === post.who_is_looking).map(role => ({ id: role.id, title: role.title }));
            });
    
            res.status(200).json({ status: 'success', data: posts });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Внутренняя ошибка сервера' });
        }
    }
    
    
    async createPost(req, res) {
        const { title, description, city, contacts, who_is_looking, roles, goals } = req.body; // Новое поле who_is_looking добавлено
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'your_secret_key'); // Проверка ключа токена
    
        if (!decoded) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    
        // Преобразуем roles и goals в массив, если они не являются массивом
        const rolesArray = Array.isArray(roles) ? roles : [roles];
        const goalsArray = Array.isArray(goals) ? goals : [goals];
    
        if (!who_is_looking || !rolesArray?.length || !goalsArray?.length) {
            return res.status(400).json({ message: 'Who is looking, roles and goals are required', status: 'error' });
        }
    
        const creator = decoded.userId; // Идентификатор пользователя из токена
    
        try {
            await knex.transaction(async trx => {
                // Создание поста с полем who_is_looking
                const [postid] = await trx('posts').insert({
                    title,
                    description,
                    city,
                    contacts,
                    creator,
                    who_is_looking // Роль человека, который ищет
                }, 'id'); // Возвращаем id созданного поста
    
                // Создание записей в таблице postroles (включаем роль "кто ищет")
                const postRoles = [
                    ...rolesArray.map(roleid => ({
                        postid: postid.id,
                        roleid // Роли того, кого ищут
                    }))
                ];

                console.log('post roles', postRoles, rolesArray)
    
                await trx('postroles').insert(postRoles);
    
                // Создание записей в таблице postgoals
                const postGoals = goalsArray.map(goalid => ({
                    postid: postid.id,
                    goalid
                }));
    
                await trx('postgoals').insert(postGoals);
    
            });
    
            res.status(201).json({ message: 'Post created successfully', status: 'success' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    
    async getPostById(req, res) {
        try {
            // Валидация токена
            const token = req.headers.authorization?.split(" ")[1]; // Предполагается формат 'Bearer token'
            if (!token) {
                return res.status(401).json({ message: 'Токен не предоставлен', status: 'error' });
            }
    
            try {
                const decodedToken = jwt.verify(token, 'your_secret_key');
                // Здесь может быть дополнительная логика проверки наличия необходимых прав или ролей
            } catch (error) {
                return res.status(401).json({ message: 'Невалидный токен', status: 'error' });
            }
    
            const { id } = req.params; // Получаем id поста из параметров запроса
    
            // Получение поста
            const post = await knex('posts')
                .select('*')
                .where({ id })
                .first();
    
            // Если пост не найден
            if (!post) {
                return res.status(404).json({ message: 'Пост не найден', status: 'error' });
            }
    
            // Получение ролей для поста
            const roles = await knex('postroles')
                .join('roles', 'postroles.roleid', '=', 'roles.id')
                .where('postroles.postid', id)
                .select('postroles.postid', 'roles.title as roleTitle', 'roles.id as roleid');
    
            // Получение целей для поста
            const goals = await knex('postgoals')
                .join('goals', 'postgoals.goalid', '=', 'goals.id')
                .where('postgoals.postid', id)
                .select('postgoals.postid', 'goals.title as goalTitle', 'goals.id as goalid');
    
            // Обогащение поста ролями и целями
            post.roles = roles.map(role => ({ id: role.roleid, title: role.roleTitle }));
            post.goals = goals.map(goal => ({ id: goal.goalid, title: goal.goalTitle }));
    
            res.status(200).json({ status: 'success', data: post });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Внутренняя ошибка сервера' });
        }
    }


    async getFilteredPosts(req, res) {
        try {
            const token = req.headers.authorization?.split(" ")[1];
            if (!token) {
                return res.status(401).json({ message: 'Токен не предоставлен', status: 'error' });
            }
    
            try {
                jwt.verify(token, 'your_secret_key');
            } catch (error) {
                return res.status(401).json({ message: 'Невалидный токен', status: 'error' });
            }
    
            const { roles = [] } = req.body; // Массив ролей
            const who_is_looking = parseInt(req.body.who_is_looking, 10); // Кто ищет
            const goals = req.body.goals.map((goal) => parseInt(goal.id, 10)); // Преобразуем goals в массив чисел
            const roleIds = roles.map((role) => parseInt(role.id, 10)); // Преобразуем roles в массив чисел
    
            const page = parseInt(req.query.page) || 1;
            const limit = 20;
            const offset = (page - 1) * limit;
    
            let query = knex('posts')
                .select('posts.*')
                .offset(offset)
                .limit(limit);
    
            if (who_is_looking) {
                query = query.where('posts.who_is_looking', who_is_looking);
            }
    
            if (goals.length > 0) {
                query = query
                    .join('postgoals', 'posts.id', '=', 'postgoals.postid')
                    .whereIn('postgoals.goalid', goals); // Используем массив чисел
            }
    
            if (roleIds.length > 0) {
                query = query
                    .join('postroles', 'posts.id', '=', 'postroles.postid')
                    .whereIn('postroles.roleid', roleIds); // Используем массив чисел
            }
    
            query = query.groupBy('posts.id', 'posts.title', 'posts.description', 'posts.city', 'posts.contacts', 'posts.creator', 'posts.createdat', 'posts.who_is_looking');
    
            const posts = await query;
    
            if (!posts || posts.length === 0) {
                return res.status(200).json({ data: [], status: 'success' });
            }
    
            const postIds = posts.map((post) => post.id);
    
            const postRoles = await knex('postroles')
                .join('roles', 'postroles.roleid', '=', 'roles.id')
                .whereIn('postroles.postid', postIds)
                .select('postroles.postid', 'roles.id as roleid', 'roles.title as roleTitle');
    
            const postGoals = await knex('postgoals')
                .join('goals', 'postgoals.goalid', '=', 'goals.id')
                .whereIn('postgoals.postid', postIds)
                .select('postgoals.postid', 'goals.id as goalid', 'goals.title as goalTitle');
    
            // Получение данных для поля who_is_looking
            const whoIsLookingIds = [...new Set(posts.map((post) => post.who_is_looking))];
            const whoIsLookingData = await knex('roles')
                .whereIn('id', whoIsLookingIds)
                .select('id', 'title');
    
            // Обогащение постов ролями, целями и данными для who_is_looking
            posts.forEach((post) => {
                post.roles = postRoles.filter((role) => role.postid === post.id).map((role) => ({ id: role.roleid, title: role.roleTitle }));
                post.goals = postGoals.filter((goal) => goal.postid === post.id).map((goal) => ({ id: goal.goalid, title: goal.goalTitle }));
                post.who_is_looking = whoIsLookingData
                    .filter((role) => role.id === post.who_is_looking)
                    .map((role) => ({ id: role.id, title: role.title })); // Преобразуем в массив объектов
            });
    
            res.status(200).json({ status: 'success', data: posts });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Внутренняя ошибка сервера' });
        }
    }
    

    async getRoles(req, res) {
        try {
            // Валидация токена
            const token = req.headers.authorization?.split(" ")[1]; // Предполагается формат 'Bearer token'
            if (!token) {
                return res.status(401).json({ message: 'Токен не предоставлен', status: 'error' });
            }
    
            try {
                const decodedToken = jwt.verify(token, 'your_secret_key');
                // Здесь может быть дополнительная логика проверки прав доступа
            } catch (error) {
                return res.status(401).json({ message: 'Невалидный токен', status: 'error' });
            }
    
            // Получение списка ролей
            const roles = await knex('roles')
                .select('id', 'title'); // Выбираем только id и title
    
            res.status(200).json({ status: 'success', data: roles });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Внутренняя ошибка сервера' });
        }
    }

    async getGoals(req, res) {
        try {
            // Валидация токена
            const token = req.headers.authorization?.split(" ")[1]; // Предполагается формат 'Bearer token'
            if (!token) {
                return res.status(401).json({ message: 'Токен не предоставлен', status: 'error' });
            }
    
            try {
                const decodedToken = jwt.verify(token, 'your_secret_key');
                // Здесь может быть дополнительная логика проверки прав доступа
            } catch (error) {
                return res.status(401).json({ message: 'Невалидный токен', status: 'error' });
            }
    
            // Получение списка целей
            const goals = await knex('goals')
                .select('id', 'title'); // Выбираем только id и title
    
            res.status(200).json({ status: 'success', data: goals });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Внутренняя ошибка сервера' });
        }
    }
    
    
    
}

module.exports = new PostController();