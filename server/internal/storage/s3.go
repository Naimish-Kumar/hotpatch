package storage

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/hotpatch/server/internal/config"
)

// S3Storage handles bundle file storage in S3 or Cloudflare R2.
type S3Storage struct {
	client *s3.Client
	bucket string
}

// NewS3Storage creates a new S3/R2 storage client.
func NewS3Storage(cfg *config.Config) (*S3Storage, error) {
	// Build custom resolver for R2 endpoints
	customResolver := aws.EndpointResolverWithOptionsFunc(
		func(service, region string, options ...interface{}) (aws.Endpoint, error) {
			if cfg.S3Endpoint != "" {
				return aws.Endpoint{
					URL:               cfg.S3Endpoint,
					HostnameImmutable: true,
				}, nil
			}
			return aws.Endpoint{}, &aws.EndpointNotFoundError{}
		},
	)

	awsCfg, err := awsconfig.LoadDefaultConfig(context.TODO(),
		awsconfig.WithRegion(cfg.S3Region),
		awsconfig.WithEndpointResolverWithOptions(customResolver),
		awsconfig.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(cfg.AWSAccessKey, cfg.AWSSecretKey, ""),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.UsePathStyle = true // Required for R2
	})

	return &S3Storage{
		client: client,
		bucket: cfg.S3Bucket,
	}, nil
}

// Upload uploads a bundle file to S3/R2 and returns the object key.
func (s *S3Storage) Upload(ctx context.Context, key string, body io.Reader, contentType string) (string, error) {
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(key),
		Body:        body,
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload to S3: %w", err)
	}

	return key, nil
}

// GetPresignedURL generates a presigned download URL for a bundle (valid for 1 hour).
func (s *S3Storage) GetPresignedURL(ctx context.Context, key string) (string, error) {
	presignClient := s3.NewPresignClient(s.client)

	req, err := presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	}, func(o *s3.PresignOptions) {
		o.Expires = 1 * time.Hour
	})
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return req.URL, nil
}

// Delete removes a bundle from S3/R2.
func (s *S3Storage) Delete(ctx context.Context, key string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("failed to delete from S3: %w", err)
	}
	return nil
}
