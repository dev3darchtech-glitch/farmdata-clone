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

Important:

- Since July 31, 2026, the backend now fails fast on startup if `NODE_ENV=production` and `MONGODB_URI` is missing.
- Cloud Run should no longer be considered healthy if MongoDB is disconnected. `/health` returns `503` in that case.
- Do not rely on local fallback values in production. `mongodb://localhost:27017/farmdata` is for local development only.

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

### Step 3.3: Change Existing Env Values

If the service is already running and you need to rotate or replace an env value, update the secret first, then redeploy or update the Cloud Run service.

Update an existing secret value by creating a new secret version:

```sh
echo -n "your-new-mongodb-uri" | gcloud secrets versions add MONGODB_URI --data-file=-
echo -n "your-new-jwt-secret" | gcloud secrets versions add JWT_SECRET --data-file=-
echo -n "your-new-google-client-secret" | gcloud secrets versions add GOOGLE_CLIENT_SECRET --data-file=-
```

Force Cloud Run to pick up the latest secret versions:

```sh
gcloud run services update farmdata-backend \
  --region=asia-southeast1 \
  --set-secrets="MONGODB_URI=MONGODB_URI:latest,JWT_SECRET=JWT_SECRET:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest"
```

If you also need to change non-secret env vars such as `NODE_ENV` or `GOOGLE_REDIRECT_URI`, update them explicitly:

```sh
gcloud run services update farmdata-backend \
  --region=asia-southeast1 \
  --update-env-vars="NODE_ENV=production,GOOGLE_REDIRECT_URI=https://YOUR_DOMAIN/api/auth/google/callback"
```

Notes:

- `MONGODB_URI` is mandatory in production. If it is empty, missing, or points to an unreachable host, the new revision will fail to start.
- Prefer changing one thing at a time for production incidents: update `MONGODB_URI` first, verify, then rotate other secrets.
- If you use Cloud Build triggers, a normal code deploy also creates a new Cloud Run revision, but secret value changes alone still need `gcloud run services update ...` or a manual redeploy.

### Step 3.4: Verify Env Changes Took Effect

Check which env vars and secret bindings are attached to the current service:

```sh
gcloud run services describe farmdata-backend \
  --region=asia-southeast1 \
  --format="yaml(spec.template.spec.containers)"
```

Check the latest revision status:

```sh
gcloud run revisions list \
  --region=asia-southeast1 \
  --service=farmdata-backend
```

Check runtime health after the revision becomes active:

```sh
curl https://YOUR_BACKEND_DOMAIN/health
```

Expected healthy response:

```json
{
  "status": "ok",
  "mongo": {
    "readyState": 1,
    "status": "connected"
  }
}
```

If `/health` returns `503` or login shows a Mongo timeout again, verify:

- `MONGODB_URI` exists in Secret Manager.
- The latest Cloud Run revision is using `MONGODB_URI:latest`.
- The runtime service account can access Secret Manager.
- The MongoDB host allows inbound connections from Cloud Run.

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
