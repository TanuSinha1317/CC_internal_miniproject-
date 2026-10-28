/**
 * Token Types and Constants for MiniLang Lexical Analyzer
 */

export const TokenType = {
  // Keywords
  KEYWORD: 'KEYWORD',
  
  // Identifiers
  IDENTIFIER: 'IDENTIFIER',
  
  // Constants
  INTEGER: 'INTEGER_CONSTANT',
  FLOAT: 'FLOAT_CONSTANT',
  STRING: 'STRING_LITERAL',
  BOOLEAN: 'BOOLEAN_CONSTANT',
  
  // Operators
  ARITHMETIC_OPERATOR: 'ARITHMETIC_OPERATOR',
  ASSIGNMENT_OPERATOR: 'ASSIGNMENT_OPERATOR',
  RELATIONAL_OPERATOR: 'RELATIONAL_OPERATOR',
  LOGICAL_OPERATOR: 'LOGICAL_OPERATOR',
  
  // Delimiters
  DELIMITER: 'DELIMITER',
  
  // Comments
  COMMENT: 'COMMENT',
  
  // EOF
  EOF: 'EOF'
};

export const KEYWORDS = new Set([
  'START',
  'END',
  'INT',
  'FLOAT',
  'STRING',
  'IF',
  'ELSE',
  'THEN',
  'ENDIF',
  'WHILE',
  'DO',
  'PRINT',
  'TRUE',
  'FALSE'
]);

export const BOOLEAN_CONSTANTS = new Set(['TRUE', 'FALSE']);

export const DATA_TYPES = new Set(['INT', 'FLOAT', 'STRING']);

export const DELIMITERS = new Set(['(', ')', '{', '}', ';', ',', '[', ']']);

export const OPERATORS = new Set([
  '+', '-', '*', '/',
  '=', '==', '!=',
  '>', '<', '>=', '<=',
  '&&', '||'
]);

export const LexicalErrorType = {
  INVALID_CHARACTER: 'INVALID_CHARACTER',
  INVALID_IDENTIFIER: 'INVALID_IDENTIFIER',
  UNTERMINATED_STRING: 'UNTERMINATED_STRING',
  MALFORMED_NUMBER: 'MALFORMED_NUMBER',
  INVALID_SYMBOL: 'INVALID_SYMBOL'
};
