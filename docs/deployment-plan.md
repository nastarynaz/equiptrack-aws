# Deployment plan

1. Open AWS Academy course 195218 and launch the Vocareum lab from the microservices instructions. Verify the federated lab identity, region, and remaining lab budget.
2. Create a Cloud9 EC2 environment using SSH, t3.small, Amazon Linux 2023, LabVPC, and Public Subnet1. Keep the 30-minute idle timeout and the Cloud9-managed SSH rule. Direct EC2 and Cloud9 SSM attempts were blocked by IAM. The Cloud9 SSH setup worked.
3. Upload a Git archive of the application source in Cloud9. The lab host provides Docker Engine 25.0.14. Install Docker Compose 2.39.4 from the official release and verify its SHA-256 checksum. Start the stack with `bash scripts/run-stack.sh`. The script creates a local database password if none is configured.
4. Check `docker compose ps` and `curl --fail http://127.0.0.1:8080/health`. Verify that the frontend HTML and proxied API respond through the host loopback interface. Run `bash scripts/smoke-test.sh http://127.0.0.1:8080` from a terminal on the host. Save the resource configuration and test output as evidence.
5. If permitted, create private ECR repositories named `equiptrack-frontend` and `equiptrack-backend`. Use an authenticated temporary lab profile to run `bash scripts/push-to-ecr.sh us-east-1`. Verify the `week12` tag and image digests.
6. Check the lab budget and project resources. Stop idle project compute as permitted. Preserve resources and evidence for assessment. Course instructions state that lab session expiry retains AWS resources. Obtain approval before deleting project resources.
