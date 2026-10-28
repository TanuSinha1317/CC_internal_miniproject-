# Compiler Construction Project Report: MiniLang Lexical Analyzer

**Course:** Compiler Construction (CS-501)  
**Candidate Name:** Tanu Rakesh Sinha  
**Project Title:** Design and Implementation of a Lexical Analyzer for MiniLang (A Custom Context-Free Imperative Language)  
**Technology Stack:** Node.js (v20+, ES6 Modules), Express.js, Vanilla JavaScript, HTML5/CSS3  
**Status:** Complete, Verified, & Production Ready  
**Generated PDF Artifact:** [`compiler_project_report.pdf`](./compiler_project_report.pdf) (Exact 2-Page Academic/Technical Format)

---

## 1. Executive Summary & Project Objectives
In modern compiler engineering, the **Lexical Analysis (Scanning)** phase acts as the critical entry point of the compiler front-end, translating unstructured source text into a coherent stream of atomic, categorized tokens.

This project delivers a complete, robust, and deterministic lexical analyzer for **MiniLang**—a custom imperative programming language designed for compiler construction pedagogy. 

### Key Project Capabilities:
1. **Deterministic Finite Automaton (DFA) Character Scanner:** Single-pass, linear-time $O(N)$ scanning with 1-character lookahead (`peekChar`, `peekNextChar`).
2. **Comprehensive Token Categorization:** Classifies source lexemes into Keywords, Identifiers, Integer Constants, Float Constants, String Literals, Arithmetic/Relational/Logical/Assignment Operators, Delimiters, and Comments.
3. **Coordinate-Aware Diagnostic Tracking:** Precision recording of 1-indexed `(line, column)` positions for every token and error.
4. **Intelligent Symbol Table Management:** Hash-map backed symbol repository featuring early semantic inference (backtracking variable types from declaration keywords and extracting assigned literal values).
5. **Non-Halting Lexical Error Recovery:** Panic-mode point recovery isolating five distinct error classes (`INVALID_CHARACTER`, `INVALID_IDENTIFIER`, `UNTERMINATED_STRING`, `MALFORMED_NUMBER`, `INVALID_SYMBOL`) without interrupting analysis.
6. **Decoupled Dual-Execution Architecture:** A high-throughput Node.js/Express REST microservice (`POST /api/analyze`) paired with an isomorphic client-side engine in `frontend/script.js` ensuring 100% offline resilience.

---

## 2. MiniLang Lexical Specification & Grammar Rules

| Token Class | Formal Pattern / Rule | Concrete Sample Lexemes | Internal Token Enum |
| :--- | :--- | :--- | :--- |
| **KEYWORD** | Reserved syntactic words | `START`, `END`, `INT`, `FLOAT`, `STRING`, `IF`, `ELSE`, `THEN`, `ENDIF`, `WHILE`, `DO`, `PRINT`, `TRUE`, `FALSE` | `TokenType.KEYWORD` |
| **IDENTIFIER** | `[a-zA-Z_][a-zA-Z0-9_]*` (cannot match keyword) | `age`, `marks`, `name`, `counter_val` | `TokenType.IDENTIFIER` |
| **INTEGER_CONSTANT** | `[0-9]+` | `0`, `20`, `1024` | `TokenType.INTEGER` |
| **FLOAT_CONSTANT** | `[0-9]+\.[0-9]+` | `0.5`, `89.5`, `3.14159` | `TokenType.FLOAT` |
| **STRING_LITERAL** | `"([^"\n\r])*"` | `"Tanu"`, `"Eligible"`, `"Hello World"` | `TokenType.STRING` |
| **OPERATORS** | Arithmetic, Relational, Logical, Assignment | `+`, `-`, `*`, `/`, `=`, `==`, `!=`, `>`, `<`, `>=`, `<=`, `&&`, `\|\|` | `TokenType.*_OPERATOR` |
| **DELIMITER** | Syntactic punctuation & grouping | `(`, `)`, `{`, `}`, `;`, `,`, `[`, `]` | `TokenType.DELIMITER` |
| **COMMENT** | `//.*` to end-of-line | `// Student eligibility check` | `TokenType.COMMENT` |

---

## 3. Architecture & Processing Pipeline

```
┌─────────────────────────┐
│ Source Code Input (Text)│
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Character Reader      │  <-- Maintains pointer (pos), line counter, column counter
│ (peekChar, peekNextChar)│
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ State-Based DFA Scanner │  <-- O(1) Keyword Set, multi-character lookahead (==, !=, <=)
│  (backend/lexer/Lexer)  │
└──────┬───────────┬──────┘
       │           │
       ▼           ▼
┌─────────────┐ ┌──────────────────────┐
│Token Stream │ │Lexical Error Stream  │  <-- Non-crashing error recovery
│Token[1..N]  │ │LexicalError[1..M]    │
└──────┬──────┘ └──────────┬───────────┘
       │                   │
       ▼                   │
┌─────────────────────────┐│
│   Symbol Table Engine   ││  <-- Map-backed identifier tracking & type inference
│(backend/lexer/SymbolTbl)││
└────────────┬────────────┘│
             │             │
             ▼             ▼
┌───────────────────────────────────────┐
│     Web Dashboard Presentation        │  <-- Token Table, Symbol Table, Error Badges
│    (REST API & Client Fallback)       │
└───────────────────────────────────────┘
```

---

## 4. Lexical Engine Implementation Highlights

### 4.1 Character Traversal & Lookahead
- `peekChar()` returns the character at the current stream index `pos` without incrementing coordinates.
- `peekNextChar()` inspects `pos + 1` to resolve composite tokens (e.g., differentiating `=` from `==`, `>` from `>=`, or detecting single-line comment `//`).
- `advanceChar()` consumes the character, increments `pos` and `column`, and handles newline transitions by incrementing `line` and resetting `column = 1`.

### 4.2 Constant-Time Keyword Discrimination
Keywords are maintained in an ES6 `Set` containing the 14 reserved identifiers. When an alphanumeric sequence is extracted, `KEYWORDS.has(lexeme)` evaluates in $O(1)$ time complexity, bypassing expensive regular expression execution.

---

## 5. Symbol Table Design & Attribute Inference

The `SymbolTable` class (`backend/lexer/SymbolTable.js`) uses an internal JavaScript `Map` mapping identifier names to attribute descriptors:

```javascript
{
  identifier: "age",
  type: "IDENTIFIER",
  dataType: "INT",            // Inferred from preceding declaration keyword
  firstOccurrence: "2:9",     // Line 2, Column 9
  line: 2,
  column: 9,
  value: "20"                 // Extracted from assignment lookahead
}
```

### Inference Algorithms:
1. **Type Backtracking:** When scanning `token[i]` (an identifier), the symbol processor checks if `token[i-1]` is one of `['INT', 'FLOAT', 'STRING']`. If true, `dataType` is locked to that primitive type.
2. **Literal Binding:** If `token[i+1]` is `=` and `token[i+2]` is a constant or literal, the symbol entry binds the literal value directly.

---

## 6. Lexical Error Handling & Panic Recovery

| Error Type | Example Input | Diagnostic Message | Recovery Action |
| :--- | :--- | :--- | :--- |
| `INVALID_CHARACTER` | `@`, `$`, `#` | `Invalid character '@' found in input.` | Logs error; skips 1 character; continues scanning. |
| `INVALID_IDENTIFIER` | `123age` | `Invalid identifier '123age': identifiers cannot start with a digit.` | Consumes entire alphanumeric sequence; registers error. |
| `UNTERMINATED_STRING` | `"Tanu;\n` | `Unterminated string literal: missing closing double quote "` | Halts string scanner on newline; records error; continues at next line. |
| `MALFORMED_NUMBER` | `89.5.2`, `10.` | `Malformed floating-point number '89.5.2'.` | Flags numeric format exception without crashing. |
| `INVALID_SYMBOL` | `!` (isolated) | `Invalid symbol '!'. Did you mean '!='?` | Emits syntax recommendation; moves cursor forward. |

---

## 7. Sample Program Verification

### Input MiniLang Source Code:
```minilang
START
    INT age = 20;
    FLOAT marks = 89.5;
    STRING name = "Tanu";

    IF age >= 18 THEN
        PRINT("Eligible");
    ELSE
        PRINT("Not Eligible");
    ENDIF
END
```

### Generated Token Stream (First 10 Tokens):
| Token # | Lexeme | Token Type | Line | Column |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `START` | `KEYWORD` | 1 | 1 |
| 2 | `INT` | `KEYWORD` | 2 | 5 |
| 3 | `age` | `IDENTIFIER` | 2 | 9 |
| 4 | `=` | `ASSIGNMENT_OPERATOR` | 2 | 13 |
| 5 | `20` | `INTEGER_CONSTANT` | 2 | 15 |
| 6 | `;` | `DELIMITER` | 2 | 17 |
| 7 | `FLOAT` | `KEYWORD` | 3 | 5 |
| 8 | `marks` | `IDENTIFIER` | 3 | 11 |
| 9 | `=` | `ASSIGNMENT_OPERATOR` | 3 | 17 |
| 10 | `89.5` | `FLOAT_CONSTANT` | 3 | 19 |

### Generated Symbol Table:
| Identifier | Inferred Data Type | First Occurrence | Bound Initial Value |
| :--- | :--- | :--- | :--- |
| `age` | `INT` (INTEGER) | 2:9 | `20` |
| `marks` | `FLOAT` | 3:11 | `89.5` |
| `name` | `STRING` | 4:12 | `"Tanu"` |

---

## 8. Compiler Roadmap (Subsequent Phases)
- **Phase 2: Syntax Analysis:** Implementation of LL(1) / LALR parser producing an Abstract Syntax Tree (AST).
- **Phase 3: Semantic Analysis:** Type compatibility enforcement and scope binding.
- **Phase 4: Intermediate Code Generation:** Generation of Three-Address Code (TAC) quadruples.
- **Phase 5: Code Optimization:** Constant propagation, common subexpression elimination, and dead code pruning.
- **Phase 6: Code Generation:** Emitting runnable WebAssembly or x86 machine instructions.

---

## 9. Conclusion
The **MiniLang Lexical Analyzer** fully realizes Phase 1 of classical compiler design. With deterministic linear tokenization, comprehensive lexical grammar support, automated symbol table derivation, and fault-tolerant diagnostics, the project fulfills all curricular and practical standards of compiler construction.
