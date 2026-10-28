/**
 * LexicalError Class
 * Represents a lexical error detected during scanning
 */

export class LexicalError {
  constructor(errorNo, lexeme, type, line, column, description) {
    this.errorNo = errorNo;
    this.lexeme = lexeme;
    this.type = type;
    this.line = line;
    this.column = column;
    this.description = description;
  }

  toJSON() {
    return {
      errorNo: this.errorNo,
      lexeme: this.lexeme,
      type: this.type,
      line: this.line,
      column: this.column,
      description: this.description
    };
  }
}
