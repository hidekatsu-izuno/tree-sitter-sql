# Building Tree-sitter SQLite Parser to WebAssembly (WASM)

This document provides comprehensive instructions for building the SQLite tree-sitter parser to WebAssembly for use in web browsers and other JavaScript environments.

## Prerequisites

You need either **Emscripten** or **Docker** to build the WASM version.

### Option 1: Install Emscripten (Recommended)

#### Linux/WSL:
```bash
# Install Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# Add to your shell profile (.bashrc, .zshrc, etc.)
echo 'source /path/to/emsdk/emsdk_env.sh' >> ~/.bashrc
```

#### macOS:
```bash
# Using Homebrew
brew install emscripten

# Or using the manual method above
```

#### Windows:
```bash
# Download from: https://emscripten.org/docs/getting_started/downloads.html
# Or use WSL with the Linux instructions above
```

### Option 2: Use Docker

```bash
# Make sure Docker is installed and running
docker --version
```

## Building to WASM

Once you have either Emscripten or Docker installed:

### Method 1: Using npm script (Recommended)
```bash
# Generate parser first
npm run generate

# Build WASM version
npm run build-wasm

# This will create tree-sitter-sql.wasm in the current directory
```

### Method 2: Using tree-sitter CLI directly
```bash
# Generate the parser first
npx tree-sitter generate

# Build WASM
npx tree-sitter build-wasm

# Or with custom output path
npx tree-sitter build-wasm --output web/tree-sitter-sql.wasm
```

### Method 3: Using Docker (if Emscripten not installed)
```bash
# Build using Docker container with Emscripten
npx tree-sitter build-wasm --docker
```

## Output Files

After successful build, you'll get:
- `tree-sitter-sql.wasm` - The WebAssembly binary
- `tree-sitter-sql.js` - JavaScript loader (if generated)

## Usage in Browser

### Basic HTML Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>SQLite Parser Demo</title>
    <script src="https://unpkg.com/web-tree-sitter@^0.20.8/tree-sitter.js"></script>
</head>
<body>
    <script>
        (async () => {
            await TreeSitter.init();
            const parser = new TreeSitter();
            
            // Load the SQLite language
            const SQLite = await TreeSitter.Language.load('./tree-sitter-sql.wasm');
            parser.setLanguage(SQLite);
            
            // Parse some SQL
            const sql = `
                SELECT u.name, COUNT(o.id) as order_count
                FROM users u
                LEFT JOIN orders o ON u.id = o.user_id
                WHERE u.active = 1
                GROUP BY u.id, u.name
                HAVING COUNT(o.id) > 5;
            `;
            
            const tree = parser.parse(sql);
            console.log('AST:', tree.rootNode.toString());
            
            // Query the tree
            const selectNodes = tree.rootNode.descendantsOfType('select_statement');
            console.log('Found', selectNodes.length, 'SELECT statements');
        })();
    </script>
</body>
</html>
```

### Node.js Example (using WASM)

```javascript
const fs = require('fs');
const TreeSitter = require('web-tree-sitter');

(async () => {
    await TreeSitter.init();
    
    const parser = new TreeSitter();
    
    // Load the WASM file
    const wasmBuffer = fs.readFileSync('./tree-sitter-sql.wasm');
    const SQLite = await TreeSitter.Language.load(wasmBuffer);
    parser.setLanguage(SQLite);
    
    // Parse SQL
    const sql = "SELECT * FROM users WHERE active = 1;";
    const tree = parser.parse(sql);
    
    console.log(tree.rootNode.toString());
})();
```

### React/Vue/Modern Framework Example

```javascript
import TreeSitter from 'web-tree-sitter';

class SQLParser {
    constructor() {
        this.parser = null;
        this.language = null;
        this.initialized = false;
    }
    
    async init() {
        if (this.initialized) return;
        
        await TreeSitter.init();
        this.parser = new TreeSitter();
        
        // Load the SQLite language
        this.language = await TreeSitter.Language.load('/tree-sitter-sql.wasm');
        this.parser.setLanguage(this.language);
        
        this.initialized = true;
    }
    
    parse(sql) {
        if (!this.initialized) {
            throw new Error('Parser not initialized. Call init() first.');
        }
        
        return this.parser.parse(sql);
    }
    
    // Get all table names from a SQL query
    getTableNames(sql) {
        const tree = this.parse(sql);
        const tables = [];
        
        const tableNodes = tree.rootNode.descendantsOfType('qualified_identifier');
        tableNodes.forEach(node => {
            // Extract table names from qualified identifiers
            if (node.parent && node.parent.type === 'table_or_subquery') {
                tables.push(node.text);
            }
        });
        
        return [...new Set(tables)]; // Remove duplicates
    }
    
    // Validate SQL syntax
    isValidSQL(sql) {
        try {
            const tree = this.parse(sql);
            // Check if there are any ERROR nodes
            const errors = tree.rootNode.descendantsOfType('ERROR');
            return errors.length === 0;
        } catch (e) {
            return false;
        }
    }
}

// Usage
const sqlParser = new SQLParser();
await sqlParser.init();

const sql = "SELECT * FROM users WHERE id = 1;";
const isValid = sqlParser.isValidSQL(sql);
const tables = sqlParser.getTableNames(sql);

console.log('Valid SQL:', isValid);
console.log('Tables:', tables);
```

## Advanced Usage

### Syntax Highlighting

```javascript
async function highlightSQL(sqlCode) {
    await TreeSitter.init();
    const parser = new TreeSitter();
    const SQLite = await TreeSitter.Language.load('./tree-sitter-sql.wasm');
    parser.setLanguage(SQLite);
    
    const tree = parser.parse(sqlCode);
    
    // Define highlighting rules
    const highlights = {
        'keyword': ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE'],
        'function': ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN'],
        'string': ['string_literal'],
        'number': ['numeric_literal'],
        'comment': ['comment']
    };
    
    // Apply highlighting based on node types
    const highlightedNodes = [];
    
    tree.rootNode.walk((node) => {
        if (highlights.string.includes(node.type)) {
            highlightedNodes.push({
                start: node.startIndex,
                end: node.endIndex,
                class: 'string'
            });
        }
        // Add more highlighting rules...
        
        return true; // Continue walking
    });
    
    return highlightedNodes;
}
```

### SQL Query Analysis

```javascript
class SQLAnalyzer {
    constructor(parser) {
        this.parser = parser;
    }
    
    analyzeQuery(sql) {
        const tree = this.parser.parse(sql);
        const analysis = {
            type: this.getQueryType(tree),
            tables: this.getTables(tree),
            columns: this.getColumns(tree),
            joins: this.getJoins(tree),
            functions: this.getFunctions(tree),
            complexity: this.calculateComplexity(tree)
        };
        
        return analysis;
    }
    
    getQueryType(tree) {
        const rootChild = tree.rootNode.firstChild;
        if (rootChild) {
            return rootChild.type.replace('_statement', '').toUpperCase();
        }
        return 'UNKNOWN';
    }
    
    getTables(tree) {
        const tableNodes = tree.rootNode.descendantsOfType('table_or_subquery');
        return tableNodes.map(node => {
            const identifierNode = node.childForFieldName('name') || node.firstChild;
            return identifierNode ? identifierNode.text : null;
        }).filter(Boolean);
    }
    
    calculateComplexity(tree) {
        let complexity = 1;
        
        // Add complexity for each construct
        complexity += tree.rootNode.descendantsOfType('join_clause').length * 2;
        complexity += tree.rootNode.descendantsOfType('scalar_subquery').length * 3;
        complexity += tree.rootNode.descendantsOfType('case_expression').length * 2;
        complexity += tree.rootNode.descendantsOfType('window_function').length * 2;
        
        return complexity;
    }
}
```

## Optimization Tips

### 1. Lazy Loading
```javascript
// Only load the parser when needed
let parserPromise = null;

function getParser() {
    if (!parserPromise) {
        parserPromise = initializeParser();
    }
    return parserPromise;
}

async function initializeParser() {
    await TreeSitter.init();
    const parser = new TreeSitter();
    const SQLite = await TreeSitter.Language.load('./tree-sitter-sql.wasm');
    parser.setLanguage(SQLite);
    return parser;
}
```

### 2. Web Worker Usage
```javascript
// sql-parser-worker.js
importScripts('https://unpkg.com/web-tree-sitter@^0.20.8/tree-sitter.js');

let parser = null;

self.onmessage = async function(e) {
    if (!parser) {
        await TreeSitter.init();
        parser = new TreeSitter();
        const SQLite = await TreeSitter.Language.load('./tree-sitter-sql.wasm');
        parser.setLanguage(SQLite);
    }
    
    const { sql, id } = e.data;
    try {
        const tree = parser.parse(sql);
        self.postMessage({ id, result: tree.rootNode.toString() });
    } catch (error) {
        self.postMessage({ id, error: error.message });
    }
};

// Main thread usage
const worker = new Worker('sql-parser-worker.js');
worker.postMessage({ sql: 'SELECT * FROM users;', id: 1 });
worker.onmessage = (e) => {
    console.log('Parsed:', e.data.result);
};
```

## Troubleshooting

### Common Issues

1. **WASM loading fails**
   ```javascript
   // Make sure the WASM file is served with correct MIME type
   // Add to your server configuration:
   // .wasm files should be served with application/wasm
   ```

2. **Performance issues**
   ```javascript
   // Use parser pooling for multiple parses
   class ParserPool {
       constructor(size = 3) {
           this.parsers = [];
           this.available = [];
           this.size = size;
       }
       
       async init() {
           await TreeSitter.init();
           const SQLite = await TreeSitter.Language.load('./tree-sitter-sql.wasm');
           
           for (let i = 0; i < this.size; i++) {
               const parser = new TreeSitter();
               parser.setLanguage(SQLite);
               this.parsers.push(parser);
               this.available.push(parser);
           }
       }
       
       async parse(sql) {
           if (this.available.length === 0) {
               await new Promise(resolve => setTimeout(resolve, 10));
               return this.parse(sql);
           }
           
           const parser = this.available.pop();
           try {
               const result = parser.parse(sql);
               return result;
           } finally {
               this.available.push(parser);
           }
       }
   }
   ```

3. **Memory leaks**
   ```javascript
   // Always delete trees when done
   const tree = parser.parse(sql);
   // ... use tree
   tree.delete(); // Important: free memory
   ```

## File Size Optimization

The WASM file will be approximately 400-800KB. To optimize:

1. **Enable gzip compression** on your server
2. **Use CDN** for faster delivery
3. **Lazy load** only when needed
4. **Cache** the WASM file aggressively

## Integration Examples

Check the `examples/` directory (to be created) for complete integration examples with:
- React
- Vue.js
- Angular
- Svelte
- Plain JavaScript
- Node.js applications

## Performance Benchmarks

Expected performance (approximate):
- Small queries (<100 chars): ~1-5ms
- Medium queries (100-1000 chars): ~5-20ms  
- Large queries (1000+ chars): ~20-100ms
- Complex queries with subqueries: ~50-200ms

Performance is highly dependent on query complexity and browser/environment.