"use strict";
var qs = require('qs');

exports.handler = (event, context) => {
    let slackParams = JSON.parse(qs.parse(event.body).payload);
    
    if(process.env.SLACK_VERIFICATION != slackParams.token){
        context.succeed({
            "statusCode": 401,
            "headers": {},
            "body": JSON.stringify({'err': 'The slack verification code was incorrect.'})
        });
        return;
    }

    let response = slackParams.original_message;
    let user = slackParams.user.name;
    
    console.log(response.attachments[0].fields);
    
    
    for (let a = 0, len = slackParams.actions.length; a < len; a++) {
      let thisAction = slackParams.actions[a];
      let deletedValue = "";
      
      for (let f = 0, len = response.attachments[0].fields.length; f < len; f++) {
        let thisField = response.attachments[0].fields[f];
        
            if(thisField.title == user){
                deletedValue = response.attachments[0].fields[f].value;
                delete response.attachments[0].fields[f];
                break;
            }
        }
      
        if(deletedValue != thisAction.value){
            response.attachments[0].fields.push( {'title': user, 'value': thisAction.value, 'short': true} );
        }
      
    }

    const res = {
        "statusCode": 200,
        "headers": {'Content-Type': 'application/json'},
        "body": JSON.stringify(response)    // body must be returned as a string
    };

    context.succeed(res);
};