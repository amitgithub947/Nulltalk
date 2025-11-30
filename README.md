# NullTalk


A confession platform built with Node.js, Prisma, and PostgreSQL.

## Features

- Anonymous confessions
- Category-based organization
- PostgreSQL database with Prisma ORM
- Admin authentication

## Tech Stack

- **Backend**: Node.js
- **Database**: PostgreSQL 
- **ORM**: Prisma
- **Environment**: dotenv

## Prerequisites

- Node.js 
- npm or yarn
- PostgreSQL database 

## Installation

1. Clone the repository:
```bash
git clone:https://github.com/amitgithub947/Nulltalk
cd nulltalk
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
DATABASE_URL='your_postgresql_connection_string'
ADMIN_KEY='your_admin_key'
```

4. Generate Prisma Client:
```bash
npx prisma generate
```

5. Run database migrations:
```bash
npx prisma migrate deploy
```

## Development

Start the development server:
```bash
npm run dev
```

## Database Management

### Run migrations
```bash
npx prisma migrate dev
```

### Reset database
```bash
npx prisma migrate reset
```

### Open Prisma Studio
```bash
npx prisma studio
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (from Neon) |
| `ADMIN_KEY` | Admin authentication key |

## Deployment

### Vercel
```bash
vercel
```

 
```

### Render
- Connect your GitHub repository
- Set build command: `npm install && npx prisma generate && npx prisma migrate deploy`
- Set start command: `npm start`
- Add environment variables in dashboard

## Project Structure

```
nulltalk/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env (not committed)
├── .gitignore
├── package.json
└── README.md
```

## Security

- Never commit `.env` file
- Keep `ADMIN_KEY` secret
- Use environment variables for sensitive data
- Enable SSL for database connections

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first.
Create by Amit Kumar
