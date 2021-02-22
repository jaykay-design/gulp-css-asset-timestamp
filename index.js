'use strict';

var path = require('path');

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

        if (group.indexOf('http') === 0) {
            return match;
        }

        var parts = group.split(','),
            assetPath = parts.shift(),
            args = parts.map(p => p.trim()),
            assetPath = path.join(opts.assetRoot, assetPath),
            stats;

        try {
            stats = fs.statSync(path.join(__dirname, assetPath));
        } catch (ex) {
            return match;
        }

        var url = new URL(opts.assetURL + assetPath);
        url.searchParams.append('v', stats.mtime.valueOf());

        return match.replace(group, url.toString());
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
