// Helper functions
function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

// Case-insensitive keyword helper
function kw(keyword) {
  let str = "";
  for (var i = 0; i < keyword.length; i++) {
    const c = keyword.charAt(i);
    str += "[" + c.toUpperCase() + c.toLowerCase() + "]";
  }
  return new RegExp(str);
}

// Common patterns
function alias($, mandatory_as = false) {
  return mandatory_as
    ? seq(kw('AS'), field('alias', $._identifier))
    : seq(optional(kw('AS')), field('alias', $._identifier));
}

function if_not_exists() {
  return optional(seq(kw('IF'), kw('NOT'), kw('EXISTS')));
}

function if_exists() {
  return optional(seq(kw('IF'), kw('EXISTS')));
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

// Keyword groups - using case-insensitive patterns
const DDL_KEYWORDS = [
  kw('CREATE'), kw('DROP'), kw('ALTER'), kw('TABLE'), kw('INDEX'), kw('VIEW'), kw('TRIGGER'),
  kw('DATABASE'), kw('SCHEMA'), kw('VIRTUAL'), kw('TEMPORARY'), kw('TEMP'), kw('IF'),
  kw('EXISTS'), kw('CASCADE'), kw('RESTRICT'), kw('RENAME'), kw('ADD'), kw('COLUMN'),
  kw('FUNCTION'), kw('RETURNS'), kw('LANGUAGE')
];

const DML_KEYWORDS = [
  kw('SELECT'), kw('INSERT'), kw('UPDATE'), kw('DELETE'), kw('FROM'), kw('WHERE'), kw('INTO'),
  kw('VALUES'), kw('SET'), kw('JOIN'), kw('LEFT'), kw('RIGHT'), kw('INNER'), kw('OUTER'),
  kw('CROSS'), kw('NATURAL'), kw('USING'), kw('ON'), kw('AS'), kw('GROUP'), kw('BY'),
  kw('HAVING'), kw('ORDER'), kw('LIMIT'), kw('OFFSET'), kw('DISTINCT'), kw('ALL')
];

const TRANSACTION_KEYWORDS = [
  kw('BEGIN'), kw('COMMIT'), kw('ROLLBACK'), kw('SAVEPOINT'), kw('RELEASE'),
  kw('TRANSACTION'), kw('DEFERRED'), kw('IMMEDIATE'), kw('EXCLUSIVE')
];

const CONSTRAINT_KEYWORDS = [
  kw('PRIMARY'), kw('KEY'), kw('FOREIGN'), kw('UNIQUE'), kw('CHECK'), kw('DEFAULT'),
  kw('CONSTRAINT'), kw('REFERENCES'), kw('AUTOINCREMENT'), kw('NOT'), kw('NULL'),
  kw('COLLATE'), kw('GENERATED'), kw('ALWAYS'), kw('STORED'), kw('VIRTUAL')
];

const FUNCTION_KEYWORDS = [
  kw('COUNT'), kw('SUM'), kw('AVG'), kw('MIN'), kw('MAX'), kw('CAST'), kw('COALESCE'),
  kw('NULLIF'), kw('SUBSTR'), kw('LENGTH'), kw('UPPER'), kw('LOWER'), kw('TRIM'),
  kw('DATE'), kw('TIME'), kw('DATETIME'), kw('STRFTIME'), kw('JULIANDAY'),
  // Oracle functions
  kw('NVL'), kw('NVL2'), kw('DECODE'), kw('GREATEST'), kw('LEAST'),
  // MySQL functions
  kw('IFNULL'), kw('ISNULL'), kw('CONCAT'), kw('CONCAT_WS'), kw('SUBSTRING_INDEX'),
  // SQL Server functions
  kw('ISNULL'), kw('CHARINDEX'), kw('PATINDEX'), kw('STUFF'), kw('REPLICATE')
];

const OPERATOR_KEYWORDS = [
  kw('AND'), kw('OR'), kw('NOT'), kw('IN'), kw('BETWEEN'), kw('LIKE'), kw('GLOB'), kw('MATCH'),
  kw('REGEXP'), kw('IS'), kw('ISNULL'), kw('NOTNULL'), kw('ESCAPE')
];

const MISC_KEYWORDS = [
  kw('PRAGMA'), kw('VACUUM'), kw('ANALYZE'), kw('REINDEX'), kw('ATTACH'), kw('DETACH'),
  kw('EXPLAIN'), kw('QUERY'), kw('PLAN'), kw('WITH'), kw('RECURSIVE'), kw('WITHOUT'),
  kw('ROWID'), kw('FILTER'), kw('OVER'), kw('PARTITION'), kw('WINDOW'), kw('ROWS'),
  kw('RANGE'), kw('PRECEDING'), kw('FOLLOWING'), kw('CURRENT'), kw('ROW'), kw('UNBOUNDED'),
  kw('EXCLUDE'), kw('TIES'), kw('GROUPS'), kw('NO'), kw('OTHERS'), kw('CASE'), kw('WHEN'),
  kw('THEN'), kw('ELSE'), kw('END'), kw('RAISE'), kw('ABORT'), kw('FAIL'), kw('IGNORE'),
  kw('REPLACE'), kw('CONFLICT'), kw('DO'), kw('NOTHING'), kw('RETURNING'), kw('ASC'),
  kw('DESC'), kw('FULL'), kw('GLOB'), kw('EACH'), kw('FOR'), kw('OF'), kw('INSTEAD'),
  kw('BEFORE'), kw('AFTER'), kw('NEW'), kw('OLD'), kw('UNION'), kw('INTERSECT'), kw('EXCEPT'),
  kw('TRUE'), kw('FALSE'), kw('DEFERRABLE'), kw('INITIALLY'), kw('MATCH'), kw('ON'),
  kw('USING'), kw('TO'), kw('INDEXED'), kw('ACTION'), kw('RESTRICT'),
  // Oracle-specific
  kw('DUAL'), kw('ROWNUM'), kw('CONNECT'), kw('PRIOR'), kw('START'), kw('SYSDATE'), kw('SYSTIMESTAMP'),
  kw('LEVEL'), kw('MINUS'),
  // MySQL-specific
  kw('SHOW'), kw('DATABASES'), kw('TABLES'), kw('ENGINE'), kw('CHARSET'), kw('COLLATION'),
  kw('USE'), kw('FORCE'), kw('IGNORE'),
  // SQL Server-specific
  kw('TOP'), kw('OUTPUT'), kw('INSERTED'), kw('DELETED'), kw('GO'), kw('IDENTITY'), kw('PERCENT'),
  kw('APPLY'), kw('OUTER'), kw('CROSS'), kw('OPTION'), kw('NOLOCK'), kw('READUNCOMMITTED'),
  kw('READCOMMITTED'), kw('REPEATABLEREAD'), kw('SERIALIZABLE'), kw('SNAPSHOT')
];

// ZetaSQL-specific keywords (excluding data types which are handled in type_name)
const ZETASQL_KEYWORDS = [
  kw('EXTEND'), kw('RENAME'), kw('AGGREGATE'), kw('TABLESAMPLE'), kw('PIVOT'), kw('UNPIVOT'),
  kw('ASSERT'), kw('SAFE_CAST'), kw('NULLIFZERO'), kw('ZEROIFNULL'),
  kw('PROTO'), kw('CALL'), kw('DESTINATION'), kw('SOURCE'), kw('GRAPH'),
  kw('NODES'), kw('EDGES'), kw('PROPERTY_EXISTS'), kw('ELEMENT_ID'), kw('SAFE')
];

// Grouped binary operators by precedence
const OPERATORS_BY_PRECEDENCE = {
  1: ['||'],  // String concatenation
  2: ['*', '/', '%'],  // Multiplication, division, modulo
  3: ['+', '-'],  // Addition, subtraction
  4: ['<<', '>>', '&', '|'],  // Bitwise operators
  5: ['<', '<=', '>', '>='],  // Comparison
  6: ['=', '==', '!=', '<>', kw('IS'), seq(kw('IS'), kw('NOT')), kw('IN'), seq(kw('NOT'), kw('IN')), kw('LIKE'), seq(kw('NOT'), kw('LIKE')), kw('GLOB'), seq(kw('NOT'), kw('GLOB')), kw('MATCH'), seq(kw('NOT'), kw('MATCH')), kw('REGEXP'), seq(kw('NOT'), kw('REGEXP')), '->', '->>', '@>', '<@', token('#>'), token('#>>'), token('?&'), token('?|'), token('&&'), token('@@'), token('(+)')],  // Equality, pattern matching, PostgreSQL operators, and Oracle outer join
  7: [kw('AND')],  // Logical AND
  8: [kw('OR')],  // Logical OR
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
    [$.table_or_subquery, $.apply_clause],
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
        $.show_statement,
        $.go_statement,
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
      kw('WITH'),
      optional(kw('RECURSIVE')),
      commaSep1($.common_table_expression)
    ),

    common_table_expression: $ => seq(
      field('name', $.identifier),
      optional(column_list($)),
      kw('AS'),
      '(',
      field('query', $.select_statement),
      ')'
    ),

    select_core: $ => seq(
      kw('SELECT'),
      optional(choice(kw('DISTINCT'), kw('ALL'))),
      optional($.top_clause), // SQL Server TOP clause
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
      kw('FROM'),
      $.table_or_subquery,
      repeat(choice($.join_clause, $.apply_clause))
    ),

    table_or_subquery: $ => choice(
      seq(
        qualified_table_name($),
        optional(choice(
          seq(kw('INDEXED'), kw('BY'), field('index', $.identifier)),
          seq(kw('NOT'), kw('INDEXED')),
          $.table_hint,  // SQL Server table hints
          $.mysql_index_hint  // MySQL index hints
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
      optional(choice(kw('NATURAL'))),
      optional(choice(kw('LEFT'), kw('RIGHT'), kw('FULL'))),
      optional(kw('OUTER')),
      choice(kw('JOIN'), seq(kw('INNER'), kw('JOIN')), seq(kw('CROSS'), kw('JOIN')), ','),
      $.table_or_subquery,
      optional($.join_constraint)
    ),

    join_constraint: $ => choice(
      seq(kw('ON'), field('condition', $._expression)),
      seq(kw('USING'), column_list($))
    ),

    where_clause: $ => seq(kw('WHERE'), field('condition', $._expression)),

    group_by_clause: $ => seq(
      kw('GROUP'), kw('BY'),
      commaSep1(field('expression', $._expression)),
      optional(seq(kw('HAVING'), field('having', $._expression)))
    ),

    window_clause: $ => seq(
      kw('WINDOW'),
      commaSep1(seq(
        field('name', $.identifier),
        kw('AS'),
        $.window_definition
      ))
    ),

    window_definition: $ => seq(
      '(',
      optional(seq(kw('PARTITION'), kw('BY'), commaSep1($._expression))),
      optional($.order_by_clause),
      optional($.frame_spec),
      ')'
    ),

    frame_spec: $ => seq(
      choice(kw('RANGE'), kw('ROWS'), kw('GROUPS')),
      choice(
        seq(kw('BETWEEN'), $.frame_bound, kw('AND'), $.frame_bound),
        $.frame_bound
      ),
      optional(seq(kw('EXCLUDE'), choice(seq(kw('NO'), kw('OTHERS')), seq(kw('CURRENT'), kw('ROW')), kw('GROUP'), kw('TIES'))))
    ),

    frame_bound: $ => choice(
      seq(kw('UNBOUNDED'), kw('PRECEDING')),
      seq($._expression, kw('PRECEDING')),
      seq(kw('CURRENT'), kw('ROW')),
      seq($._expression, kw('FOLLOWING')),
      seq(kw('UNBOUNDED'), kw('FOLLOWING'))
    ),

    order_by_clause: $ => seq(
      kw('ORDER'), kw('BY'),
      commaSep1($.ordering_term)
    ),

    ordering_term: $ => seq(
      field('expression', $._expression),
      optional(choice(kw('ASC'), kw('DESC'))),
      optional(seq(kw('NULLS'), choice(kw('FIRST'), kw('LAST'))))
    ),

    limit_clause: $ => seq(
      kw('LIMIT'),
      field('limit', $._expression),
      optional(seq(choice(kw('OFFSET'), ','), field('offset', $._expression)))
    ),

    compound_operator: $ => seq(
      field('operator', choice(kw('UNION'), seq(kw('UNION'), kw('ALL')), kw('INTERSECT'), kw('EXCEPT'), kw('MINUS'))),
      $.select_core
    ),

    // INSERT statement
    insert_statement: $ => seq(
      optional($.with_clause),
      choice(kw('INSERT'), kw('REPLACE')),
      optional(choice(kw('OR'), kw('ROLLBACK'), kw('ABORT'), kw('REPLACE'), kw('FAIL'), kw('IGNORE'))),
      kw('INTO'),
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
        seq(kw('DEFAULT'), kw('VALUES'))
      ),
      optional($.returning_clause)
    ),

    values_clause: $ => seq(
      kw('VALUES'),
      commaSep1(seq(
        '(',
        commaSep1(field('value', $._expression)),
        ')'
      ))
    ),

    on_conflict_clause: $ => seq(
      kw('ON'), kw('CONFLICT'),
      optional(seq(
        '(',
        commaSep1(field('column', $.identifier)),
        optional($.where_clause),
        ')'
      )),
      kw('DO'),
      choice(
        kw('NOTHING'),
        seq(
          kw('UPDATE'),
          kw('SET'),
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
      kw('RETURNING'),
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
      kw('UPDATE'),
      optional(choice(kw('OR'), kw('ROLLBACK'), kw('ABORT'), kw('REPLACE'), kw('FAIL'), kw('IGNORE'))),
      qualified_table_name($),
      kw('SET'),
      commaSep1($.update_set),
      optional($.where_clause),
      optional($.returning_clause)
    ),

    // DELETE statement
    delete_statement: $ => seq(
      optional($.with_clause),
      kw('DELETE'),
      kw('FROM'),
      qualified_table_name($),
      optional($.where_clause),
      optional($.returning_clause)
    ),

    // CREATE TABLE statement
    create_table_statement: $ => seq(
      kw('CREATE'),
      optional(choice(kw('TEMP'), kw('TEMPORARY'))),
      kw('TABLE'),
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
          optional(seq(kw('WITHOUT'), kw('ROWID')))
        ),
        seq(kw('AS'), field('select', $.select_statement))
      ),
      optional(seq(kw('STRICT'), optional(seq(',', kw('WITHOUT'), kw('ROWID')))))
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
      optional(seq(kw('CONSTRAINT'), field('name', $.identifier))),
      choice(
        seq(kw('PRIMARY'), kw('KEY'), optional(choice(kw('ASC'), kw('DESC'))), optional($.conflict_clause), optional(kw('AUTOINCREMENT'))),
        seq(kw('NOT'), kw('NULL'), optional($.conflict_clause)),
        seq(kw('UNIQUE'), optional($.conflict_clause)),
        seq(kw('CHECK'), '(', field('expression', $._expression), ')'),
        seq(kw('DEFAULT'), field('value', choice($._expression, $._literal_value))),
        seq(kw('COLLATE'), field('collation', $.identifier)),
        $.foreign_key_clause,
        seq(
          optional(seq(kw('GENERATED'), kw('ALWAYS'))),
          kw('AS'),
          '(',
          field('expression', $._expression),
          ')',
          optional(choice(kw('STORED'), kw('VIRTUAL')))
        )
      )
    ),

    table_constraint: $ => seq(
      optional(seq(kw('CONSTRAINT'), field('name', $.identifier))),
      choice(
        seq(
          choice(seq(kw('PRIMARY'), kw('KEY')), kw('UNIQUE')),
          '(',
          commaSep1(seq(
            field('column', $.identifier),
            optional(choice(kw('ASC'), kw('DESC')))
          )),
          ')',
          optional($.conflict_clause)
        ),
        seq(
          kw('CHECK'),
          '(',
          field('expression', $._expression),
          ')'
        ),
        seq(
          kw('FOREIGN'), kw('KEY'),
          column_list($),
          $.foreign_key_clause
        )
      )
    ),

    foreign_key_clause: $ => seq(
      kw('REFERENCES'),
      field('table', $._qualified_identifier),
      optional(column_list($)),
      repeat(choice(
        seq(
          kw('ON'),
          choice(kw('DELETE'), kw('UPDATE')),
          choice(seq(kw('SET', kw('NULL')), seq(kw('SET'), kw('DEFAULT')), kw('CASCADE'), kw('RESTRICT'), seq(kw('NO'), kw('ACTION'))))
        ),
        seq(kw('MATCH'), field('name', $.identifier))
      )),
      optional(seq(
        optional(kw('NOT')),
        kw('DEFERRABLE'),
        optional(seq(kw('INITIALLY'), choice(kw('DEFERRED'), kw('IMMEDIATE'))))
      ))
    ),

    conflict_clause: $ => seq(
      kw('ON'), kw('CONFLICT'),
      choice(kw('ROLLBACK'), kw('ABORT'), kw('FAIL'), kw('IGNORE'), kw('REPLACE'))
    ),

    // CREATE INDEX statement
    create_index_statement: $ => seq(
      kw('CREATE'),
      optional(kw('UNIQUE')),
      kw('INDEX'),
      if_not_exists(),
      field('name', $._qualified_identifier),
      kw('ON'),
      field('table', $._qualified_identifier),
      '(',
      commaSep1($.indexed_column),
      ')',
      optional($.where_clause)
    ),

    indexed_column: $ => seq(
      field('expression', $._expression),
      optional(choice(kw('ASC'), kw('DESC')))
    ),

    // CREATE VIEW statement
    create_view_statement: $ => seq(
      kw('CREATE'),
      optional(choice(kw('TEMP'), kw('TEMPORARY'))),
      kw('VIEW'),
      if_not_exists(),
      field('name', $._qualified_identifier),
      optional(column_list($)),
      kw('AS'),
      field('select', $.select_statement)
    ),

    // CREATE TRIGGER statement
    create_trigger_statement: $ => seq(
      kw('CREATE'),
      optional(choice(kw('TEMP'), kw('TEMPORARY'))),
      kw('TRIGGER'),
      if_not_exists(),
      field('name', $._qualified_identifier),
      optional(choice(kw('BEFORE'), kw('AFTER'), seq(kw('INSTEAD'), kw('OF')))),
      choice(
        kw('DELETE'),
        kw('INSERT'),
        seq(kw('UPDATE'), optional(seq(kw('OF'), commaSep1(field('column', $.identifier)))))
      ),
      kw('ON'),
      field('table', $._qualified_identifier),
      optional(seq(kw('FOR'), kw('EACH'), kw('ROW'))),
      optional(seq(kw('WHEN'), field('condition', $._expression))),
      kw('BEGIN'),
      repeat1($._statement),
      kw('END')
    ),

    // CREATE VIRTUAL TABLE statement
    create_virtual_table_statement: $ => seq(
      kw('CREATE'), kw('VIRTUAL'), kw('TABLE'),
      if_not_exists(),
      field('name', $._qualified_identifier),
      kw('USING'),
      field('module', $.identifier),
      optional(seq(
        '(',
        commaSep(field('argument', choice($.identifier, $._literal_value))),
        ')'
      ))
    ),

    // CREATE AGGREGATE statement (PostgreSQL)
    create_aggregate_statement: $ => seq(
      kw('CREATE'),
      optional(seq(kw('OR'), kw('REPLACE'))),
      kw('AGGREGATE'),
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
      kw('CREATE'),
      optional(seq(kw('OR'), kw('REPLACE'))),
      kw('FUNCTION'),
      field('name', $.identifier),
      '(',
      optional(commaSep1($.function_parameter)),
      ')',
      kw('RETURNS'),
      field('return_type', $.identifier),
      kw('AS'),
      $.dollar_quoted_string,
      kw('LANGUAGE'),
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
      kw('DROP'),
      field('type', choice(kw('TABLE'), kw('INDEX'), kw('VIEW'), kw('TRIGGER'))),
      if_exists(),
      field('name', $._qualified_identifier)
    ),

    // ALTER TABLE statement
    alter_table_statement: $ => seq(
      kw('ALTER'), kw('TABLE'),
      field('table', $._qualified_identifier),
      choice(
        seq(kw('RENAME'), kw('TO'), field('new_name', $.identifier)),
        seq(kw('RENAME'), optional(kw('COLUMN')), field('old_name', $.identifier), kw('TO'), field('new_name', $.identifier)),
        seq(kw('ADD'), optional(kw('COLUMN')), $.column_definition),
        seq(kw('DROP'), optional(kw('COLUMN')), field('column', $.identifier))
      )
    ),

    // PRAGMA statement
    pragma_statement: $ => seq(
      kw('PRAGMA'),
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
      kw('ATTACH'),
      optional(kw('DATABASE')),
      field('file', $._expression),
      kw('AS'),
      field('schema', $.identifier)
    ),

    detach_statement: $ => seq(
      kw('DETACH'),
      optional(kw('DATABASE')),
      field('schema', $.identifier)
    ),

    // VACUUM statement
    vacuum_statement: $ => seq(
      kw('VACUUM'),
      optional(field('schema', $.identifier)),
      optional(seq(kw('INTO'), field('file', $._expression)))
    ),

    // ANALYZE statement
    analyze_statement: $ => seq(
      kw('ANALYZE'),
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
      kw('REINDEX'),
      optional(choice(
        field('name', $.identifier),
        field('name', $._qualified_identifier)
      ))
    ),

    // Transaction statements
    begin_statement: $ => seq(
      kw('BEGIN'),
      optional(choice(kw('DEFERRED'), kw('IMMEDIATE'), kw('EXCLUSIVE'))),
      optional(kw('TRANSACTION'))
    ),

    commit_statement: $ => seq(
      choice(kw('COMMIT'), kw('END')),
      optional(kw('TRANSACTION'))
    ),

    rollback_statement: $ => seq(
      kw('ROLLBACK'),
      optional(kw('TRANSACTION')),
      optional(seq(kw('TO'), optional(kw('SAVEPOINT')), field('savepoint', $.identifier)))
    ),

    savepoint_statement: $ => seq(
      kw('SAVEPOINT'),
      field('name', $.identifier)
    ),

    release_statement: $ => seq(
      kw('RELEASE'),
      optional(kw('SAVEPOINT')),
      field('name', $.identifier)
    ),

    // EXPLAIN statement
    explain_statement: $ => seq(
      kw('EXPLAIN'),
      optional(seq(kw('QUERY'), kw('PLAN'))),
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
      $.zeroifnull_expression,
      $.oracle_rownum,
      $.oracle_level
    ),

    _literal_value: $ => choice(
      $.integer,
      $.real,
      $.string,
      $.blob,
      $.null,
      $.boolean,
      $.oracle_date_literal,
      $.oracle_timestamp_literal
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
      choice('x', kw('X')),
      "'",
      /[0-9a-fA-F]+/,
      "'"
    ),

    null: $ => kw('NULL'),

    boolean: $ => choice(kw('TRUE'), kw('FALSE')),

    unary_expression: $ => prec.right('unary', choice(
      seq('-', field('operand', $._expression)),
      seq('+', field('operand', $._expression)),
      seq(kw('NOT'), field('operand', $._expression)),
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
      kw('CAST'),
      '(',
      field('expression', $._expression),
      kw('AS'),
      field('type', $.type_name),
      ')'
    ),

    case_expression: $ => seq(
      kw('CASE'),
      optional(field('expression', $._expression)),
      repeat1(seq(
        kw('WHEN'),
        field('condition', $._expression),
        kw('THEN'),
        field('result', $._expression)
      )),
      optional(seq(kw('ELSE'), field('else', $._expression))),
      kw('END')
    ),

    exists_expression: $ => seq(
      optional(kw('NOT')),
      kw('EXISTS'),
      '(',
      field('subquery', $.select_statement),
      ')'
    ),

    in_expression: $ => seq(
      field('expression', $._expression),
      optional(kw('NOT')),
      kw('IN'),
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
      optional(kw('NOT')),
      kw('BETWEEN'),
      field('low', $._expression),
      kw('AND'),
      field('high', $._expression)
    ),

    like_expression: $ => seq(
      field('expression', $._expression),
      optional(kw('NOT')),
      choice(kw('LIKE'), kw('GLOB'), kw('MATCH'), kw('REGEXP')),
      field('pattern', $._expression),
      optional(seq(kw('ESCAPE'), field('escape', $._expression)))
    ),

    is_expression: $ => seq(
      field('left', $._expression),
      kw('IS'),
      optional(kw('NOT')),
      choice(
        kw('NULL'),
        kw('TRUE'),
        kw('FALSE'),
        field('value', $._expression)
      )
    ),

    null_expression: $ => seq(
      field('expression', $._expression),
      choice(kw('ISNULL'), kw('NOTNULL'))
    ),

    collate_expression: $ => seq(
      field('expression', $._expression),
      kw('COLLATE'),
      field('collation', $.identifier)
    ),

    function_call: $ => seq(
      field('name', choice(
        $.identifier,
        // Allow certain keywords to be used as function names
        kw('DATE'), kw('TIME'), kw('DATETIME'), kw('TIMESTAMP')
      )),
      '(',
      optional(choice(
        '*',
        seq(
          optional(kw('DISTINCT')),
          commaSep1(field('argument', $._expression))
        )
      )),
      ')',
      optional(seq(
        optional(seq(kw('FILTER'), '(', kw('WHERE'), field('filter', $._expression), ')')),
        kw('OVER'),
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
      kw('RAISE'),
      '(',
      choice(kw('IGNORE'), kw('ROLLBACK'), kw('ABORT'), kw('FAIL')),
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
        kw('ARRAY'),
        '[',
        commaSep1(field('element', $._expression)),
        ']'
      ),
      seq(
        kw('ARRAY'),
        '(',
        field('subquery', $.select_statement),
        ')'
      )
    ),

    // ZetaSQL data types
    array_type: $ => seq(
      kw('ARRAY'),
      '<',
      field('element_type', $.type_name),
      '>'
    ),

    struct_type: $ => seq(
      kw('STRUCT'),
      '<',
      commaSep1(seq(
        field('field_name', $.identifier),
        field('field_type', $.type_name)
      )),
      '>'
    ),

    // ZetaSQL pipe syntax
    pipe_query: $ => prec(1, seq(
      kw('FROM'),
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

    pipe_select: $ => seq(kw('SELECT'), commaSep1($._expression)),
    pipe_extend: $ => seq(kw('EXTEND'), commaSep1(seq($._expression, optional(alias($))))),
    pipe_set: $ => seq(kw('SET'), commaSep1(seq($.identifier, '=', $._expression))),
    pipe_drop: $ => seq(kw('DROP'), commaSep1($.identifier)),
    pipe_rename: $ => seq(kw('RENAME'), commaSep1(seq($.identifier, kw('AS'), $.identifier))),
    pipe_where: $ => seq(kw('WHERE'), $._expression),
    pipe_limit: $ => seq(kw('LIMIT'), $._expression),
    pipe_aggregate: $ => seq(
      kw('AGGREGATE'),
      commaSep1(seq($._expression, optional(alias($)))),
      optional(seq(kw('GROUP'), kw('BY'), commaSep1($._expression)))
    ),
    pipe_distinct: $ => kw('DISTINCT'),
    pipe_order_by: $ => seq(kw('ORDER'), kw('BY'), commaSep1($.ordering_term)),
    pipe_join: $ => seq(
      optional(choice(kw('LEFT'), kw('RIGHT'), kw('FULL'), kw('INNER'))),
      kw('JOIN'),
      $.table_or_subquery,
      optional($.join_constraint)
    ),
    pipe_assert: $ => seq(kw('ASSERT'), $._expression),

    // ZetaSQL-specific functions
    safe_cast_expression: $ => seq(
      'SAFE_CAST',
      '(',
      field('expression', $._expression),
      kw('AS'),
      field('type', $.type_name),
      ')'
    ),

    nullifzero_expression: $ => seq(
      kw('NULLIFZERO'),
      '(',
      field('expression', $._expression),
      ')'
    ),

    zeroifnull_expression: $ => seq(
      kw('ZEROIFNULL'),
      '(',
      field('expression', $._expression),
      ')'
    ),

    // SQL Server TOP clause
    top_clause: $ => seq(
      kw('TOP'),
      choice(
        field('count', $.integer),
        seq('(', field('count', $._expression), ')')
      ),
      optional(field('percent', kw('PERCENT')))
    ),

    // Oracle date and timestamp literals
    oracle_date_literal: $ => seq(
      kw('DATE'),
      field('value', $.string)
    ),

    oracle_timestamp_literal: $ => seq(
      kw('TIMESTAMP'),
      field('value', $.string)
    ),

    // MySQL SHOW statements
    show_statement: $ => seq(
      kw('SHOW'),
      choice(
        kw('DATABASES'),
        kw('TABLES'),
        seq(kw('TABLES'), kw('FROM'), field('database', $.identifier)),
        seq(kw('COLUMNS'), kw('FROM'), field('table', $.identifier)),
        seq(kw('INDEX'), kw('FROM'), field('table', $.identifier)),
        seq(kw('CREATE'), kw('TABLE'), field('table', $.identifier)),
        seq(kw('CREATE'), kw('DATABASE'), field('database', $.identifier))
      )
    ),


    // Oracle ROWNUM support
    oracle_rownum: $ => kw('ROWNUM'),
    
    // Oracle LEVEL pseudo-column for hierarchical queries
    oracle_level: $ => kw('LEVEL'),

    // SQL Server batch separator
    go_statement: $ => kw('GO'),

    // SQL Server table hints
    table_hint: $ => seq(
      kw('WITH'),
      '(',
      commaSep1(choice(
        kw('NOLOCK'),
        kw('READUNCOMMITTED'),
        kw('READCOMMITTED'), 
        kw('REPEATABLEREAD'),
        kw('SERIALIZABLE'),
        kw('SNAPSHOT'),
        seq(kw('INDEX'), '(', commaSep1($.identifier), ')'),
        seq(kw('INDEX'), '=', $.identifier)
      )),
      ')'
    ),

    // SQL Server APPLY operators
    apply_clause: $ => seq(
      choice(seq(kw('CROSS'), kw('APPLY')), seq(kw('OUTER'), kw('APPLY'))),
      choice(
        $.table_or_subquery,
        seq('(', $.select_statement, ')')
      )
    ),

    // MySQL index hints  
    mysql_index_hint: $ => seq(
      choice(kw('USE'), kw('IGNORE'), kw('FORCE')),
      choice(kw('INDEX'), kw('KEY')),
      optional(seq(kw('FOR'), choice(kw('JOIN'), seq(kw('ORDER'), kw('BY')), seq(kw('GROUP'), kw('BY'))))),
      '(',
      optional(commaSep1($.identifier)),
      ')'
    ),

  }
});