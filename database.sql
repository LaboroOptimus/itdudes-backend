-- Создание таблицы Roles
CREATE TABLE Roles (
    id SERIAL PRIMARY KEY,         -- Уникальный идентификатор роли
    title VARCHAR(255) NOT NULL    -- Название роли
);

-- Создание таблицы Goals
CREATE TABLE Goals (
    id SERIAL PRIMARY KEY,         -- Уникальный идентификатор цели
    title VARCHAR(255) NOT NULL    -- Название цели
);


-- Создание таблицы Posts
CREATE TABLE Posts (
    id SERIAL PRIMARY KEY,         -- Уникальный идентификатор поста
    title VARCHAR(255) NOT NULL,   -- Заголовок поста
    description TEXT,              -- Описание поста
    city VARCHAR(255),             -- Город
    contacts TEXT,                 -- Контакты
    creator UUID NOT NULL,         -- Создатель поста (ссылка на id пользователя)
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Дата создания поста
    who_is_looking INTEGER NOT NULL, -- Кто ищет (ссылка на роль из Roles)
    FOREIGN KEY (creator) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (who_is_looking) REFERENCES Roles(id) ON DELETE CASCADE
);

-- Создание связующей таблицы для Posts и Roles (многие ко многим)
CREATE TABLE PostRoles (
    postId INTEGER NOT NULL,       -- Ссылка на пост
    roleId INTEGER NOT NULL,       -- Ссылка на роль
    PRIMARY KEY (postId, roleId),  -- Композитный первичный ключ
    FOREIGN KEY (postId) REFERENCES Posts(id) ON DELETE CASCADE,
    FOREIGN KEY (roleId) REFERENCES Roles(id) ON DELETE CASCADE
);

-- Создание связующей таблицы для Posts и Goals (многие ко многим)
CREATE TABLE PostGoals (
    postId INTEGER NOT NULL,       -- Ссылка на пост
    goalId INTEGER NOT NULL,       -- Ссылка на цель
    PRIMARY KEY (postId, goalId),  -- Композитный первичный ключ
    FOREIGN KEY (postId) REFERENCES Posts(id) ON DELETE CASCADE,
    FOREIGN KEY (goalId) REFERENCES Goals(id) ON DELETE CASCADE
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- Уникальный идентификатор пользователя (UUID)
    email VARCHAR(255) UNIQUE NOT NULL,   -- Email пользователя (уникальный и обязательный)
    username VARCHAR(100) UNIQUE NOT NULL,-- Никнейм пользователя (уникальный и обязательный)
    password VARCHAR(255) NOT NULL,       -- Пароль пользователя (обязательный)
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP -- Дата регистрации (по умолчанию текущая дата и время)
    isverified BOOLEAN DEFAULT false,
    verificationcode VARCHAR(255)
);


INSERT INTO Roles (id, title) VALUES (1, 'Разработчик');
INSERT INTO Roles (id, title) VALUES (2, 'Менеджер');
INSERT INTO Roles (id, title) VALUES (3, 'Аналитик');
INSERT INTO Roles (id, title) VALUES (4, 'Дизайнер');
INSERT INTO Roles (id, title) VALUES (5, 'Предприниматель');
INSERT INTO Roles (id, title) VALUES (6, 'Инвестор');
INSERT INTO Roles (id, title) VALUES (7, 'Маркетолог');


INSERT INTO Goals (title) VALUES ('мероприятие');
INSERT INTO Goals (title) VALUES ('сходить в бар');
INSERT INTO Goals (title) VALUES ('погулять')
INSERT INTO Goals (title) VALUES ('сыграть в онлайн игру');
INSERT INTO Goals (title) VALUES ('общение');
INSERT INTO Goals (title) VALUES ('зареферить');
INSERT INTO Goals (title) VALUES ('поиск работы');
INSERT INTO Goals (title) VALUES ('поиск сотрудника');
INSERT INTO Goals (title) VALUES ('хакатон');
INSERT INTO Goals (title) VALUES ('проект');
INSERT INTO Goals (title) VALUES ('инвестиции');
INSERT INTO Goals (title) VALUES ('менторство');
INSERT INTO Goals (title) VALUES ('курс');
INSERT INTO Goals (title) VALUES ('другое');
