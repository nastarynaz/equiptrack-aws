"""EquipTrack HTTP API handler for API Gateway payload 2.0."""

import base64
import binascii
import json
import logging
import os
from datetime import datetime, timezone
from decimal import Decimal
from functools import lru_cache
from uuid import UUID, uuid4

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

CONDITIONS = {"Good", "Damaged", "Maintenance"}
TEXT_LIMITS = {"name": 120, "category": 80, "condition": 20}
ITEM_EXISTS = "attribute_exists(equipment_id)"


@lru_cache(maxsize=1)
def equipment_table():
    return boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])


def parse_equipment(event):
    body = event.get("body")
    if not isinstance(body, str):
        raise ValueError("A JSON object is required.")

    try:
        if event.get("isBase64Encoded"):
            body = base64.b64decode(body, validate=True).decode("utf-8")
        payload = json.loads(body)
    except (ValueError, binascii.Error, RecursionError) as error:
        raise ValueError("The request body must contain valid JSON.") from error

    if not isinstance(payload, dict):
        raise ValueError("A JSON object is required.")

    equipment = {}
    for field, limit in TEXT_LIMITS.items():
        value = payload.get(field)
        if not isinstance(value, str) or not 1 <= len(value.strip()) <= limit:
            raise ValueError(f"{field} must contain 1 to {limit} characters.")
        value = value.strip()
        try:
            value.encode("utf-8")
        except UnicodeEncodeError as error:
            raise ValueError(f"{field} must contain valid Unicode.") from error
        equipment[field] = value

    if equipment["condition"] not in CONDITIONS:
        raise ValueError("condition must be Good, Damaged, or Maintenance.")

    quantity = payload.get("quantity")
    if type(quantity) is not int or not 0 <= quantity < 10**38:
        raise ValueError("quantity must be a non-negative integer with up to 38 digits.")
    equipment["quantity"] = quantity
    return equipment


def parse_equipment_id(event):
    parameters = event.get("pathParameters")
    raw_id = parameters.get("id") if isinstance(parameters, dict) else None
    if not isinstance(raw_id, str):
        raise ValueError("equipment id must be a UUID.")
    try:
        return str(UUID(raw_id))
    except ValueError as error:
        raise ValueError("equipment id must be a UUID.") from error


def utc_timestamp():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def encode_dynamodb_integer(value):
    if isinstance(value, Decimal) and value == value.to_integral_value():
        return int(value)
    raise TypeError(f"Unsupported JSON value type {type(value).__name__}")


def response(status, payload=None):
    if status == 204:
        return {"statusCode": 204, "body": ""}
    return {
        "statusCode": status,
        "headers": {"content-type": "application/json"},
        "body": json.dumps(payload, default=encode_dynamodb_integer),
    }


def lambda_handler(event, context):
    method = None
    try:
        if not isinstance(event, dict) or event.get("version") != "2.0":
            raise ValueError("An HTTP API payload version 2.0 event is required.")
        request_context = event.get("requestContext")
        http = request_context.get("http") if isinstance(request_context, dict) else None
        method = http.get("method") if isinstance(http, dict) else None
        if method not in ("POST", "GET", "PUT", "DELETE"):
            raise ValueError("Unsupported HTTP method.")

        fields = parse_equipment(event) if method in ("POST", "PUT") else None
        key = {"equipment_id": parse_equipment_id(event)} if method != "POST" else None
        table = equipment_table()

        if method == "POST":
            now = utc_timestamp()
            item = {**fields, "equipment_id": str(uuid4()), "created_at": now, "updated_at": now}
            table.put_item(Item=item, ConditionExpression="attribute_not_exists(equipment_id)")
            return response(201, item)

        if method == "GET":
            result = table.get_item(Key=key, ConsistentRead=True)
            if "Item" not in result:
                return response(404, {"message": "Equipment not found."})
            return response(200, result["Item"])

        if method == "PUT":
            fields["updated_at"] = utc_timestamp()
            result = table.update_item(
                Key=key,
                UpdateExpression="SET " + ", ".join(f"#{field} = :{field}" for field in fields),
                ExpressionAttributeNames={f"#{field}": field for field in fields},
                ExpressionAttributeValues={f":{field}": value for field, value in fields.items()},
                ConditionExpression=ITEM_EXISTS,
                ReturnValues="ALL_NEW",
            )
            return response(200, result["Attributes"])

        table.delete_item(Key=key, ConditionExpression=ITEM_EXISTS)
        return response(204)
    except ValueError as error:
        return response(400, {"message": str(error)})
    except ClientError as error:
        if error.response["Error"]["Code"] == "ConditionalCheckFailedException":
            if method == "POST":
                return response(409, {"message": "Equipment identifier already exists."})
            if method in ("PUT", "DELETE"):
                return response(404, {"message": "Equipment not found."})
        logger.exception("DynamoDB request failed for %s", method)
    except Exception:
        logger.exception("EquipTrack request failed for %s", method)

    return response(500, {"message": "An internal error occurred."})
