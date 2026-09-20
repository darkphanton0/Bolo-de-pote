PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS pedido_itens;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS produtos;

CREATE TABLE produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT NOT NULL,
    preco REAL NOT NULL CHECK (preco >= 0),
    preco_original REAL CHECK (preco_original IS NULL OR preco_original > preco),
    imagem TEXT NOT NULL DEFAULT 'img/lirio2.webp',
    categoria TEXT NOT NULL DEFAULT 'Classicos',
    promocao INTEGER NOT NULL DEFAULT 0 CHECK (promocao IN (0, 1)),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_cliente TEXT NOT NULL,
    endereco TEXT NOT NULL,
    observacoes TEXT,
    total REAL NOT NULL CHECK (total >= 0),
    status TEXT NOT NULL DEFAULT 'recebido' CHECK (status IN ('recebido', 'preparando', 'pronto', 'entregue', 'cancelado')),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pedido_itens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    produto_id INTEGER,
    nome_produto TEXT NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario REAL NOT NULL CHECK (preco_unitario >= 0),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL
);

INSERT INTO produtos (nome, descricao, preco, categoria, imagem) VALUES
('Chocolate cremoso', 'Camadas de bolo de chocolate e creme de brigadeiro.', 12.00, 'Classicos', 'img/lirio2.webp'),
('Morango com creme', 'Bolo branco, creme suave e pedacos de morango.', 14.00, 'Frutados', 'img/lirio2.webp'),
('Limao refrescante', 'Massa leve com mousse de limao e raspas citricas.', 13.00, 'Frutados', 'img/lirio2.webp'),
('Leite Ninho', 'Bolo branco com creme de leite em po bem delicado.', 14.00, 'Especiais', 'img/lirio2.webp'),
('Pacoca crocante', 'Creme de amendoim, bolo macio e farofa de pacoca.', 13.00, 'Especiais', 'img/lirio2.webp'),
('Red velvet', 'Bolo aveludado com recheio cremoso de cream cheese.', 15.00, 'Especiais', 'img/lirio2.webp');

ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalogo publico leitura" ON produtos
    FOR SELECT USING (true);

CREATE POLICY "painel catalogo inserir" ON produtos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "painel catalogo atualizar" ON produtos
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "painel catalogo excluir" ON produtos
    FOR DELETE USING (true);

CREATE POLICY "cliente criar pedido" ON pedidos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "cliente criar itens" ON pedido_itens
    FOR INSERT WITH CHECK (true);

-- Exemplo de consulta para listar o cardapio:
-- SELECT * FROM produtos ORDER BY categoria, nome;

-- Exemplo de consulta para listar pedidos recentes:
-- SELECT * FROM pedidos ORDER BY criado_em DESC;
