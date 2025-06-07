// Helper functions
function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

// Case-insensitive keyword helper
function kw(keyword) {
  return new RegExp(keyword.replace(/[A-Z]/ig, m => `[${m.toUpperCase()}${m.toLowerCase()}]`));
}

// Common patterns
function alias($, mandatory_as = false) {
  return mandatory_as
    ? seq($._kw_as, field('alias', $._identifier))
    : seq(optional($._kw_as), field('alias', $._identifier));
}

function if_not_exists($) {
  return optional(seq($._kw_if, $._kw_not, $._kw_exists));
}

function if_exists($) {
  return optional(seq($._kw_if, $._kw_exists));
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

module.exports = grammar({
  name: 'sql',

  extras: $ => [
    /\s/,
    $.comment,
  ],

  conflicts: $ => [
    [$._expression, $.select_statement],
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
    [$.unary_expression, $.binary_expression, $.is_expression],
    [$.safe_cast_expression, $.function_call],
    [$.oracle_date_literal, $.function_call],
    [$.oracle_timestamp_literal, $.function_call],
    [$.oracle_rownum, $.qualified_identifier],
    [$.oracle_level, $.qualified_identifier],
  ],

  precedences: $ => [
    ['unary', 'binary'],
    ['member', 'call'],
  ],

  reserved: $ => ({
    default: [
      $._kw_add,
      $._kw_all,
      $._kw_alter,
      $._kw_and,
      $._kw_array,
      $._kw_as,
      $._kw_asc,
      $._kw_begin,
      $._kw_between,
      $._kw_by,
      $._kw_case,
      $._kw_cast,
      $._kw_check,
      $._kw_column,
      $._kw_commit,
      $._kw_create,
      $._kw_default,
      $._kw_deferred,
      $._kw_delete,
      $._kw_desc,
      $._kw_distinct,
      $._kw_drop,
      $._kw_else,
      $._kw_end,
      $._kw_exclusive,
      $._kw_exists,
      $._kw_for,
      $._kw_foreign,
      $._kw_from,
      $._kw_group,
      $._kw_having,
      $._kw_if,
      $._kw_immediate,
      $._kw_in,
      $._kw_insert,
      $._kw_intersect,
      $._kw_into,
      $._kw_is,
      $._kw_join,
      $._kw_key,
      $._kw_like,
      $._kw_limit,
      $._kw_not,
      $._kw_null,
      $._kw_offset,
      $._kw_of,
      $._kw_on,
      $._kw_or,
      $._kw_order,
      $._kw_primary,
      $._kw_recursive,
      $._kw_release,
      $._kw_rename,
      $._kw_rollback,
      $._kw_safe_cast,
      $._kw_savepoint,
      $._kw_select,
      $._kw_set,
      $._kw_struct,
      $._kw_table,
      $._kw_then,
      $._kw_to,
      $._kw_top,
      $._kw_transaction,
      $._kw_trigger,
      $._kw_union,
      $._kw_unique,
      $._kw_update,
      $._kw_values,
      $._kw_when,
      $._kw_where,
      $._kw_window,
      $._kw_with,
    ],
  }),

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($._statement),

    _kw_add: $ => kw("ADD"),
    _kw_all: $ => kw("ALL"),
    _kw_alter: $ => kw("ALTER"),
    _kw_array: $ => kw("ARRAY"),
    _kw_and: $ => kw("AND"),
    _kw_autoincrement: $ => kw("AUTOINCREMENT"),
    _kw_as: $ => kw("AS"),
    _kw_asc: $ => kw("ASC"),
    _kw_begin: $ => kw("BEGIN"),
    _kw_between: $ => kw("BETWEEN"),
    _kw_by: $ => kw("BY"),
    _kw_case: $ => kw("CASE"),
    _kw_cast: $ => kw("CAST"),
    _kw_check: $ => kw("CHECK"),
    _kw_column: $ => kw("COLUMN"),
    _kw_commit: $ => kw("COMMIT"),
    _kw_create: $ => kw("CREATE"),
    _kw_deferred: $ => kw("DEFERRED"),
    _kw_default: $ => kw("DEFAULT"),
    _kw_delete: $ => kw("DELETE"),
    _kw_desc: $ => kw("DESC"),
    _kw_distinct: $ => kw("DISTINCT"),
    _kw_drop: $ => kw("DROP"),
    _kw_else: $ => kw("ELSE"),
    _kw_end: $ => kw("END"),
    _kw_exclusive: $ => kw("EXCLUSIVE"),
    _kw_exists: $ => kw("EXISTS"),
    _kw_for: $ => kw("FOR"),
    _kw_foreign: $ => kw("FOREIGN"),
    _kw_from: $ => kw("FROM"),
    _kw_group: $ => kw("GROUP"),
    _kw_having: $ => kw("HAVING"),
    _kw_if: $ => kw("IF"),
    _kw_immediate: $ => kw("IMMEDIATE"),
    _kw_in: $ => kw("IN"),
    _kw_insert: $ => kw("INSERT"),
    _kw_intersect: $ => kw("INTERSECT"),
    _kw_into: $ => kw("INTO"),
    _kw_is: $ => kw("IS"),
    _kw_join: $ => kw("JOIN"),
    _kw_key: $ => kw("KEY"),
    _kw_like: $ => kw("LIKE"),
    _kw_limit: $ => kw("LIMIT"),
    _kw_not: $ => kw("NOT"),
    _kw_null: $ => kw("NULL"),
    _kw_offset: $ => kw("OFFSET"),
    _kw_of: $ => kw("OF"),
    _kw_on: $ => kw("ON"),
    _kw_or: $ => kw("OR"),
    _kw_order: $ => kw("ORDER"),
    _kw_primary: $ => kw("PRIMARY"),
    _kw_recursive: $ => kw("RECURSIVE"),
    _kw_release: $ => kw("RELEASE"),
    _kw_rename: $ => kw("RENAME"),
    _kw_rollback: $ => kw("ROLLBACK"),
    _kw_safe_cast: _ => /[Ss][Aa][Ff][Ee]_[Cc][Aa][Ss][Tt]/,
    _kw_savepoint: $ => kw("SAVEPOINT"),
    _kw_select: $ => kw("SELECT"),
    _kw_set: $ => kw("SET"),
    _kw_struct: $ => kw("STRUCT"),
    _kw_table: $ => kw("TABLE"),
    _kw_top: $ => kw("TOP"),
    _kw_then: $ => kw("THEN"),
    _kw_to: $ => kw("TO"),
    _kw_transaction: $ => kw("TRANSACTION"),
    _kw_trigger: $ => kw("TRIGGER"),
    _kw_union: $ => kw("UNION"),
    _kw_unique: $ => kw("UNIQUE"),
    _kw_update: $ => kw("UPDATE"),
    _kw_values: $ => kw("VALUES"),
    _kw_when: $ => kw("WHEN"),
    _kw_where: $ => kw("WHERE"),
    _kw_window: $ => kw("WINDOW"),
    _kw_with: $ => kw("WITH"),

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
    identifier: $ => token(prec(-1, /[a-zA-Z_][a-zA-Z0-9_]*/)),

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
      $._kw_with,
      optional($._kw_recursive),
      commaSep1($.common_table_expression)
    ),

    common_table_expression: $ => seq(
      $.identifier,
      optional(column_list($)),
      $._kw_as,
      '(',
      $.select_statement,
      ')'
    ),

    select_core: $ => seq(
      $._kw_select,
      optional(choice($._kw_distinct, $._kw_all)),
      optional($.top_clause), // SQL Server TOP clause
      field('columns', $.select_list),
      optional($.from_clause),
      optional($.where_clause),
      optional($.group_by_clause),
      optional($.window_clause),
      optional($.for_update_clause)
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
      $._kw_from,
      $.table_or_subquery,
      repeat(choice($.join_clause, $.apply_clause))
    ),

    table_or_subquery: $ => choice(
      seq(
        qualified_table_name($),
        optional(choice(
          seq(kw('INDEXED'), $._kw_by, field('index', $.identifier)),
          seq($._kw_not, kw('INDEXED')),
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
      choice($._kw_join, seq(kw('INNER'), $._kw_join), seq(kw('CROSS'), $._kw_join), ','),
      $.table_or_subquery,
      optional($.join_constraint)
    ),

    join_constraint: $ => choice(
      seq($._kw_on, field('condition', $._expression)),
      seq(kw('USING'), column_list($))
    ),

    where_clause: $ => seq($._kw_where, field('condition', $._expression)),

    group_by_clause: $ => seq(
      $._kw_group, $._kw_by,
      commaSep1(field('expression', $._expression)),
      optional(seq($._kw_having, field('having', $._expression)))
    ),

    window_clause: $ => seq(
      $._kw_window,
      commaSep1(seq(
        field('name', $.identifier),
        $._kw_as,
        $.window_definition
      ))
    ),

    for_update_clause: $ => seq(
      $._kw_for,
      $._kw_update,
      optional(seq($._kw_of, commaSep1(field('table', $.identifier)))),
      optional(choice(kw('NOWAIT'), seq(kw('WAIT'), field('timeout', $.integer))))
    ),

    window_definition: $ => seq(
      '(',
      optional(seq(kw('PARTITION'), $._kw_by, commaSep1($._expression))),
      optional($.order_by_clause),
      optional($.frame_spec),
      ')'
    ),

    frame_spec: $ => seq(
      choice(kw('RANGE'), kw('ROWS'), kw('GROUPS')),
      choice(
        seq($._kw_between, $.frame_bound, $._kw_and, $.frame_bound),
        $.frame_bound
      ),
      optional(seq(kw('EXCLUDE'), choice(seq(kw('NO'), kw('OTHERS')), seq(kw('CURRENT'), kw('ROW')), $._kw_group, kw('TIES'))))
    ),

    frame_bound: $ => choice(
      seq(kw('UNBOUNDED'), kw('PRECEDING')),
      seq($._expression, kw('PRECEDING')),
      seq(kw('CURRENT'), kw('ROW')),
      seq($._expression, kw('FOLLOWING')),
      seq(kw('UNBOUNDED'), kw('FOLLOWING'))
    ),

    order_by_clause: $ => seq(
      $._kw_order, $._kw_by,
      commaSep1($.ordering_term)
    ),

    ordering_term: $ => seq(
      field('expression', $._expression),
      optional(choice($._kw_asc, $._kw_desc)),
      optional(seq(kw('NULLS'), choice(kw('FIRST'), kw('LAST'))))
    ),

    limit_clause: $ => seq(
      $._kw_limit,
      field('limit', $._expression),
      optional(seq(choice($._kw_offset, ','), field('offset', $._expression)))
    ),

    compound_operator: $ => seq(
      field('operator', choice($._kw_union, seq($._kw_union, $._kw_all), $._kw_intersect, kw('EXCEPT'), kw('MINUS'))),
      $.select_core
    ),

    // INSERT statement
    insert_statement: $ => seq(
      optional($.with_clause),
      choice($._kw_insert, kw('REPLACE')),
      optional(choice($._kw_or, kw('ROLLBACK'), kw('ABORT'), kw('REPLACE'), kw('FAIL'), kw('IGNORE'))),
      $._kw_into,
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
        seq($._kw_default, $._kw_values)
      ),
      optional($.returning_clause)
    ),

    values_clause: $ => seq(
      $._kw_values,
      commaSep1(seq(
        '(',
        commaSep1(field('value', $._expression)),
        ')'
      ))
    ),

    on_conflict_clause: $ => seq(
      $._kw_on, kw('CONFLICT'),
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
          $._kw_update,
          $._kw_set,
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
      $._kw_update,
      optional(choice($._kw_or, kw('ROLLBACK'), kw('ABORT'), kw('REPLACE'), kw('FAIL'), kw('IGNORE'))),
      qualified_table_name($),
      $._kw_set,
      commaSep1($.update_set),
      optional($.where_clause),
      optional($.returning_clause)
    ),

    // DELETE statement
    delete_statement: $ => seq(
      optional($.with_clause),
      $._kw_delete,
      $._kw_from,
      qualified_table_name($),
      optional($.where_clause),
      optional($.returning_clause)
    ),

    // CREATE TABLE statement
    create_table_statement: $ => seq(
      $._kw_create,
      optional(choice(kw('TEMP'), kw('TEMPORARY'))),
      $._kw_table,
      if_not_exists($),
      qualified_table_name($, false),
      choice(
        seq(
          '(',
          commaSep1($.column_definition),
          repeat(seq(',', $.table_constraint)),
          ')',
          optional(seq(kw('WITHOUT'), kw('ROWID')))
        ),
        seq($._kw_as, field('select', $.select_statement))
      ),
      optional(seq(kw('STRICT'), optional(seq(',', kw('WITHOUT'), kw('ROWID')))))
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
        seq($._kw_primary, $._kw_key, optional(choice($._kw_asc, $._kw_desc)), optional($.conflict_clause), optional($._kw_autoincrement)),
        seq($._kw_not, $._kw_null, optional($.conflict_clause)),
        seq($._kw_unique, optional($.conflict_clause)),
        seq($._kw_check, '(', field('expression', $._expression), ')'),
        seq($._kw_default, field('value', choice($._expression, $._literal_value))),
        seq(kw('COLLATE'), field('collation', $.identifier)),
        $.foreign_key_clause,
        seq(
          optional(seq(kw('GENERATED'), kw('ALWAYS'))),
          $._kw_as,
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
          choice(seq($._kw_primary, $._kw_key), $._kw_unique),
          '(',
          commaSep1(seq(
            field('column', $.identifier),
            optional(choice($._kw_asc, $._kw_desc))
          )),
          ')',
          optional($.conflict_clause)
        ),
        seq(
          $._kw_check,
          '(',
          field('expression', $._expression),
          ')'
        ),
        seq(
          $._kw_foreign, $._kw_key,
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
          $._kw_on,
          choice($._kw_delete, $._kw_update),
          choice(seq($._kw_set, $._kw_null), seq($._kw_set, $._kw_default), kw('CASCADE'), kw('RESTRICT'), seq(kw('NO'), kw('ACTION')))
        ),
        seq(kw('MATCH'), field('name', $.identifier))
      )),
      optional(seq(
        optional($._kw_not),
        kw('DEFERRABLE'),
        optional(seq(kw('INITIALLY'), choice(kw('DEFERRED'), kw('IMMEDIATE'))))
      ))
    ),
    
    column_definition: $ => seq(
      field('name', $.identifier),
      optional(field('type', $.type_name)),
      repeat($.column_constraint)
    ),

    conflict_clause: $ => seq(
      $._kw_on, kw('CONFLICT'),
      choice(kw('ROLLBACK'), kw('ABORT'), kw('FAIL'), kw('IGNORE'), kw('REPLACE'))
    ),

    // CREATE INDEX statement
    create_index_statement: $ => seq(
      $._kw_create,
      optional($._kw_unique),
      kw('INDEX'),
      if_not_exists($),
      field('name', $._qualified_identifier),
      $._kw_on,
      field('table', $._qualified_identifier),
      '(',
      commaSep1($.indexed_column),
      ')',
      optional($.where_clause)
    ),

    indexed_column: $ => seq(
      field('expression', $._expression),
      optional(choice($._kw_asc, $._kw_desc))
    ),

    // CREATE VIEW statement
    create_view_statement: $ => seq(
      $._kw_create,
      optional(choice(kw('TEMP'), kw('TEMPORARY'))),
      kw('VIEW'),
      if_not_exists($),
      field('name', $._qualified_identifier),
      optional(column_list($)),
      $._kw_as,
      field('select', $.select_statement)
    ),

    // CREATE TRIGGER statement
    create_trigger_statement: $ => seq(
      $._kw_create,
      optional(choice(kw('TEMP'), kw('TEMPORARY'))),
      $._kw_trigger,
      if_not_exists($),
      field('name', $._qualified_identifier),
      optional(choice(kw('BEFORE'), kw('AFTER'), seq(kw('INSTEAD'), $._kw_of))),
      choice(
        $._kw_delete,
        $._kw_insert,
        seq($._kw_update, optional(seq($._kw_of, commaSep1(field('column', $.identifier)))))
      ),
      $._kw_on,
      field('table', $._qualified_identifier),
      optional(seq($._kw_for, kw('EACH'), kw('ROW'))),
      optional(seq($._kw_when, field('condition', $._expression))),
      $._kw_begin,
      repeat1($._statement),
      $._kw_end
    ),

    // CREATE VIRTUAL TABLE statement
    create_virtual_table_statement: $ => seq(
      $._kw_create, kw('VIRTUAL'), $._kw_table,
      if_not_exists($),
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
      $._kw_create,
      optional(seq($._kw_or, kw('REPLACE'))),
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
      $._kw_create,
      optional(seq($._kw_or, kw('REPLACE'))),
      kw('FUNCTION'),
      field('name', $.identifier),
      '(',
      optional(commaSep1($.function_parameter)),
      ')',
      kw('RETURNS'),
      field('return_type', $.identifier),
      $._kw_as,
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
      $._kw_drop,
      field('type', choice($._kw_table, kw('INDEX'), kw('VIEW'), $._kw_trigger)),
      if_exists($),
      field('name', $._qualified_identifier)
    ),

    // ALTER TABLE statement
    alter_table_statement: $ => seq(
      $._kw_alter, $._kw_table,
      field('table', $._qualified_identifier),
      choice(
        seq($._kw_rename, $._kw_to, field('new_name', $.identifier)),
        seq($._kw_rename, optional($._kw_column), field('old_name', $.identifier), $._kw_to, field('new_name', $.identifier)),
        seq($._kw_add, optional($._kw_column), $.column_definition),
        seq($._kw_drop, optional($._kw_column), field('column', $.identifier))
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
      $._kw_as,
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
      optional(seq($._kw_into, field('file', $._expression)))
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
      $._kw_begin,
      optional(choice($._kw_deferred, $._kw_immediate, $._kw_exclusive)),
      optional($._kw_transaction)
    ),

    commit_statement: $ => seq(
      choice($._kw_commit, $._kw_end),
      optional($._kw_transaction)
    ),

    rollback_statement: $ => seq(
      $._kw_rollback,
      optional($._kw_transaction),
      optional(seq($._kw_to, optional($._kw_savepoint), field('savepoint', $.identifier)))
    ),

    savepoint_statement: $ => seq(
      $._kw_savepoint,
      field('name', $.identifier)
    ),

    release_statement: $ => seq(
      $._kw_release,
      optional($._kw_savepoint),
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
      $.oracle_date_literal,
      $.oracle_timestamp_literal,
      $.oracle_rownum,
      $.oracle_level,
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
      $.safe_cast_expression,
      $.function_call,
      $.subquery_expression,
      $.raise_expression,
      $.array_constructor
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
      choice('x', kw('X')),
      "'",
      /[0-9a-fA-F]+/,
      "'"
    ),

    null: $ => $._kw_null,

    boolean: $ => choice(kw('TRUE'), kw('FALSE')),

    unary_expression: $ => prec.right('unary', choice(
      seq('-', field('operand', $._expression)),
      seq('+', field('operand', $._expression)),
      seq($._kw_not, field('operand', $._expression)),
      seq('~', field('operand', $._expression))
    )),

    binary_expression: $ => {
      const table = [];
      
      for (const [precedence, operators] of Object.entries({
        1: ['||'],  // String concatenation
        2: ['*', '/', '%'],  // Multiplication, division, modulo
        3: ['+', '-'],  // Addition, subtraction
        4: ['<<', '>>', '&', '|'],  // Bitwise operators
        5: ['<', '<=', '>', '>='],  // Comparison
        6: ['=', '==', '!=', '<>', $._kw_is, seq($._kw_is, $._kw_not), $._kw_in, seq($._kw_not, $._kw_in), $._kw_like, seq($._kw_not, $._kw_like), kw('GLOB'), seq($._kw_not, kw('GLOB')), kw('MATCH'), seq($._kw_not, kw('MATCH')), kw('REGEXP'), seq($._kw_not, kw('REGEXP')), '->', '->>', '@>', '<@', token('#>'), token('#>>'), token('?&'), token('?|'), token('&&'), token('@@'), token('(+)')],  // Equality, pattern matching, PostgreSQL operators, and Oracle outer join
        7: [$._kw_and],  // Logical AND
        8: [$._kw_or],  // Logical OR
      })) {
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
      $._kw_cast,
      '(',
      field('expression', $._expression),
      $._kw_as,
      field('type', $.type_name),
      ')'
    ),

    case_expression: $ => seq(
      $._kw_case,
      optional(field('expression', $._expression)),
      repeat1(seq(
        $._kw_when,
        field('condition', $._expression),
        $._kw_then,
        field('result', $._expression)
      )),
      optional(seq($._kw_else, field('else', $._expression))),
      $._kw_end
    ),

    exists_expression: $ => seq(
      optional($._kw_not),
      $._kw_exists,
      '(',
      field('subquery', $.select_statement),
      ')'
    ),

    in_expression: $ => seq(
      field('expression', $._expression),
      optional($._kw_not),
      $._kw_in,
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
      optional($._kw_not),
      $._kw_between,
      field('low', $._expression),
      $._kw_and,
      field('high', $._expression)
    ),

    like_expression: $ => seq(
      field('expression', $._expression),
      optional($._kw_not),
      choice($._kw_like, kw('GLOB'), kw('MATCH'), kw('REGEXP')),
      field('pattern', $._expression),
      optional(seq(kw('ESCAPE'), field('escape', $._expression)))
    ),

    is_expression: $ => seq(
      field('left', $._expression),
      $._kw_is,
      optional($._kw_not),
      choice(
        $._kw_null,
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

    function_call: $ => prec(1, seq(
      field('name', choice(
        $.identifier,
        // Allow certain keywords to be used as function names
        kw('DATE'), kw('TIME'), kw('DATETIME'), kw('TIMESTAMP')
      )),
      '(',
      optional(choice(
        '*',
        seq(
          optional($._kw_distinct),
          commaSep1(field('argument', $._expression))
        )
      )),
      ')',
      optional(seq(
        optional(seq(kw('FILTER'), '(', $._kw_where, field('filter', $._expression), ')')),
        kw('OVER'),
        choice(
          field('window', $.identifier),
          $.window_definition
        )
      ))
    )),

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
        $._kw_array,
        '[',
        commaSep1(field('element', $._expression)),
        ']'
      ),
      seq(
        $._kw_array,
        '(',
        field('subquery', $.select_statement),
        ')'
      )
    ),

    // ZetaSQL data types
    array_type: $ => seq(
      $._kw_array,
      '<',
      field('element_type', $.type_name),
      '>'
    ),

    struct_type: $ => seq(
      $._kw_struct,
      '<',
      commaSep1(seq(
        field('field_name', $.identifier),
        field('field_type', $.type_name)
      )),
      '>'
    ),

    // ZetaSQL pipe syntax
    pipe_query: $ => prec(1, seq(
      $._kw_from,
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

    pipe_select: $ => seq($._kw_select, commaSep1($._expression)),
    pipe_extend: $ => seq(kw('EXTEND'), commaSep1(seq($._expression, optional(alias($))))),
    pipe_set: $ => seq($._kw_set, commaSep1(seq($.identifier, '=', $._expression))),
    pipe_drop: $ => seq($._kw_drop, commaSep1($.identifier)),
    pipe_rename: $ => seq($._kw_rename, commaSep1(seq($.identifier, $._kw_as, $.identifier))),
    pipe_where: $ => seq($._kw_where, $._expression),
    pipe_limit: $ => seq($._kw_limit, $._expression),
    pipe_aggregate: $ => seq(
      kw('AGGREGATE'),
      commaSep1(seq($._expression, optional(alias($)))),
      optional(seq($._kw_group, $._kw_by, commaSep1($._expression)))
    ),
    pipe_distinct: $ => $._kw_distinct,
    pipe_order_by: $ => seq($._kw_order, $._kw_by, commaSep1($.ordering_term)),
    pipe_join: $ => seq(
      optional(choice(kw('LEFT'), kw('RIGHT'), kw('FULL'), kw('INNER'))),
      $._kw_join,
      $.table_or_subquery,
      optional($.join_constraint)
    ),
    pipe_assert: $ => seq(kw('ASSERT'), $._expression),

    // ZetaSQL-specific functions
    safe_cast_expression: $ => prec(2, seq(
      $._kw_safe_cast,
      '(',
      field('expression', $._expression),
      $._kw_as,
      field('type', $.type_name),
      ')'
    )),


    // SQL Server TOP clause
    top_clause: $ => seq(
      $._kw_top,
      choice(
        field('count', $.integer),
        seq('(', field('count', $._expression), ')')
      ),
      optional(field('percent', kw('PERCENT')))
    ),

    // Oracle date and timestamp literals
    oracle_date_literal: $ => prec(3, seq(
      /[Dd][Aa][Tt][Ee]\s+/,
      field('value', $.string)
    )),

    oracle_timestamp_literal: $ => prec(3, seq(
      /[Tt][Ii][Mm][Ee][Ss][Tt][Aa][Mm][Pp]\s+/,
      field('value', $.string)
    )),

    // MySQL SHOW statements
    show_statement: $ => seq(
      kw('SHOW'),
      choice(
        kw('DATABASES'),
        kw('TABLES'),
        seq(kw('TABLES'), $._kw_from, field('database', $.identifier)),
        seq(kw('COLUMNS'), $._kw_from, field('table', $.identifier)),
        seq(kw('INDEX'), $._kw_from, field('table', $.identifier)),
        seq($._kw_create, $._kw_table, field('table', $.identifier)),
        seq($._kw_create, kw('DATABASE'), field('database', $.identifier))
      )
    ),


    // Oracle ROWNUM support
    oracle_rownum: _ => prec(2, /[Rr][Oo][Ww][Nn][Uu][Mm]/),
    
    // Oracle LEVEL pseudo-column for hierarchical queries
    oracle_level: _ => prec(2, /[Ll][Ee][Vv][Ee][Ll]/),

    // SQL Server batch separator
    go_statement: $ => kw('GO'),

    // SQL Server table hints
    table_hint: $ => seq(
      $._kw_with,
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
      choice(kw('INDEX'), $._kw_key),
      optional(seq($._kw_for, choice($._kw_join, seq($._kw_order, $._kw_by), seq($._kw_group, $._kw_by)))),
      '(',
      optional(commaSep1($.identifier)),
      ')'
    ),

  }
});