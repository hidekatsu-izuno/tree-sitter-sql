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

    // Keywords
    _keyword: $ => choice(
      'ABORT', 'ACTION', 'ADD', 'AFTER', 'ALL', 'ALTER', 'ANALYZE', 'AND', 'AS', 'ASC',
      'ATTACH', 'AUTOINCREMENT', 'BEFORE', 'BEGIN', 'BETWEEN', 'BY', 'CASCADE', 'CASE',
      'CAST', 'CHECK', 'COLLATE', 'COLUMN', 'COMMIT', 'CONFLICT', 'CONSTRAINT', 'CREATE',
      'CROSS', 'CURRENT', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'DATABASE',
      'DEFAULT', 'DEFERRABLE', 'DEFERRED', 'DELETE', 'DESC', 'DETACH', 'DISTINCT', 'DO',
      'DROP', 'EACH', 'ELSE', 'END', 'ESCAPE', 'EXCEPT', 'EXCLUDE', 'EXCLUDED', 'EXCLUSIVE', 'EXISTS',
      'EXPLAIN', 'FAIL', 'FILTER', 'FIRST', 'FOLLOWING', 'FOR', 'FOREIGN', 'FROM', 'FULL',
      'GLOB', 'GROUP', 'GROUPS', 'HAVING', 'IF', 'IGNORE', 'IMMEDIATE', 'IN', 'INDEX',
      'INDEXED', 'INITIALLY', 'INNER', 'INSERT', 'INSTEAD', 'INTERSECT', 'INTO', 'IS',
      'ISNULL', 'JOIN', 'KEY', 'LAST', 'LEFT', 'LIKE', 'LIMIT', 'MATCH', 'MATERIALIZED', 'NATURAL', 'NO',
      'NOT', 'NOTHING', 'NOTNULL', 'NULL', 'NULLS', 'OF', 'OFFSET', 'ON', 'OR', 'ORDER',
      'OTHERS', 'OUTER', 'OVER', 'PARTITION', 'PLAN', 'PRAGMA', 'PRECEDING', 'PRIMARY',
      'QUERY', 'RAISE', 'RANGE', 'RECURSIVE', 'REFERENCES', 'REGEXP', 'REINDEX', 'RELEASE',
      'RENAME', 'REPLACE', 'RESTRICT', 'RETURNING', 'RIGHT', 'ROLLBACK', 'ROW', 'ROWS', 'STRICT',
      'SAVEPOINT', 'SELECT', 'SET', 'TABLE', 'TEMP', 'TEMPORARY', 'THEN', 'TIES', 'TO',
      'TRANSACTION', 'TRIGGER', 'UNBOUNDED', 'UNION', 'UNIQUE', 'UPDATE', 'USING', 'VACUUM',
      'VALUES', 'VIEW', 'VIRTUAL', 'WHEN', 'WHERE', 'WINDOW', 'WITH', 'WITHOUT'
    ),

    // SELECT Statement
    select_statement: $ => seq(
      optional($.with_clause),
      $.select_core,
      repeat(seq(
        choice('UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT'),
        $.select_core
      )),
      optional($.order_by_clause),
      optional($.limit_clause)
    ),

    with_clause: $ => seq(
      'WITH',
      optional('RECURSIVE'),
      commaSep1($.cte)
    ),

    cte: $ => seq(
      field('name', $._identifier),
      optional(seq('(', commaSep1($._identifier), ')')),
      'AS',
      optional(choice('MATERIALIZED', seq('NOT', 'MATERIALIZED'))),
      '(',
      $.select_statement,
      ')'
    ),

    select_core: $ => seq(
      'SELECT',
      optional(choice('DISTINCT', 'ALL')),
      $.select_list,
      optional($.from_clause),
      optional($.where_clause),
      optional($.group_by_clause),
      optional($.having_clause),
      optional($.window_clause)
    ),

    select_list: $ => choice(
      '*',
      commaSep1($.select_item)
    ),

    select_item: $ => seq(
      $._expression,
      optional(seq(optional('AS'), field('alias', $._identifier)))
    ),

    from_clause: $ => seq(
      'FROM',
      $.table_or_subquery,
      repeat($.join_clause)
    ),

    table_or_subquery: $ => choice(
      seq(
        field('name', $._qualified_identifier),
        optional(seq(optional('AS'), field('alias', $._identifier))),
        optional($.indexed_by)
      ),
      seq(
        '(',
        choice($.select_statement, $.join_clause),
        ')',
        optional(seq(optional('AS'), field('alias', $._identifier)))
      ),
      seq(
        '(',
        commaSep1($.table_or_subquery),
        ')'
      ),
      // Table-valued function
      seq(
        $.function_call,
        optional(seq(optional('AS'), field('alias', $._identifier)))
      ),
      // VALUES constructor
      seq(
        $.values_clause,
        optional(seq('AS', field('alias', $._identifier), optional(seq('(', commaSep1(field('column', $._identifier)), ')'))))
      )
    ),

    indexed_by: $ => choice(
      seq('INDEXED', 'BY', field('index', $._identifier)),
      seq('NOT', 'INDEXED')
    ),

    join_clause: $ => seq(
      $.join_operator,
      $.table_or_subquery,
      optional($.join_constraint)
    ),

    join_operator: $ => choice(
      ',',
      seq(optional('NATURAL'), optional(choice('LEFT', 'RIGHT', 'FULL')), optional('OUTER'), 'JOIN'),
      seq('INNER', 'JOIN'),
      seq('CROSS', 'JOIN')
    ),

    join_constraint: $ => choice(
      seq('ON', $._expression),
      seq('USING', '(', commaSep1($._identifier), ')')
    ),

    where_clause: $ => seq('WHERE', $._expression),

    group_by_clause: $ => seq(
      'GROUP', 'BY',
      commaSep1($._expression)
    ),

    having_clause: $ => seq('HAVING', $._expression),

    window_clause: $ => seq(
      'WINDOW',
      commaSep1(seq(
        field('name', $._identifier),
        'AS',
        $.window_definition
      ))
    ),

    window_definition: $ => seq(
      '(',
      optional(field('base', $._identifier)),
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
      commaSep1($.order_by_item)
    ),

    order_by_item: $ => seq(
      $._expression,
      optional(choice('ASC', 'DESC')),
      optional(seq('NULLS', choice('FIRST', 'LAST')))
    ),

    limit_clause: $ => seq(
      'LIMIT',
      $._expression,
      optional(choice(
        seq('OFFSET', $._expression),
        seq(',', $._expression)
      ))
    ),

    // INSERT Statement
    insert_statement: $ => seq(
      optional($.with_clause),
      choice('INSERT', 'REPLACE'),
      optional(seq('OR', $.conflict_clause)),
      'INTO',
      field('table', $._qualified_identifier),
      optional(seq('AS', field('alias', $._identifier))),
      optional(seq('(', commaSep1(field('column', $._identifier)), ')')),
      choice(
        $.values_clause,
        $.select_statement,
        seq('DEFAULT', 'VALUES')
      ),
      optional($.on_conflict_clause),
      optional($.returning_clause)
    ),

    values_clause: $ => seq(
      'VALUES',
      commaSep1(seq('(', commaSep1($._expression), ')'))
    ),

    returning_clause: $ => seq(
      'RETURNING',
      choice('*', commaSep1($.select_item))
    ),

    // UPDATE Statement
    update_statement: $ => seq(
      optional($.with_clause),
      'UPDATE',
      optional(seq('OR', $.conflict_clause)),
      field('table', $._qualified_identifier),
      optional(seq('AS', field('alias', $._identifier))),
      'SET',
      commaSep1($.update_set),
      optional($.from_clause),
      optional($.where_clause),
      optional($.returning_clause)
    ),

    update_set: $ => choice(
      seq(field('column', $._identifier), '=', $._expression),
      seq(
        '(',
        commaSep1(field('column', $._identifier)),
        ')',
        '=',
        '(',
        commaSep1($._expression),
        ')'
      )
    ),

    // DELETE Statement
    delete_statement: $ => seq(
      optional($.with_clause),
      'DELETE',
      'FROM',
      field('table', $._qualified_identifier),
      optional(seq('AS', field('alias', $._identifier))),
      optional($.where_clause),
      optional($.returning_clause)
    ),

    // CREATE TABLE Statement
    create_table_statement: $ => seq(
      'CREATE',
      optional(choice('TEMP', 'TEMPORARY')),
      'TABLE',
      optional(seq('IF', 'NOT', 'EXISTS')),
      field('name', $._qualified_identifier),
      choice(
        seq(
          '(',
          commaSep1(choice($.column_definition, $.table_constraint)),
          ')',
          optional(seq('WITHOUT', 'ROWID')),
          optional('STRICT')
        ),
        seq('AS', $.select_statement)
      )
    ),

    column_definition: $ => seq(
      field('name', $._identifier),
      optional($.type_name),
      repeat($.column_constraint)
    ),

    type_name: $ => seq(
      repeat1($._identifier),
      optional(seq(
        '(',
        $.signed_number,
        optional(seq(',', $.signed_number)),
        ')'
      ))
    ),

    column_constraint: $ => seq(
      optional(seq('CONSTRAINT', field('name', $._identifier))),
      choice(
        seq('PRIMARY', 'KEY', optional(choice('ASC', 'DESC')), optional($.conflict_clause), optional('AUTOINCREMENT')),
        seq('NOT', 'NULL', optional($.conflict_clause)),
        seq('UNIQUE', optional($.conflict_clause)),
        seq('CHECK', '(', $._expression, ')'),
        seq('DEFAULT', $._expression),
        seq('COLLATE', field('collation', $._identifier)),
        $.foreign_key_clause,
        seq(optional(seq('GENERATED', 'ALWAYS')), 'AS', '(', $._expression, ')', optional(choice('STORED', 'VIRTUAL')))
      )
    ),

    table_constraint: $ => seq(
      optional(seq('CONSTRAINT', field('name', $._identifier))),
      choice(
        seq('PRIMARY', 'KEY', '(', commaSep1($.indexed_column), ')', optional($.conflict_clause)),
        seq('UNIQUE', '(', commaSep1($.indexed_column), ')', optional($.conflict_clause)),
        seq('CHECK', '(', $._expression, ')'),
        seq('FOREIGN', 'KEY', '(', commaSep1(field('column', $._identifier)), ')', $.foreign_key_clause)
      )
    ),

    indexed_column: $ => seq(
      $._expression,
      optional(choice('ASC', 'DESC'))
    ),

    foreign_key_clause: $ => seq(
      'REFERENCES',
      field('table', $._qualified_identifier),
      optional(seq('(', commaSep1(field('column', $._identifier)), ')')),
      repeat(choice(
        seq('ON', choice('DELETE', 'UPDATE'), choice('SET NULL', 'SET DEFAULT', 'CASCADE', 'RESTRICT', 'NO ACTION')),
        seq('MATCH', field('name', $._identifier))
      )),
      optional(seq(optional('NOT'), 'DEFERRABLE', optional(seq('INITIALLY', choice('DEFERRED', 'IMMEDIATE')))))
    ),

    conflict_clause: $ => choice(
      'ROLLBACK',
      'ABORT',
      'FAIL',
      'IGNORE',
      'REPLACE'
    ),

    on_conflict_clause: $ => seq(
      'ON',
      'CONFLICT',
      optional(choice(
        seq('(', commaSep1($._identifier), ')'),
        seq('(', commaSep1($.indexed_column), ')')
      )),
      choice(
        seq('DO', 'NOTHING'),
        seq(
          'DO',
          'UPDATE',
          'SET',
          commaSep1($.update_set),
          optional($.where_clause)
        )
      )
    ),

    // CREATE INDEX Statement
    create_index_statement: $ => seq(
      'CREATE',
      optional('UNIQUE'),
      'INDEX',
      optional(seq('IF', 'NOT', 'EXISTS')),
      field('name', $._qualified_identifier),
      'ON',
      field('table', $._identifier),
      '(',
      commaSep1($.indexed_column),
      ')',
      optional($.where_clause)
    ),

    // CREATE VIEW Statement
    create_view_statement: $ => seq(
      'CREATE',
      optional(choice('TEMP', 'TEMPORARY')),
      'VIEW',
      optional(seq('IF', 'NOT', 'EXISTS')),
      field('name', $._qualified_identifier),
      optional(seq('(', commaSep1(field('column', $._identifier)), ')')),
      'AS',
      $.select_statement
    ),

    // CREATE VIRTUAL TABLE Statement
    create_virtual_table_statement: $ => seq(
      'CREATE',
      'VIRTUAL',
      'TABLE',
      optional(seq('IF', 'NOT', 'EXISTS')),
      field('name', $._qualified_identifier),
      'USING',
      field('module', $._identifier),
      optional(seq('(', commaSep1($._expression), ')'))
    ),

    // CREATE TRIGGER Statement
    create_trigger_statement: $ => seq(
      'CREATE',
      optional(choice('TEMP', 'TEMPORARY')),
      'TRIGGER',
      optional(seq('IF', 'NOT', 'EXISTS')),
      field('name', $._qualified_identifier),
      optional(choice('BEFORE', 'AFTER', 'INSTEAD OF')),
      choice(
        'DELETE',
        'INSERT',
        seq('UPDATE', optional(seq('OF', commaSep1(field('column', $._identifier)))))
      ),
      'ON',
      field('table', $._qualified_identifier),
      optional(seq('FOR', 'EACH', 'ROW')),
      optional(seq('WHEN', $._expression)),
      'BEGIN',
      repeat1($._statement),
      'END'
    ),

    // DROP Statement
    drop_statement: $ => seq(
      'DROP',
      choice('TABLE', 'INDEX', 'VIEW', 'TRIGGER'),
      optional(seq('IF', 'EXISTS')),
      field('name', $._qualified_identifier)
    ),

    // ALTER TABLE Statement
    alter_table_statement: $ => seq(
      'ALTER', 'TABLE',
      field('table', $._qualified_identifier),
      choice(
        seq('RENAME', 'TO', field('new_name', $._identifier)),
        seq('RENAME', optional('COLUMN'), field('column', $._identifier), 'TO', field('new_name', $._identifier)),
        seq('ADD', optional('COLUMN'), $.column_definition),
        seq('DROP', optional('COLUMN'), field('column', $._identifier))
      )
    ),

    // PRAGMA Statement
    pragma_statement: $ => seq(
      'PRAGMA',
      optional(seq(field('schema', $._identifier), '.')),
      field('name', $._identifier),
      optional(choice(
        seq('=', $.pragma_value),
        seq('(', optional(commaSep1($.pragma_value)), ')')
      ))
    ),

    pragma_value: $ => choice(
      $.signed_number,
      $.string_literal,
      $._identifier,
      choice('ON', 'OFF', 'TRUE', 'FALSE')
    ),

    // ATTACH/DETACH Statements
    attach_statement: $ => seq(
      'ATTACH',
      optional('DATABASE'),
      $._expression,
      'AS',
      field('schema', $._identifier)
    ),

    detach_statement: $ => seq(
      'DETACH',
      optional('DATABASE'),
      field('schema', $._identifier)
    ),

    // VACUUM Statement
    vacuum_statement: $ => seq(
      'VACUUM',
      optional(field('schema', $._identifier)),
      optional(seq('INTO', $._expression))
    ),

    // ANALYZE Statement
    analyze_statement: $ => seq(
      'ANALYZE',
      optional(choice(
        field('schema', $._identifier),
        seq(
          field('schema', $._identifier),
          '.',
          field('table', $._identifier)
        )
      ))
    ),

    // REINDEX Statement
    reindex_statement: $ => seq(
      'REINDEX',
      optional($._qualified_identifier)
    ),

    // Transaction Statements
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
      optional(seq('TO', optional('SAVEPOINT'), field('savepoint', $._identifier)))
    ),

    savepoint_statement: $ => seq(
      'SAVEPOINT',
      field('name', $._identifier)
    ),

    release_statement: $ => seq(
      'RELEASE',
      optional('SAVEPOINT'),
      field('name', $._identifier)
    ),

    // EXPLAIN Statement
    explain_statement: $ => seq(
      'EXPLAIN',
      optional(seq('QUERY', 'PLAN')),
      choice(
        $.select_statement,
        $.insert_statement,
        $.update_statement,
        $.delete_statement,
        $.create_table_statement,
        $.create_index_statement,
        $.create_view_statement,
        $.create_virtual_table_statement
      )
    ),

    // Expressions
    _expression: $ => choice(
      $.literal_value,
      $.bind_parameter,
      $._identifier,
      $.qualified_identifier,
      $.unary_expression,
      $.binary_expression,
      $.function_call,
      $.parenthesized_expression,
      $.scalar_subquery,
      $.cast_expression,
      $.collate_expression,
      $.like_expression,
      $.isnull_expression,
      $.notnull_expression,
      $.between_expression,
      $.in_expression,
      $.exists_expression,
      $.case_expression,
      $.json_extract_expression,
      $.raise_function
    ),

    scalar_subquery: $ => seq('(', $.select_statement, ')'),

    literal_value: $ => choice(
      $.numeric_literal,
      $.string_literal,
      $.blob_literal,
      'NULL',
      'TRUE',
      'FALSE',
      'CURRENT_TIME',
      'CURRENT_DATE',
      'CURRENT_TIMESTAMP'
    ),

    numeric_literal: $ => choice(
      /\d+(_\d+)*/,
      /\d+(_\d+)*\.\d*(_\d+)*/,
      /\.\d+(_\d+)*/,
      /\d+(_\d+)*[eE][+-]?\d+(_\d+)*/,
      /\d+(_\d+)*\.\d*(_\d+)*[eE][+-]?\d+(_\d+)*/,
      /\.\d+(_\d+)*[eE][+-]?\d+(_\d+)*/,
      /0x[0-9a-fA-F]+(_[0-9a-fA-F]+)*/
    ),

    string_literal: $ => seq(
      "'",
      repeat(choice(
        /[^']/,
        "''"
      )),
      "'"
    ),

    blob_literal: $ => /[xX]'[0-9a-fA-F]+'/,

    bind_parameter: $ => choice(
      /\?[0-9]*/,
      /:[a-zA-Z_][a-zA-Z0-9_]*/,
      /@[a-zA-Z_][a-zA-Z0-9_]*/,
      /\$[a-zA-Z_][a-zA-Z0-9_]*/
    ),

    unary_expression: $ => prec.left('unary', seq(
      choice('-', '+', '~', 'NOT'),
      $._expression
    )),

    binary_expression: $ => {
      const operators = [
        ['||', 1],
        ['*', 2],
        ['/', 2],
        ['%', 2],
        ['+', 3],
        ['-', 3],
        ['<<', 4],
        ['>>', 4],
        ['&', 4],
        ['|', 4],
        ['<', 5],
        ['<=', 5],
        ['>', 5],
        ['>=', 5],
        ['=', 6],
        ['==', 6],
        ['!=', 6],
        ['<>', 6],
        ['IS', 6],
        ['IS NOT', 6],
        ['IS DISTINCT FROM', 6],
        ['IS NOT DISTINCT FROM', 6],
        ['AND', 7],
        ['OR', 8],
      ];

      return choice(...operators.map(([operator, precedence]) =>
        prec.left(precedence, seq(
          $._expression,
          operator,
          $._expression
        ))
      ));
    },

    like_expression: $ => prec.left(6, seq(
      $._expression,
      optional('NOT'),
      choice('LIKE', 'GLOB', 'REGEXP', 'MATCH'),
      $._expression,
      optional(seq('ESCAPE', $._expression))
    )),

    isnull_expression: $ => prec.left(6, seq(
      $._expression,
      'ISNULL'
    )),

    notnull_expression: $ => prec.left(6, seq(
      $._expression,
      choice('NOTNULL', seq('NOT', 'NULL'))
    )),

    between_expression: $ => prec.left(6, seq(
      $._expression,
      optional('NOT'),
      'BETWEEN',
      $._expression,
      'AND',
      $._expression
    )),

    in_expression: $ => prec.left(6, seq(
      $._expression,
      optional('NOT'),
      'IN',
      choice(
        seq('(', optional(commaSep1($._expression)), ')'),
        $._qualified_identifier,
        seq('(', $.select_statement, ')')
      )
    )),

    exists_expression: $ => seq(
      optional('NOT'),
      'EXISTS',
      '(',
      $.select_statement,
      ')'
    ),

    function_call: $ => prec('call', seq(
      field('name', $._identifier),
      '(',
      optional(choice(
        '*',
        seq(
          optional('DISTINCT'),
          commaSep1($._expression),
          optional($.order_by_clause)
        )
      )),
      ')',
      optional(seq('WITHIN', 'GROUP', '(', $.order_by_clause, ')')),
      optional(seq('FILTER', '(', 'WHERE', $._expression, ')')),
      optional(seq('OVER', choice(field('window', $._identifier), $.window_definition)))
    )),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    cast_expression: $ => seq(
      'CAST',
      '(',
      $._expression,
      'AS',
      $.type_name,
      ')'
    ),

    collate_expression: $ => prec.left(1, seq(
      $._expression,
      'COLLATE',
      field('collation', $._identifier)
    )),

    case_expression: $ => seq(
      'CASE',
      optional($._expression),
      repeat1($.when_clause),
      optional($.else_clause),
      'END'
    ),

    when_clause: $ => seq(
      'WHEN',
      $._expression,
      'THEN',
      $._expression
    ),

    else_clause: $ => seq('ELSE', $._expression),

    json_extract_expression: $ => prec.left(6, seq(
      $._expression,
      choice('->', '->>'),
      $._expression
    )),

    raise_function: $ => seq(
      'RAISE',
      '(',
      choice(
        'IGNORE',
        seq(choice('ROLLBACK', 'ABORT', 'FAIL'), ',', $.string_literal)
      ),
      ')'
    ),

    signed_number: $ => seq(
      optional(choice('+', '-')),
      $.numeric_literal
    ),
  }
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}