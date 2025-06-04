// Helper functions
function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

// Common patterns
function alias($, mandatory_as = false) {
  return mandatory_as
    ? seq('AS', field('alias', $._identifier))
    : seq(optional('AS'), field('alias', $._identifier));
}

function if_not_exists() {
  return optional(seq('IF', 'NOT', 'EXISTS'));
}

function if_exists() {
  return optional(seq('IF', 'EXISTS'));
}

function column_list($) {
  return seq('(', commaSep1(field('column', $._identifier)), ')');
}

function qualified_table_name($, with_alias = true) {
  return with_alias
    ? seq(
        field('name', $._qualified_identifier),
        optional(alias($))
      )
    : field('name', $._qualified_identifier);
}

// Keyword groups
const DDL_KEYWORDS = [
  'CREATE', 'DROP', 'ALTER', 'TABLE', 'INDEX', 'VIEW', 'TRIGGER',
  'DATABASE', 'SCHEMA', 'VIRTUAL', 'TEMPORARY', 'TEMP', 'IF',
  'EXISTS', 'CASCADE', 'RESTRICT', 'RENAME', 'ADD', 'COLUMN',
  'FUNCTION', 'RETURNS', 'LANGUAGE'
];

const DML_KEYWORDS = [
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'FROM', 'WHERE', 'INTO',
  'VALUES', 'SET', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
  'CROSS', 'NATURAL', 'USING', 'ON', 'AS', 'GROUP', 'BY',
  'HAVING', 'ORDER', 'LIMIT', 'OFFSET', 'DISTINCT', 'ALL'
];

const TRANSACTION_KEYWORDS = [
  'BEGIN', 'COMMIT', 'ROLLBACK', 'SAVEPOINT', 'RELEASE',
  'TRANSACTION', 'DEFERRED', 'IMMEDIATE', 'EXCLUSIVE'
];

const CONSTRAINT_KEYWORDS = [
  'PRIMARY', 'KEY', 'FOREIGN', 'UNIQUE', 'CHECK', 'DEFAULT',
  'CONSTRAINT', 'REFERENCES', 'AUTOINCREMENT', 'NOT', 'NULL',
  'COLLATE', 'GENERATED', 'ALWAYS', 'STORED', 'VIRTUAL'
];

const FUNCTION_KEYWORDS = [
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'CAST', 'COALESCE',
  'NULLIF', 'SUBSTR', 'LENGTH', 'UPPER', 'LOWER', 'TRIM',
  'DATE', 'TIME', 'DATETIME', 'STRFTIME', 'JULIANDAY'
];

const OPERATOR_KEYWORDS = [
  'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'GLOB', 'MATCH',
  'REGEXP', 'IS', 'ISNULL', 'NOTNULL', 'ESCAPE'
];

const MISC_KEYWORDS = [
  'PRAGMA', 'VACUUM', 'ANALYZE', 'REINDEX', 'ATTACH', 'DETACH',
  'EXPLAIN', 'QUERY', 'PLAN', 'WITH', 'RECURSIVE', 'WITHOUT',
  'ROWID', 'FILTER', 'OVER', 'PARTITION', 'WINDOW', 'ROWS',
  'RANGE', 'PRECEDING', 'FOLLOWING', 'CURRENT', 'ROW', 'UNBOUNDED',
  'EXCLUDE', 'TIES', 'GROUPS', 'NO', 'OTHERS', 'CASE', 'WHEN',
  'THEN', 'ELSE', 'END', 'RAISE', 'ABORT', 'FAIL', 'IGNORE',
  'REPLACE', 'CONFLICT', 'DO', 'NOTHING', 'RETURNING', 'ASC',
  'DESC', 'FULL', 'GLOB', 'EACH', 'FOR', 'OF', 'INSTEAD',
  'BEFORE', 'AFTER', 'NEW', 'OLD', 'UNION', 'INTERSECT', 'EXCEPT',
  'TRUE', 'FALSE', 'DEFERRABLE', 'INITIALLY', 'MATCH', 'ON',
  'USING', 'TO', 'INDEXED', 'ACTION', 'RESTRICT'
];

// ZetaSQL-specific keywords (excluding data types which are handled in type_name)
const ZETASQL_KEYWORDS = [
  'EXTEND', 'RENAME', 'AGGREGATE', 'TABLESAMPLE', 'PIVOT', 'UNPIVOT',
  'ASSERT', 'SAFE_CAST', 'NULLIFZERO', 'ZEROIFNULL',
  'PROTO', 'CALL', 'DESTINATION', 'SOURCE', 'GRAPH',
  'NODES', 'EDGES', 'PROPERTY_EXISTS', 'ELEMENT_ID', 'SAFE'
];

// Grouped binary operators by precedence
const OPERATORS_BY_PRECEDENCE = {
  1: ['||'],  // String concatenation
  2: ['*', '/', '%'],  // Multiplication, division, modulo
  3: ['+', '-'],  // Addition, subtraction
  4: ['<<', '>>', '&', '|'],  // Bitwise operators
  5: ['<', '<=', '>', '>='],  // Comparison
  6: ['=', '==', '!=', '<>', 'IS', 'IS NOT', 'IN', 'NOT IN', 'LIKE', 'NOT LIKE', 'GLOB', 'NOT GLOB', 'MATCH', 'NOT MATCH', 'REGEXP', 'NOT REGEXP', '->', '->>', '@>', '<@', token('#>'), token('#>>'), token('?&'), token('?|'), token('&&'), token('@@')],  // Equality, pattern matching, and PostgreSQL operators
  7: ['AND'],  // Logical AND
  8: ['OR'],  // Logical OR
};

module.exports = grammar({
  name: 'sql',

  extras: $ => [
    /\s/,
    $.comment,
  ],

  conflicts: $ => [
    [$.identifier, $._keyword],
    [$._expression, $.select_statement],
    [$.column_definition, $.table_constraint],
    [$.qualified_identifier, $._identifier],
    [$._qualified_identifier, $.qualified_identifier],
    [$._expression, $.qualified_identifier],
    [$.table_or_subquery],
    [$.table_or_subquery, $.join_clause],
    [$.column_constraint],
    [$.exists_expression],
    [$.foreign_key_clause],
    [$.create_trigger_statement, $.commit_statement],
    [$.values_clause],
    [$.on_conflict_clause, $._expression],
    [$.join_clause],
    [$.qualified_identifier, $.reindex_statement],
    [$._statement],
    [$.binary_expression, $.unary_expression, $.in_expression, $.between_expression, $.like_expression, $.collate_expression, $.is_expression],
    [$.qualified_identifier, $.function_call],
    [$._qualified_identifier, $._expression],
    [$.null, $.is_expression],
    [$.boolean, $.is_expression],
    [$.binary_expression, $.in_expression],
    [$.binary_expression, $.like_expression],
    [$.binary_expression, $.is_expression],
    [$.select_statement, $.insert_statement],
    [$._pragma_value, $._literal_value],
    [$.like_expression, $.collate_expression],
    [$.like_expression, $.null_expression],
    [$.in_expression, $.between_expression, $.like_expression],
    [$.between_expression, $.like_expression],
    [$.unary_expression, $.is_expression],
    [$.binary_expression, $.in_expression, $.between_expression, $.like_expression],
    [$.binary_expression, $.between_expression, $.like_expression],
    [$.unary_expression, $.in_expression, $.between_expression, $.like_expression, $.is_expression],
    [$.unary_expression, $.is_expression, $.collate_expression],
    [$.unary_expression, $.between_expression, $.is_expression],
    [$.unary_expression, $.is_expression, $.null_expression],
    [$.in_expression, $.subquery_expression],
    [$.parenthesized_expression, $.in_expression],
    [$.column_constraint, $.in_expression, $.between_expression, $.like_expression],
    [$.column_constraint, $.collate_expression],
    [$.column_constraint, $._expression],
    [$.like_expression],
    [$.select_core, $.pipe_query],
  ],

  precedences: $ => [
    ['unary', 'binary'],
    ['member', 'call'],
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($._statement),

    _statement: $ => seq(
      choice(
        $.select_statement,
        $.insert_statement,
        $.update_statement,
        $.delete_statement,
        $.create_table_statement,
        $.create_index_statement,
        $.create_view_statement,
        $.create_trigger_statement,
        $.create_virtual_table_statement,
        $.create_aggregate_statement,
        $.create_function_statement,
        $.drop_statement,
        $.alter_table_statement,
        $.pragma_statement,
        $.attach_statement,
        $.detach_statement,
        $.vacuum_statement,
        $.analyze_statement,
        $.reindex_statement,
        $.begin_statement,
        $.commit_statement,
        $.rollback_statement,
        $.savepoint_statement,
        $.release_statement,
        $.explain_statement,
      ),
      optional(';')
    ),

    comment: $ => token(choice(
      seq('--', /.*/),
      seq(
        '/*',
        /[^*]*\*+([^/*][^*]*\*+)*/,
        '/'
      )
    )),

    // Identifiers
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    qualified_identifier: $ => seq(
      optional(seq(field('schema', $.identifier), '.')),
      field('name', $.identifier)
    ),

    quoted_identifier: $ => choice(
      seq('`', /[^`]+/, '`'),
      seq('[', /[^\]]+/, ']'),
      seq('"', /[^"]+/, '"')
    ),

    _identifier: $ => choice(
      $.identifier,
      $.quoted_identifier
    ),

    _qualified_identifier: $ => choice(
      $.qualified_identifier,
      $.quoted_identifier
    ),

    // Keywords - now organized by category
    _keyword: $ => choice(
      ...DDL_KEYWORDS,
      ...DML_KEYWORDS,
      ...TRANSACTION_KEYWORDS,
      ...CONSTRAINT_KEYWORDS,
      ...FUNCTION_KEYWORDS,
      ...OPERATOR_KEYWORDS,
      ...MISC_KEYWORDS,
      ...ZETASQL_KEYWORDS
    ),

    // SELECT statement
    select_statement: $ => seq(
      optional($.with_clause),
      choice(
        $.select_core,
        $.values_clause
      ),
      repeat($.compound_operator),
      optional($.order_by_clause),
      optional($.limit_clause)
    ),

    with_clause: $ => seq(
      'WITH',
      optional('RECURSIVE'),
      commaSep1($.common_table_expression)
    ),

    common_table_expression: $ => seq(
      field('name', $.identifier),
      optional(column_list($)),
      'AS',
      '(',
      field('query', $.select_statement),
      ')'
    ),

    select_core: $ => seq(
      'SELECT',
      optional(choice('DISTINCT', 'ALL')),
      field('columns', $.select_list),
      optional($.from_clause),
      optional($.where_clause),
      optional($.group_by_clause),
      optional($.window_clause)
    ),

    select_list: $ => choice(
      '*',
      commaSep1($.result_column)
    ),

    result_column: $ => choice(
      seq(field('table', $.identifier), '.', '*'),
      seq(field('expression', $._expression), optional(alias($)))
    ),

    from_clause: $ => seq(
      'FROM',
      $.table_or_subquery,
      repeat($.join_clause)
    ),

    table_or_subquery: $ => choice(
      seq(
        qualified_table_name($),
        optional(choice(
          seq('INDEXED', 'BY', field('index', $.identifier)),
          seq('NOT', 'INDEXED')
        ))
      ),
      seq(
        '(',
        choice(
          $.select_statement,
          $.table_or_subquery,
          seq($.table_or_subquery, repeat1($.join_clause))
        ),
        ')',
        optional(alias($))
      )
    ),

    join_clause: $ => seq(
      optional(choice('NATURAL')),
      optional(choice('LEFT', 'RIGHT', 'FULL')),
      optional('OUTER'),
      choice('JOIN', 'INNER JOIN', 'CROSS JOIN', ','),
      $.table_or_subquery,
      optional($.join_constraint)
    ),

    join_constraint: $ => choice(
      seq('ON', field('condition', $._expression)),
      seq('USING', column_list($))
    ),

    where_clause: $ => seq('WHERE', field('condition', $._expression)),

    group_by_clause: $ => seq(
      'GROUP', 'BY',
      commaSep1(field('expression', $._expression)),
      optional(seq('HAVING', field('having', $._expression)))
    ),

    window_clause: $ => seq(
      'WINDOW',
      commaSep1(seq(
        field('name', $.identifier),
        'AS',
        $.window_definition
      ))
    ),

    window_definition: $ => seq(
      '(',
      optional(seq('PARTITION', 'BY', commaSep1($._expression))),
      optional($.order_by_clause),
      optional($.frame_spec),
      ')'
    ),

    frame_spec: $ => seq(
      choice('RANGE', 'ROWS', 'GROUPS'),
      choice(
        seq('BETWEEN', $.frame_bound, 'AND', $.frame_bound),
        $.frame_bound
      ),
      optional(seq('EXCLUDE', choice('NO OTHERS', 'CURRENT ROW', 'GROUP', 'TIES')))
    ),

    frame_bound: $ => choice(
      'UNBOUNDED PRECEDING',
      seq($._expression, 'PRECEDING'),
      'CURRENT ROW',
      seq($._expression, 'FOLLOWING'),
      'UNBOUNDED FOLLOWING'
    ),

    order_by_clause: $ => seq(
      'ORDER', 'BY',
      commaSep1($.ordering_term)
    ),

    ordering_term: $ => seq(
      field('expression', $._expression),
      optional(choice('ASC', 'DESC')),
      optional(seq('NULLS', choice('FIRST', 'LAST')))
    ),

    limit_clause: $ => seq(
      'LIMIT',
      field('limit', $._expression),
      optional(seq(choice('OFFSET', ','), field('offset', $._expression)))
    ),

    compound_operator: $ => seq(
      field('operator', choice('UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT')),
      $.select_core
    ),

    // INSERT statement
    insert_statement: $ => seq(
      optional($.with_clause),
      choice('INSERT', 'REPLACE'),
      optional(choice('OR', 'ROLLBACK', 'ABORT', 'REPLACE', 'FAIL', 'IGNORE')),
      'INTO',
      qualified_table_name($, false),
      optional(alias($)),
      choice(
        seq(
          optional(column_list($)),
          $.values_clause,
          optional($.on_conflict_clause)
        ),
        seq(
          optional(column_list($)),
          field('select', $.select_statement),
          optional($.on_conflict_clause)
        ),
        seq('DEFAULT', 'VALUES')
      ),
      optional($.returning_clause)
    ),

    values_clause: $ => seq(
      'VALUES',
      commaSep1(seq(
        '(',
        commaSep1(field('value', $._expression)),
        ')'
      ))
    ),

    on_conflict_clause: $ => seq(
      'ON', 'CONFLICT',
      optional(seq(
        '(',
        commaSep1(field('column', $.identifier)),
        optional($.where_clause),
        ')'
      )),
      'DO',
      choice(
        'NOTHING',
        seq(
          'UPDATE',
          'SET',
          commaSep1($.update_set)
        )
      ),
      optional($.where_clause)
    ),

    update_set: $ => seq(
      choice(
        field('column', $.identifier),
        seq('(', commaSep1(field('column', $.identifier)), ')')
      ),
      '=',
      field('value', $._expression)
    ),

    returning_clause: $ => seq(
      'RETURNING',
      choice(
        '*',
        commaSep1(seq(
          field('expression', $._expression),
          optional(alias($))
        ))
      )
    ),

    // UPDATE statement
    update_statement: $ => seq(
      optional($.with_clause),
      'UPDATE',
      optional(choice('OR', 'ROLLBACK', 'ABORT', 'REPLACE', 'FAIL', 'IGNORE')),
      qualified_table_name($),
      'SET',
      commaSep1($.update_set),
      optional($.where_clause),
      optional($.returning_clause)
    ),

    // DELETE statement
    delete_statement: $ => seq(
      optional($.with_clause),
      'DELETE',
      'FROM',
      qualified_table_name($),
      optional($.where_clause),
      optional($.returning_clause)
    ),

    // CREATE TABLE statement
    create_table_statement: $ => seq(
      'CREATE',
      optional(choice('TEMP', 'TEMPORARY')),
      'TABLE',
      if_not_exists(),
      qualified_table_name($, false),
      choice(
        seq(
          '(',
          commaSep1(choice(
            $.column_definition,
            $.table_constraint
          )),
          ')',
          optional(seq('WITHOUT', 'ROWID'))
        ),
        seq('AS', field('select', $.select_statement))
      ),
      optional(seq('STRICT', optional(seq(',', 'WITHOUT', 'ROWID'))))
    ),

    column_definition: $ => seq(
      field('name', $.identifier),
      optional(field('type', $.type_name)),
      repeat($.column_constraint)
    ),

    type_name: $ => choice(
      seq(
        field('name', $.identifier),
        optional(seq(
          '(',
          field('size', $.integer),
          optional(seq(',', field('scale', $.integer))),
          ')'
        ))
      ),
      field('name', $.array_type),
      field('name', $.struct_type)
    ),

    column_constraint: $ => seq(
      optional(seq('CONSTRAINT', field('name', $.identifier))),
      choice(
        seq('PRIMARY', 'KEY', optional(choice('ASC', 'DESC')), optional($.conflict_clause), optional('AUTOINCREMENT')),
        seq('NOT', 'NULL', optional($.conflict_clause)),
        seq('UNIQUE', optional($.conflict_clause)),
        seq('CHECK', '(', field('expression', $._expression), ')'),
        seq('DEFAULT', field('value', choice($._expression, $._literal_value))),
        seq('COLLATE', field('collation', $.identifier)),
        $.foreign_key_clause,
        seq(
          optional(seq('GENERATED', 'ALWAYS')),
          'AS',
          '(',
          field('expression', $._expression),
          ')',
          optional(choice('STORED', 'VIRTUAL'))
        )
      )
    ),

    table_constraint: $ => seq(
      optional(seq('CONSTRAINT', field('name', $.identifier))),
      choice(
        seq(
          choice('PRIMARY KEY', 'UNIQUE'),
          '(',
          commaSep1(seq(
            field('column', $.identifier),
            optional(choice('ASC', 'DESC'))
          )),
          ')',
          optional($.conflict_clause)
        ),
        seq(
          'CHECK',
          '(',
          field('expression', $._expression),
          ')'
        ),
        seq(
          'FOREIGN', 'KEY',
          column_list($),
          $.foreign_key_clause
        )
      )
    ),

    foreign_key_clause: $ => seq(
      'REFERENCES',
      field('table', $._qualified_identifier),
      optional(column_list($)),
      repeat(choice(
        seq(
          'ON',
          choice('DELETE', 'UPDATE'),
          choice('SET NULL', 'SET DEFAULT', 'CASCADE', 'RESTRICT', 'NO ACTION')
        ),
        seq('MATCH', field('name', $.identifier))
      )),
      optional(seq(
        optional('NOT'),
        'DEFERRABLE',
        optional(seq('INITIALLY', choice('DEFERRED', 'IMMEDIATE')))
      ))
    ),

    conflict_clause: $ => seq(
      'ON', 'CONFLICT',
      choice('ROLLBACK', 'ABORT', 'FAIL', 'IGNORE', 'REPLACE')
    ),

    // CREATE INDEX statement
    create_index_statement: $ => seq(
      'CREATE',
      optional('UNIQUE'),
      'INDEX',
      if_not_exists(),
      field('name', $._qualified_identifier),
      'ON',
      field('table', $._qualified_identifier),
      '(',
      commaSep1($.indexed_column),
      ')',
      optional($.where_clause)
    ),

    indexed_column: $ => seq(
      field('expression', $._expression),
      optional(choice('ASC', 'DESC'))
    ),

    // CREATE VIEW statement
    create_view_statement: $ => seq(
      'CREATE',
      optional(choice('TEMP', 'TEMPORARY')),
      'VIEW',
      if_not_exists(),
      field('name', $._qualified_identifier),
      optional(column_list($)),
      'AS',
      field('select', $.select_statement)
    ),

    // CREATE TRIGGER statement
    create_trigger_statement: $ => seq(
      'CREATE',
      optional(choice('TEMP', 'TEMPORARY')),
      'TRIGGER',
      if_not_exists(),
      field('name', $._qualified_identifier),
      optional(choice('BEFORE', 'AFTER', 'INSTEAD OF')),
      choice(
        'DELETE',
        'INSERT',
        seq('UPDATE', optional(seq('OF', commaSep1(field('column', $.identifier)))))
      ),
      'ON',
      field('table', $._qualified_identifier),
      optional(seq('FOR', 'EACH', 'ROW')),
      optional(seq('WHEN', field('condition', $._expression))),
      'BEGIN',
      repeat1($._statement),
      'END'
    ),

    // CREATE VIRTUAL TABLE statement
    create_virtual_table_statement: $ => seq(
      'CREATE', 'VIRTUAL', 'TABLE',
      if_not_exists(),
      field('name', $._qualified_identifier),
      'USING',
      field('module', $.identifier),
      optional(seq(
        '(',
        commaSep(field('argument', choice($.identifier, $._literal_value))),
        ')'
      ))
    ),

    // CREATE AGGREGATE statement (PostgreSQL)
    create_aggregate_statement: $ => seq(
      'CREATE',
      optional(seq('OR', 'REPLACE')),
      'AGGREGATE',
      field('name', $.identifier),
      '(',
      field('parameter_type', $.identifier),
      ')',
      '(',
      commaSep1($.aggregate_option),
      ')'
    ),

    aggregate_option: $ => seq(
      field('option_name', $.identifier),
      '=',
      field('option_value', $.identifier)
    ),

    // CREATE FUNCTION statement (PostgreSQL)
    create_function_statement: $ => seq(
      'CREATE',
      optional(seq('OR', 'REPLACE')),
      'FUNCTION',
      field('name', $.identifier),
      '(',
      optional(commaSep1($.function_parameter)),
      ')',
      'RETURNS',
      field('return_type', $.identifier),
      'AS',
      $.dollar_quoted_string,
      'LANGUAGE',
      field('language', $.identifier)
    ),

    function_parameter: $ => seq(
      field('name', $.identifier),
      field('type', $.identifier)
    ),

    // Dollar-quoted strings for PostgreSQL ($$...$$)
    dollar_quoted_string: $ => seq(
      '$$',
      /[^$]*(\$[^$]+)*[^$]*/,
      '$$'
    ),

    // DROP statement
    drop_statement: $ => seq(
      'DROP',
      field('type', choice('TABLE', 'INDEX', 'VIEW', 'TRIGGER')),
      if_exists(),
      field('name', $._qualified_identifier)
    ),

    // ALTER TABLE statement
    alter_table_statement: $ => seq(
      'ALTER', 'TABLE',
      field('table', $._qualified_identifier),
      choice(
        seq('RENAME', 'TO', field('new_name', $.identifier)),
        seq('RENAME', optional('COLUMN'), field('old_name', $.identifier), 'TO', field('new_name', $.identifier)),
        seq('ADD', optional('COLUMN'), $.column_definition),
        seq('DROP', optional('COLUMN'), field('column', $.identifier))
      )
    ),

    // PRAGMA statement
    pragma_statement: $ => seq(
      'PRAGMA',
      optional(seq(field('schema', $.identifier), '.')),
      field('name', $.identifier),
      optional(choice(
        seq('=', field('value', $._pragma_value)),
        seq('(', field('value', $._pragma_value), ')')
      ))
    ),

    _pragma_value: $ => choice(
      $.identifier,
      $._literal_value,
      $.boolean
    ),

    // ATTACH/DETACH statements
    attach_statement: $ => seq(
      'ATTACH',
      optional('DATABASE'),
      field('file', $._expression),
      'AS',
      field('schema', $.identifier)
    ),

    detach_statement: $ => seq(
      'DETACH',
      optional('DATABASE'),
      field('schema', $.identifier)
    ),

    // VACUUM statement
    vacuum_statement: $ => seq(
      'VACUUM',
      optional(field('schema', $.identifier)),
      optional(seq('INTO', field('file', $._expression)))
    ),

    // ANALYZE statement
    analyze_statement: $ => seq(
      'ANALYZE',
      optional(choice(
        field('schema', $.identifier),
        seq(
          field('schema', $.identifier),
          '.',
          field('table_or_index', $.identifier)
        )
      ))
    ),

    // REINDEX statement
    reindex_statement: $ => seq(
      'REINDEX',
      optional(choice(
        field('name', $.identifier),
        field('name', $._qualified_identifier)
      ))
    ),

    // Transaction statements
    begin_statement: $ => seq(
      'BEGIN',
      optional(choice('DEFERRED', 'IMMEDIATE', 'EXCLUSIVE')),
      optional('TRANSACTION')
    ),

    commit_statement: $ => seq(
      choice('COMMIT', 'END'),
      optional('TRANSACTION')
    ),

    rollback_statement: $ => seq(
      'ROLLBACK',
      optional('TRANSACTION'),
      optional(seq('TO', optional('SAVEPOINT'), field('savepoint', $.identifier)))
    ),

    savepoint_statement: $ => seq(
      'SAVEPOINT',
      field('name', $.identifier)
    ),

    release_statement: $ => seq(
      'RELEASE',
      optional('SAVEPOINT'),
      field('name', $.identifier)
    ),

    // EXPLAIN statement
    explain_statement: $ => seq(
      'EXPLAIN',
      optional(seq('QUERY', 'PLAN')),
      $._statement
    ),

    // Expressions
    _expression: $ => choice(
      $._literal_value,
      $.identifier,
      $.qualified_identifier,
      $.parameter,
      $.unary_expression,
      $.binary_expression,
      $.parenthesized_expression,
      $.cast_expression,
      $.case_expression,
      $.exists_expression,
      $.in_expression,
      $.between_expression,
      $.like_expression,
      $.is_expression,
      $.null_expression,
      $.collate_expression,
      $.function_call,
      $.subquery_expression,
      $.raise_expression,
      $.array_constructor,
      $.safe_cast_expression,
      $.nullifzero_expression,
      $.zeroifnull_expression
    ),

    _literal_value: $ => choice(
      $.integer,
      $.real,
      $.string,
      $.blob,
      $.null,
      $.boolean
    ),

    integer: $ => /\d+/,

    real: $ => /\d+\.\d+([eE][+-]?\d+)?/,

    string: $ => seq(
      "'",
      repeat(choice(
        /[^']/,
        "''"
      )),
      "'"
    ),

    blob: $ => seq(
      choice('x', 'X'),
      "'",
      /[0-9a-fA-F]+/,
      "'"
    ),

    null: $ => 'NULL',

    boolean: $ => choice('TRUE', 'FALSE'),

    unary_expression: $ => prec.right('unary', choice(
      seq('-', field('operand', $._expression)),
      seq('+', field('operand', $._expression)),
      seq('NOT', field('operand', $._expression)),
      seq('~', field('operand', $._expression))
    )),

    binary_expression: $ => {
      const table = [];
      
      for (const [precedence, operators] of Object.entries(OPERATORS_BY_PRECEDENCE)) {
        for (const operator of operators) {
          table.push([parseInt(precedence), operator]);
        }
      }

      return choice(...table.map(([precedence, operator]) => 
        prec.left(precedence, seq(
          field('left', $._expression),
          field('operator', operator),
          field('right', $._expression)
        ))
      ));
    },

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    cast_expression: $ => seq(
      'CAST',
      '(',
      field('expression', $._expression),
      'AS',
      field('type', $.type_name),
      ')'
    ),

    case_expression: $ => seq(
      'CASE',
      optional(field('expression', $._expression)),
      repeat1(seq(
        'WHEN',
        field('condition', $._expression),
        'THEN',
        field('result', $._expression)
      )),
      optional(seq('ELSE', field('else', $._expression))),
      'END'
    ),

    exists_expression: $ => seq(
      optional('NOT'),
      'EXISTS',
      '(',
      field('subquery', $.select_statement),
      ')'
    ),

    in_expression: $ => seq(
      field('expression', $._expression),
      optional('NOT'),
      'IN',
      choice(
        seq('(', commaSep1(field('value', $._expression)), ')'),
        seq('(', field('subquery', $.select_statement), ')'),
        qualified_table_name($, false),
        seq(
          qualified_table_name($, false),
          '(',
          commaSep1(field('argument', $._expression)),
          ')'
        )
      )
    ),

    between_expression: $ => seq(
      field('expression', $._expression),
      optional('NOT'),
      'BETWEEN',
      field('low', $._expression),
      'AND',
      field('high', $._expression)
    ),

    like_expression: $ => seq(
      field('expression', $._expression),
      optional('NOT'),
      choice('LIKE', 'GLOB', 'MATCH', 'REGEXP'),
      field('pattern', $._expression),
      optional(seq('ESCAPE', field('escape', $._expression)))
    ),

    is_expression: $ => seq(
      field('left', $._expression),
      'IS',
      optional('NOT'),
      choice(
        'NULL',
        'TRUE',
        'FALSE',
        field('value', $._expression)
      )
    ),

    null_expression: $ => seq(
      field('expression', $._expression),
      choice('ISNULL', 'NOTNULL')
    ),

    collate_expression: $ => seq(
      field('expression', $._expression),
      'COLLATE',
      field('collation', $.identifier)
    ),

    function_call: $ => seq(
      field('name', $.identifier),
      '(',
      optional(choice(
        '*',
        seq(
          optional('DISTINCT'),
          commaSep1(field('argument', $._expression))
        )
      )),
      ')',
      optional(seq(
        optional(seq('FILTER', '(', 'WHERE', field('filter', $._expression), ')')),
        'OVER',
        choice(
          field('window', $.identifier),
          $.window_definition
        )
      ))
    ),

    subquery_expression: $ => seq(
      '(',
      $.select_statement,
      ')'
    ),

    raise_expression: $ => seq(
      'RAISE',
      '(',
      choice('IGNORE', 'ROLLBACK', 'ABORT', 'FAIL'),
      optional(seq(',', field('message', $.string))),
      ')'
    ),

    parameter: $ => choice(
      token('?'),  // Anonymous parameter
      seq(token('?'), $.integer),  // Numbered parameter (?1, ?2, etc.)
      seq(':', $.identifier),  // Named parameter (:name)
      seq('@', $.identifier),  // Named parameter (@name)
      seq('$', $.identifier),  // Named parameter ($name)
      seq('$', $.integer)  // Numbered parameter ($1, $2, etc.)
    ),

    array_constructor: $ => choice(
      seq(
        'ARRAY',
        '[',
        commaSep1(field('element', $._expression)),
        ']'
      ),
      seq(
        'ARRAY',
        '(',
        field('subquery', $.select_statement),
        ')'
      )
    ),

    // ZetaSQL data types
    array_type: $ => seq(
      'ARRAY',
      '<',
      field('element_type', $.type_name),
      '>'
    ),

    struct_type: $ => seq(
      'STRUCT',
      '<',
      commaSep1(seq(
        field('field_name', $.identifier),
        field('field_type', $.type_name)
      )),
      '>'
    ),

    // ZetaSQL pipe syntax
    pipe_query: $ => prec(1, seq(
      'FROM',
      field('source', $.table_or_subquery),
      repeat1($.pipe_operator)
    )),

    pipe_operator: $ => seq(
      token('|>'),
      field('operator', choice(
        $.pipe_select,
        $.pipe_extend,
        $.pipe_set,
        $.pipe_drop,
        $.pipe_rename,
        $.pipe_where,
        $.pipe_limit,
        $.pipe_aggregate,
        $.pipe_distinct,
        $.pipe_order_by,
        $.pipe_join,
        $.pipe_assert
      ))
    ),

    pipe_select: $ => seq('SELECT', commaSep1($._expression)),
    pipe_extend: $ => seq('EXTEND', commaSep1(seq($._expression, optional(alias($))))),
    pipe_set: $ => seq('SET', commaSep1(seq($.identifier, '=', $._expression))),
    pipe_drop: $ => seq('DROP', commaSep1($.identifier)),
    pipe_rename: $ => seq('RENAME', commaSep1(seq($.identifier, 'AS', $.identifier))),
    pipe_where: $ => seq('WHERE', $._expression),
    pipe_limit: $ => seq('LIMIT', $._expression),
    pipe_aggregate: $ => seq(
      'AGGREGATE',
      commaSep1(seq($._expression, optional(alias($)))),
      optional(seq('GROUP', 'BY', commaSep1($._expression)))
    ),
    pipe_distinct: $ => 'DISTINCT',
    pipe_order_by: $ => seq('ORDER', 'BY', commaSep1($.ordering_term)),
    pipe_join: $ => seq(
      optional(choice('LEFT', 'RIGHT', 'FULL', 'INNER')),
      'JOIN',
      $.table_or_subquery,
      optional($.join_constraint)
    ),
    pipe_assert: $ => seq('ASSERT', $._expression),

    // ZetaSQL-specific functions
    safe_cast_expression: $ => seq(
      'SAFE_CAST',
      '(',
      field('expression', $._expression),
      'AS',
      field('type', $.type_name),
      ')'
    ),

    nullifzero_expression: $ => seq(
      'NULLIFZERO',
      '(',
      field('expression', $._expression),
      ')'
    ),

    zeroifnull_expression: $ => seq(
      'ZEROIFNULL',
      '(',
      field('expression', $._expression),
      ')'
    ),

  }
});