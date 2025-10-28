# Storytelling Primer - Cloud Run Deployment

This Terraform configuration deploys both the Storytelling Primer Flask API and React frontend to Google Cloud Run.

## Prerequisites

Before you begin, ensure you have:

1. **Google Cloud SDK (gcloud)** installed and configured
   ```bash
   # Install: https://cloud.google.com/sdk/docs/install
   gcloud --version
   ```

2. **Terraform** installed (version >= 1.0)
   ```bash
   # Install: https://developer.hashicorp.com/terraform/downloads
   terraform --version
   ```

3. **Docker** installed and running
   ```bash
   docker --version
   ```

4. **A GCP Project** with billing enabled

5. **Anthropic API Key** for Claude AI functionality

## Initial Setup

### 1. Authenticate with Google Cloud

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable application default credentials for Terraform
gcloud auth application-default login
```

### 2. Configure Terraform Variables

Copy the example variables file and update it with your values:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
project_id        = "your-gcp-project-id"
region            = "us-central1"
anthropic_api_key = "your-anthropic-api-key"
```

**Important:** Never commit `terraform.tfvars` to version control as it contains sensitive data.

### 3. Enable Required APIs

The Terraform script will automatically enable the required APIs, but you can also do it manually:

```bash
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

## Deployment

### Initialize Terraform

```bash
cd terraform
terraform init
```

### Plan the Deployment

Review what Terraform will create:

```bash
terraform plan
```

### Deploy to Cloud Run

Apply the Terraform configuration:

```bash
terraform apply
```

Type `yes` when prompted to confirm the deployment.

This will:
1. Create an Artifact Registry repository
2. Build and push both Docker images (API and frontend)
3. Deploy the API to Cloud Run
4. Deploy the frontend to Cloud Run (configured to point to the API)
5. Configure public access (if enabled)

### Get the Service URLs

After successful deployment, Terraform will output the service URLs:

```bash
# Frontend URL (main application)
terraform output frontend_service_url

# API URL (backend)
terraform output api_service_url
```

Visit the frontend URL to access your application. The API is available at the API URL with `/api/docs` for Swagger documentation.

**Note:** The frontend is automatically configured to communicate with the deployed API URL.

## How It Works

### Frontend-API Connection

The frontend automatically connects to the deployed API through the following mechanism:

1. **Build Time**: The frontend is built with a placeholder value `__VITE_API_BASE_URL__` in the JavaScript code
2. **Deploy Time**: Terraform deploys the API first and obtains its URL
3. **Container Startup**: When the frontend container starts, an entrypoint script:
   - Receives the API URL via the `VITE_API_BASE_URL` environment variable
   - Replaces all occurrences of `__VITE_API_BASE_URL__` in the built JavaScript files with the actual API URL
   - Starts the nginx web server

This approach allows the same Docker image to be deployed to different environments with different API URLs.

## Configuration Options

### Resource Limits

Adjust CPU and memory in `terraform.tfvars`:

```hcl
# API Resource Limits
cpu_limit    = "2"      # CPU cores
memory_limit = "1Gi"    # Memory

# Frontend Resource Limits
frontend_cpu_limit    = "1"      # CPU cores (frontend typically needs less)
frontend_memory_limit = "256Mi"  # Memory
```

### Scaling Configuration

Configure auto-scaling for both services:

```hcl
# API Scaling
min_instances = 0   # Scales to zero when idle
max_instances = 10  # Maximum concurrent instances

# Frontend Scaling
frontend_min_instances = 0   # Scales to zero when idle
frontend_max_instances = 10  # Maximum concurrent instances
```

### Access Control

To require authentication:

```hcl
allow_unauthenticated = false
```

## Updating the Deployment

When you make changes to your code:

```bash
# Update the image tag (optional)
# Edit terraform.tfvars: image_tag = "v1.1.0"

# Reapply Terraform
terraform apply
```

Terraform will detect changes in:

**API Changes:**
- `api/Dockerfile`
- `api/app.py`
- `api/requirements.txt`

**Frontend Changes:**
- `frontend/Dockerfile`
- `frontend/package.json`
- `frontend/src/**` (any source file)

And automatically rebuild and redeploy the affected service(s).

## Managing Secrets

### Using Environment Variables (Development)

For development, you can set the Anthropic API key via environment variable:

```bash
export TF_VAR_anthropic_api_key="your-api-key"
terraform apply
```

### Using Secret Manager (Production Recommended)

For production, use Google Secret Manager:

1. Create a secret:
   ```bash
   echo -n "your-api-key" | gcloud secrets create anthropic-api-key --data-file=-
   ```

2. Update `main.tf` to use Secret Manager instead of environment variable:
   ```hcl
   env {
     name = "ANTHROPIC_API_KEY"
     value_source {
       secret_key_ref {
         secret  = "anthropic-api-key"
         version = "latest"
       }
     }
   }
   ```

## Monitoring and Logs

### View Logs

```bash
# View API logs
gcloud run services logs read storytelling-primer-api --region=us-central1

# View frontend logs
gcloud run services logs read storytelling-primer-frontend --region=us-central1

# Stream API logs in real-time
gcloud run services logs tail storytelling-primer-api --region=us-central1

# Stream frontend logs in real-time
gcloud run services logs tail storytelling-primer-frontend --region=us-central1
```

### View Service Details

```bash
# API service details
gcloud run services describe storytelling-primer-api --region=us-central1

# Frontend service details
gcloud run services describe storytelling-primer-frontend --region=us-central1
```

## Cleanup

To destroy all resources created by Terraform:

```bash
terraform destroy
```

Type `yes` when prompted to confirm deletion.

**Warning:** This will permanently delete:
- Both Cloud Run services (API and frontend)
- The Artifact Registry repository and all images
- All associated resources

## Troubleshooting

### Docker Build Fails

Ensure Docker is running and you have the correct permissions:
```bash
docker ps
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### Permission Denied Errors

Ensure your account has the necessary IAM roles:
```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="user:YOUR_EMAIL" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="user:YOUR_EMAIL" \
  --role="roles/artifactregistry.admin"
```

### API Not Loading data.json

Ensure `data.json` is present in the `api/` directory before building.

## Cost Optimization

Cloud Run pricing is based on:
- Request count
- CPU and memory allocated
- Time running

To minimize costs:
- Set `min_instances = 0` to scale to zero when idle
- Use appropriate resource limits
- Consider setting a maximum request timeout

Estimated cost: ~$0-5/month for low traffic applications (scales to zero).

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Terraform Google Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Artifact Registry Documentation](https://cloud.google.com/artifact-registry/docs)

## Support

For issues related to:
- **Terraform Configuration**: Review the `.tf` files in this directory
- **API Code**: See the `api/` directory
- **GCP Services**: Consult GCP documentation or support
