# Lexical Analyzer for Custom Mini-Language (MiniLang)

> **Subject:** Compiler Construction Mini Project  
> **Technology Stack:** HTML5, CSS3, JavaScript, Node.js, Express.js  

---

## 1. Project Description
**MiniLang Lexical Analyzer** is a clean, web-based educational project created for the **Compiler Construction** subject. It implements the first phase of a compiler—**Lexical Analysis**—by scanning source code written in a custom programming language called **MiniLang** character-by-character, identifying tokens, tracking line/column coordinates, generating a Symbol Table, and reporting lexical errors.

---

## 2. Architecture & Pipeline
```
Source Code Input
       ↓
Lexical Analyzer (State Machine Scanner)
       ↓
Tokens Stream (Lexeme | Token Type | Line | Column)
       ↓
Symbol Table (Identifier | Type | Line)
       ↓
Lexical Errors (Lexeme | Error | Line | Column)
```

---

## 3. MiniLang Syntax & Token Categories

### Example Program:
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

### Token Rules:
- **KEYWORD:** `START`, `END`, `INT`, `FLOAT`, `STRING`, `IF`, `ELSE`, `THEN`, `ENDIF`, `WHILE`, `DO`, `PRINT`, `TRUE`, `FALSE`
- **IDENTIFIER:** Must start with a letter or `_`, followed by alphanumeric characters. Cannot be a keyword (e.g. `age`, `marks`, `name`).
- **INTEGER:** Digits only (e.g. `20`, `100`).
- **FLOAT:** Floating-point numbers (e.g. `89.5`).
- **STRING:** Delimited by double quotes (e.g. `"Tanu"`).
- **OPERATOR:** Arithmetic (`+`, `-`, `*`, `/`), Assignment (`=`), Relational (`==`, `!=`, `>`, `<`, `>=`, `<=`), Logical (`&&`, `||`).
- **DELIMITER:** `(`, `)`, `{`, `}`, `;`, `,`, `[`, `]`.
- **COMMENT:** Single-line comments starting with `//`.

---

## 4. Project Structure
```
mini_project/
├── backend/
│   ├── lexer/
│   │   ├── TokenTypes.js     # Token category definitions
│   │   ├── Token.js          # Token class structure
│   │   ├── LexicalError.js   # Lexical error class structure
│   │   ├── SymbolTable.js    # Symbol Table manager class
│   │   └── Lexer.js          # State-based Lexer character scanner
│   └── server.js             # Express.js server
├── frontend/
│   ├── index.html            # Simple college mini-project UI
│   ├── style.css             # Clean responsive layout
│   └── script.js             # Client interface script
├── package.json              # Project dependencies & scripts
└── README.md                 # Project documentation
```

---

## 5. How to Run

1. Open terminal in the project directory:
   ```bash
   cd mini_project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 6. Output Examples

### Token Table Output:

| Lexeme | Token Type | Line | Column |
| :--- | :--- | :--- | :--- |
| `START` | `KEYWORD` | 1 | 1 |
| `INT` | `KEYWORD` | 2 | 5 |
| `age` | `IDENTIFIER` | 2 | 9 |
| `=` | `OPERATOR` | 2 | 13 |
| `20` | `INTEGER` | 2 | 15 |
| `;` | `DELIMITER` | 2 | 17 |

### Symbol Table Output:

| Identifier | Type | Line |
| :--- | :--- | :--- |
| `age` | `INTEGER` | 2 |
| `marks` | `FLOAT` | 3 |
| `name` | `STRING` | 4 |

### Lexical Error Output (If errors exist):

| Lexeme | Error | Line | Column |
| :--- | :--- | :--- | :--- |
| `@` | Invalid character | 5 | 5 |
| `123abc` | Invalid identifier starting with digit | 2 | 9 |
| `"Tanu;` | Unterminated string literal | 3 | 19 |
