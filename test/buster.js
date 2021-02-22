'use strict';

var path = require('path');

var File = require('vinyl');
var assert = require('chai').assert;
var es = require('event-stream');
var fs = require('fs');

var buster = require('..');

var createAssets = function () {
    fs.mkdirSync('assets/images', {
        recursive: true
    });
    fs.writeFileSync('assets/images/logo.svg', 'test');
    fs.writeFileSync('assets/images/logo-basic.png', 'test');
}
var createDistAssets = function () {
    fs.mkdirSync('dist/assets/images', {
        recursive: true
    });
    fs.writeFileSync('dist/assets/images/logo.svg', 'test');
    fs.writeFileSync('dist/assets/images/logo-basic.png', 'test');
}

var removeAssets = function () {
    fs.rmdirSync('assets', {
        recursive: true
    });
    fs.rmdirSync('dist', {
        recursive: true
    });
}

var makeCSSBuffer = function (map) {
    return Buffer.from([
        '.logo {',
        '  width: 200px;',
        '  background: url(' + map('/assets/images/logo.svg') + ');',
        '  background-size: contain;',
        '  background-repeat: no-repeat;',
        '  background-position: center;',
        '}',
        '.logo-basic {',
        '  width: 80px;',
        '  background: url(' + map('/assets/images/logo-basic.png') + ');',
        '  background-size: contain;',
        '  background-repeat: no-repeat;',
        '  background-position: center;',
        '}'
    ].join('\n'), 'utf8');
};

var bufferToStream = function (buf) {
    var current = 0;
    var len = buf.length;
    return es.readable(function (count, cb) {
        if (current < len) {
            this.emit('data', buf.slice(current, current + count));
            current += count;
        }
        if (current >= len) {
            this.emit('end');
        }

        cb();
    });
};


describe('gulp-cache-buster', function () {

    createAssets();
    var expected = makeCSSBuffer(function (asset) {
        return 'https://example.com' + asset + '?v=' + fs.statSync(path.join(__dirname, '/../', asset)).mtime.valueOf();
    });

    describe('in streaming mode', function () {
        it('should cache bust asset references', function (done) {
            var file = new File({
                contents: bufferToStream(makeCSSBuffer(asset => asset))
            });

            es.readArray([file])
                .pipe(buster({
                    assetURL: 'https://example.com',
                    assetRoot : path.join(__dirname,'../')
                }))
                .pipe(es.map(function (file, cb) {
                    file.pipe(es.wait(function (err, data) {
                        assert.isNull(err, 'Unexpected error');
                        assert.equal(data.toString('utf8'), expected.toString('utf8'));
                        cb(null, file);
                    }));
                }))
                .pipe(es.wait(function (err) {
                    assert.isNull(err, 'Unexpected error');
                    done();
                }));
        });
    });

    describe('in buffer mode', function () {
        it('should cache bust asset references', function (done) {
            var file = new File({
                contents: makeCSSBuffer(asset => asset)
            });

            es.readArray([file])
                .pipe(buster({
                    assetURL: 'https://example.com',
                    assetRoot : path.join(__dirname,'../')
                }))
                .pipe(es.map(function (file, cb) {
                    file.pipe(es.wait(function (err, data) {
                        assert.isNull(err, 'Unexpected error');
                        assert.equal(data.toString('utf8'), expected.toString('utf8'));
                        cb(null, file);
                    }));
                }))
                .pipe(es.wait(function (err) {
                    assert.isNull(err, 'Unexpected error');
                    done();
                }));
        });
    });

    describe('with null files', function () {
        it('should cache bust asset references', function (done) {
            var file = new File({
                path: __dirname,
                contents: null
            });
            es.readArray([file])
                .pipe(buster({
                    assetURL: 'https://example.com',
                    assetRoot : path.join(__dirname,'../')
                }))
                .pipe(es.map(function (file, cb) {
                    assert.ok(file.isNull());
                    cb(null, file);
                }))
                .pipe(es.wait(function (err) {
                    assert.isNull(err, 'Unexpected error');
                    done();
                }));
        });
    });

    describe('with a custom assetRoot option', function () {
        it('should cache bust asset references', function (done) {
            createDistAssets();
            var expectedDist = makeCSSBuffer(function (asset) {
                return 'https://example.com' + asset + '?v=' + fs.statSync(path.join(__dirname, '/../dist', asset)).mtime.valueOf();
            });

            var file = new File({
                contents: makeCSSBuffer(path => path)
            });

            es.readArray([file])
                .pipe(buster({
                    assetRoot: path.join(__dirname, '../dist'),
                    assetURL: 'https://example.com'
                }))
                .pipe(es.map(function (file, cb) {
                    file.pipe(es.wait(function (err, data) {
                        assert.isNull(err, 'Unexpected error');
                        assert.equal(data.toString('utf8'), expectedDist.toString('utf8'));
                        cb(null, file);
                    }));
                }))
                .pipe(es.wait(function (err) {
                    assert.isNull(err, 'Unexpected error');
                    done();
                }));
        });
    });


    describe('with unrecognised asset reference', function () {
        it('should not add cache busting query to asset url', function (done) {
            removeAssets();
            var file = new File({
                contents: makeCSSBuffer(asset => asset)
            });

            es.readArray([file])
                .pipe(buster({
                    assetURL: 'https://example.com',
                    assetRoot : path.join(__dirname,'../')
                }))
                .pipe(es.map(function (file, cb) {
                    var exp = makeCSSBuffer(asset => asset);
                    file.pipe(es.wait(function (err, data) {
                        assert.isNull(err, 'Unexpected error');
                        assert.equal(data.toString('utf8'), exp.toString('utf8'));
                        cb(null, file);
                    }));
                }))
                .pipe(es.wait(function (err) {
                    assert.isNull(err, 'Unexpected error');
                    done();
                }));
        });
    });

});
