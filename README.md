Room Booking App
================

Full-stack room booking application.

- Backend: Spring Boot (Java 17), PostgreSQL
- Frontend: React (in `web-client`)
- Container/Deploy: Docker, Render

Quick Start
-----------

Prerequisites
- Java 17+
- Node.js 18+
- Docker

Run frontend locally
```
cd web-client
npm install
npm start
```

API Contract
------------

Base URL: `/api/v1`

`openapi.yaml` into Swagger Editor: [editor.swagger.io](https://editor.swagger.io/).

Bookings (`/bookings`)
- `GET /bookings` → List all bookings
- `GET /bookings/{id}` → Get booking by id
- `POST /bookings` → Create booking
  - Body: `Booking` JSON (includes `customerPhoneNumber`, `roomId`, dates, costs...)
- `PUT /bookings/{id}` → Update booking fields (partial allowed)
- `DELETE /bookings/{id}` → Delete booking
- `GET /bookings/customer/{phoneNumber}` → List bookings for a customer
- `GET /bookings/room/{roomId}` → List bookings for a room
- `GET /bookings/status/{status}` → List by status (`PENDING|CONFIRMED|CANCELLED|COMPLETED`)

Rooms (`/rooms`)
- `POST /rooms` → Create room
- `GET /rooms` → List all rooms
- `GET /rooms/{id}` → Get room by id
- `PUT /rooms/{id}` → Update room
- `DELETE /rooms/{id}` → Delete room
- `GET /rooms/check-availability?checkInDate=YYYY-MM-DD&checkOutDate=YYYY-MM-DD` → Available rooms between dates
- `GET /rooms/available?checkInDate=YYYY-MM-DD&checkOutDate=YYYY-MM-DD` → Same as above

Customer (`/customer`)
- `GET /customer` → List customers
- `GET /customer/{phoneNumber}` → Get customer by phone number
- `GET /customer/bookings` → Get bookings for authenticated customer
  - Header: `Authorization: Bearer customer_token_{phoneNumber}`
- `GET /customer/profile` → Get authenticated customer profile
  - Header: `Authorization: Bearer customer_token_{phoneNumber}`
- `PUT /customer/profile` → Update authenticated customer profile
  - Header: `Authorization: Bearer customer_token_{phoneNumber}`
  - Body: `{ name?, additionalPhoneNumber?, remarks? }`
- `POST /customer/{phoneNumber}/upload-photo-id` → Upload single ID proof (multipart `file`)
- `POST /customer/{phoneNumber}/upload-id-proofs` → Upload multiple ID proofs (multipart `files[]`)
- `DELETE /customer/{phoneNumber}/id-proofs/{index}` → Delete ID proof by index
- `PUT /customer/{phoneNumber}` → Update a customer record
- `DELETE /customer/{phoneNumber}` → Delete a customer

Auth (`/auth`)
- `POST /auth/login` → Staff login (body: `{ userId, password }`)
- `POST /auth/logout` → Staff logout (header: `Authorization`)

Customer Auth (`/auth/customer`)
- `POST /auth/customer/register` → Register a customer
- `POST /auth/customer/login` → Customer login
- `POST /auth/customer/logout` → Customer logout
- `GET /auth/customer/profile` → Get profile (header: `Authorization: Bearer customer_token_{phoneNumber}`)

Booking Requests (`/booking-requests`)
- `POST /booking-requests` → Create a booking request
- `GET /booking-requests` → List booking requests
- `GET /booking-requests/{id}` → Get booking request by id
- `PUT /booking-requests/{id}` → Update booking request
- `DELETE /booking-requests/{id}` → Delete booking request
- `GET /booking-requests/customer/{phoneNumber}` → Requests by customer
- `GET /booking-requests/status/{status}` → Requests by status
- `PUT /booking-requests/{id}/approve` → Approve request
- `PUT /booking-requests/{id}/reject` → Reject request

Invoices (`/invoices`)
- `POST /invoices` → Create invoice
- `GET /invoices` → List invoices
- `GET /invoices/{id}` → Get invoice
- `PUT /invoices/{id}` → Update invoice
- `DELETE /invoices/{id}` → Delete invoice
- `GET /invoices/booking/{bookingId}` → Invoices for booking
- `GET /invoices/{id}/download` → Download by id (URL)
- `GET /invoices/{bookingId}/preview` → Preview by booking id (HTML)
- `GET /invoices/{bookingId}/download` → Download PDF by booking

Payments (`/payments`)
- `POST /payments` → Create payment
- `GET /payments` → List payments
- `GET /payments/{id}` → Get payment
- `PUT /payments/{id}` → Update payment
- `DELETE /payments/{id}` → Delete payment
- `GET /payments/booking/{bookingId}` → Payments for booking

Dashboard (`/dashboard`)
- `GET /dashboard/today-summary?date=YYYY-MM-DD` → Summary and stats
- `GET /dashboard/recent-bookings?limit=10` → Recent bookings
- `GET /dashboard/room-occupancy` → Occupancy breakdown

Root
- `GET /` → OK
- `GET /healthcheck` → OK