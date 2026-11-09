# Local CMS

Local-only content editor for Crewbase Collective. **Not deployed to Vercel. Has no login — never expose it.**

This folder is only a shell: `src/App.tsx` routes `/admin/*` to the screens in **`client/src/pages/admin/`** (via the `@` alias in `vite.config.ts`). Edit admin UI there. The API is `server/src/cms-server.ts` + `server/src/cms-routes.ts` (see [docs/API.md](../docs/API.md)).

```bash
# from repo root
npm run dev:cms
```

- UI: http://localhost:5174/admin  
- API: http://localhost:4001 (writes `data/`, rebuilds `client/public/data`)

Run **both** public site + admin together from repo root:

```bash
npm run dev:all
```

- Public site: http://localhost:5173 (API :4000)
- Admin CMS: http://localhost:5174 (API :4001)
