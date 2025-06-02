const { S3Client } = require('@aws-sdk/client-s3');
const { TextractClient } = require('@aws-sdk/client-textract');
const { ComprehendClient } = require('@aws-sdk/client-comprehend');
const { TranslateClient } = require('@aws-sdk/client-translate'); // Thêm dòng này
const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');

// Validate required environment variables
const requiredEnvVars = {
  AWS_REGION: process.env.AWS_REGION || 'ap-southeast-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'cloudstudy-files'
};

// Check for missing environment variables
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

// Configure AWS S3 Client
const s3Client = new S3Client({
  region: requiredEnvVars.AWS_REGION,
  credentials: {
    accessKeyId: requiredEnvVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: requiredEnvVars.AWS_SECRET_ACCESS_KEY
  }
});

// Configure Cognito Client (if using Cognito)
const cognitoClient = new CognitoIdentityProviderClient({
  region: requiredEnvVars.AWS_REGION,
  credentials: {
    accessKeyId: requiredEnvVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: requiredEnvVars.AWS_SECRET_ACCESS_KEY,
  },
});

// Tạo các client AWS
const textractClient = new TextractClient({
  region: requiredEnvVars.AWS_REGION,
  credentials: {
    accessKeyId: requiredEnvVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: requiredEnvVars.AWS_SECRET_ACCESS_KEY
  }
});

const comprehendClient = new ComprehendClient({
  region: requiredEnvVars.AWS_REGION,
  credentials: {
    accessKeyId: requiredEnvVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: requiredEnvVars.AWS_SECRET_ACCESS_KEY
  }
});

const translateClient = new TranslateClient({ // Thêm client này
  region: requiredEnvVars.AWS_REGION,
  credentials: {
    accessKeyId: requiredEnvVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: requiredEnvVars.AWS_SECRET_ACCESS_KEY
  }
});

// Export configuration
module.exports = {
  s3Client,
  cognitoClient,
  textractClient,
  comprehendClient,
  translateClient, // Export thêm client này
  userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
  clientId: process.env.AWS_COGNITO_CLIENT_ID,
  s3Bucket: requiredEnvVars.AWS_S3_BUCKET // Thêm s3Bucket để dễ dàng truy cập
};