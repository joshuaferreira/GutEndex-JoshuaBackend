# Books API

Express + Sequelize API that exposes a Gutendex-like books endpoint with filtering, pagination, and eager-loaded associations.

## Quick start

Prereqs:
- Node.js LTS
- MySQL (or compatible) reachable from your machine

Setup:
1) Clone this repo and open it in VS Code.
2) Create/edit `.env`:
```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=yourpassword
DB_NAME=gutendex
DB_DIALECT=mysql
```
3) Install deps:
```
npm install
```
4) Start:
```
npm run start
# or during development (auto-reload, if nodemon is installed)
npm run dev
```
5) Health check:
- http://localhost:3000/health → {"status":"ok"}

Base URL:
- http://localhost:3000/api

## Endpoint

GET /api/books

Returns a paginated list of books with authors, languages, subjects, bookshelves, and formats.

Pagination:
- page: number (default 1)
- page size: 25
- Response includes: count, next, previous, results[]

## Filters (all can accept multiple values; OR semantics across values)

- gutenberg_id: Project Gutenberg ID numbers
  - Single or multiple (comma-separated or repeated params)
  - Example: `?gutenberg_id=84,85` or `?gutenberg_id=84&gutenberg_id=85`
- language: language codes (case-insensitive)
  - IN semantics; ex: `?language=en,fr`
- mime_type: MIME categories and partials (case-insensitive)
  - Category tokens (audio, text, application, image, video, etc.) match like `token/%` (e.g., `audio/%`)
  - Other tokens do partial match (e.g., `pdf` → `%pdf%`, `epub` → `%epub%`)
  - Examples: `?mime_type=audio`, `?mime_type=pdf,epub`, `?mime_type=application,pdf`
- topic: matches either Subjects or Bookshelves names (case-insensitive partial)
  - Multiple topics supported; OR across topics and across subjects/bookshelves
  - Example: `?topic=child,infant` matches “Children’s literature”, “Child education”, etc.
  - Some Unexpected Behaviour
- author: case-insensitive partial
  - Multiple comma-separated phrases; inside each phrase, all words must match (AND)
  - Example: `?author=william shakespeare,mark twain`
- title: case-insensitive partial
  - Multiple comma-separated phrases; inside each phrase, all words must match (AND)
  - Example: `?title=great gatsby,pride prejudice`

Notes:
- Within author/title, a phrase like “great gatsby” is treated as words that must all appear in any order (AND); multiple phrases are OR’d.
- Languages and IDs use an IN list and do not split into word tokens.

## Response shape

```
{
  "count": number,
  "next": number|null,
  "previous": number|null,
  "results": [
    {
      "id": number|null,
      "title": string|null,
      "authors": [{ "name": string|null, "birth_year": number|null, "death_year": number|null }],
      "genre": [string],                 // subjects + bookshelves names
      "languages": [string],             // language codes
      "subjects": [string],
      "bookshelves": [string],
      "download_count": number,
      "formats": [{ "mime_type": string|null, "url": string|null }]
    }
  ]
}
```

## Test URLs

Basics:
- /api/books
- /api/books?page=2

Gutenberg IDs:
- /api/books?gutenberg_id=84
- /api/books?gutenberg_id=84,85,1342
- /api/books?gutenberg_id=84&gutenberg_id=85&gutenberg_id=1342

Language:
- /api/books?language=en
- /api/books?language=EN,Fr
- /api/books?language=%20en%20,%20fr%20

MIME type:
- /api/books?mime_type=text
- /api/books?mime_type=audio
- /api/books?mime_type=pdf,epub
- /api/books?mime_type=application,pdf

Topic:
- /api/books?topic=child
- /api/books?topic=Horror,Romance
- /api/books?topic=children%E2%80%99s%20literature

Author:
- /api/books?author=austen
- /api/books?author=william%20shakespeare
- /api/books?author=william%20shakespeare,mark%20twain

Title:
- /api/books?title=great%20gatsby
- /api/books?title=great%20gatsby,pride%20prejudice

Combinations:
- /api/books?language=en,fr&topic=child,infant
- /api/books?topic=horror,romance&mime_type=audio,pdf
- /api/books?author=william%20shakespeare&title=romeo%20juliet
- /api/books?gutenberg_id=84,85&language=en&mime_type=pdf
- /api/books?title=great%20gatsby,pride%20prejudice&author=austen,dickens&topic=classic,romance&language=en,fr&mime_type=audio,pdf&page=2

Tip: URL-encode spaces as `%20`.
