# EquipTrack

EquipTrack is a CRUD API for laboratory equipment inventory. The Week 12 project covers the architecture, initial infrastructure, and connectivity tests for one equipment entity.

The target environment is the authorized lab in AWS Academy Lab Project - Microservices and CI/CD Pipeline Builder (course 195218). Track C is the proposed design pending confirmation of Lambda, DynamoDB, and API Gateway permissions.

## API

| Method | Route | Success |
| --- | --- | --- |
| POST | `/equipment` | 201 |
| GET | `/equipment/{id}` | 200 |
| PUT | `/equipment/{id}` | 200 |
| DELETE | `/equipment/{id}` | 204 |

POST and PUT accept a JSON object with `name`, `category`, `quantity`, and `condition`. Quantity is a non-negative integer. Condition is `Good`, `Damaged`, or `Maintenance`. The service generates the UUID and UTC timestamps. Invalid requests return 400, missing records return 404, ID conflicts return 409, and internal failures return 500.

## Verification

Run `python3 -m py_compile lambda_function.py` to check the Python source. The Lambda console event is in [tests/create-equipment-event.json](tests/create-equipment-event.json). To run the HTTP smoke tests against the deployed endpoint, use `bash scripts/smoke-test.sh "$API_URL"` with a test client authorized to invoke the endpoint. Keep the live URL and temporary credentials outside the repository.

See the [architecture](docs/architecture.md) and [deployment plan](docs/deployment-plan.md).
