# Counter POS (Next.js + Express + MongoDB + JWT)

## Run it
1. Start MongoDB locally (or set `MONGO_URI` to Atlas).
2. Backend:  `cd server && npm install && npm run seed && npm run dev`  (http://localhost:5000)
3. Frontend: `cd client && npm install && npm run dev`  (http://localhost:3000)
4. Tests (billing + status transitions): `cd server && npm test`

Seed logins: `admin@pos.local / Admin@123`, `staff@pos.local / Staff@123`.
Copy `.env.example` -> `.env` in server (and `.env.local.example` -> `.env.local` in client) and change `JWT_SECRET`.

## API (all JSON, all except login need `Authorization: Bearer <token>`)
| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | /api/auth/login | public | Returns JWT + user |
| POST | /api/auth/register | admin | Create staff/admin user |
| GET | /api/menu?search=&category= | any | Active items (admin: `includeInactive=true`) |
| POST / PUT / DELETE | /api/menu, /api/menu/:id | admin | Create, edit, deactivate (soft delete) |
| POST | /api/orders/preview | any | Server-calculated totals without saving |
| POST | /api/orders | any | Create order `{type, tableNumber?, items:[{menuItemId, quantity}], discount?}` |
| GET | /api/orders?status=&search=&date=&page= | any | List/search |
| GET | /api/orders/:id | any | Details |
| PUT | /api/orders/:id/items | any | Edit items/discount (Pending + Unpaid only), totals recalculated |
| PATCH | /api/orders/:id/status | any | Pending -> Preparing -> Ready -> Completed |
| POST | /api/orders/:id/payment | any | `{method: Cash|UPI|Card, reference?}` |
| GET | /api/reports/daily-sales?date= | any | Totals, sales by method, recent orders |

Errors always look like `{ "error": { "code": "...", "message": "...", "details"?: ... } }`.
Codes used: 400 validation/bad id, 401 not logged in/bad token, 403 forbidden, 404 not found, 409 conflict (bad transition, already paid), 422 unavailable item.

## Design decisions
- Client sends only `menuItemId` + `quantity`. Price, tax and totals come from the DB/server; order lines store a name/price snapshot.
- Money maths uses integer paise (`utils/billing.js`). Discount applies before tax; capped at subtotal.
- Tax rate: `TAX_RATE` env (default 5%). Never accepted from the client.
- Unavailable (`isAvailable=false`) or deactivated (`isActive=false`) items are rejected with 422.
- Staff discount limit: `STAFF_MAX_DISCOUNT_PERCENT` (default 10%); admins unlimited.
- Admin only: menu create/edit/deactivate, user creation, discounts above the staff limit.
- An order cannot be Completed until payment is recorded. Payment amount is always the server total.
- Order numbers: `ORD-YYYYMMDD-0001`, from an atomic per-day counter.
- Daily sales = payments recorded that day; order counts = orders created that day (server local time).
