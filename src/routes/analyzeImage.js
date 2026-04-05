const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const Groq = require('groq-sdk');
require("dotenv").config();

const upload = multer({ dest: 'uploads/' });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function analyzeCaption(caption) {
  const text = caption.toLowerCase();

  let category = 'general';
  if (text.includes('road') || text.includes('pothole') || text.includes('crack') || text.includes('pavement') || text.includes('asphalt'))
    category = 'road';
  else if (text.includes('water') || text.includes('flood') || text.includes('drain') || text.includes('pipe'))
    category = 'water';
  else if (text.includes('light') || text.includes('electric') || text.includes('wire') || text.includes('power'))
    category = 'electricity';
  else if (text.includes('garbage') || text.includes('waste') || text.includes('trash') || text.includes('litter'))
    category = 'sanitation';

  let severity = 'Low';
  if (text.includes('large') || text.includes('big') || text.includes('severe') || text.includes('broken') || text.includes('flood') || text.includes('danger') || text.includes('collapsed'))
    severity = 'High';
  else if (text.includes('crack') || text.includes('damage') || text.includes('leak') || text.includes('hole') || text.includes('pothole'))
    severity = 'Medium';

  const priority = severity === 'High' ? 'high' : severity === 'Medium' ? 'medium' : 'low';
  return { category, severity, priority };
}

router.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    try { fs.unlinkSync(req.file.path); } catch (_) {}

    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Image}` }
            },
            {
              type: 'text',
              text: 'You are an assistant for a neighbourhood issue reporting app. Analyze this image and respond ONLY in this exact JSON format, no extra text:\n{\n  "title": "Short 4-6 word title of the issue",\n  "description": "One clear sentence describing the damage or problem visible"\n}'
            }
          ]
        }
      ],
      max_tokens: 150,
    });

    const raw = response.choices[0]?.message?.content?.trim() || '{}';
    console.log('Raw AI response:', raw);

    let title = 'Neighbourhood Issue';
    let description = 'Issue detected. Please add details.';

    try {
      const parsed = JSON.parse(raw);
      if (parsed.title) title = parsed.title;
      if (parsed.description) description = parsed.description;
    } catch (_) {
      description = raw;
    }

    const { category, severity, priority } = analyzeCaption(description);

    res.json({ title, description, category, severity, priority });

  } catch (err) {
    try { if (req.file) fs.unlinkSync(req.file.path); } catch (_) {}
    console.error('Analysis error:', err.message);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

module.exports = router;