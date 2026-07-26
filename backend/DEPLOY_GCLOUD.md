# Deploy Backend To Google Cloud Run via Cloud Build Repository Trigger

This backend is configured for automated deployment to **Google Cloud Run** using **GCP Cloud Build Repository Triggers** upon code commits to the repository.

---

## Architecture Overview

```
[Git Push to Repo] ──> [GCP Cloud Build Trigger] ──> [Build & Push Docker Image] ──> [Deploy to Cloud Run]
```

- **Cloud Build file**: `backend/cloudbuild.yaml`
- **Dockerfile**: `backend/Dockerfile`
- **Included Files Filter**: `backend/**` (only triggers on backend code changes)

---

## 1. Prerequisites & GCP Setup

### 1.1 Create Artifact Registry Repository
Run once per project/region:

```sh
gcloud artifacts repositories create farmdata \
  --repository-format=docker \
  --location=asia-southeast1 \
  --description="FarmData Docker images"
```

### 1.2 Grant IAM Permissions to Cloud Build Service Account
GCP Cloud Build uses its default Service Account (`<PROJECT_NUMBER>@cloudbuild.gserviceaccount.com`) to execute triggers. It requires permissions to push container images to Artifact Registry and deploy services to Cloud Run.

Get your GCP Project Number:
```sh
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')
```

Grant required roles:
```sh
# 1. Cloud Run Admin (to deploy Cloud Run services)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

# 2. Service Account User (to act as runtime service account)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# 3. Artifact Registry Writer (to push container images)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# 4. Secret Manager Secret Accessor (if accessing Secret Manager)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 2. Creating Cloud Build Repository Trigger in GCP Console

Instead of external CI/CD (GitHub Actions / GitLab CI), configure a **Repository Trigger directly in Google Cloud**:

### Option A: Via Google Cloud Console (UI)
1. Navigate to **Google Cloud Console** ──> **Cloud Build** ──> **Triggers**.
2. Click **Connect Repository** (or **Manage Repositories** via Developer Connect / GitHub App).
3. Select your repository host (e.g. GitHub / Bitbucket / Cloud Source Repositories) and choose repository (`capture-data`).
4. Click **Create Trigger** and set the parameters:
   - **Name**: `deploy-farmdata-backend`
   - **Event**: `Push to a branch`
   - **Source Repository**: Select your connected repo and branch (e.g., `^main$` or `^master$`)
   - **Included files filter**: `backend/**`
   - **Configuration**: `Cloud Build configuration file (yaml or json)`
   - **Location**: `Repository`
   - **Cloud Build configuration file location**: `backend/cloudbuild.yaml`
5. Click **Create**.

### Option B: Via gcloud CLI
```sh
gcloud beta builds triggers create github \
  --name="deploy-farmdata-backend" \
  --repo-name="capture-data" \
  --repo-owner="YOUR_GITHUB_OWNER" \
  --branch-pattern="^main$" \
  --build-config="backend/cloudbuild.yaml" \
  --included-files="backend/**"
```

---

## 3. Environment Variables & Secret Manager (Recommended)

To securely supply production secrets (`MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_SECRET`) to Cloud Run:

### Step 3.1: Store Secrets in Secret Manager
```sh
echo -n "your-mongodb-uri" | gcloud secrets create MONGODB_URI --data-file=-
echo -n "your-jwt-secret" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "your-google-client-secret" | gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=-
```

### Step 3.2: Bind Secrets to Cloud Run Service
```sh
gcloud run services update farmdata-backend \
  --region=asia-southeast1 \
  --set-secrets="MONGODB_URI=MONGODB_URI:latest,JWT_SECRET=JWT_SECRET:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest"
```

---

## 4. Verification & Testing

1. Push a test commit to `backend/` on the main branch:
   ```sh
   git add backend/
   git commit -m "ci: test cloud build repository trigger"
   git push origin main
   ```
2. Check real-time execution logs in **GCP Console ──> Cloud Build ──> History**.
3. Verify that Cloud Run service `farmdata-backend` updates automatically with the newly deployed revision.
