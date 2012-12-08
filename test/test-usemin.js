"use strict";

var fs      = require('fs');
var path    = require('path');
var grunt   = require('grunt');
var assert  = require('assert');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');

grunt.task.init([]);
grunt.config.init({});

var usemin = require('../tasks/usemin.js')(grunt);

var opts = grunt.cli.options;
opts.redirect = !opts.silent;

var directory = function directory(dir) {
  return function directory(done) {
    process.chdir(__dirname );
    rimraf(dir, function(err) {
      if(err) { return done(err); }
      mkdirp(dir, function(err) {
        if(err) { return done(err); }
        process.chdir(dir);
        done();
      });
    });
  };
};

var gruntfile = function(options, taskMap) {
  return function gruntfile(done) {
    var config = 'grunt.initConfig(' + JSON.stringify(options, null, 2) + ');';
    config = config.split('\n').map(function(line) {
      return '  ' + line;
    }).join('\n');

    var tasks = Object.keys(taskMap || {}).map(function(key) {
      return '\ngrunt.registerTask(\'' + key + '\', ' + taskMap[key] + ');';
    }).join('\n');

    var out = [
      'module.exports = function(grunt) {',
      config,
      tasks,
      '};'
    ];

    fs.writeFile('Gruntfile.js', out.join('\n'), done);
  };
};


// XXX Conform to coding guidelines, mostly literral spacing stuff
describe('usemin', function() {
  before(directory('temp'));

  it("should take into account path", function() {
    grunt.file.mkdir('images');
    grunt.file.mkdir('images/misc');
    grunt.file.write('images/23012.test.png', "foo");
    grunt.file.write('images/misc/2a436.test.png', "foo");
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('usemin', {html: "index.html"});
    grunt.file.copy(path.join(__dirname,"fixtures/usemin.html"), "index.html");
    grunt.task.run('usemin');
    grunt.task.start();

    var changed = grunt.file.read("index.html");

    // Check replace has performed its duty
    assert.ok( changed.match(/img[^\>]+src=['"]images\/23012\.test\.png["']/) );
    assert.ok( changed.match(/img[^\>]+src=['"]images\/misc\/2a436\.test\.png["']/) );
    assert.ok( changed.match(/img[^\>]+src=['"]\/\/images\/test\.png["']/) );
    assert.ok( changed.match(/img[^\>]+src=['"]\/images\/23012.test\.png["']/) );
    assert.ok( changed.match('<a href="http://foo/bar"></a><a href="ftp://bar"></a><a href="images/23012.test.png"></a><a href="/images/23012.test.png"></a><a href="#local"></a>'));
  });

  it("should work on CSS files", function() {
    grunt.file.mkdir('images');
    grunt.file.mkdir('images/misc');
    grunt.file.write('images/23012.test.png', "foo");
    grunt.file.write('images/misc/2a436.test.png', "foo");
    grunt.log.muted = true;
    grunt.config.init();
    grunt.config('usemin', {css: "style.css"});
    grunt.file.copy(path.join(__dirname,"fixtures/style.css"), "style.css");
    grunt.task.run('usemin');
    grunt.task.start();

    var changed = grunt.file.read("style.css");

    // Check replace has performed its duty
    assert.ok( changed.match(/url\(\"images\/23012\.test\.png\"/) );
    assert.ok( changed.match(/url\(\"images\/misc\/2a436\.test\.png\"/) );
    assert.ok( changed.match(/url\(\"\/\/images\/test\.png\"/) );
    assert.ok( changed.match(/url\(\"\/images\/23012.test\.png\"/) );
  });

  describe('usemin-handler', function() {
    it("should update the config (HTML)", function() {
      grunt.log.muted = true;
      grunt.config.init();
      grunt.config('usemin-handler', {html: "index.html"});
      grunt.file.copy(path.join(__dirname,"fixtures/usemin.html"), "index.html");
      grunt.task.run('usemin-handler');
      grunt.task.start();

      var concat = grunt.config('concat');
      assert.ok(concat['scripts/plugins.js']);
      assert.equal(concat['scripts/plugins.js'].length, 13);

      var rjs = grunt.config('rjs');
      assert.ok(rjs.name);
      assert.equal(rjs.name, 'scripts/main');
      assert.equal(rjs.out, 'scripts/amd-app.js');

      var min = grunt.config('min');
      assert.equal(min['scripts/amd-app.js'], 'scripts/amd-app.js');
      assert.equal(min['scripts/plugins.js'], 'scripts/plugins.js');

    });
  });
});

