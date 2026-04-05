"use strict";

var express = require('express');

var router = express.Router();

var Anthropic = require('@anthropic-ai/sdk');

var multer = require('multer');

var fs = require('fs');

var upload = multer({
  dest: 'uploads/'
});
var client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});
router.post('/analyze-image', upload.single('image'), function _callee(req, res) {
  var imageFile, imageData, base64Image, mimeType, response, raw, parsed;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          imageFile = req.file;

          if (imageFile) {
            _context.next = 4;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            error: 'No image provided'
          }));

        case 4:
          // Read image and convert to base64
          imageData = fs.readFileSync(imageFile.path);
          base64Image = imageData.toString('base64');
          mimeType = imageFile.mimetype; // e.g., image/jpeg

          _context.next = 9;
          return regeneratorRuntime.awrap(client.messages.create({
            model: 'claude-opus-4-5',
            max_tokens: 300,
            messages: [{
              role: 'user',
              content: [{
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: base64Image
                }
              }, {
                type: 'text',
                text: "You are an assistant for a neighbourhood issue reporting app.\nAnalyze this image and respond ONLY in this exact JSON format, no extra text:\n{\n  \"caption\": \"A short 1-sentence description of the issue visible in the image\",\n  \"category\": \"One of: Pothole, Road Damage, Broken Sidewalk, Flooding, Street Light, Garbage, Other\"\n}"
              }]
            }]
          }));

        case 9:
          response = _context.sent;
          // Clean up temp file
          fs.unlinkSync(imageFile.path);
          raw = response.content[0].text.trim();
          parsed = JSON.parse(raw);
          res.json(parsed);
          _context.next = 20;
          break;

        case 16:
          _context.prev = 16;
          _context.t0 = _context["catch"](0);
          console.error('Claude API error:', _context.t0);
          res.status(500).json({
            error: 'Failed to analyze image'
          });

        case 20:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 16]]);
});
module.exports = router;