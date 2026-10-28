/**
 * Lexer Engine for Custom MiniLang
 * Performs state-based character-by-character lexical analysis.
 */

import { Token } from './Token.js';
import { LexicalError } from './LexicalError.js';
import { SymbolTable } from './SymbolTable.js';
import {
  TokenType,
  KEYWORDS,
  DELIMITERS,
  OPERATORS,
  LexicalErrorType
} from './TokenTypes.js';

export class Lexer {
  constructor(sourceCode = '') {
    this.source = sourceCode;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.length = sourceCode.length;
    
    this.tokens = [];
    this.errors = [];
    this.comments = [];
    this.symbolTable = new SymbolTable();
    this.tokenCounter = 1;
    this.errorCounter = 1;

    // Statistics
    this.stats = {
      totalTokens: 0,
      keywords: 0,
      identifiers: 0,
      constants: 0,
      operators: 0,
      delimiters: 0,
      comments: 0,
      errors: 0
    };
  }

  /**
   * Reset lexer with new source code
   */
  reset(sourceCode) {
    this.source = sourceCode;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.length = sourceCode.length;
    this.tokens = [];
    this.errors = [];
    this.comments = [];
    this.symbolTable.clear();
    this.tokenCounter = 1;
    this.errorCounter = 1;
    this.stats = {
      totalTokens: 0,
      keywords: 0,
      identifiers: 0,
      constants: 0,
      operators: 0,
      delimiters: 0,
      comments: 0,
      errors: 0
    };
  }

  peekChar() {
    if (this.pos >= this.length) return null;
    return this.source[this.pos];
  }

  peekNextChar() {
    if (this.pos + 1 >= this.length) return null;
    return this.source[this.pos + 1];
  }

  advanceChar() {
    if (this.pos >= this.length) return null;
    const ch = this.source[this.pos];
    this.pos++;
    if (ch === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return ch;
  }

  isAlpha(ch) {
    if (!ch) return false;
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
  }

  isDigit(ch) {
    if (!ch) return false;
    return ch >= '0' && ch <= '9';
  }

  isAlnum(ch) {
    return this.isAlpha(ch) || this.isDigit(ch);
  }

  isWhitespace(ch) {
    return ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n';
  }

  /**
   * Run full lexical analysis on source code
   */
  tokenize() {
    while (this.pos < this.length) {
      const ch = this.peekChar();

      // Skip Whitespace
      if (this.isWhitespace(ch)) {
        this.advanceChar();
        continue;
      }

      // Check for Comments (//)
      if (ch === '/' && this.peekNextChar() === '/') {
        this.scanComment();
        continue;
      }

      // String Literals ("...")
      if (ch === '"') {
        this.scanString();
        continue;
      }

      // Identifiers or Keywords
      if (this.isAlpha(ch)) {
        this.scanIdentifierOrKeyword();
        continue;
      }

      // Numbers or Invalid Identifier starting with digit (e.g. 123abc)
      if (this.isDigit(ch)) {
        this.scanNumber();
        continue;
      }

      // Multi-character / Single-character Operators
      if (this.isOperatorStart(ch)) {
        this.scanOperator();
        continue;
      }

      // Delimiters
      if (DELIMITERS.has(ch)) {
        const startCol = this.column;
        const startLine = this.line;
        const lexeme = this.advanceChar();
        this.addToken(lexeme, TokenType.DELIMITER, startLine, startCol);
        this.stats.delimiters++;
        continue;
      }

      // Invalid character / Unknown symbol (e.g. @, $, #)
      const startCol = this.column;
      const startLine = this.line;
      const invalidChar = this.advanceChar();
      this.addError(
        invalidChar,
        LexicalErrorType.INVALID_CHARACTER,
        startLine,
        startCol,
        `Invalid character '${invalidChar}' found in input.`
      );
    }

    // Process symbol table for all valid identifier tokens
    this.symbolTable.processTokens(this.tokens);

    return {
      tokens: this.tokens,
      symbolTable: this.symbolTable.getAllEntries(),
      errors: this.errors,
      comments: this.comments,
      stats: this.stats
    };
  }

  scanComment() {
    const startLine = this.line;
    const startCol = this.column;
    let commentText = '';

    // Consume '//'
    commentText += this.advanceChar();
    commentText += this.advanceChar();

    // Consume till end of line or EOF
    while (this.pos < this.length && this.peekChar() !== '\n' && this.peekChar() !== '\r') {
      commentText += this.advanceChar();
    }

    this.comments.push({
      commentNo: this.comments.length + 1,
      lexeme: commentText,
      line: startLine,
      column: startCol
    });
    this.stats.comments++;
  }

  scanString() {
    const startLine = this.line;
    const startCol = this.column;
    let strLexeme = '';

    // Consume initial quote '"'
    strLexeme += this.advanceChar();

    let terminated = false;

    while (this.pos < this.length) {
      const ch = this.peekChar();

      if (ch === '\n' || ch === '\r') {
        // String contains unescaped newline before closing quote -> Unterminated String
        break;
      }

      if (ch === '"') {
        strLexeme += this.advanceChar();
        terminated = true;
        break;
      }

      strLexeme += this.advanceChar();
    }

    if (terminated) {
      this.addToken(strLexeme, TokenType.STRING, startLine, startCol);
      this.stats.constants++;
    } else {
      this.addError(
        strLexeme,
        LexicalErrorType.UNTERMINATED_STRING,
        startLine,
        startCol,
        `Unterminated string literal: missing closing double quote "`
      );
    }
  }

  scanIdentifierOrKeyword() {
    const startLine = this.line;
    const startCol = this.column;
    let lexeme = '';

    while (this.pos < this.length && this.isAlnum(this.peekChar())) {
      lexeme += this.advanceChar();
    }

    if (KEYWORDS.has(lexeme)) {
      this.addToken(lexeme, TokenType.KEYWORD, startLine, startCol);
      this.stats.keywords++;
    } else {
      this.addToken(lexeme, TokenType.IDENTIFIER, startLine, startCol);
      this.stats.identifiers++;
    }
  }

  scanNumber() {
    const startLine = this.line;
    const startCol = this.column;
    let lexeme = '';
    let dotCount = 0;
    let hasLetters = false;

    // Scan token sequence of digits, dots, letters
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

    // Classify
    if (hasLetters) {
      // e.g., 123abc -> Invalid Identifier starting with digit
      this.addError(
        lexeme,
        LexicalErrorType.INVALID_IDENTIFIER,
        startLine,
        startCol,
        `Invalid identifier '${lexeme}': identifiers cannot start with a digit.`
      );
    } else if (dotCount > 1 || lexeme.endsWith('.')) {
      // e.g., 12.5.6 or 12. -> Malformed Number
      this.addError(
        lexeme,
        LexicalErrorType.MALFORMED_NUMBER,
        startLine,
        startCol,
        `Malformed floating-point number '${lexeme}'.`
      );
    } else if (dotCount === 1) {
      this.addToken(lexeme, TokenType.FLOAT, startLine, startCol);
      this.stats.constants++;
    } else {
      this.addToken(lexeme, TokenType.INTEGER, startLine, startCol);
      this.stats.constants++;
    }
  }

  isOperatorStart(ch) {
    return ['+', '-', '*', '/', '=', '>', '<', '!', '&', '|'].includes(ch);
  }

  scanOperator() {
    const startLine = this.line;
    const startCol = this.column;
    const ch = this.peekChar();
    const nextCh = this.peekNextChar();
    let lexeme = '';

    // Two-character operators check
    const twoChar = ch + (nextCh || '');
    if (['==', '!=', '>=', '<=', '&&', '||'].includes(twoChar)) {
      lexeme = twoChar;
      this.advanceChar();
      this.advanceChar();
    } else if (['+', '-', '*', '/', '=', '>', '<'].includes(ch)) {
      lexeme = ch;
      this.advanceChar();
    } else if (ch === '!') {
      // Single '!' without '=' is invalid symbol in MiniLang
      lexeme = ch;
      this.advanceChar();
      this.addError(
        lexeme,
        LexicalErrorType.INVALID_SYMBOL,
        startLine,
        startCol,
        `Invalid symbol '!'. Did you mean '!='?`
      );
      return;
    } else {
      lexeme = ch;
      this.advanceChar();
    }

    let type = TokenType.ARITHMETIC_OPERATOR;
    if (lexeme === '=') type = TokenType.ASSIGNMENT_OPERATOR;
    else if (['==', '!=', '>', '<', '>=', '<='].includes(lexeme)) type = TokenType.RELATIONAL_OPERATOR;
    else if (['&&', '||'].includes(lexeme)) type = TokenType.LOGICAL_OPERATOR;
    else if (['+', '-', '*', '/'].includes(lexeme)) type = TokenType.ARITHMETIC_OPERATOR;

    this.addToken(lexeme, type, startLine, startCol);
    this.stats.operators++;
  }

  addToken(lexeme, type, line, column) {
    const token = new Token(this.tokenCounter++, lexeme, type, line, column);
    this.tokens.push(token);
    this.stats.totalTokens++;
  }

  addError(lexeme, type, line, column, description) {
    const error = new LexicalError(this.errorCounter++, lexeme, type, line, column, description);
    this.errors.push(error);
    this.stats.errors++;
  }
}
