# AGENTS.md

## Always do this first
1. Read `docs/PRODUCT_SPEC.md`
2. Read `docs/ACCEPTANCE_CRITERIA.md`
3. Inspect the repository structure
4. Write a short implementation plan before editing files

## Project goal
Build a production-quality MVP for **타요**, a taxi ride-sharing web app for **가톨릭대학교 성심교정** students.

## Stack
- Next.js App Router
- TypeScript (strict)
- Tailwind CSS
- Supabase for auth + database
- Kakao Maps JavaScript SDK for map/place search

## Non-negotiable rules
- Only `@catholic.ac.kr` email accounts may sign in
- A user may belong to only one active taxi party at a time
- Max party capacity is 4
- Do not hardcode any secrets
- Kakao map key must come only from `NEXT_PUBLIC_KAKAO_MAP_APP_KEY`
- If Kakao SDK fails or the key is missing, the app must still work with manual place text input
- Admin accounts must not be creatable from the public signup UI
- Prefer simple, maintainable code over over-engineering

## Implementation rules
- Keep components small and reusable
- Use clear server/client boundaries
- Validate forms carefully
- Handle empty/loading/error states
- Add database schema or migrations
- Update README and env example
- Before finishing, run lint/build and fix failures

## UX priorities
- Mobile-first
- Fast party creation
- Fast party joining
- Clear time/place/capacity visibility
- Strong guidance when feedback is due

