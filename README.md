# Cloud Study - Document Analysis Platform

A web application for document analysis, translation, and summarization using AWS services.

## Features

- **Document Management**
  - Upload and store documents
  - Preview various file types (PDF, images, text, etc.)
  - Download documents
  - Delete documents

- **Document Analysis**
  - Text extraction from PDF and images using AWS Textract
  - Language detection
  - Document translation between multiple languages
  - Document summarization with adjustable length

- **Supported Languages**
  - Vietnamese (Tiếng Việt)
  - English
  - Japanese (日本語)
  - Korean (한국어)
  - Chinese (中文)
  - French (Français)
  - German (Deutsch)
  - Spanish (Español)
  - Russian (Русский)

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- AWS Services:
  - S3 (Storage)
  - Textract (OCR)
  - Translate (Translation)
  - Comprehend (Language Analysis)

### Frontend
- React.js
- Material-UI
- Axios

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- AWS Account with required services enabled
- AWS IAM User with appropriate permissions

## AWS IAM Policy Requirements

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

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=your_bucket_name
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/cloudstudy.git
cd cloudstudy
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Create .env files in both backend and frontend directories with the required environment variables.

5. Start the development servers:

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm start
```

## Usage

1. Register a new account or login with existing credentials
2. Upload a document (PDF, image, or text file)
3. Choose the desired operation:
   - Preview: View the document content
   - Translate: Translate to another language
   - Summarize: Generate a summary with adjustable length

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login

### Documents
- POST /api/documents/upload - Upload document
- GET /api/documents - Get user's documents
- GET /api/documents/:id - Get document details
- DELETE /api/documents/:id - Delete document
- GET /api/documents/:id/preview - Preview document
- GET /api/documents/:id/download - Download document

### Analysis
- POST /api/analysis - Analyze document (translate/summarize)


## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

