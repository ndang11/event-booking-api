# Event Booking API

 A production-ready RESTful API for booking events online with JWT authentication.

# Problem Statement

Many small organizations in Cameroon manage event registrations manually, leading to double bookings, lost attendee records, and inefficient communication. This API digitizes the event booking process with a secure, scalable solution for managing events and attendee bookings.

# Project Goals

- Provide secure user authentication using JWT
- Enable event creation and management
- Allow users to book events and view their bookings
- Implement proper error handling and validation
- Support database seeding for development

# Tech Stack

**Backend:**
- Node.js
- Express

**Database:**
- PostgreSQL

**Authentication:**
- JWT (JSON Web Tokens)

**Other Tools:**
- Git & GitHub
- Jest & Supertest (Testing)


# API Endpoints

# Auth Routes (`/auth`)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

# Events Routes
- `GET /events` - Get all events (with optional date filtering)
- `GET /events/:id` - Get single event
- `POST /events` - Create a new event (authenticated)
- `PUT /events/:id` - Update an event (authenticated)

# Bookings Routes
- `POST /events/:id/book` - Book seats for an event
- `GET /bookings` - Get user's bookings
- `DELETE /bookings/:id` - Cancel a booking

---

# Installation & Setup

Clone the repository:

```bash
git clone git@github.com:ndang11/event-booking-api.git
cd event-booking-api
```

Install dependencies:

```bash
npm install
```

Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your database credentials
```

Initialize the database:

```bash
npm run db:init
npm run db:seed
```

Run the project:

```bash
npm run dev
```

---

# Testing

Run tests:

```bash
npm test
```

# Challenges Faced

Handling authentication tokens securely

---

# What I Learned

Managing authentication with JWT
Writing secure database queries with PostgreSQL
Debugging network errors

---

# Author

NDANG-KAH A

LinkedIn: https://www.linkedin.com/in/ndang-kah-ambei-250892379/
Email: ndangkahambei@email.com
Based in Cameroon | Open to remote opportunities