# SQLite Tree-sitter Parser Examples

This directory contains comprehensive examples for using the SQLite tree-sitter parser in different environments.

## 📁 Directory Structure

```
examples/
├── web/                 # Browser examples
│   └── index.html      # Complete web demo with UI
├── react/              # React framework examples  
│   └── SQLParser.jsx   # React component
├── node/               # Node.js examples
│   └── parser-example.js # Complete Node.js demo
└── README.md           # This file
```

## 🌐 Web Examples

### [`web/index.html`](web/index.html)
A complete browser-based demo featuring:
- Real-time SQL parsing and analysis
- Interactive SQL examples (basic, joins, CTEs, window functions, UPSERT)
- Visual AST display
- Query analysis with complexity scoring
- Responsive design with professional UI

**Usage:**
1. Build WASM: `npm run build-wasm`
2. Copy `tree-sitter-sql.wasm` to `examples/web/`
3. Serve with a local server (not `file://`)
4. Open `index.html` in browser

**Features demonstrated:**
- Parser initialization with error handling
- Real-time parsing with debouncing
- Query analysis (tables, joins, functions, complexity)
- Example SQL queries
- Performance optimization techniques

## ⚛️ React Examples

### [`react/SQLParser.jsx`](react/SQLParser.jsx)
A production-ready React component featuring:
- Complete SQL parser integration
- Real-time analysis with state management
- Professional UI with responsive design
- TypeScript-compatible structure
- Performance optimizations

**Usage:**
```bash
# Install dependencies
npm install web-tree-sitter

# Copy WASM file to public directory
cp tree-sitter-sql.wasm public/

# Import and use component
import SQLParser from './examples/react/SQLParser';

function App() {
  return <SQLParser />;
}
```

**Features demonstrated:**
- React hooks integration (`useState`, `useEffect`, `useCallback`)
- Parser lifecycle management
- Memory management (cleanup on unmount)
- Error boundary patterns
- Responsive design with CSS-in-JS

## 🟢 Node.js Examples

### [`node/parser-example.js`](node/parser-example.js)
A comprehensive Node.js demonstration featuring:
- Full parser API coverage
- Command-line interface
- Performance benchmarking
- Batch processing examples
- Advanced query analysis

**Usage:**
```bash
# Build WASM first
npm run build-wasm

# Run with default examples
node examples/node/parser-example.js

# Parse custom SQL
node examples/node/parser-example.js "SELECT * FROM users WHERE id = 1;"

# Run performance benchmark
node examples/node/parser-example.js --benchmark

# Quick demo via npm
npm run demo-wasm
```

**Features demonstrated:**
- WASM loading in Node.js
- Comprehensive query analysis
- Memory management (tree cleanup)
- Performance benchmarking
- CLI argument handling
- Pretty-printed output
- Error handling

## 🚀 Getting Started

### 1. Build WASM
```bash
# Generate parser and build WASM file
npm run generate
npm run build-wasm
```

### 2. Choose Your Platform

#### For Web Development:
```bash
# Copy WASM file to your web server
cp tree-sitter-sql.wasm /path/to/your/webserver/

# See examples/web/index.html for usage
```

#### For React/Vue/Modern Frameworks:
```bash
# Install web-tree-sitter
npm install web-tree-sitter

# Copy WASM to public directory
cp tree-sitter-sql.wasm public/

# See examples/react/SQLParser.jsx for usage
```

#### For Node.js:
```bash
# Install web-tree-sitter for Node.js WASM support
npm install web-tree-sitter

# Run the example
node examples/node/parser-example.js
```

## 📊 Performance Benchmarks

Expected performance (approximate, depends on query complexity):

| Query Type | Size | Parse Time | Example |
|------------|------|------------|---------|
| Simple SELECT | <50 chars | 1-2ms | `SELECT * FROM users;` |
| Basic JOIN | 50-200 chars | 2-5ms | `SELECT u.name FROM users u JOIN orders o ON u.id = o.user_id;` |
| Complex Query | 200-500 chars | 5-15ms | Multiple JOINs, subqueries, window functions |
| CTE with Recursion | 500+ chars | 15-50ms | Recursive CTEs, complex aggregations |

Run benchmarks:
```bash
node examples/node/parser-example.js --benchmark
```

## 🎯 Use Cases Demonstrated

### 1. **SQL Syntax Highlighting**
- Real-time parsing for code editors
- Error detection and highlighting
- Semantic token classification

### 2. **Query Analysis Tools**
- Table dependency analysis
- Query complexity scoring
- Performance optimization hints
- Security analysis (SQL injection detection)

### 3. **SQL Formatters**
- AST-based code formatting
- Style enforcement
- Query optimization suggestions

### 4. **Educational Tools**
- Interactive SQL learning platforms
- Query visualization
- Syntax explanation

### 5. **Development Tools**
- IDE integration
- Linting and validation
- Auto-completion systems
- Query builders

## 🔧 Integration Patterns

### Parser Initialization
```javascript
// Singleton pattern for parser reuse
let parserInstance = null;

async function getParser() {
  if (!parserInstance) {
    await TreeSitter.init();
    parserInstance = new TreeSitter();
    const SQLite = await TreeSitter.Language.load('./tree-sitter-sql.wasm');
    parserInstance.setLanguage(SQLite);
  }
  return parserInstance;
}
```

### Memory Management
```javascript
// Always clean up trees
const tree = parser.parse(sql);
try {
  // Use tree...
  const result = analyzeTree(tree);
  return result;
} finally {
  tree.delete(); // Important: prevent memory leaks
}
```

### Error Handling
```javascript
function parseSQL(sql) {
  try {
    const tree = parser.parse(sql);
    const hasErrors = tree.rootNode.hasError();
    
    if (hasErrors) {
      const errors = tree.rootNode.descendantsOfType('ERROR');
      console.log('Parse errors:', errors.length);
    }
    
    return { tree, hasErrors };
  } catch (error) {
    console.error('Parse failed:', error);
    return { tree: null, hasErrors: true };
  }
}
```

## 🎨 UI Integration Examples

### Simple Parser Status
```javascript
const [parserStatus, setParserStatus] = useState('loading');

useEffect(() => {
  initializeParser()
    .then(() => setParserStatus('ready'))
    .catch(() => setParserStatus('error'));
}, []);

return (
  <div>
    Status: {parserStatus}
    {parserStatus === 'ready' && <SQLEditor />}
  </div>
);
```

### Real-time Validation
```javascript
const [sql, setSql] = useState('');
const [isValid, setIsValid] = useState(true);

const validateSQL = useCallback(
  debounce((sqlText) => {
    const tree = parser.parse(sqlText);
    setIsValid(!tree.rootNode.hasError());
    tree.delete();
  }, 300),
  [parser]
);

useEffect(() => {
  if (sql.trim()) {
    validateSQL(sql);
  }
}, [sql, validateSQL]);
```

## 🤝 Contributing Examples

To add new examples:

1. **Create example file** in appropriate directory
2. **Add comprehensive comments** explaining the approach
3. **Include error handling** and cleanup
4. **Add to this README** with description
5. **Test thoroughly** across environments

## 🔗 Related Resources

- [Tree-sitter Documentation](https://tree-sitter.github.io/tree-sitter/)
- [Web Tree-sitter](https://github.com/tree-sitter/tree-sitter/tree/master/lib/binding_web)
- [SQLite Documentation](https://sqlite.org/docs.html)
- [WASM Build Guide](../WASM_BUILD.md)
- [Main README](../README.md)

---

These examples provide a solid foundation for integrating the SQLite tree-sitter parser into your projects. Each example is production-ready and demonstrates best practices for performance, error handling, and user experience.