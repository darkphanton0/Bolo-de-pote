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
const avisoCarrinho = document.querySelector('#aviso-carrinho');
const listaCarrinho = document.querySelector('.lista-carrinho');
const totalCarrinho = document.querySelector('.total-carrinho strong');
const botaoAbrirCheckout = document.querySelector('#abrir-checkout');
const botaoLimparCarrinho = document.querySelector('#limpar-carrinho');
const checkoutArea = document.querySelector('#checkout-pedido');
const botaoFecharCheckout = document.querySelector('#fechar-checkout');
const gradeCardapio = document.querySelector('.cardapio');
const quantidadeCardapio = document.querySelector('.quantidade');
const formularioPesquisa = document.querySelector('.pesquisa');
const campoPesquisa = document.querySelector('#pesquisa');
const filtroCategoria = document.querySelector('#filtro-categoria');
const checkoutCarrinho = document.querySelector('#checkout-carrinho');
const estadoCatalogo = document.querySelector('#estado-catalogo');
const checkoutResumo = document.querySelector('#checkout-resumo');
const checkoutErro = document.querySelector('#checkout-erro');
const checkoutEndereco = document.querySelector('#checkout-endereco');
const botaoEnviarPedido = document.querySelector('#enviar-pedido');
const campoTelefone = document.querySelector('#cliente-telefone');
let produtos = [];
const numeroWhatsApp = '5527997515335';
let temporizadorAviso = null;
let temporizadorCarrinho = null;
const temporizadoresBotoes = new WeakMap();

const campoEntregaSelecionado = () => document.querySelector('input[name="tipo-entrega"]:checked')?.value || 'Entrega';

const formatarTelefone = (valor) => {
    const digitos = valor.replace(/\D/g, '').slice(0, 11);

    if (digitos.length <= 2) {
        return digitos.length ? `(${digitos}` : '';
    }

    if (digitos.length <= 6) {
        return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
    }

    if (digitos.length <= 10) {
        return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
    }

    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
};

const atualizarResumoCheckout = () => {
    if (!checkoutResumo) {
        return;
    }

    if (carrinho.length === 0) {
        checkoutResumo.innerHTML = '<p class="resumo-vazio">Seu carrinho está vazio.</p>';
        return;
    }

    const total = carrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
    const linhas = carrinho.map((item) => `
        <li>
            <span>${item.quantidade}x ${escaparHtml(item.nome)}</span>
            <strong>${formatarPreco(item.preco * item.quantidade)}</strong>
        </li>
    `).join('');

    checkoutResumo.innerHTML = `
        <ul class="resumo-itens">${linhas}</ul>
        <p class="resumo-total"><span>Total</span><strong>${formatarPreco(total)}</strong></p>
    `;
};

const atualizarCamposEntrega = () => {
    if (!checkoutEndereco) {
        return;
    }

    const retirada = campoEntregaSelecionado() === 'Retirada';
    checkoutEndereco.hidden = retirada;
};

const mostrarErroCheckout = (mensagem) => {
    if (!checkoutErro) {
        return;
    }

    if (!mensagem) {
        checkoutErro.hidden = true;
        checkoutErro.textContent = '';
        return;
    }

    checkoutErro.hidden = false;
    checkoutErro.textContent = mensagem;
};

const quantidadeTotal = () => carrinho.reduce((total, item) => total + item.quantidade, 0);

const normalizarTexto = (texto) => texto.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const salvarCarrinho = () => {
    localStorage.setItem(chaveCarrinho, JSON.stringify(carrinho));
};

const prepararCategorias = () => {
    const categorias = [...new Set(produtos.map((produto) => produto.categoria))].sort();
    filtroCategoria.innerHTML = '<option value="todas">Todas</option>';
    categorias.forEach((categoria) => {
        filtroCategoria.insertAdjacentHTML('beforeend', `<option value="${escaparHtml(categoria)}">${escaparHtml(categoria)}</option>`);
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

    gradeCardapio.innerHTML = produtosFiltrados.map((produto, indice) => `
        <article class="item-card" style="animation-delay: ${Math.min(indice * 70, 700)}ms">
            ${produto.promocao && produto.precoOriginal > produto.preco ? '<span class="selo-promocao"><span aria-hidden="true">✦</span> Promoção</span>' : ''}
            <img src="${escaparHtml(produto.imagem)}" alt="Imagem de ${escaparHtml(produto.nome)}" class="imagem-item" loading="lazy">
            <div class="detalhes-item">
                <h3>${escaparHtml(produto.nome)}</h3>
                <p>${escaparHtml(produto.descricao)}<small class="categoria-item">${escaparHtml(produto.categoria)}</small></p>
                <div class="rodape-item">
                    <strong class="preco-item">${produto.promocao && produto.precoOriginal > produto.preco ? `<del>${formatarPreco(produto.precoOriginal)}</del>` : ''}<span class="preco-atual">${formatarPreco(produto.preco)}</span></strong>
                    <button type="button" data-id="${escaparHtml(produto.id)}" data-nome="${escaparHtml(produto.nome)}" data-preco="${escaparHtml(produto.preco)}">Adicionar</button>
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

    if (botaoLimparCarrinho) {
        botaoLimparCarrinho.hidden = carrinho.length === 0;
    }

    if (carrinho.length === 0) {
        listaCarrinho.innerHTML = '<p class="carrinho-vazio">Seu carrinho está vazio.</p>';
        return;
    }

    listaCarrinho.innerHTML = carrinho.map((item, indice) => `
        <div class="item-carrinho">
            <div>
                <p>${escaparHtml(item.nome)}</p>
                <small>${formatarPreco(item.preco)} cada</small>
            </div>
            <div class="controles-item">
                <button type="button" data-acao="diminuir" data-indice="${indice}" aria-label="Diminuir ${escaparHtml(item.nome)}">-</button>
                <span>${item.quantidade}</span>
                <button type="button" data-acao="aumentar" data-indice="${indice}" aria-label="Aumentar ${escaparHtml(item.nome)}">+</button>
            </div>
        </div>
    `).join('');
};

const reduzirAnimacao = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const mostrarAvisoAdicionado = (mensagem) => {
    if (!avisoCarrinho) {
        return;
    }

    window.clearTimeout(temporizadorAviso);
    avisoCarrinho.textContent = mensagem;
    avisoCarrinho.classList.add('aviso-visivel');
    temporizadorAviso = window.setTimeout(() => avisoCarrinho.classList.remove('aviso-visivel'), 2400);
};

const marcarBotaoAdicionado = (botao) => {
    if (!botao) {
        return;
    }

    window.clearTimeout(temporizadoresBotoes.get(botao));

    if (!botao.dataset.rotulo) {
        botao.dataset.rotulo = botao.textContent;
    }

    botao.classList.add('botao-adicionado');
    botao.textContent = 'Adicionado ✓';

    temporizadoresBotoes.set(botao, window.setTimeout(() => {
        botao.classList.remove('botao-adicionado');
        botao.textContent = botao.dataset.rotulo;
    }, 1400));
};

const pulsarCarrinho = () => {
    if (!botaoCarrinho) {
        return;
    }

    window.clearTimeout(temporizadorCarrinho);
    botaoCarrinho.classList.remove('carrinho-recebendo');
    void botaoCarrinho.offsetWidth;
    botaoCarrinho.classList.add('carrinho-recebendo');
    temporizadorCarrinho = window.setTimeout(() => botaoCarrinho.classList.remove('carrinho-recebendo'), 700);
};

const animarProdutoAoCarrinho = (origem) => {
    if (!origem || !botaoCarrinho) {
        return;
    }

    if (reduzirAnimacao()) {
        return;
    }

    const cartao = origem.closest('.item-card');
    const imagem = cartao?.querySelector('.imagem-item');

    if (!imagem) {
        return;
    }

    const origemRect = imagem.getBoundingClientRect();
    const destinoRect = botaoCarrinho.getBoundingClientRect();
    const origemX = origemRect.left + origemRect.width / 2;
    const origemY = origemRect.top + origemRect.height / 2;
    const destinoX = destinoRect.left + destinoRect.width / 2;
    const destinoY = destinoRect.top + destinoRect.height / 2;

    const clone = document.createElement('img');
    clone.src = imagem.currentSrc || imagem.src;
    clone.alt = '';
    clone.setAttribute('aria-hidden', 'true');
    clone.className = 'item-voador';
    clone.style.top = `${origemRect.top}px`;
    clone.style.left = `${origemRect.left}px`;
    clone.style.width = `${origemRect.width}px`;
    clone.style.height = `${origemRect.height}px`;
    document.body.appendChild(clone);

    const animacao = clone.animate([
        { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1, borderRadius: '10px' },
        {
            transform: `translate(${(destinoX - origemX) * 0.55}px, ${(destinoY - origemY) * 0.55 - 70}px) scale(0.45) rotate(-10deg)`,
            opacity: 0.95,
            offset: 0.55
        },
        {
            transform: `translate(${destinoX - origemX}px, ${destinoY - origemY}px) scale(0.08) rotate(10deg)`,
            opacity: 0.2,
            borderRadius: '50%'
        }
    ], {
        duration: 780,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
    });

    animacao.onfinish = () => {
        clone.remove();
        pulsarCarrinho();
    };

    animacao.oncancel = () => clone.remove();
};

const adicionarAoCarrinho = (id, nome, preco, origem) => {
    const idNumerico = Number(id);

    if (!produtos.some((item) => item.id === idNumerico)) {
        return;
    }

    const itemExistente = carrinho.find((item) => item.id === idNumerico);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({ id: idNumerico, nome, preco, quantidade: 1 });
    }

    atualizarCarrinho();
    marcarBotaoAdicionado(origem);
    mostrarAvisoAdicionado(`${nome} foi adicionado ao carrinho.`);
    animarProdutoAoCarrinho(origem);
};

gradeCardapio.addEventListener('click', (evento) => {
    const botao = evento.target.closest('.rodape-item button');

    if (botao) {
        adicionarAoCarrinho(botao.dataset.id, botao.dataset.nome, Number(botao.dataset.preco), botao);
    }
});

campoPesquisa.addEventListener('input', () => {
    renderizarProdutos(campoPesquisa.value, filtroCategoria.value);
});

formularioPesquisa.addEventListener('submit', (evento) => {
    evento.preventDefault();
    renderizarProdutos(campoPesquisa.value, filtroCategoria.value);
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

botaoLimparCarrinho?.addEventListener('click', () => {
    if (carrinho.length === 0) {
        return;
    }

    const confirmado = window.confirm('Tem certeza que deseja limpar o carrinho?');

    if (!confirmado) {
        return;
    }

    carrinho = [];
    atualizarCarrinho();
    atualizarResumoCheckout();
    botaoAbrirCheckout.focus();
});

botaoAbrirCheckout.addEventListener('click', () => {
    painelCarrinho.hidden = true;
    botaoCarrinho.setAttribute('aria-expanded', 'false');
    checkoutArea.hidden = false;
    mostrarErroCheckout('');
    atualizarResumoCheckout();
    atualizarCamposEntrega();
    checkoutArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelector('#cliente-nome').focus();
});

botaoFecharCheckout.addEventListener('click', () => {
    checkoutArea.hidden = true;
    mostrarErroCheckout('');
});

if (campoTelefone) {
    campoTelefone.addEventListener('input', () => {
        campoTelefone.value = formatarTelefone(campoTelefone.value);
    });
}

document.querySelectorAll('input[name="tipo-entrega"]').forEach((radio) => {
    radio.addEventListener('change', atualizarCamposEntrega);
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
        mostrarErroCheckout('Seu carrinho está vazio. Adicione itens antes de finalizar.');
        return;
    }

    const nomeCliente = document.querySelector('#cliente-nome').value.trim();
    const telefoneCliente = document.querySelector('#cliente-telefone').value.trim();
    const tipoEntrega = campoEntregaSelecionado();
    const formaPagamento = document.querySelector('input[name="forma-pagamento"]:checked')?.value || 'Pix';
    const enderecoCliente = document.querySelector('#cliente-endereco').value.trim();
    const bairroCliente = document.querySelector('#cliente-bairro').value.trim();
    const referenciaCliente = document.querySelector('#cliente-referencia').value.trim();
    const observacoes = document.querySelector('#cliente-observacoes').value.trim();
    const digitosTel = telefoneCliente.replace(/\D/g, '');

    if (digitosTel.length < 10) {
        mostrarErroCheckout('Informe um telefone válido com DDD para combinarmos a entrega.');
        campoTelefone.focus();
        return;
    }

    if (tipoEntrega === 'Entrega' && (!enderecoCliente || !bairroCliente)) {
        mostrarErroCheckout('Para entrega, preencha o endereço e o bairro.');
        (enderecoCliente ? document.querySelector('#cliente-bairro') : document.querySelector('#cliente-endereco')).focus();
        return;
    }

    mostrarErroCheckout('');

    const total = carrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
    const itens = carrinho.map((item) => `- ${item.quantidade}x ${item.nome} (${formatarPreco(item.preco * item.quantidade)})`);
    const enderecoCompleto = [enderecoCliente, bairroCliente].filter(Boolean).join(', ');
    const enderecoFormatado = referenciaCliente ? `${enderecoCompleto} (${referenciaCliente})` : enderecoCompleto;

    const linhas = [
        `Olá, ${nomeCliente}! Gostaria de fazer este pedido na Yellow:`,
        '',
        '*Itens:*',
        ...itens,
        '',
        `*Total:* ${formatarPreco(total)}`,
        `*Telefone:* ${telefoneCliente}`,
        `*Recebimento:* ${tipoEntrega}`,
        tipoEntrega === 'Entrega' ? `*Endereço:* ${enderecoFormatado}` : '',
        `*Pagamento:* ${formaPagamento}`
    ];

    if (observacoes) {
        linhas.push(`*Observações:* ${observacoes}`);
    }

    window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(linhas.filter((l) => l !== '').join('\n'))}`, '_blank', 'noopener');

    carrinho = [];
    salvarCarrinho();
    atualizarCarrinho();
    checkoutCarrinho.reset();
    atualizarCamposEntrega();
    atualizarResumoCheckout();
    checkoutArea.hidden = true;
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