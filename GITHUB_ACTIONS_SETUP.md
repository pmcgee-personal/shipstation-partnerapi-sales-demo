# GitHub Actions Deployment Setup

This guide walks you through setting up AWS credentials for automated deployments via GitHub Actions.

## Step 1: Create AWS IAM User

### In AWS Console:

1. Go to **IAM Dashboard** → **Users** → **Create User**
2. Enter name: `github-actions-deploy`
3. Click **Next**
4. **Attach policies directly** → Search for and attach these policies:
   - `AWSCloudFormationFullAccess` (Serverless Framework needs this)
   - `AmazonDynamoDBFullAccess` (DynamoDB table management)
   - `AmazonAPIGatewayAdministrator` (API Gateway management)
   - `AWSLambdaFullAccess` (Lambda function management)
   - `AmazonS3FullAccess` (Frontend hosting)
   - `CloudFrontFullAccess` (CloudFront invalidation)
   - `AmazonSSMReadOnlyAccess` (Read Partner API key from Parameter Store)
   - `IAMFullAccess` (For Serverless Framework to create/manage roles)

   **Why these?** Serverless Framework needs CloudFormation + IAM permissions to create/update stacks. The others are for the Lambda functions and frontend deployment.

5. Click **Create User**

### Generate Access Keys:

1. Click the newly created user: `github-actions-deploy`
2. Go to **Security Credentials** tab
3. Click **Create Access Key**
4. Choose **Application running outside AWS** (for GitHub)
5. Click **Next**
6. Copy the **Access Key** and **Secret Access Key**
   - You'll only see the secret once—save both securely

## Step 2: Add GitHub Secrets

### In GitHub Repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

Add these 4 secrets:

| Secret Name | Value | Source |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | Access Key from Step 1 | AWS IAM user credentials |
| `AWS_SECRET_ACCESS_KEY` | Secret Access Key from Step 1 | AWS IAM user credentials |
| `S3_BUCKET_NAME` | Your S3 bucket name | Check AWS S3 console or ask from deployment docs |
| `CLOUDFRONT_DISTRIBUTION_ID` | Your CloudFront distribution ID | AWS CloudFront console → Distributions |

**How to find S3 bucket and CloudFront ID if needed:**

**S3 Bucket:**
- AWS Console → S3 → Look for bucket starting with `shipstation-` or check deployment notes

**CloudFront Distribution ID:**
- AWS Console → CloudFront → Distributions → Look for distribution pointing to your S3 bucket
- ID is listed in the first column

### Secrets Safety:
- ✅ Secrets are encrypted by GitHub
- ✅ Never printed in logs
- ✅ Only accessible to workflow jobs
- ✅ Regenerate if accidentally exposed

## Step 3: Verify Workflow

The workflow file `.github/workflows/deploy.yml` is already set up. It:

1. **On every push/PR:** Lints and tests code (frontend lint + test)
2. **On push to main only:** Deploys backend and frontend
3. **Deploys:** Backend (Serverless), Frontend (S3 + CloudFront invalidation)

### Test it:
1. Make a small change to code
2. Push to a branch (e.g., `git push origin test-branch`)
3. Go to GitHub → **Actions** tab
4. Watch the workflow run (lint/test only, no deployment)
5. Once working, merge to main to trigger deployment

## Troubleshooting

**"InvalidAction" error with aws-actions/configure-aws-credentials:**
- This action is from AWS and should work. If fails, update to latest version or use `aws-cli` directly.

**"Access Denied" during deployment:**
- Check that IAM user has all 8 policies attached
- Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are correct

**"S3 bucket not found":**
- Verify S3_BUCKET_NAME secret value is correct (no trailing slashes)
- Bucket must exist in same region as backend (us-west-2)

**"CloudFront distribution not found":**
- Verify CLOUDFRONT_DISTRIBUTION_ID is correct (e.g., `E1234ABCD`)
- Should match the distribution pointing to your S3 bucket

**Deployment succeeds but site doesn't update:**
- CloudFront cache invalidation might be slow (up to 60 seconds)
- Verify both S3 upload and CloudFront invalidation steps show "success" in logs

## Rollback Strategy

If a bad deployment reaches production:

1. **Immediate:** GitHub Actions can be disabled temporarily in Actions settings
2. **Revert:** Revert the commit with `git revert`, push to main
3. **Manual:** Use `serverless deploy` locally from previous working commit
4. **Re-enable:** Re-enable Actions workflow

## Monitoring Deployments

After setting up:

- Check **Actions** tab in GitHub to see deployment status
- Workflow logs show each step (lint, test, deploy)
- Failures block redeployment until fixed
- Rollback by reverting commit and pushing to main

## Next Steps

Once this is working:
1. Add backend unit tests (they'll run in the workflow)
2. All code improvements will be tested before deployment
3. No more manual `serverless deploy` commands needed
