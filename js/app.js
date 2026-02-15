// Variáveis globais
let contadorItens = 0;
let modalPrestador, modalMateriais;
let pdfGeradoBlob = null;
let materiaisAdicionadosNaSessao = 0; 

// Lista de serviços para autocomplete (Nicho Climatização)
const servicosSugeridos = [
    'Instalação Ar Split 9.000 BTUs',
    'Instalação Ar Split 12.000 BTUs',
    'Instalação Ar Split 18.000 BTUs',
    'Instalação Ar Split 24.000 BTUs',
    'Limpeza e Higienização Completa',
    'Carga de Gás R410A',
    'Carga de Gás R22',
    'Troca de Capacitor',
    'Conserto de Placa Eletrônica',
    'Reparo de Vazamento de Fluído',
    'Desinstalação de Aparelho',
    'Mudança de Local de Unidade',
    'Manutenção Preventiva Mensal (PMOC)',
    'Substituição de Compressor',
    'Limpeza de Dreno',
    'Instalação de Dreno de Condensado',
    'Troca de Sensores de Temperatura',
    'Instalação de Cortina de Ar',
    'Manutenção de Ar-Condicionado Janela',
    'Visita Técnica para Diagnóstico'
];

// Dados do prestador (Padrão Climatização)
let dadosPrestador = {
    empresa: 'ClimaPro Soluções',
    nome: 'Técnico Responsável',
    telefone: '(00) 00000-0000',
    documento: '',
    endereco: ''
};

// --- LÓGICA DE SEGURANÇA (SHA-256) ---

// Função para gerar Hash SHA-256 (Padrão de segurança)
async function _hash(string) {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verificar senha de acesso
async function verificarAcesso() {
    const senhaDigitada = document.getElementById('senhaAcesso').value;
    const erroLogin = document.getElementById('erroLogin');
    
    // Compara o hash da senha digitada com o do config.js
    const hashDigitado = await _hash(senhaDigitada);
    
    if (hashDigitado === _CONFIG.access_key) {
        document.getElementById('telaLogin').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('telaLogin').style.display = 'none';
            document.getElementById('conteudoSistema').style.display = 'block';
            inicializarSistema();
        }, 500);
    } else {
        erroLogin.style.display = 'block';
        document.getElementById('senhaAcesso').value = '';
        document.getElementById('senhaAcesso').focus();
    }
}

// Atalho para Enter no Login
document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && document.getElementById('telaLogin').style.display !== 'none') {
        verificarAcesso();
    }
});

// --- FIM DA LÓGICA DE SEGURANÇA ---

// Inicialização do Sistema
function inicializarSistema() {
    modalPrestador = new bootstrap.Modal(document.getElementById('modalPrestador'));
    modalMateriais = new bootstrap.Modal(document.getElementById('modalMateriais'));
    
    const dataInput = document.getElementById('orcamentoData');
    if (dataInput) dataInput.valueAsDate = new Date();
    
    adicionarItem();
    aplicarMascaras();
    carregarDadosPrestador();

    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', atualizarPreviewCondicoes);
    });
}

// Atualizar preview das condições
function atualizarPreviewCondicoes() {
    const condicoes = [];
    if (document.getElementById('pagamentoPix').checked) condicoes.push('PIX à vista (5% off)');
    if (document.getElementById('pagamentoCartao').checked) condicoes.push('Cartão em até 3x');
    if (document.getElementById('pagamentoBoleto').checked) condicoes.push('50% entrada + 50% entrega');
    
    const card = document.getElementById('cardPreviewCondicoes');
    const lista = document.getElementById('listaCondicoesPreview');
    
    if (condicoes.length > 0) {
        lista.innerHTML = condicoes.map(c => `<li class="mb-1"><i class="bi bi-check-circle-fill text-success me-2"></i>${c}</li>`).join('');
        card.style.display = 'block';
    } else {
        card.style.display = 'none';
    }
}

// Funções de Modal
function abrirModalMateriais() {
    materiaisAdicionadosNaSessao = 0;
    atualizarContadorModal();
    document.getElementById('materiaisAdicionadosLista').style.display = 'none';
    document.getElementById('listaMateriaisTemp').innerHTML = '';
    document.getElementById('materialManualNome').value = '';
    document.getElementById('materialManualQtd').value = '1';
    document.getElementById('materialManualValor').value = '';
    modalMateriais.show();
}

function fecharModalMateriais() {
    modalMateriais.hide();
}

function atualizarContadorModal() {
    const contador = document.getElementById('contadorMateriaisModal');
    if (contador) {
        contador.textContent = `${materiaisAdicionadosNaSessao} item${materiaisAdicionadosNaSessao !== 1 ? 's' : ''} adicionado${materiaisAdicionadosNaSessao !== 1 ? 's' : ''}`;
    }
}

// Adicionar material rápido (Insumos/Peças)
function adicionarMaterialRapidoContinuo(nome, valor) {
    contadorItens++;
    materiaisAdicionadosNaSessao++;
    const container = document.getElementById('listaItens');
    
    const itemHTML = `
        <div class="item-row material-item" id="item-${contadorItens}" data-tipo="material">
            <button type="button" class="btn btn-danger btn-sm btn-remover" onclick="removerItem(${contadorItens})">
                <i class="bi bi-x-lg"></i>
            </button>
            <div class="d-flex align-items-center mb-2">
                <span class="badge bg-success me-2"><i class="bi bi-cpu me-1"></i>PEÇA / INSUMO</span>
            </div>
            <div class="row g-3">
                <div class="col-12">
                    <label class="form-label small fw-bold">Descrição *</label>
                    <input type="text" class="form-control item-descricao" value="${nome}" readonly>
                </div>
                <div class="col-md-4">
                    <label class="form-label small fw-bold">Qtd *</label>
                    <input type="number" class="form-control item-quantidade" value="1" min="1" onchange="calcularTotais()" onkeyup="calcularTotais()">
                </div>
                <div class="col-md-4">
                    <label class="form-label small fw-bold">Valor Unit. (R$) *</label>
                    <input type="number" class="form-control item-valor" value="${valor}" min="0" step="0.01" onchange="calcularTotais()" onkeyup="calcularTotais()">
                </div>
                <div class="col-md-4">
                    <label class="form-label small fw-bold">Total</label>
                    <input type="text" class="form-control item-total bg-light fw-bold text-success" readonly value="${formatarMoeda(valor)}">
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', itemHTML);
    calcularTotais();
    atualizarContadorModal();
    adicionarNaListaTemp(nome, valor);
    document.getElementById('materiaisAdicionadosLista').style.display = 'block';
}

function adicionarMaterialManualContinuo() {
    const nome = document.getElementById('materialManualNome').value;
    const qtd = parseFloat(document.getElementById('materialManualQtd').value) || 1;
    const valor = parseFloat(document.getElementById('materialManualValor').value) || 0;
    
    if (!nome) { alert('Digite o nome da peça ou material'); return; }
    
    contadorItens++;
    materiaisAdicionadosNaSessao++;
    const container = document.getElementById('listaItens');
    
    const itemHTML = `
        <div class="item-row material-item" id="item-${contadorItens}" data-tipo="material">
            <button type="button" class="btn btn-danger btn-sm btn-remover" onclick="removerItem(${contadorItens})">
                <i class="bi bi-x-lg"></i>
            </button>
            <div class="d-flex align-items-center mb-2">
                <span class="badge bg-success me-2"><i class="bi bi-cpu me-1"></i>PEÇA / INSUMO</span>
            </div>
            <div class="row g-3">
                <div class="col-12">
                    <label class="form-label small fw-bold">Descrição *</label>
                    <input type="text" class="form-control item-descricao" value="${nome}" readonly>
                </div>
                <div class="col-md-4">
                    <label class="form-label small fw-bold">Qtd *</label>
                    <input type="number" class="form-control item-quantidade" value="${qtd}" min="1" onchange="calcularTotais()" onkeyup="calcularTotais()">
                </div>
                <div class="col-md-4">
                    <label class="form-label small fw-bold">Valor Unit. (R$) *</label>
                    <input type="number" class="form-control item-valor" value="${valor}" min="0" step="0.01" onchange="calcularTotais()" onkeyup="calcularTotais()">
                </div>
                <div class="col-md-4">
                    <label class="form-label small fw-bold">Total</label>
                    <input type="text" class="form-control item-total bg-light fw-bold text-success" readonly value="${formatarMoeda(qtd * valor)}">
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', itemHTML);
    calcularTotais();
    atualizarContadorModal();
    adicionarNaListaTemp(nome, valor, qtd);
    
    document.getElementById('materialManualNome').value = '';
    document.getElementById('materialManualQtd').value = '1';
    document.getElementById('materialManualValor').value = '';
    document.getElementById('materiaisAdicionadosLista').style.display = 'block';
}

function adicionarNaListaTemp(nome, valor, qtd = 1) {
    const lista = document.getElementById('listaMateriaisTemp');
    const total = formatarMoeda(valor * qtd);
    const item = document.createElement('li');
    item.className = 'list-group-item d-flex justify-content-between align-items-center';
    item.innerHTML = `<span>${nome} (${qtd}x)</span><span class="badge bg-success rounded-pill">${total}</span>`;
    lista.appendChild(item);
}

// Adicionar serviço rápido
function adicionarServicoRapido(descricao, valorUnitario, unidade) {
    contadorItens++;
    const container = document.getElementById('listaItens');
    
    const itemHTML = `
        <div class="item-row servico-item" id="item-${contadorItens}" data-tipo="servico">
            <button type="button" class="btn btn-danger btn-sm btn-remover" onclick="removerItem(${contadorItens})">
                <i class="bi bi-x-lg"></i>
            </button>
            <div class="d-flex align-items-center mb-2">
                <span class="badge bg-info me-2"><i class="bi bi-lightning-charge me-1"></i>SERVIÇO</span>
            </div>
            <div class="row g-3">
                <div class="col-12">
                    <label class="form-label small fw-bold">Descrição do Serviço *</label>
                    <input type="text" class="form-control item-descricao" value="${descricao}" readonly>
                </div>
                <div class="col-md-4">
                    <label class="form-label small fw-bold">Quantidade (${unidade}) *</label>
                    <input type="number" class="form-control item-quantidade" value="1" min="1" onchange="calcularTotais()" onkeyup="calcularTotais()">
                </div>
                <div class="col-md-4">
                    <label class="form-label small fw-bold">Valor Unit. (R$) *</label>
                    <input type="number" class="form-control item-valor" value="${valorUnitario}" min="0" step="0.01" onchange="calcularTotais()" onkeyup="calcularTotais()">
                </div>
                <div class="col-md-4">
                    <label class="form-label small fw-bold">Total</label>
                    <input type="text" class="form-control item-total bg-light fw-bold text-info" readonly value="${formatarMoeda(valorUnitario)}">
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', itemHTML);
    calcularTotais();
    setTimeout(() => {
        const el = document.getElementById(`item-${contadorItens}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

// Adicionar item manual
function adicionarItem() {
    contadorItens++;
    const container = document.getElementById('listaItens');
    
    const itemHTML = `
        <div class="item-row" id="item-${contadorItens}" data-tipo="manual">
            <button type="button" class="btn btn-danger btn-sm btn-remover" onclick="removerItem(${contadorItens})">
                <i class="bi bi-x-lg"></i>
            </button>
            <div class="row g-3">
                <div class="col-12 position-relative">
                    <label class="form-label small fw-bold">Descrição do Serviço *</label>
                    <input type="text" class="form-control item-descricao" placeholder="Digite ou selecione o serviço..." 
                           onfocus="mostrarSugestoes(this)" oninput="filtrarSugestoes(this)" onblur="ocultarSugestoes(this)">
                    <div class="suggestions-container"></div>
                </div>
                <div class="col-md-4">
                    <label class="form-label small fw-bold">Qtd *</label>
                    <input type="number" class="form-control item-quantidade" value="1" min="1" onchange="calcularTotais()" onkeyup="calcularTotais()">
                </div>
                <div class="col-md-4">
                    <label class="form-label small fw-bold">Valor Unit. (R$) *</label>
                    <input type="number" class="form-control item-valor" placeholder="0,00" min="0" step="0.01" onchange="calcularTotais()" onkeyup="calcularTotais()">
                </div>
                <div class="col-md-4">
                    <label class="form-label small fw-bold">Total</label>
                    <input type="text" class="form-control item-total bg-light fw-bold text-primary" readonly value="R$ 0,00">
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', itemHTML);
    setTimeout(() => {
        const input = document.querySelector(`#item-${contadorItens} .item-descricao`);
        if (input) input.focus();
    }, 100);
}

// Autocomplete
function mostrarSugestoes(input) {
    const container = input.parentElement.querySelector('.suggestions-container');
    container.innerHTML = servicosSugeridos.map(s => 
        `<div class="suggestion-item" onclick="selecionarSugestao(this, '${s}')">${s}</div>`
    ).join('');
    container.style.display = 'block';
}

function filtrarSugestoes(input) {
    const container = input.parentElement.querySelector('.suggestions-container');
    const filtro = input.value.toLowerCase();
    const filtrados = servicosSugeridos.filter(s => s.toLowerCase().includes(filtro));
    
    if (filtrados.length > 0 && filtro.length > 0) {
        container.innerHTML = filtrados.map(s => `<div class="suggestion-item" onclick="selecionarSugestao(this, '${s}')">${s}</div>`).join('');
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

function selecionarSugestao(elemento, valor) {
    const input = elemento.closest('.position-relative').querySelector('.item-descricao');
    input.value = valor;
    elemento.parentElement.style.display = 'none';
}

function ocultarSugestoes(input) {
    setTimeout(() => {
        const container = input.parentElement.querySelector('.suggestions-container');
        if (container) container.style.display = 'none';
    }, 200);
}

function removerItem(id) {
    const item = document.getElementById(`item-${id}`);
    if (item) {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            item.remove();
            calcularTotais();
            if (document.querySelectorAll('.item-row').length === 0) adicionarItem();
        }, 300);
    }
}

// Cálculos
function calcularTotais() {
    let totalServicos = 0;
    let totalMateriais = 0;
    let subtotal = 0;
    
    document.querySelectorAll('.item-row').forEach(item => {
        const qtd = parseFloat(item.querySelector('.item-quantidade').value) || 0;
        const valor = parseFloat(item.querySelector('.item-valor').value) || 0;
        const total = qtd * valor;
        
        item.querySelector('.item-total').value = formatarMoeda(total);
        subtotal += total;
        
        const tipo = item.getAttribute('data-tipo');
        if (tipo === 'material') {
            totalMateriais += total;
        } else {
            totalServicos += total;
        }
    });
    
    const descontoPercentual = parseFloat(document.getElementById('descontoPercentual').value) || 0;
    const valorDesconto = subtotal * (descontoPercentual / 100);
    const totalFinal = subtotal - valorDesconto;
    
    document.getElementById('previewServicos').textContent = formatarMoeda(totalServicos);
    document.getElementById('previewMateriais').textContent = formatarMoeda(totalMateriais);
    document.getElementById('previewSubtotal').textContent = formatarMoeda(subtotal);
    
    const btnPDFMateriais = document.getElementById('btnPDFMateriais');
    if (btnPDFMateriais) btnPDFMateriais.style.display = totalMateriais > 0 ? 'block' : 'none';
    
    const linhaDesconto = document.getElementById('linhaDesconto');
    if (valorDesconto > 0) {
        linhaDesconto.style.display = 'flex !important';
        document.getElementById('previewDesconto').textContent = `- ${formatarMoeda(valorDesconto)}`;
    } else {
        linhaDesconto.style.display = 'none !important';
    }
    
    document.getElementById('previewTotal').textContent = formatarMoeda(totalFinal);
    return { subtotal, valorDesconto, totalFinal, totalServicos, totalMateriais };
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

// Geração de PDF
function gerarPDF() {
    const clienteNome = document.getElementById('clienteNome').value;
    if (!clienteNome) { alert('Preencha o nome do cliente!'); return; }
    
    const { subtotal, valorDesconto, totalFinal, totalServicos, totalMateriais } = calcularTotais();
    const clienteTelefone = document.getElementById('clienteTelefone').value;
    const clienteEndereco = document.getElementById('clienteEndereco').value;
    const validadeDias = document.getElementById('validadeOrcamento').value;
    const observacoes = document.getElementById('observacoes').value;
    const dataOrcamento = document.getElementById('orcamentoData').value;
    
    const condicoes = [];
    if (document.getElementById('pagamentoPix').checked) condicoes.push('PIX à vista com 5% de desconto');
    if (document.getElementById('pagamentoCartao').checked) condicoes.push('Cartão de crédito em até 3x sem juros');
    if (document.getElementById('pagamentoBoleto').checked) condicoes.push('50% de entrada + 50% na entrega');

    const dataValidade = new Date();
    dataValidade.setDate(dataValidade.getDate() + parseInt(validadeDias));
    
    const itens = [];
    document.querySelectorAll('.item-row').forEach(item => {
        const tipo = item.getAttribute('data-tipo');
        const descricao = item.querySelector('.item-descricao').value.trim();
        const qtd = item.querySelector('.item-quantidade').value;
        const valor = item.querySelector('.item-total').value; 
        
        if (descricao) {
            itens.push({
                tipo: tipo === 'material' ? 'PEÇA/INSUMO' : 'SERVIÇO',
                descricao: descricao,
                qtd: qtd,
                valor: formatarMoeda(parseFloat(item.querySelector('.item-valor').value) || 0),
                total: valor
            });
        }
    });
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const htmlContent = montarHTMLPDF({
        clienteNome, clienteTelefone, clienteEndereco, dataOrcamento,
        dataValidade, itens, subtotal, valorDesconto, totalFinal,
        totalServicos, totalMateriais, observacoes, condicoes
    });
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
}

function gerarPDFMateriais() {
    const { totalMateriais } = calcularTotais();
    if (totalMateriais === 0) return;
    
    const clienteNome = document.getElementById('clienteNome').value;
    const materiais = [];
    document.querySelectorAll('.item-row[data-tipo="material"]').forEach(item => {
        const descricao = item.querySelector('.item-descricao').value.trim();
        const qtd = item.querySelector('.item-quantidade').value;
        const valor = item.querySelector('.item-total').value;
        const total = item.querySelector('.item-total').value;
        if (descricao) materiais.push({ descricao, qtd, valor: formatarMoeda(parseFloat(valor) || 0), total });
    });
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const htmlContent = montarHTMLPDFMateriais({ clienteNome, materiais, totalMateriais });
    printWindow.document.write(htmlContent);
    printWindow.document.close();
}

function montarHTMLPDF(dados) {
    let itensHtml = dados.itens.map((item, index) => `
        <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <span style="color: ${item.tipo === 'SERVIÇO' ? '#0dcaf0' : '#198754'}; font-size: 9px; font-weight: bold;">${item.tipo}</span><br>${escapeHtml(item.descricao)}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.qtd}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.valor}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">${item.total}</td>
        </tr>
    `).join('');

    let condicoesHtml = dados.condicoes.length > 0 ? `
        <div style="margin-top: 15px; padding: 10px; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
            <div style="font-weight: bold; color: #1976d2; margin-bottom: 5px; font-size: 12px;">CONDIÇÕES DE PAGAMENTO</div>
            <ul style="margin: 0; padding-left: 20px; font-size: 11px; line-height: 1.6;">
                ${dados.condicoes.map(c => `<li>${escapeHtml(c)}</li>`).join('')}
            </ul>
        </div>
    ` : '';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Orçamento - ${escapeHtml(dados.clienteNome)}</title>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.4; }
                @media print { body { -webkit-print-color-adjust: exact; } }
            </style>
        </head>
        <body>
            <div style="max-width: 700px; margin: 0 auto; border-top: 5px solid #0d6efd; padding-top: 20px;">
                <div style="overflow: hidden; margin-bottom: 20px;">
                    <div style="float: left;">
                        <h1 style="color: #0d6efd; margin: 0;">${escapeHtml(dadosPrestador.empresa)}</h1>
                        <p style="margin: 5px 0; color: #666;">Orçamento Técnico • Climatização</p>
                    </div>
                    <div style="float: right; text-align: right; font-size: 12px;">
                        <strong>Data:</strong> ${new Date(dados.dataOrcamento).toLocaleDateString('pt-BR')}<br>
                        <strong>Validade:</strong> ${dados.dataValidade.toLocaleDateString('pt-BR')}
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 13px;">
                    <strong>Cliente:</strong> ${escapeHtml(dados.clienteNome)}<br>
                    <strong>Contato:</strong> ${dados.clienteTelefone}<br>
                    <strong>Local:</strong> ${escapeHtml(dados.clienteEndereco)}
                </div>

                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background: #0d6efd; color: white;">
                            <th style="padding: 10px; border: 1px solid #0d6efd;">#</th>
                            <th style="padding: 10px; border: 1px solid #0d6efd; text-align: left;">Descrição Técnica</th>
                            <th style="padding: 10px; border: 1px solid #0d6efd;">Qtd</th>
                            <th style="padding: 10px; border: 1px solid #0d6efd; text-align: right;">Unit.</th>
                            <th style="padding: 10px; border: 1px solid #0d6efd; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>${itensHtml}</tbody>
                </table>

                <div style="background: #f1f1f1; padding: 15px; margin-top: 20px; border-radius: 8px; text-align: right;">
                    <div style="font-size: 12px; margin-bottom: 5px;">Subtotal Serviços: ${formatarMoeda(dados.totalServicos)}</div>
                    <div style="font-size: 12px; margin-bottom: 5px;">Subtotal Peças: ${formatarMoeda(dados.totalMateriais)}</div>
                    <div style="font-size: 18px; font-weight: bold; color: #0d6efd; margin-top: 10px; border-top: 1px solid #ccc; padding-top: 10px;">
                        TOTAL GERAL: ${formatarMoeda(dados.totalFinal)}
                    </div>
                </div>

                ${condicoesHtml}

                ${dados.observacoes ? `<div style="margin-top: 20px; font-size: 12px; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                    <strong>Observações:</strong><br>${escapeHtml(dados.observacoes)}
                </div>` : ''}

                <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #999;">
                    Este orçamento não tem valor fiscal. Gerado por ClimaPro Soluções.
                </div>
            </div>
            <script>window.onload = function() { window.print(); };</script>
        </body>
        </html>
    `;
}

function montarHTMLPDFMateriais(dados) {
    let materiaisHtml = dados.materiais.map((item, index) => `
        <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(item.descricao)}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.qtd}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.total}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Lista de Peças - ${escapeHtml(dados.clienteNome)}</title>
            <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial; padding: 20px;">
            <h2 style="color: #198754;">Lista de Peças e Insumos</h2>
            <p><strong>Cliente:</strong> ${escapeHtml(dados.clienteNome)}</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead><tr style="background: #198754; color: white;"><th style="padding: 10px;">#</th><th style="text-align: left;">Peça/Insumo</th><th>Qtd</th><th style="text-align: right;">Total</th></tr></thead>
                <tbody>${materiaisHtml}</tbody>
            </table>
            <div style="text-align: right; margin-top: 20px; font-weight: bold;">Total em Peças: ${formatarMoeda(dados.totalMateriais)}</div>
            <script>window.onload = function() { window.print(); };</script>
        </body>
        </html>
    `;
}

function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

function aplicarMascaras() {
    const telInput = document.getElementById('clienteTelefone');
    if (telInput) telInput.addEventListener('input', (e) => {
        let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
        e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });
}

function carregarDadosPrestador() {
    const salvos = localStorage.getItem('dadosPrestador');
    if (salvos) {
        dadosPrestador = JSON.parse(salvos);
        atualizarInterfacePrestador();
    }
}

function salvarDadosPrestador() {
    dadosPrestador = {
        empresa: document.getElementById('modalEmpresaNome').value,
        nome: document.getElementById('modalPrestadorNome').value,
        telefone: document.getElementById('modalPrestadorTelefone').value,
        documento: document.getElementById('modalPrestadorDoc').value,
        endereco: document.getElementById('modalPrestadorEndereco').value
    };
    localStorage.setItem('dadosPrestador', JSON.stringify(dadosPrestador));
    atualizarInterfacePrestador();
    modalPrestador.hide();
}

function atualizarInterfacePrestador() {
    const brand = document.querySelector('.brand-title');
    const nome = document.querySelector('.prestador-info .fw-semibold');
    const tel = document.querySelector('.prestador-info small');
    
    if (brand) brand.textContent = dadosPrestador.empresa;
    if (nome) nome.textContent = dadosPrestador.nome;
    if (tel) tel.innerHTML = `<i class="bi bi-telephone-fill me-1"></i>${dadosPrestador.telefone}`;
}

function editarPrestador() {
    document.getElementById('modalEmpresaNome').value = dadosPrestador.empresa;
    document.getElementById('modalPrestadorNome').value = dadosPrestador.nome;
    document.getElementById('modalPrestadorTelefone').value = dadosPrestador.telefone;
    document.getElementById('modalPrestadorDoc').value = dadosPrestador.documento;
    document.getElementById('modalPrestadorEndereco').value = dadosPrestador.endereco;
    modalPrestador.show();
}