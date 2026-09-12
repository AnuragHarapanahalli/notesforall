# NotesForAll ??

A simple and elegant platform to share academic notes, past year questions, and presentations.

**Tech Stack:** Spring Boot 3.2 (Maven) + Angular 17

---

## Project Structure

```
notesforall/
+-- backend/      ? Spring Boot Maven API
+-- frontend/     ? Angular 17 SPA
```

---

## ? Quick Start

### 1. Backend (Spring Boot)

**Prerequisites:** Java 17+, Maven 3.8+

```bash
cd backend
./mvnw spring-boot:run
```

- Runs on **http://localhost:8080**
- H2 database auto-created at `./data/notesforall.mv.db`
- Files stored in `./uploads/`
- Admin credentials: `admin` / `admin123`

> **Windows:** Use `mvnw.cmd spring-boot:run` or `mvn spring-boot:run`

---

### 2. Frontend (Angular)

**Prerequisites:** Node.js 18+, npm 9+

```bash
cd frontend
npm install
npm start
```

- Runs on **http://localhost:4200**
- Auto-connects to backend at `http://localhost:8080`

---

## ?? Admin Access

1. Go to `http://localhost:4200/admin/login`
2. Login: **admin** / **admin123**
3. Create subjects, upload files (PDF, MD, DOCX, PPTX, TXT)

---

## ?? Folder Types

| Folder | Purpose |
|--------|---------|
| **Notes** | Lecture notes, study material |
| **PYQs** | Past Year Question papers |
| **PPTs** | Presentations and slideshows |

Folders only appear when they contain at least one file.

---

## ?? File Viewing

| File Type | Viewer |
|-----------|--------|
| PDF | Browser iframe (toolbar hidden) |
| Markdown (.md) | Rendered HTML with `marked` |
| Word (.docx) | Converted HTML with `mammoth` |
| PowerPoint (.pptx) | Google Docs Viewer embed |
| Text (.txt) | Rendered plain text |

**Downloads are disabled** — files open inline only.

---

## ?? Deployment

### Option A: Single VPS / Nginx (Recommended)

**Step 1 — Build artifacts:**
```bash
cd backend && mvn clean package -DskipTests
cd ../frontend && npm run build
```

**Step 2 — Run backend:**
```bash
java -jar backend/target/notesforall-backend-0.0.1-SNAPSHOT.jar
```

**Step 3 — Nginx config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/notesforall;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        client_max_body_size 60M;
    }
}
```
Copy frontend: `cp -r frontend/dist/frontend/browser/* /var/www/notesforall/`

### Option B: Docker Compose

Add `Dockerfile` to `backend/`:
```dockerfile
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY target/notesforall-backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Add `Dockerfile` to `frontend/`:
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
```

`docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports: ["8080:8080"]
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
  frontend:
    build: ./frontend
    ports: ["80:80"]
    depends_on: [backend]
```

Run: `docker-compose up --build`

### Option C: Free Hosting

| Component | Platform | Notes |
|-----------|----------|-------|
| Backend | Railway or Render | Free tier; deploy JAR |
| Frontend | Vercel or Netlify | Free; static deploy |
| Database | Supabase (PostgreSQL) | Free tier, update app.properties |

---

## ?? Production Configuration

```properties
# Change these in production!
app.admin.username=admin
app.admin.password=yourSecurePassword
app.jwt.secret=very-long-random-secret-key-here

# Switch to PostgreSQL for production
spring.datasource.url=jdbc:postgresql://localhost:5432/notesforall
spring.datasource.username=postgres
spring.datasource.password=yourdbpassword
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

---

Made with ?? by Anurag
