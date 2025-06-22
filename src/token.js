export const TokenType = {
    // Single-character tokens.
    LEFT_PAREN: 'LEFT_PAREN',
    RIGHT_PAREN: 'RIGHT_PAREN',
    LEFT_BRACE: 'LEFT_BRACE',
    LEFT_BRACKET: 'LEFT_BRACKET',
    RIGHT_BRACE: 'RIGHT_BRACE',
    RIGHT_BRACKET: 'RIGHT_BRACKET',
    COMMA: 'COMMA',
    DOT: 'DOT',
    MINUS: 'MINUS',
    PLUS: 'PLUS',
    SEMICOLON: 'SEMICOLON',
    SLASH: 'SLASH',
    STAR: 'STAR',

    // One or two character tokens.
    BANG: 'BANG',
    BANG_EQUAL: 'BANG_EQUAL',
    EQUAL_EQUAL: 'EQUAL_EQUAL',
    GREATER: 'GREATER',
    GREATER_EQUAL: 'GREATER_EQUAL',
    LESS: 'LESS',
    LESS_EQUAL: 'LESS_EQUAL',
    EQUAL: 'EQUAL',

    // Literals.
    IDENTIFIER: 'IDENTIFIER',
    STRING: 'STRING',
    NUMBER: 'NUMBER',

    // Keywords.
    CLASS: 'CLASS',
    ELSE: 'ELSE',
    FN: 'FN',
    WHILE: 'WHILE',
    IF: 'IF',
    LET: 'LET',
    PRINT: 'PRINT',
    THIS: 'THIS',
    STATIC: 'STATIC',
    UI: 'UI',
    TRUE: 'TRUE',
    FALSE: 'FALSE',
    NIL: 'NIL',

    EOF: 'EOF'
};