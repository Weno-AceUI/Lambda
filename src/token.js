export const TokenType = {
  // Single-character tokens.
  LEFT_PAREN: 'LEFT_PAREN',
  RIGHT_PAREN: 'RIGHT_PAREN',
  LEFT_BRACE: 'LEFT_BRACE',
  RIGHT_BRACE: 'RIGHT_BRACE',
  COMMA: 'COMMA',
  DOT: 'DOT',
  MINUS: 'MINUS',
  PLUS: 'PLUS',
  SEMICOLON: 'SEMICOLON',
  SLASH: 'SLASH',
  STAR: 'STAR',

  // One or two character tokens.
  EQUAL: 'EQUAL',

  // Literals.
  IDENTIFIER: 'IDENTIFIER',
  STRING: 'STRING',
  NUMBER: 'NUMBER',

  // Keywords.
  LET: 'LET',
  FN: 'FN',
  IF: 'IF',
  ELSE: 'ELSE',
  PRINT: 'PRINT',

  EOF: 'EOF' // End of File
};