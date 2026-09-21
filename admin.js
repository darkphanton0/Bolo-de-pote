const usuarioAdmin = 'admin';
const senhaAdmin = 'yellow123';
const chaveSessaoAdmin = 'yellow-admin-sessao';

const loginAdmin = document.querySelector('#login-admin');
const painelAdmin = document.querySelector('#painel-admin');
const formLogin = document.querySelector('#form-login');
const erroLogin = document.querySelector('#erro-login');
const campoSenha = document.querySelector('#senha');
const botaoMostrarSenha = document.querySelector('#mostrar-senha');
const formProduto = document.querySelector('#form-produto');
const listaAdmin = document.querySelector('#itens-admin');
const totalProdutos = document.querySelector('#total-produtos');
const botaoSalvar = document.querySelector('#salvar-produto');
const botaoCancelar = document.querySelector('#cancelar-edicao');
const botaoSair = document.querySelector('#sair-admin');
const campoPreco = document.querySelector('#produto-preco');
const campoPrecoOriginal = document.querySelector('#produto-preco-original');
const campoPromocao = document.querySelector('#produto-promocao');
const campoImagem = document.querySelector('#produto-imagem');
const campoArquivo = document.querySelector('#produto-arquivo');
const campoBuscaAdmin = document.querySelector('#busca-admin');
const listaCategorias = document.querySelector('#lista-categorias');
const previaImagem = document.querySelector('#previa-imagem');
const statusAdmin = document.querySelector('#status-admin');

let produtos = [];
let termoBusca = '';
let autenticado = false;
let temporizadorStatus = null;

const definirStatus = (mensagem, tipo = 'aviso') => {
    if (!statusAdmin) {
        return;
    }

    window.clearTimeout(temporizadorStatus);
    statusAdmin.classList.remove('status-erro', 'status-sucesso');

    if (!mensagem) {
        statusAdmin.hidden = true;
        statusAdmin.textContent = '';
        return;
    }

    statusAdmin.hidden = false;
    statusAdmin.textContent = mensagem;

    if (tipo === 'erro') {
        statusAdmin.classList.add('status-erro');
    }

    if (tipo === 'sucesso') {
        statusAdmin.classList.add('status-sucesso');
        temporizadorStatus = window.setTimeout(() => definirStatus(''), 4000);
    }
};

const mostrarPainel = (estaAutenticado) => {
    autenticado = estaAutenticado;
    loginAdmin.hidden = estaAutenticado;
    painelAdmin.hidden = !estaAutenticado;

    try {
        if (estaAutenticado) {
            sessionStorage.setItem(chaveSessaoAdmin, '1');
        } else {
            sessionStorage.removeItem(chaveSessaoAdmin);
        }
    } catch {
        /* sessionStorage indisponível; segue sem persistir a sessão */
    }

    if (estaAutenticado) {
        carregarCatalogoAdmin();
    }
};

const atualizarPreviaImagem = () => {
    if (!previaImagem) {
        return;
    }

    const arquivo = campoArquivo?.files?.[0];

    if (arquivo) {
        previaImagem.src = URL.createObjectURL(arquivo);
        return;
    }

    previaImagem.src = campoImagem?.value.trim() || 'img/lirio2.webp';
};

const limparFormulario = () => {
    formProduto.reset();
    document.querySelector('#produto-id').value = '';
    campoImagem.value = 'img/lirio2.webp';
    campoPrecoOriginal.value = '';
    campoPrecoOriginal.setCustomValidity('');
    document.querySelector('#produto-categoria').value = 'Clássicos';
    campoPromocao.checked = false;
    botaoSalvar.textContent = 'Criar item';
    botaoCancelar.hidden = true;
    atualizarPreviaImagem();
};

const preencherCategorias = () => {
    if (!listaCategorias) {
        return;
    }

    const categorias = [...new Set(produtos.map((produto) => produto.categoria).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    listaCategorias.innerHTML = categorias
        .map((categoria) => `<option value="${escaparHtml(categoria)}"></option>`)
        .join('');
};

const produtosFiltrados = () => {
    if (!termoBusca) {
        return produtos;
    }

    const termo = termoBusca.toLowerCase();

    return produtos.filter((produto) =>
        String(produto.nome || '').toLowerCase().includes(termo) ||
        String(produto.categoria || '').toLowerCase().includes(termo) ||
        String(produto.descricao || '').toLowerCase().includes(termo)
    );
};

const renderizarLista = () => {
    const visiveis = produtosFiltrados();

    if (termoBusca) {
        totalProdutos.textContent = `${visiveis.length} de ${produtos.length} ${produtos.length === 1 ? 'item' : 'itens'}`;
    } else {
        totalProdutos.textContent = `${produtos.length} ${produtos.length === 1 ? 'item' : 'itens'}`;
    }

    if (produtos.length === 0) {
        listaAdmin.innerHTML = '<p class="lista-vazia">Nenhum item cadastrado ainda. Use o formulário acima para criar o primeiro.</p>';
        return;
    }

    if (visiveis.length === 0) {
        listaAdmin.innerHTML = '<p class="lista-vazia">Nenhum item corresponde à busca.</p>';
        return;
    }

    listaAdmin.innerHTML = visiveis.map((produto) => `
        <article class="linha-produto">
            <img src="${escaparHtml(produto.imagem)}" alt="" class="miniatura-produto" loading="lazy">
            <div class="info-produto">
                <h4>${escaparHtml(produto.nome)}</h4>
                <p>${escaparHtml(produto.descricao)}</p>
                <small>${escaparHtml(produto.categoria)}${produto.promocao ? ' · Promoção' : ''}</small>
            </div>
            <strong>${produto.promocao && produto.precoOriginal > produto.preco ? `<del>${formatarPreco(produto.precoOriginal)}</del>` : ''}${formatarPreco(produto.preco)}</strong>
            <div class="acoes-item-admin">
                <button type="button" class="botao-secundario" data-acao="editar" data-id="${escaparHtml(produto.id)}">Editar</button>
                <button type="button" class="botao-perigo" data-acao="excluir" data-id="${escaparHtml(produto.id)}">Excluir</button>
            </div>
        </article>
    `).join('');
};

const carregarCatalogoAdmin = async () => {
    try {
        produtos = await carregarProdutos();
        preencherCategorias();
        renderizarLista();

        if (window.catalogoRemotoAtivo === false) {
            definirStatus('Banco remoto indisponível. Os dados exibidos são locais neste navegador.');
        }
    } catch (erro) {
        console.error('Não foi possível carregar o catálogo remoto.', erro);
        produtos = obterProdutos();
        preencherCategorias();
        renderizarLista();
        definirStatus('Não foi possível conectar ao Supabase. Execute supabase.sql e confira a URL da página.', 'erro');
    }
};

const entrarNoPainel = () => {
    const usuario = document.querySelector('#usuario').value.trim();
    const senha = campoSenha.value;

    if (usuario === usuarioAdmin && senha === senhaAdmin) {
        erroLogin.hidden = true;
        formLogin.reset();
        mostrarPainel(true);
        document.querySelector('#produto-nome')?.focus();
        return;
    }

    erroLogin.hidden = false;
    campoSenha.select();
};

formLogin.addEventListener('submit', (evento) => {
    evento.preventDefault();
    entrarNoPainel();
});

if (botaoMostrarSenha) {
    botaoMostrarSenha.addEventListener('click', () => {
        const estaVisivel = campoSenha.type === 'text';
        campoSenha.type = estaVisivel ? 'password' : 'text';
        botaoMostrarSenha.textContent = estaVisivel ? 'Mostrar' : 'Ocultar';
        botaoMostrarSenha.setAttribute('aria-pressed', String(!estaVisivel));
        campoSenha.focus();
    });
}

if (campoBuscaAdmin) {
    campoBuscaAdmin.addEventListener('input', () => {
        termoBusca = campoBuscaAdmin.value.trim();
        renderizarLista();
    });
}

campoImagem?.addEventListener('input', atualizarPreviaImagem);
campoArquivo?.addEventListener('change', atualizarPreviaImagem);

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
    const arquivoImagem = campoArquivo.files[0];
    const imagemSelecionada = arquivoImagem ? await new Promise((resolver) => {
        const leitor = new FileReader();
        leitor.addEventListener('load', () => resolver(leitor.result));
        leitor.readAsDataURL(arquivoImagem);
    }) : campoImagem.value.trim();
    const produto = {
        id: id ? Number(id) : Date.now(),
        nome: document.querySelector('#produto-nome').value.trim(),
        preco,
        precoOriginal: precoOriginal || null,
        descricao: document.querySelector('#produto-descricao').value.trim(),
        imagem: imagemSelecionada,
        categoria: document.querySelector('#produto-categoria').value.trim(),
        promocao: campoPromocao.checked
    };

    const textoBotao = botaoSalvar.textContent;
    botaoSalvar.disabled = true;
    botaoSalvar.textContent = id ? 'Salvando...' : 'Criando...';

    try {
        const produtoSalvo = await salvarProdutoRemoto(produto);

        if (id) {
            produtos = produtos.map((item) => item.id === Number(id) ? produtoSalvo : item);
        } else {
            produtos.push(produtoSalvo);
        }
    } catch (erro) {
        console.error('Não foi possível salvar o produto no Supabase.', erro);
        botaoSalvar.disabled = false;
        botaoSalvar.textContent = textoBotao;
        definirStatus('Não foi possível salvar no banco remoto. Execute supabase.sql e confira as políticas da tabela produtos.', 'erro');
        return;
    }

    salvarProdutos(produtos);
    preencherCategorias();
    limparFormulario();
    renderizarLista();
    botaoSalvar.disabled = false;
    definirStatus(id ? 'Item atualizado com sucesso.' : 'Item criado com sucesso.', 'sucesso');
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

    if (!produto) {
        return;
    }

    if (botao.dataset.acao === 'excluir') {
        const confirmado = window.confirm(`Excluir "${produto.nome}"? Esta ação não pode ser desfeita.`);

        if (!confirmado) {
            return;
        }

        botao.disabled = true;
        botao.textContent = 'Excluindo...';

        try {
            await excluirProdutoRemoto(id);
        } catch (erro) {
            console.error('Não foi possível excluir o produto no Supabase.', erro);
            botao.disabled = false;
            botao.textContent = 'Excluir';
            definirStatus('Não foi possível excluir no banco remoto. Confira as políticas da tabela produtos.', 'erro');
            return;
        }

        produtos = produtos.filter((item) => item.id !== id);
        salvarProdutos(produtos);
        preencherCategorias();
        renderizarLista();
        definirStatus(`"${produto.nome}" foi excluído.`, 'sucesso');
        return;
    }

    document.querySelector('#produto-id').value = produto.id;
    document.querySelector('#produto-nome').value = produto.nome;
    document.querySelector('#produto-preco').value = produto.preco;
    document.querySelector('#produto-preco-original').value = produto.precoOriginal || '';
    document.querySelector('#produto-descricao').value = produto.descricao;
    campoImagem.value = produto.imagem;
    document.querySelector('#produto-categoria').value = produto.categoria;
    campoPromocao.checked = produto.promocao;
    botaoSalvar.textContent = 'Salvar alterações';
    botaoCancelar.hidden = false;
    definirStatus('');
    atualizarPreviaImagem();
    formProduto.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelector('#produto-nome').focus();
});

botaoCancelar.addEventListener('click', () => {
    limparFormulario();
    definirStatus('');
});

botaoSair.addEventListener('click', () => {
    mostrarPainel(false);
    formLogin.reset();
    definirStatus('');
    document.querySelector('#usuario')?.focus();
});

document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !botaoCancelar.hidden) {
        limparFormulario();
        definirStatus('');
    }
});

const iniciarPainelAdmin = () => {
    let sessaoAtiva = false;

    try {
        sessaoAtiva = sessionStorage.getItem(chaveSessaoAdmin) === '1';
    } catch {
        sessaoAtiva = false;
    }

    mostrarPainel(sessaoAtiva);
    atualizarPreviaImagem();

    if (!sessaoAtiva) {
        document.querySelector('#usuario')?.focus();
    }
};

iniciarPainelAdmin();