const AWS = require('aws-sdk');
const GCP = require('../../../lib/data/external/gcpClient.js');
const awsConfig =
    require('../../functional/aws-node-sdk/support/awsConfig');
const crypto = require('crypto');

