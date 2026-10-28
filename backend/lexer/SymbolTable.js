/**
 * SymbolTable Class
 * Maintains information about identifiers in MiniLang program
 */

export class SymbolTable {
  constructor() {
    this.entries = new Map();
  }

  /**
   * Add or update an identifier entry
   */
  addIdentifier(name, line, column, declaredType = null, value = null) {
    if (!this.entries.has(name)) {
      this.entries.set(name, {
        identifier: name,
        type: 'IDENTIFIER',
        dataType: declaredType || 'UNKNOWN',
        firstOccurrence: `${line}:${column}`,
        line: line,
        column: column,
        value: value !== null && value !== undefined ? String(value) : 'N/A'
      });
    } else {
      const entry = this.entries.get(name);
      if (declaredType && entry.dataType === 'UNKNOWN') {
        entry.dataType = declaredType;
      }
      if (value !== null && value !== undefined && entry.value === 'N/A') {
        entry.value = String(value);
      }
    }
  }

  /**
   * Extract declarations and initializations from token stream
   */
  processTokens(tokens) {
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.type === 'IDENTIFIER') {
        let declaredType = null;
        let value = null;

        // Check if preceded by a type keyword (e.g. INT age)
        if (i > 0 && ['INT', 'FLOAT', 'STRING'].includes(tokens[i - 1].lexeme)) {
          declaredType = tokens[i - 1].lexeme;
        }

        // Check if followed by = value (e.g. age = 20;)
        if (i + 2 < tokens.length && tokens[i + 1].lexeme === '=') {
          const valToken = tokens[i + 2];
          if (['INTEGER_CONSTANT', 'FLOAT_CONSTANT', 'STRING_LITERAL', 'BOOLEAN_CONSTANT', 'IDENTIFIER'].includes(valToken.type) ||
              valToken.lexeme === 'TRUE' || valToken.lexeme === 'FALSE') {
            value = valToken.lexeme;
          }
        }

        this.addIdentifier(token.lexeme, token.line, token.column, declaredType, value);
      }
    }
  }

  getAllEntries() {
    return Array.from(this.entries.values());
  }

  clear() {
    this.entries.clear();
  }
}
