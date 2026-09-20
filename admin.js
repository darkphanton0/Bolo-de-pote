const usuarioAdmin = 'admin';
const senhaAdmin = 'yellow123';
const loginAdmin = document.querySelector('#login-admin');
const painelAdmin = document.querySelector('#painel-admin');
const formLogin = document.querySelector('#form-login');
const erroLogin = document.querySelector('#erro-login');
const botaoEntrar = document.querySelector('#entrar-admin');
const formProduto = document.querySelector('#form-produto');
const listaAdmin = document.querySelector('#itens-admin');
const totalProdutos = document.querySelector('#total-produtos');
const botaoSalvar = document.querySelector('#salvar-produto');
const botaoCancelar = document.querySelector('#cancelar-edicao');
const campoPreco = document.querySelector('#produto-preco');
const campoPrecoOriginal = document.querySelector('#produto-preco-original');
const campoPromocao = document.querySelector('#produto-promocao');
const statusAdmin = document.querySelector('#status-admin');
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
    try {
        produtos = await carregarProdutos();
        renderizarLista();

        if (window.catalogoRemotoAtivo === false) {
            statusAdmin.hidden = false;
            statusAdmin.textContent = 'Banco remoto indisponível. Os dados exibidos são locais neste navegador.';
        }
    } catch (erro) {
        console.error('Não foi possível carregar o catálogo remoto.', erro);
        produtos = obterProdutos();
        renderizarLista();
        statusAdmin.hidden = false;
        statusAdmin.textContent = 'Não foi possível conectar ao Supabase. Execute supabase.sql e confira a URL da página.';
    }
};

const entrarNoPainel = () => {
    const usuario = document.querySelector('#usuario').value.trim();
    const senha = document.querySelector('#senha').value;

    if (usuario === usuarioAdmin && senha === senhaAdmin) {
        autenticado = true;
        erroLogin.hidden = true;
        mostrarPainel(true);
        return;
    }

    erroLogin.hidden = false;
};

botaoEntrar.addEventListener('click', entrarNoPainel);

formLogin.addEventListener('submit', (evento) => {
    evento.preventDefault();
    entrarNoPainel();
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

    try {
        if (id) {
            const produtoSalvo = await salvarProdutoRemoto(produto);
            produtos = produtos.map((item) => item.id === Number(id) ? produtoSalvo : item);
        } else {
            const produtoSalvo = await salvarProdutoRemoto(produto);
            produtos.push(produtoSalvo);
        }
    } catch (erro) {
        console.error('Não foi possível salvar o produto no Supabase.', erro);
        window.alert('Não foi possível salvar no banco remoto. Execute supabase.sql e confira as políticas da tabela produtos.');
        return;
    }

    salvarProdutos(produtos);
    limparFormulario();
    renderizarLista();
});

listaAdmin.addEventListener('click', async (evento) => {
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
        try {
            await excluirProdutoRemoto(id);
        } catch (erro) {
            console.error('Não foi possível excluir o produto no Supabase.', erro);
            window.alert('Não foi possível excluir no banco remoto. Confira as políticas da tabela produtos.');
            return;
        }
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