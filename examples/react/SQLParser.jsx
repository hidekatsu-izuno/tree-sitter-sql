/**
 * React component for SQLite parsing with Tree-sitter WASM
 * 
 * Usage:
 *   import SQLParser from './SQLParser';
 *   
 *   function App() {
 *     return <SQLParser />;
 *   }
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import TreeSitter from 'web-tree-sitter';

const SQLParser = () => {
    const [parser, setParser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sql, setSql] = useState(`SELECT u.name, u.email, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.active = 1 AND u.created_at > '2023-01-01'
GROUP BY u.id, u.name, u.email
HAVING COUNT(o.id) > 5
ORDER BY order_count DESC
LIMIT 10;`);
    const [parseResult, setParseResult] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const parserRef = useRef(null);

    // Initialize parser on component mount
    useEffect(() => {
        initializeParser();
        return () => {
            // Cleanup parser on unmount
            if (parserRef.current) {
                parserRef.current.delete();
            }
        };
    }, []);

    const initializeParser = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Initialize Tree-sitter
            await TreeSitter.init();
            
            // Create parser
            const newParser = new TreeSitter();
            
            // Load SQLite language (adjust path as needed)
            const SQLite = await TreeSitter.Language.load('/tree-sitter-sql.wasm');
            newParser.setLanguage(SQLite);
            
            parserRef.current = newParser;
            setParser(newParser);
            setIsLoading(false);
            
            // Auto-parse initial SQL
            parseSQL(sql, newParser);
            
        } catch (err) {
            setError(`Failed to initialize parser: ${err.message}`);
            setIsLoading(false);
        }
    };

    const parseSQL = useCallback((sqlText, parserInstance = parser) => {
        if (!parserInstance || !sqlText.trim()) {
            setParseResult(null);
            setAnalysis(null);
            return;
        }

        try {
            const tree = parserInstance.parse(sqlText);
            
            // Get AST string
            const astString = tree.rootNode.toString();
            setParseResult(astString);
            
            // Analyze query
            const queryAnalysis = analyzeQuery(tree, sqlText);
            setAnalysis(queryAnalysis);
            
            // Clean up tree
            tree.delete();
            
        } catch (err) {
            setParseResult(`Parse error: ${err.message}`);
            setAnalysis(null);
        }
    }, [parser]);

    const analyzeQuery = (tree, sqlText) => {
        return {
            isValid: tree.rootNode.descendantsOfType('ERROR').length === 0,
            type: getQueryType(tree),
            tables: getTables(tree),
            joins: getJoins(tree),
            functions: getFunctions(tree),
            subqueries: getSubqueries(tree),
            complexity: calculateComplexity(tree),
            lineCount: sqlText.split('\n').length,
            charCount: sqlText.length
        };
    };

    const getQueryType = (tree) => {
        const rootChild = tree.rootNode.firstChild;
        return rootChild ? rootChild.type.replace('_statement', '').toUpperCase() : 'UNKNOWN';
    };

    const getTables = (tree) => {
        const tables = new Set();
        const tableNodes = tree.rootNode.descendantsOfType('table_or_subquery');
        
        tableNodes.forEach(node => {
            const identifier = node.firstChild;
            if (identifier && identifier.type === 'qualified_identifier') {
                tables.add(identifier.text);
            }
        });
        
        return Array.from(tables);
    };

    const getJoins = (tree) => {
        const joins = [];
        const joinNodes = tree.rootNode.descendantsOfType('join_clause');
        
        joinNodes.forEach(node => {
            const children = node.children;
            let joinType = 'JOIN';
            
            for (let child of children) {
                if (child.type === 'join_operator') {
                    joinType = child.text;
                    break;
                }
            }
            
            joins.push(joinType);
        });
        
        return joins;
    };

    const getFunctions = (tree) => {
        const functions = new Set();
        const funcNodes = tree.rootNode.descendantsOfType('function_call');
        
        funcNodes.forEach(node => {
            const name = node.firstChild;
            if (name) {
                functions.add(name.text.toUpperCase());
            }
        });
        
        return Array.from(functions);
    };

    const getSubqueries = (tree) => {
        return {
            scalar: tree.rootNode.descendantsOfType('scalar_subquery').length,
            exists: tree.rootNode.descendantsOfType('exists_expression').length
        };
    };

    const calculateComplexity = (tree) => {
        let complexity = 1;
        complexity += tree.rootNode.descendantsOfType('join_clause').length * 2;
        complexity += tree.rootNode.descendantsOfType('scalar_subquery').length * 3;
        complexity += tree.rootNode.descendantsOfType('exists_expression').length * 3;
        complexity += tree.rootNode.descendantsOfType('case_expression').length * 2;
        complexity += tree.rootNode.descendantsOfType('window_function').length * 2;
        complexity += tree.rootNode.descendantsOfType('cte').length * 2;
        return complexity;
    };

    const handleSqlChange = (e) => {
        const newSql = e.target.value;
        setSql(newSql);
        
        // Debounce parsing
        clearTimeout(window.sqlParseTimeout);
        window.sqlParseTimeout = setTimeout(() => {
            parseSQL(newSql);
        }, 500);
    };

    const loadExample = (exampleSql) => {
        setSql(exampleSql);
        parseSQL(exampleSql);
    };

    const examples = {
        basic: "SELECT * FROM users WHERE active = 1;",
        join: `SELECT u.name, p.title 
FROM users u 
INNER JOIN posts p ON u.id = p.author_id 
WHERE u.status = 'active';`,
        cte: `WITH RECURSIVE nums AS (
  SELECT 1 as n
  UNION ALL
  SELECT n + 1 FROM nums WHERE n < 10
)
SELECT * FROM nums;`,
        window: `SELECT 
  name, 
  salary,
  ROW_NUMBER() OVER (ORDER BY salary DESC) as rank
FROM employees;`,
        upsert: `INSERT INTO stats (user_id, count) 
VALUES (1, 1)
ON CONFLICT (user_id) DO UPDATE SET count = count + 1;`
    };

    if (isLoading) {
        return (
            <div className="sql-parser loading">
                <div className="loading-spinner">⚙️</div>
                <p>Initializing SQLite parser...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sql-parser error">
                <h3>❌ Parser Error</h3>
                <p>{error}</p>
                <p>Make sure tree-sitter-sql.wasm is available in your public directory.</p>
                <button onClick={initializeParser}>Retry</button>
            </div>
        );
    }

    return (
        <div className="sql-parser">
            <style jsx>{`
                .sql-parser {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .loading, .error {
                    text-align: center;
                    padding: 40px;
                }
                
                .loading-spinner {
                    font-size: 2rem;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .header {
                    margin-bottom: 30px;
                }
                
                .input-section {
                    margin-bottom: 30px;
                }
                
                .textarea {
                    width: 100%;
                    height: 200px;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 14px;
                    border: 2px solid #ddd;
                    border-radius: 4px;
                    padding: 12px;
                    resize: vertical;
                }
                
                .examples {
                    margin: 10px 0;
                }
                
                .example-btn {
                    margin-right: 10px;
                    margin-bottom: 10px;
                    padding: 8px 16px;
                    background: #007acc;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }
                
                .example-btn:hover {
                    background: #005a9f;
                }
                
                .results {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-top: 20px;
                }
                
                .analysis-panel, .ast-panel {
                    border: 2px solid #ddd;
                    border-radius: 4px;
                    padding: 15px;
                }
                
                .analysis-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin-top: 15px;
                }
                
                .stat-card {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    padding: 12px;
                    text-align: center;
                }
                
                .stat-value {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #007acc;
                }
                
                .stat-label {
                    font-size: 0.9rem;
                    color: #666;
                    margin-top: 4px;
                }
                
                .ast-output {
                    background: #f8f8f8;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    padding: 12px;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 12px;
                    white-space: pre-wrap;
                    max-height: 400px;
                    overflow-y: auto;
                    margin-top: 10px;
                }
                
                .valid {
                    color: #28a745;
                }
                
                .invalid {
                    color: #dc3545;
                }
                
                .list {
                    list-style: none;
                    padding: 0;
                    margin: 8px 0;
                }
                
                .list li {
                    background: #e9ecef;
                    margin: 2px 0;
                    padding: 4px 8px;
                    border-radius: 3px;
                    font-size: 0.9rem;
                }
                
                @media (max-width: 768px) {
                    .results {
                        grid-template-columns: 1fr;
                    }
                    
                    .analysis-grid {
                        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    }
                }
            `}</style>
            
            <div className="header">
                <h1>🗄️ SQLite Tree-sitter Parser</h1>
                <p>Parse and analyze SQLite SQL queries in real-time</p>
            </div>
            
            <div className="input-section">
                <label htmlFor="sql-input">SQL Query:</label>
                <textarea
                    id="sql-input"
                    className="textarea"
                    value={sql}
                    onChange={handleSqlChange}
                    placeholder="Enter your SQL query here..."
                />
                
                <div className="examples">
                    <strong>Examples:</strong>
                    {Object.entries(examples).map(([name, exampleSql]) => (
                        <button
                            key={name}
                            className="example-btn"
                            onClick={() => loadExample(exampleSql)}
                        >
                            {name.charAt(0).toUpperCase() + name.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="results">
                <div className="analysis-panel">
                    <h3>📊 Query Analysis</h3>
                    {analysis ? (
                        <>
                            <div className="analysis-grid">
                                <div className="stat-card">
                                    <div className={`stat-value ${analysis.isValid ? 'valid' : 'invalid'}`}>
                                        {analysis.isValid ? '✅' : '❌'}
                                    </div>
                                    <div className="stat-label">Valid SQL</div>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-value">{analysis.type}</div>
                                    <div className="stat-label">Query Type</div>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-value">{analysis.complexity}</div>
                                    <div className="stat-label">Complexity</div>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-value">{analysis.tables.length}</div>
                                    <div className="stat-label">Tables</div>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-value">{analysis.joins.length}</div>
                                    <div className="stat-label">Joins</div>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-value">{analysis.functions.length}</div>
                                    <div className="stat-label">Functions</div>
                                </div>
                            </div>
                            
                            {analysis.tables.length > 0 && (
                                <div>
                                    <h4>Tables:</h4>
                                    <ul className="list">
                                        {analysis.tables.map((table, i) => (
                                            <li key={i}>{table}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {analysis.functions.length > 0 && (
                                <div>
                                    <h4>Functions:</h4>
                                    <ul className="list">
                                        {analysis.functions.map((func, i) => (
                                            <li key={i}>{func}()</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {analysis.joins.length > 0 && (
                                <div>
                                    <h4>Joins:</h4>
                                    <ul className="list">
                                        {analysis.joins.map((join, i) => (
                                            <li key={i}>{join}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                        <p>Enter SQL to see analysis...</p>
                    )}
                </div>
                
                <div className="ast-panel">
                    <h3>🌳 Abstract Syntax Tree</h3>
                    <div className="ast-output">
                        {parseResult || 'Enter SQL to see the AST...'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SQLParser;