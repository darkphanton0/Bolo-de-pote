const usuarioAdmin = 'admin';
const senhaAdmin = 'yellow123';
const loginAdmin = document.querySelector('#login-admin');
const painelAdmin = document.querySelector('#painel-admin');
const formLogin = document.querySelector('#form-login');
const erroLogin = document.querySelector('#erro-login');
const formProduto = document.querySelector('#form-produto');
const listaAdmin = document.querySelector('#itens-admin');
const totalProdutos = document.querySelector('#total-produtos');
const botaoSalvar = document.querySelector('#salvar-produto');
const botaoCancelar = document.querySelector('#cancelar-edicao');
const campoPreco = document.querySelector('#produto-preco');
const campoPrecoOriginal = document.querySelector('#produto-preco-original');
const campoPromocao = document.querySelector('#produto-promocao');
let produtos = [];
let autenticado = false;

const mostrarPainel = (autenticado) => {
    loginAdmin.hidden = autenticado;
    painelAdmin.hidden = !autenticado;

    if (autenticado) {
        carregarCatalogoAdmin();
    }
};

const limparFormulario = () => {
    formProduto.reset();
    document.querySelector('#produto-id').value = '';
    document.querySelector('#produto-imagem').value = 'img/lirio2.webp';
    document.querySelector('#produto-preco-original').value = '';
    document.querySelector('#produto-categoria').value = 'Clássicos';
    document.querySelector('#produto-promocao').checked = false;
    botaoSalvar.textContent = 'Criar item';
    botaoCancelar.hidden = true;
};

const renderizarLista = () => {
    totalProdutos.textContent = `${produtos.length} ${produtos.length === 1 ? 'item' : 'itens'}`;
    listaAdmin.innerHTML = produtos.map((produto) => `
        <article class="linha-produto">
            <img src="${produto.imagem}" alt="" class="miniatura-produto">
            <div class="info-produto">
                <h4>${produto.nome}</h4>
                <p>${produto.descricao}</p>
                <small>${produto.categoria}${produto.promocao ? ' · Promoção' : ''}</small>
            </div>
            <strong>${produto.promocao && produto.precoOriginal > produto.preco ? `<del>${formatarPreco(produto.precoOriginal)}</del>` : ''}${formatarPreco(produto.preco)}</strong>
            <div class="acoes-item-admin">
                <button type="button" class="botao-secundario" data-acao="editar" data-id="${produto.id}">Editar</button>
                <button type="button" class="botao-perigo" data-acao="excluir" data-id="${produto.id}">Excluir</button>
            </div>
        </article>
    `).join('');
};

const carregarCatalogoAdmin = async () => {
    produtos = await carregarProdutos();
    renderizarLista();
};

formLogin.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const usuario = document.querySelector('#usuario').value.trim();
    const senha = document.querySelector('#senha').value;

    if (usuario === usuarioAdmin && senha === senhaAdmin) {
        autenticado = true;
        erroLogin.hidden = true;
        mostrarPainel(true);
        return;
    }

    erroLogin.hidden = false;
});

formProduto.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (!autenticado) {
        mostrarPainel(false);
        return;
    }

    const preco = Number(campoPreco.value);
    const precoOriginal = Number(campoPrecoOriginal.value);

    campoPrecoOriginal.setCustomValidity('');

    if (campoPromocao.checked && (!precoOriginal || precoOriginal <= preco)) {
        campoPrecoOriginal.setCustomValidity('Informe um preço anterior maior que o preço promocional.');
        campoPrecoOriginal.reportValidity();
        return;
    }

    const id = document.querySelector('#produto-id').value;
    const arquivoImagem = document.querySelector('#produto-arquivo').files[0];
    const imagemSelecionada = arquivoImagem ? await new Promise((resolver) => {
        const leitor = new FileReader();
        leitor.addEventListener('load', () => resolver(leitor.result));
        leitor.readAsDataURL(arquivoImagem);
    }) : document.querySelector('#produto-imagem').value.trim();
    const produto = {
        id: id ? Number(id) : Date.now(),
        nome: document.querySelector('#produto-nome').value.trim(),
        preco,
        precoOriginal: precoOriginal || null,
        descricao: document.querySelector('#produto-descricao').value.trim(),
        imagem: imagemSelecionada,
        categoria: document.querySelector('#produto-categoria').value.trim(),
        promocao: document.querySelector('#produto-promocao').checked
    };

    if (id) {
        const produtoSalvo = await salvarProdutoRemoto(produto);
        produtos = produtos.map((item) => item.id === Number(id) ? produtoSalvo : item);
    } else {
        const produtoSalvo = await salvarProdutoRemoto(produto);
        produtos.push(produtoSalvo);
    }

    salvarProdutos(produtos);
    limparFormulario();
    renderizarLista();
});

listaAdmin.addEventListener('click', (evento) => {
    if (!autenticado) {
        mostrarPainel(false);
        return;
    }

    const botao = evento.target.closest('button[data-acao]');

    if (!botao) {
        return;
    }

    const id = Number(botao.dataset.id);
    const produto = produtos.find((item) => item.id === id);

    if (botao.dataset.acao === 'excluir') {
        await excluirProdutoRemoto(id);
        produtos = produtos.filter((item) => item.id !== id);
        salvarProdutos(produtos);
        renderizarLista();
        return;
    }

    document.querySelector('#produto-id').value = produto.id;
    document.querySelector('#produto-nome').value = produto.nome;
    document.querySelector('#produto-preco').value = produto.preco;
    document.querySelector('#produto-preco-original').value = produto.precoOriginal || '';
    document.querySelector('#produto-descricao').value = produto.descricao;
    document.querySelector('#produto-imagem').value = produto.imagem;
    document.querySelector('#produto-categoria').value = produto.categoria;
    document.querySelector('#produto-promocao').checked = produto.promocao;
    botaoSalvar.textContent = 'Salvar alterações';
    botaoCancelar.hidden = false;
    document.querySelector('#produto-nome').focus();
});

botaoCancelar.addEventListener('click', limparFormulario);

document.querySelector('#sair-admin').addEventListener('click', () => {
    autenticado = false;
    mostrarPainel(false);
    formLogin.reset();
});

mostrarPainel(false);