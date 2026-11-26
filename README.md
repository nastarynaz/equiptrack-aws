# EquipTrack

EquipTrack is a small laboratory equipment inventory application for Week 12 of Cloud Computing at Universitas Gadjah Mada. It uses Track B (Containers): an Nginx frontend, an Express API, and MySQL on Docker Compose.

- [Architecture and network design](docs/architecture.md)
- [AWS Academy deployment plan](docs/deployment-plan.md)
- [Design brief](docs/design-brief.md)
- [Evidence guide](evidence/README.md)

The two application images built and the Compose stack passed connectivity tests on AWS Academy Cloud9 in `us-east-1`. The host uses Amazon Linux 2023 and the course-provided lab network. Both private Amazon ECR repositories contain a verified `week12` image.

## Run locally

With Docker Engine and Compose installed, run `bash scripts/run-stack.sh`, then open `http://127.0.0.1:8080`. The script uses a generated database password in the ignored `.env` file unless one is already configured. For a different local port, set `EQUIPTRACK_PORT` before launching.

The frontend provides create, find by UUID, update, and delete actions. Run `bash scripts/smoke-test.sh http://127.0.0.1:8080` to verify the API. The tests require curl and Python 3.

## API

| Method | Route | Success |
| --- | --- | --- |
| POST | `/equipment` | 201 |
| GET | `/equipment/{id}` | 200 |
| PUT | `/equipment/{id}` | 200 |
| DELETE | `/equipment/{id}` | 204 |

POST and PUT accept JSON with `name`, `category`, `quantity`, and `condition`. Quantity is a non-negative safe integer. Condition is `Good`, `Damaged`, or `Maintenance`. The service generates the UUID and UTC timestamps. Invalid input returns 400, missing equipment returns 404, duplicate IDs return 409, and unexpected errors return 500.

`GET /health` checks that the API can query MySQL. The frontend is bound to loopback, and neither Express nor MySQL publishes a host port.
