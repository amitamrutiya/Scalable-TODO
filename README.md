# TaskForge - Production-Grade Todo Application

A full-stack Todo application built with React + TypeScript (frontend) and Node.js + Express + PostgreSQL (backend), designed as a learning project for production-grade development practices.

## 🏗️ Architecture Overview

```
├── backend/          # Node.js + Express + TypeScript + PostgreSQL
├── frontend/         # React 18 + TypeScript + Vite + Tailwind CSS
├── database/         # PostgreSQL migrations and init scripts
├── nginx/            # Nginx configuration (for production)
└── docker-compose.yml # Orchestrates all services
```

## 🚀 Quick Start (Docker)

### Prerequisites
- Docker and Docker Compose installed
- Ports 80 (frontend), 3000 (backend), 5432 (PostgreSQL) available

### Run Everything
```bash
# Clone and navigate to project
cd /Users/amit.amrutiya/Desktop/juspay/deployment

# Start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### Access Points
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **PostgreSQL**: localhost:5432 (todoapp / todoapp_secret_123)

### Stop Everything
```bash
docker-compose down

# To also remove volumes (WARNING: deletes database data)
docker-compose down -v
```

## 🛠️ Development Mode

### Option 1: Run Backend Locally
```bash
cd backend
npm install

# Set up environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Initialize database
npm run migrate

# Start development server
npm run dev
```
Backend will be available at http://localhost:3000

### Option 2: Run Frontend Locally (with Vite Dev Server)
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at http://localhost:5173 (proxies API to localhost:3000)

### Option 3: Hybrid Development (Recommended)
```bash
# Terminal 1: Start only PostgreSQL
docker-compose up postgres

# Terminal 2: Run backend locally
cd backend
npm install
npm run dev

# Terminal 3: Run frontend with hot reload
cd frontend
npm install
npm run dev
```

## 📋 Feature Complete List

### ✅ Authentication
- User signup with email validation
- User login with JWT token (15-minute expiry)
- Logout functionality
- Protected routes middleware
- Password hashing with bcrypt (cost 12)
- Rate limiting on auth endpoints

### ✅ Todo Management
- Create todos with title, description, priority, due date, tags
- Edit todos (partial updates supported)
- Delete todos (soft delete)
- Toggle completion status
- View single todo

### ✅ Organization & Discovery
- Full-text search across title and description
- Filter by: status (active/completed), priority, tag
- Sort by: created_at, due_date, priority, title (asc/desc)
- Pagination (20 items per page)
- Tag management (auto-create, normalize to lowercase)

### ✅ User Profile
- View profile with todo statistics
- Update display name
- Change password (requires current password)
- Account creation date

### ✅ Security
- JWT authentication with Bearer tokens
- Helmet security headers
- CORS configuration
- Rate limiting (API: 100 req/15min, Auth: 10 req/15min)
- Input validation with Zod on every endpoint
- Parameterized SQL queries (zero SQL injection risk)
- Soft delete for data recovery

## 🗄️ Database Schema

```sql
users
├── id (UUID, PK)
├── email (VARCHAR 255, UNIQUE)
├── password_hash (VARCHAR 255)
├── display_name (VARCHAR 50)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

todos
├── id (UUID, PK)
├── user_id (UUID, FK → users)
├── title (VARCHAR 500)
├── description (TEXT)
├── is_completed (BOOLEAN)
├── priority (ENUM: low/medium/high)
├── due_date (TIMESTAMPTZ)
├── created_at (TIMESTAMPTZ)
├── updated_at (TIMESTAMPTZ)
└── deleted_at (TIMESTAMPTZ, soft delete)

tags
├── id (UUID, PK)
├── user_id (UUID, FK → users)
├── name (VARCHAR 30, UNIQUE per user)
└── created_at (TIMESTAMPTZ)

todo_tags (Junction)
├── todo_id (UUID, FK)
├── tag_id (UUID, FK)
└── PK(todo_id, tag_id)
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Register new user |
| POST | `/api/v1/auth/login` | Login and get JWT |
| POST | `/api/v1/auth/logout` | Logout (clear token) |

### Todos
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/todos` | List todos (with filters/pagination) |
| POST | `/api/v1/todos` | Create new todo |
| GET | `/api/v1/todos/:id` | Get single todo |
| PATCH | `/api/v1/todos/:id` | Update todo |
| DELETE | `/api/v1/todos/:id` | Soft delete todo |
| PATCH | `/api/v1/todos/:id/toggle` | Toggle completion |

### User Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/me` | Get current user profile |
| PATCH | `/api/v1/users/me` | Update profile or password |

### Query Parameters (GET /todos)
- `status` - Filter by: `active`, `completed`
- `priority` - Filter by: `low`, `medium`, `high`
- `tag` - Filter by tag name
- `search` - Full-text search
- `sort` - Sort by: `created_at`, `due_date`, `priority`, `title`
- `order` - Sort order: `asc`, `desc`
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

## 🧪 Testing the API

```bash
# Signup
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","display_name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# Create Todo (replace TOKEN with actual JWT)
curl -X POST http://localhost:3000/api/v1/todos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"Buy groceries","description":"Milk, eggs, bread","priority":"medium","tags":["personal","errands"]}'

# List Todos
curl "http://localhost:3000/api/v1/todos?page=1&limit=10&sort=priority&order=desc" \
  -H "Authorization: Bearer TOKEN"
```

## 📁 Project Structure

### Backend (`/backend`)
```
src/
├── config/           # Database, environment config
├── controllers/      # Request handlers
├── middleware/       # Auth, validation, error handling, rate limiting
├── routes/           # API route definitions
├── services/         # Business logic
├── types/            # TypeScript type definitions
└── utils/            # Helpers (jwt, hash, logger, errors)
database/
└── init.sql          # Database schema
```

### Frontend (`/frontend`)
```
src/
├── components/
│   ├── ui/           # Reusable UI components (Button, Input, etc.)
│   ├── layout/       # Layout components (Navbar, ProtectedRoute)
│   └── todos/        # Todo-specific components (TodoList, TodoForm)
├── pages/            # Route pages (Landing, Login, Dashboard, Todos, Profile)
├── hooks/            # Custom React hooks (useAuth, useTodos, useProfile)
├── services/         # API service layer
├── contexts/         # React Context (AuthContext)
├── types/            # TypeScript interfaces
└── utils/            # Helper functions
```

## 🏭 Production Deployment

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-super-secret-256-bit-key-here
JWT_EXPIRES_IN=15m
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Docker Production Build
```bash
# Build and start all services
docker-compose -f docker-compose.yml up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Manual Production Deployment

**Backend:**
```bash
cd backend
npm ci --production
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm ci
npm run build
# Serve `dist/` folder with Nginx or any static file server
```

## 🔒 Security Checklist

- [x] Passwords hashed with bcrypt (cost 12)
- [x] JWT tokens with 15-minute expiry
- [x] Rate limiting on auth endpoints
- [x] Helmet.js security headers
- [x] CORS configured for known origins
- [x] Input validation on all endpoints
- [x] Parameterized SQL queries (no injection)
- [x] Soft deletes for data recovery
- [x] Graceful error handling (no stack traces leaked)
- [ ] HTTPS in production (configure SSL/TLS)
- [ ] Environment secrets management (AWS Secrets Manager, etc.)
- [ ] Content Security Policy headers
- [ ] API request logging and monitoring

## 🎯 Learning Objectives Achieved

This project teaches:
1. **Full-Stack Development** - End-to-end application architecture
2. **REST API Design** - Proper HTTP methods, status codes, error handling
3. **Database Design** - Relational modeling, indexes, relationships
4. **Authentication** - JWT implementation, password security
5. **Validation** - Input sanitization and validation pipelines
6. **Docker** - Containerization and orchestration
7. **TypeScript** - Type safety across frontend and backend
8. **React Patterns** - Hooks, Context, Component composition
9. **Security Best Practices** - Rate limiting, helmet, CORS
10. **Production Readiness** - Health checks, graceful shutdown, logging

## 🗺️ Roadmap

### Phase 1: MVP ✅
- [x] User authentication (JWT)
- [x] Todo CRUD operations
- [x] Search, filter, sort
- [x] Tags and priorities
- [x] User profile
- [x] Docker setup

### Phase 2: Enhanced Features (Future)
- [ ] Email verification
- [ ] Password reset
- [ ] Todo categories/projects
- [ ] Recurring todos
- [ ] Subtasks/checklists
- [ ] Due date reminders
- [ ] Data export (CSV/JSON)

### Phase 3: Advanced (Future)
- [ ] Real-time collaboration
- [ ] Team workspaces
- [ ] File attachments (S3)
- [ ] Notifications (email/push)
- [ ] Analytics dashboard
- [ ] AI-powered suggestions

### Phase 4: Infrastructure (Future)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] AWS deployment (ECS/EKS)
- [ ] Kubernetes manifests
- [ ] Monitoring (Prometheus/Grafana)
- [ ] Log aggregation (ELK stack)

## 📝 License

MIT License - Feel free to use this as a learning resource or starting point for your own projects.

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Connect to database manually
docker-compose exec postgres psql -U todoapp -d todoapp
```

### Port Conflicts
If ports are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "8080:80"      # Change frontend port
  - "3001:3000"    # Change backend port
  - "5433:5432"    # Change database port
```

### Reset Everything
```bash
# Stop and remove containers, networks, volumes
docker-compose down -v

# Rebuild from scratch
docker-compose up --build
```

## 📞 Support

This is a learning project. For issues or questions:
1. Check the logs: `docker-compose logs -f [service]`
2. Verify environment variables
3. Ensure database is initialized: `npm run migrate`
4. Check API health: `curl http://localhost:3000/health`
