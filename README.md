# RightMove Slack Notifier

1. npm install
2. npm install -g lambda-local
3. export SLACK_TOKEN=xxx
4. Setup your AWS Access/Secret tokens (with access to an S3 bucket)
5. Change the bucket name in the code (it's called slack-flat-search in both index.js and property.js)
6. lambda-local -l index.js -e sample-event.js -t 300