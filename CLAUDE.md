# Tree-sitter SQLite SQL Parser

## Project Overview
This project implements a tree-sitter parser for SQLite SQL syntax. Tree-sitter is a parser generator tool and incremental parsing library that builds a concrete syntax tree for source files and efficiently updates the syntax tree as the source file is edited.

## Development Plan

### Phase 1: Project Setup
1. Initialize npm project with tree-sitter dependencies
2. Create basic project structure
3. Set up grammar.js file

### Phase 2: Core SQL Grammar
1. **Basic Statements**
   - SELECT (with JOIN, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT)
   - INSERT (VALUES, SELECT)
   - UPDATE (SET, WHERE)
   - DELETE (WHERE)
   - CREATE TABLE (columns, constraints)
   - DROP TABLE
   - ALTER TABLE

2. **Expressions & Operators**
   - Literals (strings, numbers, NULL)
   - Identifiers (table names, column names)
   - Binary operators (+, -, *, /, %, ||, =, !=, <, >, <=, >=, AND, OR)
   - Unary operators (NOT, -, +)
   - CASE expressions
   - Subqueries

3. **Data Types**
   - INTEGER, REAL, TEXT, BLOB
   - NULL handling
   - Type affinity rules

### Phase 3: SQLite-Specific Features
1. **Special Statements**
   - PRAGMA statements
   - ATTACH/DETACH DATABASE
   - VACUUM
   - ANALYZE
   - EXPLAIN

2. **SQLite Functions**
   - Core functions (length, substr, etc.)
   - Aggregate functions (COUNT, SUM, AVG, etc.)
   - Date and time functions
   - JSON functions

3. **Advanced Features**
   - Common Table Expressions (WITH clause)
   - Window functions
   - Virtual tables
   - Triggers
   - Views
   - Indexes

### Phase 4: Testing & Validation
1. Create comprehensive test corpus
2. Test against real SQLite queries
3. Performance optimization
4. Error recovery testing

## Technical Details

### Grammar Structure
The grammar will be organized hierarchically:
- `source_file` - top level, contains multiple statements
- `statement` - individual SQL statements
- `expression` - expressions used in WHERE, SELECT, etc.
- `identifier` - table/column names
- `literal` - string/number/null values

### Key Challenges
1. **Keyword vs Identifier Ambiguity**: Many SQL keywords can also be identifiers
2. **Expression Precedence**: Complex operator precedence rules
3. **Optional Clauses**: Many SQL clauses are optional
4. **SQLite Quirks**: SQLite allows some non-standard SQL syntax

## Build Commands
```bash
# Install dependencies
npm install

# Generate parser
npm run generate

# Run tests
npm test

# Parse a SQL file
npm run parse <file.sql>
```

## References
- [SQLite SQL Syntax Documentation](https://www.sqlite.org/lang.html)
- [Tree-sitter Documentation](https://tree-sitter.github.io/tree-sitter/)
- [SQLite Grammar Railroad Diagrams](https://www.sqlite.org/syntaxdiagrams.html)