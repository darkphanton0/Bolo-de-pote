const produtosPadrao = [
    {
        id: 1,
        nome: 'Chocolate cremoso',
        descricao: 'Camadas de bolo de chocolate e creme de brigadeiro.',
        preco: 12,
        imagem: 'img/lirio2.webp',
        categoria: 'Clássicos',
        promocao: false
    },
    {
        id: 2,
        nome: 'Morango com creme',
        descricao: 'Bolo branco, creme suave e pedaços de morango.',
        preco: 14,
        imagem: 'img/lirio2.webp',
        categoria: 'Frutados',
        promocao: false
    },
    {
        id: 3,
        nome: 'Limão refrescante',
        descricao: 'Massa leve com mousse de limão e raspas cítricas.',
        preco: 13,
        imagem: 'img/lirio2.webp',
        categoria: 'Frutados',
        promocao: false
    },
    {
        id: 4,
        nome: 'Leite Ninho',
        descricao: 'Bolo branco com creme de leite em pó bem delicado.',
        preco: 14,
        imagem: 'img/lirio2.webp',
        categoria: 'Especiais',
        promocao: false
    },
    {
        id: 5,
        nome: 'Paçoca crocante',
        descricao: 'Creme de amendoim, bolo macio e farofa de paçoca.',
        preco: 13,
        imagem: 'img/lirio2.webp',
        categoria: 'Especiais',
        promocao: false
    },
    {
        id: 6,
        nome: 'Red velvet',
        descricao: 'Bolo aveludado com recheio cremoso de cream cheese.',
        preco: 15,
        imagem: 'img/lirio2.webp',
        categoria: 'Especiais',
        promocao: false
    }
];

const chaveProdutos = 'yellow-produtos';

const produtoParaBanco = (produto) => ({
    id: produto.id,
    nome: produto.nome,
    descricao: produto.descricao,
    preco: produto.preco,
    preco_original: produto.precoOriginal || null,
    imagem: produto.imagem,
    categoria: produto.categoria,
    promocao: produto.promocao
});

const produtoDoBanco = (produto) => ({
    id: produto.id,
    nome: produto.nome,
    descricao: produto.descricao,
    preco: Number(produto.preco),
    precoOriginal: produto.preco_original ? Number(produto.preco_original) : null,
    imagem: produto.imagem,
    categoria: produto.categoria || 'Clássicos',
    promocao: Boolean(produto.promocao)
});

const obterProdutos = () => {
    const produtosSalvos = localStorage.getItem(chaveProdutos);

    if (!produtosSalvos) {
        localStorage.setItem(chaveProdutos, JSON.stringify(produtosPadrao));
        return [...produtosPadrao];
    }

    try {
        return JSON.parse(produtosSalvos).map((produto) => ({
            categoria: 'Clássicos',
            promocao: false,
            precoOriginal: null,
            ...produto
        }));
    } catch {
        localStorage.setItem(chaveProdutos, JSON.stringify(produtosPadrao));
        return [...produtosPadrao];
    }
};

const salvarProdutos = (produtos) => {
    localStorage.setItem(chaveProdutos, JSON.stringify(produtos));
};

const carregarProdutos = async () => {
    if (!supabaseClient) {
        window.catalogoRemotoAtivo = false;
        return obterProdutos();
    }

    const { data, error } = await supabaseClient
        .from('produtos')
        .select('*')
        .order('categoria')
        .order('nome');

    if (error || !data || data.length === 0) {
        window.catalogoRemotoAtivo = false;
        console.warn('Supabase indisponível. Execute supabase.sql e confira as políticas da tabela produtos.', error);
        return obterProdutos();
    }

    window.catalogoRemotoAtivo = true;
    const produtos = data.map(produtoDoBanco);
    salvarProdutos(produtos);
    return produtos;
};

const salvarProdutoRemoto = async (produto) => {
    if (!supabaseClient) {
        salvarProdutos([...obterProdutos().filter((item) => item.id !== produto.id), produto]);
        return produto;
    }

    const { data, error } = await supabaseClient
        .from('produtos')
        .upsert(produtoParaBanco(produto), { onConflict: 'id' })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return produtoDoBanco(data);
};

const excluirProdutoRemoto = async (id) => {
    if (!supabaseClient) {
        salvarProdutos(obterProdutos().filter((produto) => produto.id !== id));
        return;
    }

    const { error } = await supabaseClient.from('produtos').delete().eq('id', id);

    if (error) {
        throw error;
    }
};

const formatarPreco = (valor) => Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});

const escaparHtml = (valor) => String(valor ?? '').replace(/[&<>"']/g, (caractere) =>
    '\u0026#' + caractere.charCodeAt(0) + ';');
