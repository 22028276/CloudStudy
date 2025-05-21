# CloudStudy - Study Material Management System

A web application for managing and sharing study materials, built with React.js and Node.js, utilizing AWS and OpenStack services.

## Features

- User authentication and authorization
- File upload and management
- Text processing with AWS services (Comprehend, Textract)
- Cloud storage with OpenStack
- Real-time collaboration
- Search and filtering capabilities

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- OpenStack (DevStack for local development)
- AWS Account (for text processing features)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cloudstudy
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
# MongoDB Configuration
MONGODB_URI=

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# OpenStack Configuration (DevStack)
OPENSTACK_AUTH_URL=http://localhost/identity/v3
OPENSTACK_USERNAME=admin
OPENSTACK_PASSWORD=admin
OPENSTACK_PROJECT_ID=admin
OPENSTACK_REGION=RegionOne
OPENSTACK_CONTAINER=cloudstudy-files

# AWS Configuration
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. DevStack Installation (OpenStack)

1. **System Requirements:**
   - Ubuntu 20.04 LTS or newer
   - 4GB RAM minimum
   - 2 CPU cores
   - 20GB free disk space

2. **Install DevStack:**
```bash
# Install git
sudo apt update
sudo apt upgrade -y
sudo apt install -y git python3-pip
sudo useradd -s /bin/bash -d /opt/stack -m stack
sudo chmod +x /opt/stack
echo "stack ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/stack
sudo -u stack -i
# Clone DevStack
git clone https://opendev.org/openstack/devstack
cd devstack

# Create local.conf
nano local.conf 

[[local|localrc]]
ADMIN_PASSWORD=secret
DATABASE_PASSWORD=\$ADMIN_PASSWORD
RABBIT_PASSWORD=\$ADMIN_PASSWORD
SERVICE_PASSWORD=\$ADMIN_PASSWORD
# Enable Swift services
enable_service s-proxy s-object s-container s-account
# Swift configuration
SWIFT_HASH=66a3d6b56c1f479c8b4e70ab5c2000f5
SWIFT_REPLICAS=1
SWIFT_TEMPURL_KEY=secretkey


# Run installation script
./stack.sh
```

3. **Verify DevStack Installation:**
```bash
# Source the OpenStack credentials
source devstack/openrc admin admin

# Check services
openstack service list

# Create container for file storage
openstack container create cloudstudy-files
```

4. **Verify Swift Endpoint:**
```bash
openstack endpoint list | grep swift
```

### 5. AWS Setup

1. Create an AWS account if you don't have one
2. Create an S3 bucket for file storage
3. Create an IAM user with S3 access
4. Configure AWS credentials in the backend `.env` file

## Running the Application

### Start the Backend

```bash
cd backend
npm run dev
```

### Start the Frontend

```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3001
- Backend: http://localhost:3000
- OpenStack Dashboard: http://localhost/dashboard

## Project Structure

```
cloudstudy/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── test-*.js       # Test connection files
│   │   └── index.js        # Entry point
│   ├── uploads/           # Temporary file storage
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── App.js        # Main component
│   └── package.json
└── README.md
```

## Dependencies

### Backend Dependencies
- Express.js - Web framework
- Mongoose - MongoDB ODM
- JWT - Authentication
- AWS SDK - AWS services integration
- OpenStack Client - OpenStack integration
- Multer - File upload handling
- CORS - Cross-origin resource sharing

### Frontend Dependencies
- React 18
- Material-UI - UI components
- React Router - Navigation
- Axios - HTTP client

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Document Endpoints

- `POST /api/documents` - Upload a new document
- `GET /api/documents` - Get all documents
- `GET /api/documents/:id` - Get document by ID
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
