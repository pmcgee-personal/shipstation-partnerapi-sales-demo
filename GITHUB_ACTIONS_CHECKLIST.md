# GitHub Actions Setup Checklist

Complete these steps in order to enable automated deployments:

## ✅ AWS IAM Setup

- [ ] Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
- [ ] Create new user: `github-actions-deploy`
- [ ] Attach these 8 policies to the user:
  - [ ] AWSCloudFormationFullAccess
  - [ ] AmazonDynamoDBFullAccess
  - [ ] AmazonAPIGatewayAdministrator
  - [ ] AWSLambdaFullAccess
  - [ ] AmazonS3FullAccess
  - [ ] CloudFrontFullAccess
  - [ ] AmazonSSMReadOnlyAccess
  - [ ] IAMFullAccess
- [ ] Generate Access Key (save both Access Key ID and Secret Access Key)

## ✅ GitHub Secrets Setup

- [ ] Go to GitHub repo → Settings → Secrets and variables → Actions
- [ ] Create 4 new repository secrets:

| Name | Value |
|------|-------|
| `AWS_ACCESS_KEY_ID` | (from IAM user Access Key ID) |
| `AWS_SECRET_ACCESS_KEY` | (from IAM user Secret Access Key) |
| `S3_BUCKET_NAME` | (your S3 bucket name) |
| `CLOUDFRONT_DISTRIBUTION_ID` | (your CloudFront distribution ID) |

## ✅ Test the Workflow

- [ ] Create a test branch: `git checkout -b test-workflow`
- [ ] Make a small change (e.g., add a comment)
- [ ] Push to GitHub: `git push origin test-workflow`
- [ ] Go to GitHub → **Actions** tab
- [ ] Watch the workflow run (lint + test, no deployment since not on main)
- [ ] Verify all steps pass ✅
- [ ] Go back to main: `git checkout main`

## ✅ Enable Production Deployments

- [ ] Create a PR from test-workflow to main
- [ ] Review and merge
- [ ] Watch the full workflow run (lint + test + deploy)
- [ ] Verify backend deployed: check CloudFormation in AWS console
- [ ] Verify frontend deployed: visit your app URL and check for latest changes
- [ ] Delete test branch: `git branch -d test-workflow`

## ✅ Next Steps

Once verified:
- [ ] All future pushes to main will auto-deploy
- [ ] All PRs will run tests (but not deploy)
- [ ] Add backend unit tests (they'll run in CI)
- [ ] Disable manual deployments (avoid conflicts with CI/CD)

## 🆘 Help

- See `GITHUB_ACTIONS_SETUP.md` for detailed instructions
- Check GitHub Actions logs if something fails (click on failed workflow)
- AWS credentials issues? Verify all 8 policies are attached to the user
