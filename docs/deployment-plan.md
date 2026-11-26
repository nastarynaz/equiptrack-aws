# Deployment plan

1. Open AWS Academy course 195218 and launch the Vocareum lab from the microservices instructions. Verify the federated lab identity, region, and remaining lab budget.
2. Use the course-supported Cloud9 EC2 development environment or a permitted project-specific EC2 host. Use the lab VPC. Keep ingress limited to the authorized connection mechanism. Do not change the lab's pre-provisioned monolith.
3. Transfer the versioned project source to the host. Install Docker Engine and a compatible Docker Compose plugin. Start the stack with `bash scripts/run-stack.sh`. The script creates a local database password if none is configured.
4. Check `docker compose ps` and `curl --fail http://127.0.0.1:8080/health`. Verify the frontend through the authorized preview or tunnel. Run `bash scripts/smoke-test.sh http://127.0.0.1:8080` from a terminal on the host. Save the resource configuration and test output as evidence.
5. If permitted, create private ECR repositories named `equiptrack-frontend` and `equiptrack-backend`. Use an authenticated temporary lab profile to run `bash scripts/push-to-ecr.sh us-east-1`. Verify the `week12` tag and image digests.
6. Check the lab budget and project resources. Stop idle project compute as permitted. Preserve resources and evidence for assessment. Course instructions state that lab session expiry retains AWS resources. Obtain approval before deleting project resources.
