'use strict';

var Promise = require('bluebird');
var express = require('express');
var multer = require('multer');
var path = require('path');
var crypto = require('crypto');
var fs = Promise.promisifyAll(require('fs'));
var bs58 = require('bs58');

var imageFolder = "img/";

var generateFilename = function(extension) {
	var filename = bs58.encode(crypto.randomBytes(5)) + extension;

	return Promise.try(function() {
		return fs.statAsync(imageFolder + filename);
	}).then(function() {
		return generateFilename(extension);
	}).catchReturn(filename);
};

var storage = multer.diskStorage({
	destination: imageFolder,
	filename: function (req, file, cb) {
		var parsedFilename = path.parse(file.originalname);

		Promise.try(function() {
			return generateFilename(parsedFilename.ext);
		}).then(function (filename) {
			cb(null, filename);
		});
	}
});

var upload = multer({storage: storage});

var app = express();

app.set('view engine', 'jade');
app.use(express.static('public'));

app.get('/', function (req, res) {
	res.render("main");
});

app.post("/upload", upload.single('image'), function (req, res) {
	res.redirect("/" + path.parse(req.file.path).base);
});

app.get("/:image", function(req, res) {
	res.sendFile(__dirname + "/img/" + path.parse(req.params.image).base);
});

var server = app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Site listening at http://%s:%s', host, port);
});
