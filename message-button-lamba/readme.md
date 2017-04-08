# Message Button Lambda

You can respond to the message buttons on the messages using AWS API Gateway and AWS Lambda.

## How?

1. Create yourself a Lambda function, and add a trigger to it for API Gateway.
2. zip -r lamdba.zip .
3. aws lambda update-function-code --function-name <function-name> --zip-file fileb://lambda.zip
4. Add to the environment variable `SLACK_VERIFICATION` your slack verification token (found in your Slack app under General Info)
5. Add the API Gateway URL into the Slack Message Button API section (again in your Slack app) 
6. Give it a try!

## Debugging/Testing

1. Replace the token xxx in the testData.txt file with yours
2. Run `curl -i -X POST -H "Content-Type: application/x-www-form-urlencoded" -d @testData.txt <gateway-url>`

