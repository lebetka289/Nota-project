# Сервер Nota Studio

## Установка и настройка

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка MySQL

Убедитесь, что MySQL установлен и запущен на вашем компьютере.

### 3. Настройка подключения к БД

Создайте файл `.env` в папке `server` (можно скопировать из `.env.example`):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=ваш_пароль
DB_NAME=nota_studio
JWT_SECRET=your-secret-key-change-in-production
```

Или измените настройки в `config/database.js` напрямую.

### 4. Создание базы данных

База данных создастся автоматически при первом запуске сервера, если у пользователя MySQL есть права на создание БД.

Если нужно создать вручную:
```sql
CREATE DATABASE nota_studio;
```

### 5. Запуск сервера

```bash
npm start
```

Сервер запустится на `http://localhost:5000`

## Структура базы данных

- **users** - пользователи системы
- **products** - товары магазина
- **cart** - корзина пользователей
- **favorites** - избранные товары
- **items** - старая таблица (для совместимости)

## API эндпоинты

См. документацию в коде `index.js`

## Скрипты для управления пользователями

Все скрипты находятся в папке `scripts/`. Для работы с Docker используйте команды через `docker-compose exec server`.

### 1. Назначение пользователя администратором

**Через Docker (рекомендуется):**
```bash
docker-compose exec server node scripts/make-admin.js <email>
```

**Пример:**
```bash
docker-compose exec server node scripts/make-admin.js maksman2100@mail.ru
```

**Локально (если сервер запущен не в Docker):**
```bash
cd server
node scripts/make-admin.js <email>
```

### 2. Изменение роли пользователя

**Через Docker:**
```bash
docker-compose exec server node scripts/set-role.js <email> <role>
```

**Доступные роли:** `user`, `admin`, `support`, `beatmaker`

**Примеры:**
```bash
# Назначить роль beatmaker
docker-compose exec server node scripts/set-role.js user@mail.ru beatmaker

# Назначить роль support
docker-compose exec server node scripts/set-role.js user@mail.ru support
```

**Локально:**
```bash
cd server
node scripts/set-role.js <email> <role>
```

### 3. Удаление пользователя

**Через Docker:**
```bash
docker-compose exec server node scripts/delete-user.js <email>
```

**Пример:**
```bash
docker-compose exec server node scripts/delete-user.js maksman2100@mail.ru
```

**Локально:**
```bash
cd server
node scripts/delete-user.js <email>
```

## Все доступные скрипты

| Скрипт | Описание | Использование |
|--------|----------|---------------|
| `make-admin.js` | Назначает пользователя администратором | `node scripts/make-admin.js <email>` |
| `set-role.js` | Изменяет роль пользователя | `node scripts/set-role.js <email> <role>` |
| `delete-user.js` | Удаляет пользователя из базы данных | `node scripts/delete-user.js <email>` |
