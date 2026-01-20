# Admin Panel

A web-based admin panel for managing articles and categories, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Login with backend URL and admin key
- Manage categories (create, edit, disable)
- Manage articles (create, edit, publish, unpublish, delete)
- Multi-language support (uz_latin, uz_cyrillic, ru, en)
- Markdown content editing with live preview
- Filter articles by status and category
- Search articles by title or slug
- Missing language indicator for articles

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
cd admin-web
npm install
```

### Configuration

1. Copy the environment example file:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and set your backend URL:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. Navigate to the app (redirects to login page)
2. Enter your backend URL and admin key
3. Use the navbar to switch between Articles and Categories
4. Create, edit, and manage your content

## Pages

- `/admin/login` - Login page
- `/admin/articles` - Articles list with filters
- `/admin/articles/new` - Create new article
- `/admin/articles/[id]` - Edit article
- `/admin/categories` - Categories management

## API Endpoints Expected

The admin panel expects the following backend endpoints:

### Categories
- `GET /admin/categories` - List categories
- `POST /admin/categories` - Create category
- `PATCH /admin/categories/{id}` - Update category

### Articles
- `GET /admin/articles` - List articles (with optional filters: status, category_id, search)
- `GET /admin/articles/{id}` - Get single article
- `POST /admin/articles` - Create article
- `PATCH /admin/articles/{id}` - Update article
- `POST /admin/articles/{id}/publish` - Publish article
- `POST /admin/articles/{id}/unpublish` - Unpublish article
- `DELETE /admin/articles/{id}` - Delete article (soft delete)

All admin endpoints require the `X-ADMIN-KEY` header.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- react-hook-form
- react-markdown
