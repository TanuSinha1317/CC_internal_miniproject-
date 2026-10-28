/**
 * MiniLang Lexical Analyzer - Client Script
 * Simple, clean logic for college project demonstration
 */

// Fallback Standalone Lexer Engine
const KEYWORDS = new Set(['START', 'END', 'INT', 'FLOAT', 'STRING', 'IF', 'ELSE', 'THEN', 'ENDIF', 'WHILE', 'DO', 'PRINT', 'TRUE', 'FALSE']);
const DELIMITERS = new Set(['(', ')', '{', '}', ';', ',', '[', ']']);

class ClientLexer {
  constructor(source) {
    this.source = source || '';
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.length = this.source.length;
    
    this.tokens = [];
    this.errors = [];
    this.symbolTableMap = new Map();
    this.tokenCounter = 1;
    this.errorCounter = 1;
  }

  peekChar() {
    return this.pos < this.length ? this.source[this.pos] : null;
  }

  peekNextChar() {
    return this.pos + 1 < this.length ? this.source[this.pos + 1] : null;
  }

  advanceChar() {
    if (this.pos >= this.length) return null;
    const ch = this.source[this.pos++];
    if (ch === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return ch;
  }

  isAlpha(ch) {
    return ch ? ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') : false;
  }

  isDigit(ch) {
    return ch ? (ch >= '0' && ch <= '9') : false;
  }

  isAlnum(ch) {
    return this.isAlpha(ch) || this.isDigit(ch);
  }

  tokenize() {
    while (this.pos < this.length) {
      const ch = this.peekChar();

      // Skip whitespace
      if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
        this.advanceChar();
        continue;
      }

      // Single line comments
      if (ch === '/' && this.peekNextChar() === '/') {
        this.advanceChar();
        this.advanceChar();
        while (this.pos < this.length && this.peekChar() !== '\n' && this.peekChar() !== '\r') {
          this.advanceChar();
        }
        continue;
      }

      // Strings
      if (ch === '"') {
        this.scanString();
        continue;
      }

      // Identifiers / Keywords
      if (this.isAlpha(ch)) {
        this.scanIdentifierOrKeyword();
        continue;
      }

      // Numbers
      if (this.isDigit(ch)) {
        this.scanNumber();
        continue;
      }

      // Operators
      if (['+', '-', '*', '/', '=', '>', '<', '!', '&', '|'].includes(ch)) {
        this.scanOperator();
        continue;
      }

      // Delimiters
      if (DELIMITERS.has(ch)) {
        const startLine = this.line, startCol = this.column;
        const lexeme = this.advanceChar();
        this.addToken(lexeme, 'DELIMITER', startLine, startCol);
        continue;
      }

      // Invalid Characters
      const startLine = this.line, startCol = this.column;
      const invalidChar = this.advanceChar();
      this.addError(invalidChar, 'Invalid character', startLine, startCol);
    }

    this.processSymbolTable();

    return {
      tokens: this.tokens,
      symbolTable: Array.from(this.symbolTableMap.values()),
      errors: this.errors
    };
  }

  scanString() {
    const startLine = this.line, startCol = this.column;
    let lexeme = this.advanceChar();
    let terminated = false;
    while (this.pos < this.length) {
      const ch = this.peekChar();
      if (ch === '\n' || ch === '\r') break;
      if (ch === '"') {
        lexeme += this.advanceChar();
        terminated = true;
        break;
      }
      lexeme += this.advanceChar();
    }

    if (terminated) {
      this.addToken(lexeme, 'STRING', startLine, startCol);
    } else {
      this.addError(lexeme, 'Unterminated string literal', startLine, startCol);
    }
  }

  scanIdentifierOrKeyword() {
    const startLine = this.line, startCol = this.column;
    let lexeme = '';
    while (this.pos < this.length && this.isAlnum(this.peekChar())) {
      lexeme += this.advanceChar();
    }

    if (KEYWORDS.has(lexeme)) {
      this.addToken(lexeme, 'KEYWORD', startLine, startCol);
    } else {
      this.addToken(lexeme, 'IDENTIFIER', startLine, startCol);
    }
  }

  scanNumber() {
    const startLine = this.line, startCol = this.column;
    let lexeme = '', dotCount = 0, hasLetters = false;

    while (this.pos < this.length) {
      const ch = this.peekChar();
      if (this.isDigit(ch)) {
        lexeme += this.advanceChar();
      } else if (ch === '.') {
        dotCount++;
        lexeme += this.advanceChar();
      } else if (this.isAlpha(ch)) {
        hasLetters = true;
        lexeme += this.advanceChar();
      } else {
        break;
      }
    }

    if (hasLetters) {
      this.addError(lexeme, 'Invalid identifier starting with digit', startLine, startCol);
    } else if (dotCount > 1 || lexeme.endsWith('.')) {
      this.addError(lexeme, 'Malformed floating-point number', startLine, startCol);
    } else if (dotCount === 1) {
      this.addToken(lexeme, 'FLOAT', startLine, startCol);
    } else {
      this.addToken(lexeme, 'INTEGER', startLine, startCol);
    }
  }

  scanOperator() {
    const startLine = this.line, startCol = this.column;
    const ch = this.peekChar();
    const nextCh = this.peekNextChar();
    const twoChar = ch + (nextCh || '');
    let lexeme = '';

    if (['==', '!=', '>=', '<=', '&&', '||'].includes(twoChar)) {
      lexeme = twoChar;
      this.advanceChar();
      this.advanceChar();
    } else if (['+', '-', '*', '/', '=', '>', '<'].includes(ch)) {
      lexeme = ch;
      this.advanceChar();
    } else {
      lexeme = ch;
      this.advanceChar();
      this.addError(lexeme, 'Invalid symbol', startLine, startCol);
      return;
    }

    this.addToken(lexeme, 'OPERATOR', startLine, startCol);
  }

  addToken(lexeme, type, line, column) {
    this.tokens.push({ tokenNo: this.tokenCounter++, lexeme, type, line, column });
  }

  addError(lexeme, description, line, column) {
    this.errors.push({ errorNo: this.errorCounter++, lexeme, description, line, column });
  }

  processSymbolTable() {
    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      if (token.type === 'IDENTIFIER') {
        let type = 'IDENTIFIER';

        if (i > 0 && ['INT', 'FLOAT', 'STRING'].includes(this.tokens[i - 1].lexeme)) {
          const kw = this.tokens[i - 1].lexeme;
          if (kw === 'INT') type = 'INTEGER';
          else if (kw === 'FLOAT') type = 'FLOAT';
          else if (kw === 'STRING') type = 'STRING';
        }

        if (!this.symbolTableMap.has(token.lexeme)) {
          this.symbolTableMap.set(token.lexeme, {
            identifier: token.lexeme,
            type: type,
            line: token.line
          });
        }
      }
    }
  }
}

// DOM Binding
document.addEventListener('DOMContentLoaded', () => {
  const codeInput = document.getElementById('code-input');
  const btnAnalyze = document.getElementById('btn-analyze');
  const btnClear = document.getElementById('btn-clear');

  btnAnalyze.addEventListener('click', runLexicalAnalysis);
  btnClear.addEventListener('click', () => {
    codeInput.value = '';
    clearResults();
  });

  // Run on initial load
  runLexicalAnalysis();
});

async function runLexicalAnalysis() {
  const codeInput = document.getElementById('code-input');
  const sourceCode = codeInput.value;

  let data;

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceCode })
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success) {
        data = formatBackendData(result.data);
      }
    }
  } catch (e) {
    console.warn('API unavailable, running client lexer.');
  }

  if (!data) {
    const lexer = new ClientLexer(sourceCode);
    data = lexer.tokenize();
  }

  renderResults(data);
}

function formatBackendData(backendData) {
  // Convert backend token types to clean prompt formats (e.g. OPERATOR, INTEGER, FLOAT)
  const tokens = backendData.tokens.map(t => {
    let cleanType = t.type;
    if (t.type.includes('OPERATOR')) cleanType = 'OPERATOR';
    else if (t.type === 'INTEGER_CONSTANT') cleanType = 'INTEGER';
    else if (t.type === 'FLOAT_CONSTANT') cleanType = 'FLOAT';
    else if (t.type === 'STRING_LITERAL') cleanType = 'STRING';
    return {
      lexeme: t.lexeme,
      type: cleanType,
      line: t.line,
      column: t.column
    };
  });

  const symbolTable = backendData.symbolTable.map(s => {
    let cleanType = s.dataType !== 'UNKNOWN' ? s.dataType : 'IDENTIFIER';
    if (cleanType === 'INT') cleanType = 'INTEGER';
    return {
      identifier: s.identifier,
      type: cleanType,
      line: s.line
    };
  });

  const errors = backendData.errors.map(e => ({
    lexeme: e.lexeme,
    description: e.description || e.type,
    line: e.line,
    column: e.column
  }));

  return { tokens, symbolTable, errors };
}

function renderResults(data) {
  // Update Summary Bar
  const summaryText = document.getElementById('summary-text');
  summaryText.innerText = `${data.tokens.length} Tokens | ${data.symbolTable.length} Identifiers | ${data.errors.length} Errors`;

  // Render Token Table
  const tokenBody = document.querySelector('#table-tokens tbody');
  if (data.tokens.length === 0) {
    tokenBody.innerHTML = `<tr><td colspan="4" class="placeholder-text">No tokens generated.</td></tr>`;
  } else {
    tokenBody.innerHTML = data.tokens.map(t => `
      <tr>
        <td><code>${escapeHtml(t.lexeme)}</code></td>
        <td>${t.type}</td>
        <td>${t.line}</td>
        <td>${t.column}</td>
      </tr>
    `).join('');
  }

  // Render Symbol Table
  const symbolBody = document.querySelector('#table-symbol tbody');
  if (data.symbolTable.length === 0) {
    symbolBody.innerHTML = `<tr><td colspan="3" class="placeholder-text">No identifiers detected.</td></tr>`;
  } else {
    symbolBody.innerHTML = data.symbolTable.map(s => `
      <tr>
        <td><code>${escapeHtml(s.identifier)}</code></td>
        <td>${s.type}</td>
        <td>${s.line}</td>
      </tr>
    `).join('');
  }

  // Render Lexical Errors
  const noErrorsMsg = document.getElementById('no-errors-msg');
  const tableErrors = document.getElementById('table-errors');
  const errorBody = document.querySelector('#table-errors tbody');

  if (data.errors.length === 0) {
    noErrorsMsg.classList.remove('hidden');
    tableErrors.classList.add('hidden');
  } else {
    noErrorsMsg.classList.add('hidden');
    tableErrors.classList.remove('hidden');
    errorBody.innerHTML = data.errors.map(e => `
      <tr>
        <td><code>${escapeHtml(e.lexeme)}</code></td>
        <td style="color: var(--danger);">${escapeHtml(e.description)}</td>
        <td>${e.line}</td>
        <td>${e.column}</td>
      </tr>
    `).join('');
  }
}

function clearResults() {
  document.getElementById('summary-text').innerText = '0 Tokens | 0 Identifiers | 0 Errors';
  document.querySelector('#table-tokens tbody').innerHTML = `<tr><td colspan="4" class="placeholder-text">Click "Analyze Code" to display tokens.</td></tr>`;
  document.querySelector('#table-symbol tbody').innerHTML = `<tr><td colspan="3" class="placeholder-text">No identifiers detected.</td></tr>`;
  document.getElementById('no-errors-msg').classList.remove('hidden');
  document.getElementById('table-errors').classList.add('hidden');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}
