'use strict';

var request = require('request');
var moment = require('moment');
var AWS = require('aws-sdk');


function Property(data, area) {
  this.data = data;
  this.data.area = area;
}

Property.prototype.getArea = function() {
    return this.data.area;
};

Property.prototype.getPrice = function(){
    return this.data.monthlyRent;
}

Property.prototype.getBedrooms = function(){
    if(this.data.bedrooms == null)
        return 1;

    return this.data.bedrooms;
}

Property.prototype.getAddress = function() {
    return this.data.address;
};

Property.prototype.getSummary = function() {
    return this.data.summary;
};

Property.prototype.getLocationCoords = function() {
    return this.data.latitude + ',' + this.data.longitude;
};

Property.prototype.getId = function() {
    return this.data.identifier;
};

Property.prototype.getLink = function() {
    return 'http://www.rightmove.co.uk/property-to-rent/property-'+this.getId()+'.html';
};

Property.prototype.getPhotoThumb = function() {
    return this.data.photoThumbnailUrl;
};

Property.prototype.getAgent = function() {
    return this.data.branch.brandName + ' (' +  this.data.branch.name + ') ' + this.data.branch.telephoneNumbers[0].number;
};

Property.prototype.getAddedDate = function() {
    return moment(this.data.sortDate).format('Do MMM YY');
};

Property.prototype.getPhotoCount = function() {
    return this.data.photoCount;
};

Property.prototype.compileSlackMessage = function() {
    let str = '';

    str += 'Price: £' + this.getPrice() + "\n";
    str += 'Bedrooms: ' + this.getBedrooms() + "\n";
    str += 'Address: ' + this.getAddress() + "\n";
    str += this.getSummary();

    return str;
};

// class methods
Property.prototype.checkPrice = function(maxPrice) {
    return this.getPrice() <= maxPrice;
};

Property.prototype.checkBedrooms = function(minBedrooms) {
    return this.getBedrooms() >= minBedrooms;
};

Property.prototype.checkPhotos = function(minPhotos) {
    return this.getPhotoCount() >= minPhotos;
};

Property.prototype.save = function(cb) {
    
    var s3 = new AWS.S3();
    s3.putObject({
        Bucket: 'slack-flat-search',
        Key: this.getArea() + '/' + this.getId() + '.json',
        Body: JSON.stringify(this.data)
    }, function(err, data){
        if (err) {
            console.log(err, err.stack);
            return cb();
        }
        else {
            return cb();
        }
    });
};

// export the class
module.exports = Property;