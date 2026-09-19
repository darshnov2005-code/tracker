# India Investment Tracker

Personal Indian investment tracker for stocks, mutual funds/SIPs, realised P&L, and financial goals.

## GitHub + Vercel setup

1. Extract this ZIP.
2. Upload **everything inside this folder** to the root of your GitHub repository. Do not upload the ZIP itself.
3. Make sure the repository root contains `app/`, `lib/`, `supabase/`, and `package.json`.
4. Keep `.env.example` in GitHub if you want; it contains blank placeholders only. Never commit `.env.local`.
5. In Vercel, import the GitHub repository.
6. Add these Environment Variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
7. In Supabase SQL Editor, run `supabase/schema.sql`.
8. Redeploy.

## Important


For production market data, use an authorised/licensed market-data provider rather than relying on scraping exchange web pages.
