'use strict';

var path = require('path');
var url = require('url');

var es = require('event-stream');
var rs = require('replacestream');
var fs = require('fs');

var defaults = {
    assetRoot: '',
    assetURL: '/',
    urlRegExp: /url\((?:['"]*)([^\'")]+)(?:['"]*)\)/g
};


var plugin = function (options) {
    var opts = Object.assign({}, defaults, options);

    var replaceFunc = function (match, group) {
        var assetUrl = url.parse(group),
            assetFilePath = path.join(opts.assetRoot, assetUrl.pathname),
            stats

        if (assetUrl.host !== null) {
            return match;
        }

        try {
            stats = fs.statSync(assetFilePath);
        } catch (ex) {
            return match;
        }

        var params = new URLSearchParams(url.search);

        params.append('v', stats.mtime.valueOf());
        assetUrl.search = params.toString();
        assetUrl = url.parse(opts.assetURL + assetUrl.format());

        return match.replace(group, assetUrl.format());
    };

    return es.map(function (file, cb) {
        var out = file;
        if (file.isNull()) {
            return cb(null, out);
        }
        if (file.isBuffer()) {
            file.contents = Buffer.from(String(file.contents)
                .replace(opts.urlRegExp, replaceFunc));
        } else if (file.isStream()) {
            out = file.pipe(rs(opts.urlRegExp, replaceFunc));
        }
        return cb(null, out);
    });
};

module.exports = plugin;
