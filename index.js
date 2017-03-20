'use strict';

var r = require('request');
var each = require('each');
var Slack = require('slack-node');
var moment = require('moment');
var fs = require('fs');
var AWS = require('aws-sdk');
var request = r.defaults({
	headers: {'User-Agent': 'Florx\'s RightMove Searcher'}
});
var throttledRequest = require('throttled-request')(request);
 
throttledRequest.configure({
  requests: 9,
  milliseconds: 60000
});

process.on('uncaughtException', function (exception) {
  console.log(exception);
});

var Property = require('./property.js');
var seenProperties = [];

//Search variables
var maxPrice = 2300;
var minBedrooms = 3;
var minPhotos = 6;

var slackToken = process.env.SLACK_TOKEN;

if(!slackToken){
	console.log('You need a slack token.');
	process.exit();
}

var areas = [{
	'outcode': 2314,
	'name': 'SE14 - New Cross'
},
{
	'outcode': 2522,
	'name': 'SW9 - Brixton/Stockwell'
},
{
	'outcode': 2317,
	'name': 'SE17 - Kennington/Elephant & Castle'
},
{
	'outcode': 2311,
	'name': 'SE11 - Vauxhall/Kennington'
},
{
	'outcode': 2316,
	'name': 'SE16 - Bermondsey/Docklands'
},
{
	'outcode': 2517,
	'name': 'SW4 - Clapham'
}];

//Code below!
var slack = new Slack(slackToken);
var s3 = new AWS.S3();

var mondayNineAm = moment().day(1).hours(9).startOf('hour').format();

exports.handler = function(event, context) {

	s3.getObject({
        Bucket: 'slack-flat-search',
        Key: 'seenProperties.json'
    },
    function(err, data) {
	  if (err){ 
	  	console.log(err, err.stack); 
	  	context.fail();
	  }
	  else seenProperties = JSON.parse(data.Body); 
	     

		each(areas).call(function(area, index, nextArea){

			console.log('Checking', area.name);

			throttledRequest('https://api.rightmove.co.uk/api/rent/find?index=0&sortType=1&numberOfPropertiesRequested=1000&locationIdentifier=OUTCODE%5E'+area.outcode+'&dontShow=houseShare&maxPrice=2500&minBedrooms=2&apiApplication=IPAD', function (error, response, body) {

				if(error){
					console.error('Something went wrong', error);
					return;
				}

				var data = JSON.parse(body);

				console.log('Got ' + data.properties.length + ' properties to check');


				each(data.properties).call(function (value, key, callback) {

					var property = new Property(value, area.name);
					checkProperty(property, callback);

				}).then(function(){
					return nextArea();
				});


			});
		}).then(function(){
			console.log("Trying to write file");
			s3.putObject({
		        Bucket: 'slack-flat-search',
		        Key: 'seenProperties.json',
		        Body: JSON.stringify(seenProperties)
		    }, function(err, data){
		    	if (err) {
		    		console.log(err, err.stack);
		    		context.fail();
		    	}
		    	else {
		    		console.log('File written');
		    		context.succeed();
		    	}
		    });
		});
	 
	});

}

function checkProperty(property, cb){

	if(seenProperties.indexOf(property.getId()) !== -1){
		return cb();
	}

	seenProperties.push(property.getId());

	if(!property.checkPrice(maxPrice)){
		console.log('Property too expensive at', property.getPrice());
		return cb();
	}

	if(!property.checkBedrooms(minBedrooms)){
		console.log('Property too small with ', property.getBedrooms(), 'bedrooms');
		return cb();
	}

	if(!property.checkPhotos(minPhotos)){
		console.log('Property doesn\'t have enough pictures with ', property.getPhotoCount());
		return cb();
	}
		
	console.log('Slacking: ', property.getAddress());

	var slackText = '*Property Found!*' + "\n" + property.compileSlackMessage();
	
	var attachments = [
		{
			"fallback": slackText,
			"color": "#36a64f",
			"pretext": "New property found!",
			"author_name": property.getAgent(),
			"title": property.getAddress(),
			"title_link": property.getLink(),
			"text": property.getSummary(),
			"fields": [
				{
					"title": "Price",
					"value": '£' + property.getPrice(),
					"short": true
				},{
					"title": "Bedrooms",
					"value": property.getBedrooms(),
					"short": true
				},
				{
					"title": "Num. of Photos",
					"value": property.getPhotoCount(),
					"short": true
				},{
					"title": "Added Date",
					"value": property.getAddedDate(),
					"short": true
				},{
					"title": "Area",
					"value": property.getArea(),
					"short": true
				}
			],
			"thumb_url": property.getPhotoThumb(),
			"footer": "Flat Finder",
			"footer_icon": "https://platform.slack-edge.com/img/default_application_icon.png",
			"callback_id": property.getId(),
			"actions": [
                {
                    "name": "thoughts",
                    "text": "Love",
                    "type": "button",
                    "style": "primary",
                    "value": ":heart: Loved"
                },{
                    "name": "thoughts",
                    "text": "Like",
                    "type": "button",
                    "value": ":+1: Liked"
                },{
                    "name": "thoughts",
                    "text": "Meh",
                    "type": "button",
                    "value": ":-1: Meh"
                },{
                    "name": "thoughts",
                    "text": "Hate",
                    "type": "button",
                    "style": "danger",
                    "value": ":rage: Hated"
                },{
                    "name": "thoughts",
                    "text": "Inappropriate",
                    "type": "button",
                    "value": ":no_entry: Inappropriate"
                }
            ]
		}
	];

	attachments = JSON.stringify(attachments);

	slack.api('chat.postMessage', {
	  	attachments: attachments,
		channel: '#flat-search'
	}, function(err, response){
	  //console.log(response);
	  return property.save(cb);
	});

	

}

