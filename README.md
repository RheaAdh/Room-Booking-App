# Professional Pride Room Booking System

A comprehensive full-stack room booking application with advanced features for property management, customer management, and booking operations.

## 🚀 Features

### Core Functionality
- **Room Management**: Complete CRUD operations for rooms with configurations
- **Customer Management**: Customer profiles with ID proof verification
- **Booking System**: Advanced booking management with availability checking
- **Payment Processing**: Payment tracking with screenshot uploads
- **Invoice Generation**: Automated invoice creation and PDF generation
- **Dashboard Analytics**: Comprehensive statistics and reporting

### Advanced Features
- **Room Availability Validation**: Prevents double bookings with real-time conflict detection
- **Excel-Style Booking Grid**: Visual calendar view with horizontal scrolling
- **Customer Booking History**: Expandable dropdown showing complete booking history
- **ID Proof Management**: Multiple ID proof uploads with thumbnail previews
- **Dynamic Pricing**: Room configurations with person-based pricing
- **Responsive Design**: Mobile-optimized interfaces for all user types
- **Real-time Notifications**: Custom popup modals for user feedback

### User Interfaces
- **Staff Dashboard**: Complete booking management with Excel-style grid
- **Customer Portal**: Airbnb-style interface with room browsing
- **Mobile Interface**: Touch-optimized mobile booking screens
- **Caretaker Interface**: Simplified interface for property caretakers

## 🛠 Technology Stack

- **Backend**: Spring Boot (Java 17), PostgreSQL, JPA/Hibernate
- **Frontend**: React.js, CSS3, Responsive Design
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary (Image and PDF uploads)
- **Deployment**: Docker, Railway/Render
- **API Documentation**: OpenAPI 3.0 (Swagger)

## 📋 Prerequisites

- Java 17+
- Node.js 18+
- Maven 3.6+
- PostgreSQL 12+
- Cloudinary account (for file uploads)

## 🚀 Quick Start

### Backend Setup
```bash
cd server
mvn clean install
# Run ProfprideApplication.java
```

### Frontend Setup
```bash
cd web-client
npm install
npm start
```

### Environment Configuration
Create `application-prod.properties` with:
```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/roombooking
spring.datasource.username=your_username
spring.datasource.password=your_password

# Cloudinary
cloudinary.cloud_name=your_cloud_name
cloudinary.api_key=your_api_key
cloudinary.api_secret=your_api_secret

# JWT
jwt.secret=your_jwt_secret
jwt.expiration=86400000
```

## 📚 API Documentation

### Base URL
- Production: `https://your-service.onrender.com/api/v1`
- Local: `http://localhost:8082/api/v1`

### Authentication
- **Staff**: `Authorization: Bearer staff_token`
- **Customer**: `Authorization: Bearer customer_token_{phoneNumber}`

### Key Endpoints

#### Bookings (`/bookings`)
- `GET /bookings` → List all bookings
- `POST /bookings` → Create booking (with availability validation)
- `PUT /bookings/{id}` → Update booking (with conflict checking)
- `DELETE /bookings/{id}` → Delete booking
- `GET /bookings/customer/{phoneNumber}` → Customer booking history
- `PATCH /bookings/{id}/checkin` → Check-in customer
- `PATCH /bookings/{id}/checkout` → Check-out customer

**Room Availability Validation**: All booking creation/updates automatically check for conflicts and return `409 Conflict` if room is already booked.

#### Rooms (`/rooms`)
- `GET /rooms` → List all rooms
- `POST /rooms` → Create room
- `GET /rooms/check-availability` → Check availability for dates
- `GET /rooms/{id}/configurations` → Get room configurations

#### Customers (`/customer`)
- `GET /customer` → List customers with booking history
- `POST /customer` → Create customer
- `PUT /customer/{phoneNumber}` → Update customer
- `POST /customer/{phoneNumber}/upload-id-proofs` → Upload ID proofs
- `GET /customer/{phoneNumber}/bookings` → Get customer bookings

#### Payments (`/payments`)
- `POST /payments` → Create payment
- `POST /payments/upload-screenshot` → Upload payment screenshot
- `GET /payments/booking/{bookingId}` → Get booking payments

#### Invoices (`/invoices`)
- `GET /invoices/{bookingId}/preview` → Preview invoice (HTML)
- `GET /invoices/{bookingId}/download` → Download invoice (PDF)

## 🎨 User Interface Features

### Staff Dashboard
- **Excel-Style Booking Grid**: Visual calendar with horizontal scrolling
- **Customer Management**: Table with ID proof thumbnails and booking history
- **Room Management**: Complete room and configuration management
- **Payment Tracking**: Payment management with screenshot uploads
- **Statistics Dashboard**: Comprehensive analytics and reporting

### Customer Portal
- **Airbnb-Style Interface**: Modern, responsive design
- **Room Browsing**: Filter by dates, guests, and availability
- **Dynamic Pricing**: Real-time pricing calculation
- **Booking Requests**: Submit and track booking requests
- **Profile Management**: Update profile and view booking history

### Mobile Interface
- **Touch-Optimized**: Mobile-first design
- **Responsive Grid**: Adapts to all screen sizes
- **Gesture Support**: Swipe and touch interactions
- **Offline Capability**: Basic functionality without internet

## 🔧 Advanced Features

### Room Availability System
- **Real-time Validation**: Prevents double bookings
- **Conflict Detection**: Checks date overlaps
- **Status-based Filtering**: Only considers CONFIRMED bookings
- **User-friendly Errors**: Custom popup modals for conflicts

### Customer ID Proof Management
- **Multiple Uploads**: Support for multiple ID proofs per customer
- **Thumbnail Previews**: Visual previews in customer table
- **Cloudinary Integration**: Secure cloud storage
- **Status Tracking**: Visual indicators for ID proof submission

### Excel-Style Booking Grid
- **Horizontal Scrolling**: Full month view with scroll
- **Fixed Cell Sizes**: Consistent layout across devices
- **Status Color Coding**: Visual status indicators
- **Click-to-View**: Detailed booking information on click

### Dynamic Pricing System
- **Room Configurations**: Person-based pricing
- **Daily/Monthly Rates**: Flexible pricing models
- **Real-time Calculation**: Live pricing updates
- **Cost Breakdown**: Detailed cost analysis

## 📱 Responsive Design

### Breakpoints
- **Desktop**: 1200px+ (Full Excel grid)
- **Tablet**: 768px-1199px (Compressed grid)
- **Mobile**: <768px (Stacked layout)

### Mobile Features
- **Touch Navigation**: Swipe gestures
- **Optimized Forms**: Mobile-friendly inputs
- **Compressed Views**: Space-efficient layouts
- **Quick Actions**: One-tap operations

## 🔒 Security Features

### Authentication
- **JWT Tokens**: Secure token-based authentication
- **Role-based Access**: Staff vs Customer permissions
- **Token Expiration**: Automatic session management

### Data Protection
- **Input Validation**: Server-side validation
- **SQL Injection Prevention**: JPA/Hibernate protection
- **File Upload Security**: Type and size validation
- **CORS Configuration**: Cross-origin request handling

## 📊 Analytics & Reporting

### Dashboard Metrics
- **Today's Summary**: Check-ins, check-outs, revenue
- **Room Occupancy**: Occupancy rates and trends
- **Payment Analytics**: Payment status and amounts
- **Customer Statistics**: Registration and activity metrics

### Export Features
- **Invoice PDFs**: Professional invoice generation
- **Booking Reports**: Detailed booking analytics
- **Customer Reports**: Customer activity summaries

## 🚀 Deployment

### Docker Support
```bash
# Build and run with Docker
docker-compose up --build
```

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `CLOUDINARY_URL`: Cloudinary configuration
- `JWT_SECRET`: JWT signing secret
- `PORT`: Server port (default: 8082)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the OpenAPI specification

## 🔄 Recent Updates

### v2.0.0 - Major Feature Release
- ✅ Room availability validation system
- ✅ Excel-style booking grid with horizontal scrolling
- ✅ Customer booking history dropdown
- ✅ ID proof management with thumbnails
- ✅ Dynamic pricing system
- ✅ Custom conflict popup modals
- ✅ Mobile-optimized interfaces
- ✅ Comprehensive invoice generation
- ✅ Real-time booking conflict detection

### v1.5.0 - UI/UX Improvements
- ✅ Airbnb-style customer portal
- ✅ Responsive design implementation
- ✅ Payment screenshot uploads
- ✅ Enhanced booking management
- ✅ Statistics dashboard

### v1.0.0 - Initial Release
- ✅ Basic booking system
- ✅ Customer management
- ✅ Payment tracking
- ✅ Room management
- ✅ Authentication system