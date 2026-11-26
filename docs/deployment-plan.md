# Deployment plan

1. Open the Vocareum workbench through AWS Academy course 195218. Start the session and confirm the AWS Console identity, region, remaining credits, lab role, and available actions.
2. For Track C, create the on-demand DynamoDB Standard table `Equipment` with a String partition key `equipment_id`, AWS-owned encryption, and no sort key or secondary indexes. Verify the table is Active and record its ARN in local evidence.
3. Deploy `lambda_function.py` to `EquipTrack` using Python 3.12 (or a supported Python runtime), x86_64, 128 MB memory, a 10-second timeout, 512 MB ephemeral storage, and `TABLE_NAME=Equipment`. Select a permitted Lambda execution role and use `lambda_function.lambda_handler` without a Function URL.
4. Invoke the private `CreateEquipmentTest` event. Verify status 201 and look up the returned UUID in DynamoDB. Check CloudWatch for the corresponding invocation.
5. Create `EquipTrackAPI` as an HTTP API with a Lambda proxy integration using payload 2.0. Attach all four routes. Verify the API's permission to invoke the function, the auto-deploying `$default` stage, and a 1 request/s rate with a burst of 5 where supported.
6. Run the smoke tests using the actual Invoke URL and an authorized test client. Keep the URL out of version control. Save the output and screenshots locally. Check the visible budget and follow the lab instructions when ending the session.
