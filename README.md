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
OPENSTACK_PASSWORD=secret
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
openstack endpoint list
```

5. **AWS Setup**

#### A. Create IAM User & Access Key

1. Go to the [AWS IAM Console](https://console.aws.amazon.com/iam/).
2. Navigate to **Users** and click **Add user**.
3. Enter a username (e.g., `cloudstudy-user`), and select:
   - ✅ **Programmatic access** (to generate an Access Key ID and Secret Access Key).
4. Click **Next: Permissions**.
5. Attach existing policies
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "textract:AnalyzeDocument",
                "textract:DetectDocumentText",
                "translate:TranslateText",
                "comprehend:DetectDominantLanguage",
                "comprehend:DetectSentiment",
                "comprehend:DetectEntities",
                "comprehend:DetectKeyPhrases"
            ],
            "Resource": "*"
        }
    ]
}
```
6. Proceed and create the user.
7. Download or copy the **Access Key ID** and **Secret Access Key** shown.

#### B. Create an S3 Bucket

1. Open the [AWS S3 Console](https://s3.console.aws.amazon.com/s3/).
2. Click **Create bucket**.
3. Enter a globally unique bucket name (e.g., `cloudstudy-files`).
4. Choose the AWS Region that matches your backend configuration (e.g., `ap-southeast-1`).
5. (Optional) Adjust public access settings if you want files to be publicly accessible (generally keep it private for security).
6. Click **Create bucket**.

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
