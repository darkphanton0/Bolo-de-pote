const chaveCarrinho = 'yellow-carrinho';
const carrinhoSalvo = localStorage.getItem(chaveCarrinho);
let carrinho = [];

try {
    carrinho = carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
} catch {
    localStorage.removeItem(chaveCarrinho);
}
const botaoCarrinho = document.querySelector('.carrinho');
const painelCarrinho = document.querySelector('#painel-carrinho');
const contadorCarrinho = document.querySelector('.contador-carrinho');
const listaCarrinho = document.querySelector('.lista-carrinho');
const totalCarrinho = document.querySelector('.total-carrinho strong');
const botaoAbrirCheckout = document.querySelector('#abrir-checkout');
const checkoutArea = document.querySelector('#checkout-pedido');
const botaoFecharCheckout = document.querySelector('#fechar-checkout');
const gradeCardapio = document.querySelector('.cardapio');
const quantidadeCardapio = document.querySelector('.quantidade');
const formularioPesquisa = document.querySelector('.pesquisa');
const campoPesquisa = document.querySelector('#pesquisa');
const filtroCategoria = document.querySelector('#filtro-categoria');
const checkoutCarrinho = document.querySelector('#checkout-carrinho');
const estadoCatalogo = document.querySelector('#estado-catalogo');
let produtos = [];
const numeroWhatsApp = '5527997515335';

const quantidadeTotal = () => carrinho.reduce((total, item) => total + item.quantidade, 0);

const normalizarTexto = (texto) => texto.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const salvarCarrinho = () => {
    localStorage.setItem(chaveCarrinho, JSON.stringify(carrinho));
};

const prepararCategorias = () => {
    const categorias = [...new Set(produtos.map((produto) => produto.categoria))].sort();
    filtroCategoria.innerHTML = '<option value="todas">Todas</option>';
    categorias.forEach((categoria) => {
        filtroCategoria.insertAdjacentHTML('beforeend', `<option value="${categoria}">${categoria}</option>`);
    });
};

const renderizarProdutos = (termo = '', categoria = 'todas') => {
    const busca = normalizarTexto(termo.trim());
    const produtosFiltrados = produtos.filter((produto) => {
        const textoProduto = normalizarTexto(`${produto.nome} ${produto.descricao}`);
        const correspondeCategoria = categoria === 'todas' || produto.categoria === categoria;
        return textoProduto.includes(busca) && correspondeCategoria;
    });

    quantidadeCardapio.textContent = `${produtosFiltrados.length} ${produtosFiltrados.length === 1 ? 'opção encontrada' : 'opções encontradas'}`;

    if (produtosFiltrados.length === 0) {
        gradeCardapio.innerHTML = '<p class="sem-resultados">Nenhum item encontrado. Tente outro sabor.</p>';
        return;
    }

    gradeCardapio.innerHTML = produtosFiltrados.map((produto) => `
        <article class="item-card">
            ${produto.promocao && produto.precoOriginal > produto.preco ? '<span class="selo-promocao"><span aria-hidden="true">✦</span> Promoção</span>' : ''}
            <img src="${produto.imagem}" alt="Imagem de ${produto.nome}" class="imagem-item">
            <div class="detalhes-item">
                <h3>${produto.nome}</h3>
                <p>${produto.descricao}<small class="categoria-item">${produto.categoria}</small></p>
                <div class="rodape-item">
                    <strong class="preco-item">${produto.promocao && produto.precoOriginal > produto.preco ? `<del>${formatarPreco(produto.precoOriginal)}</del>` : ''}<span class="preco-atual">${formatarPreco(produto.preco)}</span></strong>
                    <button type="button" data-id="${produto.id}" data-nome="${produto.nome}" data-preco="${produto.preco}">Adicionar</button>
                </div>
            </div>
        </article>
    `).join('');
};

const atualizarCarrinho = () => {
    const quantidade = quantidadeTotal();
    const total = carrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);

    contadorCarrinho.textContent = quantidade;
    salvarCarrinho();
    contadorCarrinho.classList.remove('contador-atualizado');
    requestAnimationFrame(() => contadorCarrinho.classList.add('contador-atualizado'));
    botaoCarrinho.setAttribute('aria-label', `Abrir carrinho, ${quantidade} ${quantidade === 1 ? 'item' : 'itens'}`);
    totalCarrinho.textContent = formatarPreco(total);
    botaoAbrirCheckout.disabled = quantidade === 0;

    if (carrinho.length === 0) {
        listaCarrinho.innerHTML = '<p class="carrinho-vazio">Seu carrinho está vazio.</p>';
        return;
    }

    listaCarrinho.innerHTML = carrinho.map((item, indice) => `
        <div class="item-carrinho">
            <div>
                <p>${item.nome}</p>
                <small>${formatarPreco(item.preco)} cada</small>
            </div>
            <div class="controles-item">
                <button type="button" data-acao="diminuir" data-indice="${indice}" aria-label="Diminuir ${item.nome}">-</button>
                <span>${item.quantidade}</span>
                <button type="button" data-acao="aumentar" data-indice="${indice}" aria-label="Aumentar ${item.nome}">+</button>
                    <button type="button" data-acao="aumentar" data-indice="${indice}" aria-label="Aumentar ${item.nome}">+</button>
            </div>
        </div>
    `).join('');
};

const adicionarAoCarrinho = (id, nome, preco) => {
    const itemExistente = carrinho.find((item) => item.nome === nome);
    if (!produtos.some((item) => item.id === Number(id))) {
        return;
    }

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({ nome, preco, quantidade: 1 });
    }

    atualizarCarrinho();
};

gradeCardapio.addEventListener('click', (evento) => {
    const botao = evento.target.closest('.rodape-item button');

    if (botao) {
        adicionarAoCarrinho(botao.dataset.id, botao.dataset.nome, Number(botao.dataset.preco));
    }
});

campoPesquisa.addEventListener('input', () => {
    renderizarProdutos(campoPesquisa.value);
});

formularioPesquisa.addEventListener('submit', (evento) => {
    evento.preventDefault();
    renderizarProdutos(campoPesquisa.value);
});

filtroCategoria.addEventListener('change', () => {
    renderizarProdutos(campoPesquisa.value, filtroCategoria.value);
});

botaoCarrinho.addEventListener('click', () => {
    const estaAberto = !painelCarrinho.hidden;
    painelCarrinho.hidden = estaAberto;
    botaoCarrinho.setAttribute('aria-expanded', String(!estaAberto));
});

document.querySelector('.fechar-carrinho').addEventListener('click', () => {
    painelCarrinho.hidden = true;
    botaoCarrinho.setAttribute('aria-expanded', 'false');
    botaoCarrinho.focus();
});

botaoAbrirCheckout.addEventListener('click', () => {
    painelCarrinho.hidden = true;
    botaoCarrinho.setAttribute('aria-expanded', 'false');
    checkoutArea.hidden = false;
    checkoutArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelector('#cliente-nome').focus();
});

botaoFecharCheckout.addEventListener('click', () => {
    checkoutArea.hidden = true;
});

listaCarrinho.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button[data-acao]');

    if (!botao) {
        return;
    }

    const item = carrinho[Number(botao.dataset.indice)];

    if (botao.dataset.acao === 'aumentar') {
        item.quantidade += 1;
    } else if (item.quantidade > 1) {
        item.quantidade -= 1;
    } else {
        carrinho.splice(Number(botao.dataset.indice), 1);
    }

    atualizarCarrinho();
});

checkoutCarrinho.addEventListener('submit', (evento) => {
    evento.preventDefault();

    if (carrinho.length === 0) {
        return;
    }

    const nomeCliente = document.querySelector('#cliente-nome').value.trim();
    const enderecoCliente = document.querySelector('#cliente-endereco').value.trim();
    const observacoes = document.querySelector('#cliente-observacoes').value.trim();
    const total = carrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
    const itens = carrinho.map((item) => `- ${item.quantidade}x ${item.nome} (${formatarPreco(item.preco * item.quantidade)})`);
    const mensagem = [
        `Olá! Sou ${nomeCliente} e quero fazer um pedido:`,
        ...itens,
        '',
        `Total: ${formatarPreco(total)}`,
        `Endereço: ${enderecoCliente}`,
        observacoes ? `Observações: ${observacoes}` : ''
    ].join('\n');

    window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`, '_blank');
});

const iniciarLoja = async () => {
    produtos = await carregarProdutos();
    if (estadoCatalogo && window.catalogoRemotoAtivo === false) {
        estadoCatalogo.hidden = false;
        estadoCatalogo.textContent = 'Modo local: execute supabase.sql para sincronizar todos os dispositivos.';
    }
    atualizarCarrinho();
    prepararCategorias();
    renderizarProdutos();
};

iniciarLoja();