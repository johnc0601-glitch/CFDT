# East Village at Hawksbill Cove — CFDT test package

Standalone Next.js project page based on Pender County case **SUBMAJ 2025-141**.

## Admin access

Public pages are open, but the workspace and write-capable APIs are password protected.

Set these environment variables before deploying:

```bash
CFDT_ADMIN_USER=admin
CFDT_ADMIN_PASSWORD=use-a-long-private-password
```

If `CFDT_ADMIN_PASSWORD` is missing in production, admin access is disabled.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Source

Official Pender County application package:
https://www.pendercountync.gov/DocumentCenter/View/4858/SUBMAJ-2025-141-East-Village-Hawksbill-Cove

## Notes

- The hero graphic is intentionally conceptual and is labeled as not being a survey.
- The project avoids inventing meeting dates or approval outcomes not shown in the source package.
- Update `sourceUrl` in `app/page.tsx` if the County changes the document URL.
