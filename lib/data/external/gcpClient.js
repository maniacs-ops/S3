const AWS = require('aws-sdk');
const Service = require('aws-sdk').Service;

AWS.apiLoader.services.gcp = {};
const GCPClient = Service.defineService('gcp', ['2017-11-01']);
Object.defineProperty(AWS.apiLoader.services.gcp, '2017-11-01', {
    get: function get() {
        const model = require('./gcp-2017-11-01.api.json');
        return model;
    },
    enumerable: true,
    configurable: true,
});

GCPClient.prototype.validateService = function validateService() {
    if (!this.config.region) {
        this.config.region = 'us-east-1';
    }
};

GCPClient.prototype.upload = function upload(params, options, callback) {
    /* eslint-disable no-param-reassign */
    if (typeof options === 'function' && callback === undefined) {
        callback = options;
        options = null;
    }

    options = options || {};
    options = AWS.util.merge(options, { service: this, params });
    /* eslint-disable no-param-reassign */

    const uploader = new AWS.S3.ManagedUpload(options);
    if (typeof callback === 'function') uploader.send(callback);
    return uploader;
};

module.exports = GCPClient;
