# Track B architecture

EquipTrack uses an Nginx frontend and an Express API, with MySQL as a third container. The application was verified locally in Docker. The target host is one EC2 instance in the AWS Academy lab, in `us-east-1`. See the [editable SVG](architecture.svg).

```mermaid
flowchart LR
    client["Browser / terminal"]
    subgraph aws["AWS Academy · us-east-1 · planned deployment"]
        subgraph vpc["Lab VPC · restricted security group"]
            subgraph host["EC2 development host"]
                frontend["Nginx frontend · 8080"]
                backend["Express API · 3000"]
                db["MySQL · 3306 · persistent volume"]
                frontend <-->|"HTTP / JSON · edge bridge"| backend
                backend <-->|"MySQL · internal database bridge"| db
            end
        end
        profile["Lab-provided IAM identity"]
        registry["Private Amazon ECR repositories"]
        profile -. "Authorized image push and pull" .-> registry
        registry -. "Application images" .-> host
    end
    client <-->|"Loopback preview or authorized tunnel"| frontend
    repo["Private GitHub repository"] -. "Versioned source" .-> host
```

Only the frontend is bound to the host loopback address. The backend joins both Docker networks. MySQL joins only the internal database network and keeps its data in a named volume. A cloud deployment uses the network controls provided by the Academy lab and temporary IAM credentials for ECR. Database traffic uses the application MySQL account and parameterized queries.
