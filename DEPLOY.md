# Deploy len internet

Huong dan nhanh de dua web len internet theo cau hinh da them trong repo.

## 1. Day code len GitHub

Render va Vercel de ket noi nhat khi code nam tren GitHub.

## 2. Deploy backend + PostgreSQL tren Render

1. Vao Render, chon `New` -> `Blueprint`.
2. Ket noi repository nay.
3. Render se doc file `render.yaml` va tao:
   - Web service: `car-rental-api`
   - PostgreSQL: `car-rental-db`
4. Trong tab Environment cua service backend, them cac bien can thiet:

```text
FRONTEND_ORIGINS=https://ten-web-cua-ban.vercel.app
GEMINI_API_KEY=...
GROQ_API_KEY=...
OPENROUTER_API_KEY=...
OPENROUTER_SITE_URL=https://ten-web-cua-ban.vercel.app
```

Chi can them mot API key AI neu khong dung nhieu nha cung cap.

Sau khi deploy xong, backend se co URL dang:

```text
https://car-rental-api.onrender.com
```

## 3. Deploy frontend tren Vercel

1. Vao Vercel, chon `Add New` -> `Project`.
2. Import repository.
3. Chon Root Directory la `frontend`.
4. Them Environment Variable:

```text
VITE_API_BASE_URL=https://car-rental-api.onrender.com
```

Thay URL backend bang URL Render that cua ban.

5. Deploy.

Sau khi deploy xong, frontend se co URL dang:

```text
https://ten-web-cua-ban.vercel.app
```

## 4. Cap nhat CORS backend

Quay lai Render -> service backend -> Environment, dat:

```text
FRONTEND_ORIGINS=https://ten-web-cua-ban.vercel.app
```

Sau do redeploy backend.

## 5. Luu y

- Khong day file `.env` len GitHub.
- File `frontend/.env` chi dung de chay local.
- Khi doi URL backend, can cap nhat `VITE_API_BASE_URL` tren Vercel va deploy lai frontend.
