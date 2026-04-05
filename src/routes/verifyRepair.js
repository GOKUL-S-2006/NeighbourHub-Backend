const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const Groq = require('groq-sdk');
require("dotenv").config();

const upload = multer({ dest: 'uploads/' });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/verify-repair', upload.single('afterImage'), async (req, res) => {
  try {
    const { beforeImageUrl, category, issueTitle } = req.body;

    if (!req.file) return res.status(400).json({ error: 'After image is required' });

    // Read after image as base64
    const afterBuffer  = fs.readFileSync(req.file.path);
    const afterBase64  = afterBuffer.toString('base64');
    const afterMime    = req.file.mimetype || 'image/jpeg';

    try { fs.unlinkSync(req.file.path); } catch (_) {}

    // Build messages — send both images to Groq
    const messages = [
      {
        role: 'user',
        content: [
          // Before image (from Cloudinary URL)
          ...(beforeImageUrl ? [{
            type: 'image_url',
            image_url: { url: beforeImageUrl },
          }] : []),

          // After image (uploaded by admin)
          {
            type: 'image_url',
            image_url: { url: `data:${afterMime};base64,${afterBase64}` },
          },

          {
            type: 'text',
            text: `You are an AI verifier for a government accountability system.
${beforeImageUrl ? 'Image 1 is the BEFORE photo showing the reported issue.' : 'There is no before photo available.'}
The last image is the AFTER photo uploaded by the government admin claiming the issue is fixed.

Issue title: "${issueTitle}"
Category: "${category}"

Analyze carefully and respond ONLY in this exact JSON format, no extra text:
{
  "isRepaired": true or false,
  "confidence": a number from 0 to 100,
  "reason": "One clear sentence explaining your decision"
}

Be strict — only confirm repair if there is clear visible evidence of the fix.`,
          },
        ],
      },
    ];

    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages,
      max_tokens: 200,
    });

    const raw = response.choices[0]?.message?.content?.trim() || '{}';
    console.log('Verify AI response:', raw);

    let isRepaired = false;
    let confidence = 0;
    let reason     = 'Could not verify repair.';

    try {
      const parsed = JSON.parse(raw);
      isRepaired = parsed.isRepaired === true;
      confidence = parsed.confidence || 0;
      reason     = parsed.reason || reason;
    } catch (_) {
      reason = raw; // fallback to raw text
    }

    res.json({ isRepaired, confidence, reason });

  } catch (err) {
    try { if (req.file) fs.unlinkSync(req.file.path); } catch (_) {}
    console.error('Verify repair error:', err.message);
    res.status(500).json({ error: 'Failed to verify repair' });
  }
});

module.exports = router;