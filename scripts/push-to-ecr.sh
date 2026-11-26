#!/usr/bin/env bash
set -euo pipefail
if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <authorized-aws-region>" >&2
  exit 2
fi
region=$1
account=$(aws sts get-caller-identity --query Account --output text --region "$region")
registry="$account.dkr.ecr.$region.amazonaws.com"
cd "$(dirname "$0")/.."
export DOCKER_CONFIG="$(mktemp -d)"
trap 'rm -rf "$DOCKER_CONFIG"' EXIT
aws ecr get-login-password --region "$region" | docker login --username AWS --password-stdin "$registry"
for component in frontend backend; do
  repository="equiptrack-$component"
  aws ecr describe-repositories --repository-names "$repository" --region "$region" >/dev/null
  docker tag "$repository:week12" "$registry/$repository:week12"
  docker push "$registry/$repository:week12"
  aws ecr describe-images --repository-name "$repository" --image-ids imageTag=week12 --region "$region" --query 'imageDetails[0].imageDigest' --output text
done
