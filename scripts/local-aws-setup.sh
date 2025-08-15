#!/bin/sh
# scripts/local-aws-setup.sh

echo "Setting AWS environment variables for LocalStack/DynamoDB Local"
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_SESSION_TOKEN=test
export AWS_DEFAULT_REGION=us-east-1
echo "AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION"

# Wait for LocalStack S3
echo 'Waiting for LocalStack S3...'
until (curl --silent http://localhost:4566/_localstack/health | grep "\"s3\": \"\(running\|available\)\"" > /dev/null); do
  sleep 5
done
echo 'LocalStack S3 Ready'

# Create S3 bucket
BUCKET_NAME="${AWS_S3_BUCKET_NAME:-harsimranjit-fragment}"
echo "Creating LocalStack S3 bucket: $BUCKET_NAME"
aws --endpoint-url=http://localhost:4566 s3api create-bucket --bucket "$BUCKET_NAME" || true

# Create DynamoDB table
TABLE_NAME="${AWS_DYNAMODB_TABLE_NAME:-fragments}"
echo "Creating DynamoDB-Local table: $TABLE_NAME"
aws --endpoint-url=http://localhost:8000 \
  dynamodb create-table \
  --table-name "$TABLE_NAME" \
  --attribute-definitions \
      AttributeName=ownerId,AttributeType=S \
      AttributeName=id,AttributeType=S \
  --key-schema \
      AttributeName=ownerId,KeyType=HASH \
      AttributeName=id,KeyType=RANGE \
  --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=5 \
  2>/dev/null || true

# Wait until the table exists
aws --endpoint-url=http://localhost:8000 dynamodb wait table-exists --table-name "$TABLE_NAME"
echo "DynamoDB-Local table '$TABLE_NAME' is ready"
