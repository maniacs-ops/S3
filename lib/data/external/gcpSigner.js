const AWS = require('aws-sdk');

gcpSigner = AWS.util.inherit(AWS.Signers.RequestSigner, {

  subResources: {
    'acl': 1,
    'compose': 1,
    'cors': 1,
    'encryption': 1,
    'lifecycle': 1,
    'logging': 1,
    'versioning': 1,
    'websiteConfig': 1,
  },

  responseHeaders: {
    'response-content-type': 1,
    'response-content-language': 1,
    'response-expires': 1,
    'response-cache-control': 1,
    'response-content-disposition': 1,
    'response-content-encoding': 1
  },

  addAuthorization: function addAuthorization(credentials, date) {
    if (!this.request.headers['presigned-expires']) {
      this.request.headers['X-goog-Date'] = AWS.util.date.rfc822(date);
    }

    var signature = this.sign(credentials.secretAccessKey, this.stringToSign());
    var auth = 'GOOG1 ' + credentials.accessKeyId + ':' + signature;

    this.request.headers['Authorization'] = auth;
  },

  stringToSign: function stringToSign() {
    var r = this.request;

    var parts = [];
    parts.push(r.method);
    parts.push(r.headers['Content-MD5'] || '');
    parts.push(r.headers['Content-Type'] || '');
    parts.push(r.headers['presigned-expires'] || '');

    var headers = this.canonicalizedGoogHeaders();
    if (headers) parts.push(headers);
    parts.push(this.canonicalizedResource());

    return parts.join('\n');

  },

  canonicalizedGoogHeaders: function canonicalizedGoogHeaders() {

    var googHeaders = [];

    AWS.util.each(this.request.headers, function (name) {
      if (name.match(/^x-goog-/i) || name.match(/^x-amz-/i))
        googHeaders.push(name);
    });

    googHeaders.sort(function (a, b) {
      return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    })

    var parts = [];
    AWS.util.arrayEach.call(this, googHeaders, function (name) {
      parts.push(name.toLowerCase() + ':' + String(this.request.headers[name]));
    });

    return parts.join('\n');
  },

  canonicalizedResource: function canonicalizedResource() {

    var r = this.request;

    var parts = r.path.split('?');
    var path = parts[0];
    var querystring = parts[1];

    var resource = '';

    if (r.virtualHostedBucket)
      resource += '/' + r.virtualHostedBucket;

    resource += path;

    if (querystring) {

      // collect a list of sub resources and query params that need to be signed
      var resources = [];

      AWS.util.arrayEach.call(this, querystring.split('&'), function (param) {
        var name = param.split('=')[0];
        var value = param.split('=')[1];
        if (this.subResources[name] || this.responseHeaders[name]) {
          var subresource = { name: name };
          if (value !== undefined) {
            if (this.subResources[name]) {
              subresource.value = value;
            } else {
              subresource.value = decodeURIComponent(value);
            }
          }
          resources.push(subresource);
        }
      });

      resources.sort(function (a, b) { return a.name < b.name ? -1 : 1; });

      if (resources.length) {

        querystring = [];
        AWS.util.arrayEach(resources, function (res) {
          if (res.value === undefined) {
            querystring.push(res.name);
          } else {
            querystring.push(res.name + '=' + res.value);
          }
        });

        resource += '?' + querystring.join('&');
      }

    }

    return resource;

  },

  sign: function sign(secret, string) {
    return AWS.util.crypto.hmac(secret, string, 'base64', 'sha1');
  }
})

module.exports = gcpSigner;