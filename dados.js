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

const formatarPreco = (valor) => valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});