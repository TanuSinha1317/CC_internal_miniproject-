/**
 * Express Web Server for MiniLang Lexical Analyzer
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Lexer } from './lexer/Lexer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// API Endpoint for Lexical Analysis
app.post('/api/analyze', (req, res) => {
  try {
    const { sourceCode } = req.body;

    if (typeof sourceCode !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request payload: sourceCode must be a string.'
      });
    }

    const lexer = new Lexer(sourceCode);
    const result = lexer.tokenize();

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Lexical analysis error:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred during lexical analysis.'
    });
  }
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  MiniLang Lexical Analyzer Server Running!`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
