# Proposed Track C architecture

The planned region is `us-east-1`, subject to the AWS Academy lab's service permissions. The application runs on AWS-managed networking and does not require a customer-managed VPC. See the [editable SVG](architecture.svg).

```mermaid
flowchart LR
    client["Client / terminal"]
    subgraph aws["AWS Cloud · us-east-1"]
        subgraph managed["AWS-managed networking"]
            api["API Gateway HTTP API"]
            fn["Lambda · EquipTrack"]
            db["DynamoDB · Equipment"]
            api <-->|"Lambda proxy v2.0"| fn
            fn <-->|"Boto3 · CRUD and item data"| db
        end
        iam["Lab-provided IAM role"]
        logs["CloudWatch Logs"]
        iam -. "Execution permissions" .-> fn
        fn -->|"Invocation logs"| logs
    end
    client <-->|"HTTPS / JSON"| api
    repo["Private GitHub repository"] -. "Versioned Lambda source" .-> fn
```

All cloud components in this diagram are planned. The Lambda execution role must allow the four item operations and CloudWatch logging. Prefer IAM-authorized routes where the lab supplies an authorized test identity. Use dummy data and keep endpoints out of repository documentation.
