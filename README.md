# Naseej — نسيج

A Tunisian civic platform built as a **microservices monorepo**:

| Service | What it does | Port (host) |
| --- | --- | --- |
| `auth-service` | Accounts, roles, JWT, location consent | 3001 |
| `emergency-service` | Private ambulances + first-aid volunteers, PostGIS distance search | 3002 |
| `transport-service` | Student buses ("special"), live GPS over WebSocket | 3003 |
| `api-gateway` | Single entry point: routing, JWT check, rate limit, metrics | 8080 |
| `web-frontend` | Desktop-first React app (AR / FR / EN, RTL, dark mode) | 5173 (dev) |

> **Safety notice** — this platform is **not** the official emergency service.
> In a life-threatening emergency, call **SAMU 190 / Civil Protection 198** first.
> The notice is returned by the API and displayed in every emergency screen.

---

## 1. Architecture

```
Browser
  │  HTTPS (REST)                WebSocket
  ▼                                ▼
┌───────────────────┐      ┌──────────────────────┐
│    api-gateway    │      │  transport-service   │
│  JWT · rate limit │      │  Socket.IO · Redis   │
└─────────┬─────────┘      └──────────┬───────────┘
          │                           │
   ┌──────┼────────────┐              │
   ▼      ▼            ▼              ▼
 auth   emergency   transport     (same service)
   │        │            │
   ▼        ▼            ▼
Postgres  PostGIS     Postgres + Redis
(auth_db) (emergency)  (transport)
```

**Rules that keep it a real microservice system**

- **One database per service.** No service ever reads another service's tables.
  Cross-service data is copied into the request (e.g. the citizen's name and
  phone travel with a help request) so there is no hidden coupling.
- **Stateless services.** Identity lives in the JWT, live bus positions live in
  Redis. Any replica can answer any request, which is what makes the horizontal
  scaling in Kubernetes meaningful.
- **Shared nothing but a secret.** Services share `JWT_SECRET` and nothing else.

### Why these technologies (short version for your defence)

**Backend: Node.js + NestJS + TypeScript**
NestJS is a *convention* framework: every service has the same
`module → controller → service → entity` shape, so a reviewer can open any of
the three and immediately know where things are. It ships first-class support
for WebSockets and is light enough to start in ~200 ms, which matters when the
HPA spins up new pods. TypeScript catches contract mistakes at build time rather
than in production.

*Rejected:* Spring Boot (excellent, but a JVM per pod is heavy on Minikube),
Django (great for CRUD, weaker for the real-time socket path).

**Frontend: React + Vite + TypeScript, Tailwind, React-Leaflet, Framer Motion**
React has the best RTL story (logical CSS properties + `dir` on `<html>` covers
mirroring without per-component branching). Tailwind keeps the design tokens in
one config file. Leaflet + OpenStreetMap needs **no API key and no billing
account** — important for a student project that must run anywhere. Framer
Motion gives the panel and marker transitions without hand-written CSS
keyframes.

**Database: PostgreSQL + PostGIS**
`ST_DWithin` answers "which providers are within 10 km, nearest first" using a
spatial index and real metres on the Earth's surface. Doing that in application
code would mean fetching every provider — fine for a demo, wrong for a city.

**Redis**
Bus positions are written every few seconds and read by every student on the
route. That is a cache-shaped problem, not a relational one.

**Message broker: RabbitMQ (planned)**
Not needed for the MVP: the only async flow today is the bus status broadcast,
which travels over the WebSocket. RabbitMQ is the right next step for a
`notification-service` (push/SMS) because it survives a consumer restart, which
Redis Streams does not do as gracefully. The code is already shaped for it: the
gateway emits events from one place, so adding a publisher is a local change.

---

## 2. The app

This is a **mobile-first application**, not a website. On a phone it runs
full-screen; on a desktop it renders inside a 430 px device shell so the design
is always reviewed at its real size. It is installable to a home screen
(`manifest.webmanifest`, `display: standalone`).

```
open app
   │
   ▼
[ Welcome ]  ── brand, what the app does, language switch
   │
   ├── "Get started"      → [ Register ]  role picker: citizen · student ·
   │                                       ambulance · volunteer · driver
   └── "I already have an account" → [ Login ]
                     │
                     ▼
              [ Home ]  ── two doors + SOS
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
[ Transport ]                [ Emergency ]
 campus → route →             map of Tunis, nearest
 live bus on map              providers, radius, request
                                        │
                                        ▼
                              [ Request status ] → call / cancel
```

| Route | Who | What |
| --- | --- | --- |
| `/welcome` | everyone | First screen: brand, value, language, one way in |
| `/register` | everyone | 5-role sign-up, `+216` phone |
| `/login` | everyone | Sign in with email **or** Tunisian phone |
| `/` | signed in | Home: SOS card + Transport / Ambulance |
| `/sos` | everyone | 190 and 198 as giant one-tap buttons |
| `/emergency` | everyone | Full-screen map + bottom sheet: radius, providers, send request |
| `/emergency/request/:id` | signed in | Live request status, call, cancel |
| `/bus` | everyone | University → route → live bus, stations, status |
| `/profile` | signed in | Language, theme, location consent, sign out |
| `/provider` | provider / volunteer | Provider profile, availability, accept/decline |
| `/admin` | admin | Universities, routes, buses, users |

**Navigation** is a bottom tab bar (Home · Emergency · Buses · Profile); detail
screens are pushed with a back arrow, which is the standard mobile pattern.

**Position, honestly.** Phone GPS is good, desktop GPS is not. Every map
therefore offers three ways to set your position: browser geolocation, tapping
the map, and dragging the pin.

**Privacy.** Coordinates are only stored when the user opted in. Turning consent
off deletes the stored point in the same request.

### Screenshots (معاينة الواجهات)

| الترحيب (Welcome) | تسجيل الدخول (Login) | التسجيل (Register) |
| :---: | :---: | :---: |
| <img src="screenshots/01-welcome.png" width="250" /> | <img src="screenshots/02-login.png" width="250" /> | <img src="screenshots/03-register.png" width="250" /> |

| الرئيسية (Home) | الرئيسية - الوضع الليلي (Home Dark) | الطوارئ (Emergency) |
| :---: | :---: | :---: |
| <img src="screenshots/04-home.png" width="250" /> | <img src="screenshots/08-home-dark.png" width="250" /> | <img src="screenshots/05-emergency.png" width="250" /> |

| الطوارئ - الوضع الليلي (Emergency Dark) | تتبع الحافلات (Bus Tracking) | الملف الشخصي (Profile) |
| :---: | :---: | :---: |
| <img src="screenshots/05b-emergency-dark.png" width="250" /> | <img src="screenshots/06-bus.png" width="250" /> | <img src="screenshots/07-profile.png" width="250" /> |

### Why the map is Esri and not Google Maps

Google Maps Platform needs a **billing-enabled API key**. A key committed to a
student repository is a leak, and a key that is not enabled shows a grey screen
with "For development purposes only". So the app uses key-free raster tiles:

| Layer | Source | Key needed |
| --- | --- | --- |
| Light | Esri World Street Map | no |
| Dark | Esri Dark Gray Canvas | no |
| Fallback | OpenStreetMap standard | no |

The fallback switches on automatically if the primary tiles fail, so the map
never degrades to a blank rectangle. Both Esri endpoints were checked to return
real Tunis tiles with Arabic and French labels before being wired in.

---

## 3. Run it

### Option A — GitHub Codespaces (موصى به عند استخدام المحاكاة / EVE-NG)
> 💡 **سحابياً بدون الحاجة لتثبيت أي برامج محلياً:**
1. افتح صفحة المستودع: [https://github.com/sahar2102/naseej-app](https://github.com/sahar2102/naseej-app)
2. اضغط **Code** ثم تبويب **Codespaces** واضغط **Create codespace on main**.
3. في الطرفية (Terminal):
   ```bash
   cp .env.example .env
   docker compose up --build
   ```
4. لتشغيل الواجهة الأمامية:
   ```bash
   cd frontend && npm install && npm run dev
   ```

### Option B — Docker (محلياً)

```bash
cp .env.example .env        # then edit JWT_SECRET
docker compose up --build
```

Then start the frontend in dev mode:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

| URL | What |
| --- | --- |
| http://localhost:5173 | Web app |
| http://localhost:8080/health | Gateway health |
| http://localhost:3001/health | Auth health |
| http://localhost:3002/ready | Emergency readiness (also checks PostGIS) |
| http://localhost:3003/metrics | Transport Prometheus metrics |

Add `--profile monitoring` to also start Prometheus (:9090) and Grafana (:3000,
`admin` / `admin`).

### Option C — No Docker (fastest when Docker is unavailable)

Requires Node 20 and three reachable PostgreSQL databases. Tell each service
where its database is, then run them one per terminal:

```bash
# terminal 1
cd backend/auth-service && npm install && DATABASE_URL=... JWT_SECRET=dev npm run start:dev

# terminal 2
cd backend/emergency-service && npm install && DATABASE_URL=... JWT_SECRET=dev npm run start:dev

# terminal 3
cd backend/transport-service && npm install && DATABASE_URL=... REDIS_URL=... JWT_SECRET=dev npm run start:dev

# terminal 4
cd backend/api-gateway && npm install && npm start

# terminal 5
cd frontend && npm install && npm run dev
```

---

## 4. Demo accounts

Created automatically on first boot of `auth-service`:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@naseej.tn` | `Admin@2026` |
| Citizen | `citizen@naseej.tn` | `Citizen@2026` |
| Driver | `driver@naseej.tn` | `Driver@2026` |
| Volunteer | `volunteer@naseej.tn` | `Volunteer@2026` |

Demo providers (ambulances around Tunis) are seeded by `emergency-service`, and
four Tunisian universities with routes and a bus are seeded by
`transport-service`, so the map is never empty.

The login screen has a one-click demo button for the admin account.

---

## 5. Test it

```bash
# Backend unit tests
cd backend/auth-service && npm test

# Frontend build = type + bundle check
cd frontend && npm run build
```

Manual smoke test:

```bash
# 1. Register with a Tunisian number
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Sami Ben Ali","email":"sami@example.tn","phone":"12345678","password":"password123","role":"citizen"}'

# 2. Nearest providers around Tunis
curl "http://localhost:8080/api/v1/emergency/providers/nearby?lat=36.8065&lng=10.1815&radius=10"

# 3. Universities
curl http://localhost:8080/api/v1/transport/universities
```

---

## 6. Tunisia-specific decisions

- **Phone numbers** are normalised to E.164 (`+216XXXXXXXX`). A user can type
  `12 345 678` and it still works.
- **Languages**: Arabic is the default and the layout is RTL; French and English
  are one click away. Validation messages are translation keys, resolved in the
  browser, so the API stays language-neutral.
- **Weak connections**: small JSON payloads, gzip in nginx, a 20 s axios timeout,
  one retry through the refresh token, and a REST snapshot for the bus map so a
  dropped WebSocket does not blank the screen.
- **Location privacy**: consent flag, single "last known" point per user
  (no history table), and opt-out deletes it.

---

## 7. Known limits (deliberate)

- Help requests update by polling every 3 s. A broker + push is the next step.
- WebSocket tracking is read-only for students; it is not authenticated yet.
- `DB_SYNC=true` is for development only — production needs migrations.
- No payment, no SMS gateway, no native app: those are the "not now" list.

---

## 8. Repository layout

```
backend/
  auth-service/          NestJS · JWT · bcrypt
  emergency-service/     NestJS · PostGIS
  transport-service/     NestJS · Socket.IO · Redis
  api-gateway/           Express edge proxy
frontend/                React · Vite · Tailwind · Leaflet
infrastructure/
  postgres/              PostGIS init script
  prometheus/            scrape config
  grafana/               datasource provisioning
docker-compose.yml
```
## TEST111
