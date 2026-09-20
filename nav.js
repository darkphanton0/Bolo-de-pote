const botaoMenu = document.querySelector('#botao-menu-mobile');
const navegacao = document.querySelector('.nav');
const fecharMenu = document.querySelector('#fechar-menu-mobile');

if (botaoMenu && navegacao) {
    const alternarMenu = (aberto) => {
        navegacao.classList.toggle('menu-aberto', aberto);
        botaoMenu.setAttribute('aria-expanded', String(aberto));
        document.body.classList.toggle('menu-mobile-aberto', aberto);
    };

    botaoMenu.addEventListener('click', () => {
        alternarMenu(!navegacao.classList.contains('menu-aberto'));
    });

    fecharMenu?.addEventListener('click', () => alternarMenu(false));

    navegacao.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => alternarMenu(false));
    });

    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape') {
            alternarMenu(false);
        }
    });
}
