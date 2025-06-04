#!/usr/bin/env node

/**
 * Node.js example for using the SQLite Tree-sitter Parser with WASM
 * 
 * Usage:
 *   node parser-example.js
 *   node parser-example.js "SELECT * FROM users WHERE id = 1;"
 */

const fs = require('fs');
const path = require('path');
const TreeSitter = require('web-tree-sitter');

class SQLiteParserWASM {
    constructor() {
        this.parser = null;
        this.language = null;
        this.initialized = false;
    }
    
    async init(wasmPath = './tree-sitter-sql.wasm') {
        if (this.initialized) return;
        
        try {
            console.log('🔄 Initializing Tree-sitter WASM parser...');
            
            // Initialize Tree-sitter
            await TreeSitter.init();
            
            // Create parser
            this.parser = new TreeSitter();
            
            // Load the WASM file
            const wasmBuffer = fs.readFileSync(wasmPath);
            this.language = await TreeSitter.Language.load(wasmBuffer);
            this.parser.setLanguage(this.language);
            
            this.initialized = true;
            console.log('✅ Parser initialized successfully!');
            
        } catch (error) {
            console.error('❌ Failed to initialize parser:', error.message);
            console.error('   Make sure tree-sitter-sql.wasm exists and run: npm run build-wasm');
            throw error;
        }
    }
    
    parse(sql) {
        if (!this.initialized) {
            throw new Error('Parser not initialized. Call init() first.');
        }
        
        return this.parser.parse(sql);
    }
    
    // Analyze SQL query and extract information
    analyze(sql) {
        const tree = this.parse(sql);
        
        try {
            const analysis = {
                isValid: this.isValidSQL(tree),
                type: this.getQueryType(tree),
                tables: this.getTables(tree),
                columns: this.getColumns(tree),
                joins: this.getJoins(tree),
                functions: this.getFunctions(tree),
                subqueries: this.getSubqueries(tree),
                complexity: this.calculateComplexity(tree),
                ast: tree.rootNode.toString()
            };
            
            return analysis;
        } finally {
            tree.delete(); // Important: free memory
        }
    }
    
    isValidSQL(tree) {
        const errors = tree.rootNode.descendantsOfType('ERROR');
        return errors.length === 0;
    }
    
    getQueryType(tree) {
        const rootChild = tree.rootNode.firstChild;
        if (rootChild) {
            return rootChild.type.replace('_statement', '').toUpperCase();
        }
        return 'UNKNOWN';
    }
    
    getTables(tree) {
        const tables = new Set();
        const tableNodes = tree.rootNode.descendantsOfType('table_or_subquery');
        
        tableNodes.forEach(node => {
            const identifier = node.firstChild;
            if (identifier && identifier.type === 'qualified_identifier') {
                tables.add(identifier.text);
            }
        });
        
        return Array.from(tables);
    }
    
    getColumns(tree) {
        const columns = new Set();
        const selectItems = tree.rootNode.descendantsOfType('select_item');
        
        selectItems.forEach(node => {
            const identifier = node.firstChild;
            if (identifier && identifier.type === 'qualified_identifier') {
                columns.add(identifier.text);
            }
        });
        
        return Array.from(columns);
    }
    
    getJoins(tree) {
        const joins = [];
        const joinNodes = tree.rootNode.descendantsOfType('join_clause');
        
        joinNodes.forEach(node => {
            // Extract join type and table
            const children = node.children;
            let joinType = 'JOIN';
            let table = '';
            
            for (let child of children) {
                if (child.type === 'join_operator') {
                    joinType = child.text;
                } else if (child.type === 'table_or_subquery') {
                    const tableNode = child.firstChild;
                    if (tableNode && tableNode.type === 'qualified_identifier') {
                        table = tableNode.text;
                    }
                }
            }
            
            joins.push({ type: joinType, table });
        });
        
        return joins;
    }
    
    getFunctions(tree) {
        const functions = new Set();
        const funcNodes = tree.rootNode.descendantsOfType('function_call');
        
        funcNodes.forEach(node => {
            const name = node.firstChild;
            if (name) {
                functions.add(name.text.toUpperCase());
            }
        });
        
        return Array.from(functions);
    }
    
    getSubqueries(tree) {
        return {
            scalar: tree.rootNode.descendantsOfType('scalar_subquery').length,
            exists: tree.rootNode.descendantsOfType('exists_expression').length,
            in: tree.rootNode.descendantsOfType('in_expression').length
        };
    }
    
    calculateComplexity(tree) {
        let complexity = 1;
        
        // Add complexity for various constructs
        complexity += tree.rootNode.descendantsOfType('join_clause').length * 2;
        complexity += tree.rootNode.descendantsOfType('scalar_subquery').length * 3;
        complexity += tree.rootNode.descendantsOfType('exists_expression').length * 3;
        complexity += tree.rootNode.descendantsOfType('case_expression').length * 2;
        complexity += tree.rootNode.descendantsOfType('window_function').length * 2;
        complexity += tree.rootNode.descendantsOfType('cte').length * 2;
        
        return complexity;
    }
    
    // Pretty print analysis results
    printAnalysis(analysis) {
        console.log('\n📊 SQL Analysis Results:');
        console.log('=' .repeat(50));
        
        console.log(`✅ Valid SQL: ${analysis.isValid ? 'Yes' : 'No'}`);
        console.log(`📝 Query Type: ${analysis.type}`);
        console.log(`🔢 Complexity Score: ${analysis.complexity}`);
        
        if (analysis.tables.length > 0) {
            console.log(`\n🗂️  Tables (${analysis.tables.length}):`);
            analysis.tables.forEach(table => console.log(`   • ${table}`));
        }
        
        if (analysis.columns.length > 0) {
            console.log(`\n📋 Columns (${analysis.columns.length}):`);
            analysis.columns.forEach(col => console.log(`   • ${col}`));
        }
        
        if (analysis.joins.length > 0) {
            console.log(`\n🔗 Joins (${analysis.joins.length}):`);
            analysis.joins.forEach(join => console.log(`   • ${join.type} ${join.table}`));
        }
        
        if (analysis.functions.length > 0) {
            console.log(`\n⚡ Functions (${analysis.functions.length}):`);
            analysis.functions.forEach(func => console.log(`   • ${func}()`));
        }
        
        const totalSubqueries = analysis.subqueries.scalar + analysis.subqueries.exists + analysis.subqueries.in;
        if (totalSubqueries > 0) {
            console.log(`\n🔍 Subqueries (${totalSubqueries}):`);
            if (analysis.subqueries.scalar > 0) console.log(`   • Scalar: ${analysis.subqueries.scalar}`);
            if (analysis.subqueries.exists > 0) console.log(`   • EXISTS: ${analysis.subqueries.exists}`);
            if (analysis.subqueries.in > 0) console.log(`   • IN: ${analysis.subqueries.in}`);
        }
        
        console.log('\n🌳 Abstract Syntax Tree:');
        console.log('-'.repeat(50));
        console.log(analysis.ast);
    }
}

// Example SQL queries for testing
const examples = {
    basic: `SELECT * FROM users WHERE active = 1;`,
    
    complex: `SELECT u.name, u.email, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.active = 1 AND u.created_at > '2023-01-01'
GROUP BY u.id, u.name, u.email
HAVING COUNT(o.id) > 5
ORDER BY order_count DESC
LIMIT 10;`,
    
    cte: `WITH RECURSIVE category_tree AS (
  SELECT id, name, parent_id, 0 as level
  FROM categories WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, c.name, c.parent_id, ct.level + 1
  FROM categories c
  INNER JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree ORDER BY level, name;`,
    
    window: `SELECT 
  employee_id,
  department,
  salary,
  AVG(salary) OVER (PARTITION BY department) as dept_avg,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as rank
FROM employees;`,
    
    upsert: `INSERT INTO user_stats (user_id, login_count, last_login)
VALUES (1, 1, CURRENT_TIMESTAMP)
ON CONFLICT (user_id) DO UPDATE SET
  login_count = login_count + 1,
  last_login = CURRENT_TIMESTAMP;`
};

async function main() {
    const parser = new SQLiteParserWASM();
    
    try {
        // Initialize parser
        await parser.init();
        
        // Get SQL from command line argument or use example
        const sql = process.argv[2] || examples.complex;
        
        console.log('🔍 Parsing SQL Query:');
        console.log('=' .repeat(50));
        console.log(sql);
        
        // Analyze the SQL
        const analysis = parser.analyze(sql);
        
        // Print results
        parser.printAnalysis(analysis);
        
        // Demonstrate batch processing
        if (!process.argv[2]) {
            console.log('\n\n🔄 Batch Processing Examples:');
            console.log('=' .repeat(50));
            
            for (const [name, exampleSQL] of Object.entries(examples)) {
                console.log(`\n📝 ${name.toUpperCase()} Example:`);
                try {
                    const exampleAnalysis = parser.analyze(exampleSQL);
                    console.log(`   Type: ${exampleAnalysis.type}, Complexity: ${exampleAnalysis.complexity}, Valid: ${exampleAnalysis.isValid}`);
                    console.log(`   Tables: [${exampleAnalysis.tables.join(', ')}]`);
                    console.log(`   Functions: [${exampleAnalysis.functions.join(', ')}]`);
                } catch (error) {
                    console.log(`   ❌ Error: ${error.message}`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Performance benchmark
async function benchmark() {
    const parser = new SQLiteParserWASM();
    await parser.init();
    
    console.log('\n⚡ Performance Benchmark:');
    console.log('=' .repeat(50));
    
    for (const [name, sql] of Object.entries(examples)) {
        const iterations = 100;
        const start = process.hrtime.bigint();
        
        for (let i = 0; i < iterations; i++) {
            const tree = parser.parse(sql);
            tree.delete();
        }
        
        const end = process.hrtime.bigint();
        const avgTime = Number(end - start) / iterations / 1000000; // Convert to milliseconds
        
        console.log(`${name.padEnd(10)}: ${avgTime.toFixed(2)}ms avg (${iterations} iterations)`);
    }
}

// Check if WASM file exists
function checkWASMFile() {
    const wasmPath = path.join(__dirname, '../../tree-sitter-sql.wasm');
    if (!fs.existsSync(wasmPath)) {
        console.error('❌ WASM file not found!');
        console.error('   Expected: tree-sitter-sql.wasm');
        console.error('   Run: npm run build-wasm');
        return false;
    }
    return true;
}

// Run the example
if (require.main === module) {
    if (checkWASMFile()) {
        if (process.argv.includes('--benchmark')) {
            benchmark();
        } else {
            main();
        }
    }
}

module.exports = SQLiteParserWASM;