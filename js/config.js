// Arquivo de Configuração de Segurança (Simulando .env)
// Este arquivo armazena a "impressão digital" (Hash) da senha.
// Mesmo que alguém abra este arquivo, não conseguirá ler a senha original.

const _CONFIG = {
    // A senha padrão definida é: 1234
    // Se você quiser mudar a senha, precisará gerar um novo Hash SHA-256.
    access_key: "8472a224d7ea96d50aacb1c13cbd489e5eb1fa95371454743a62c18a84b69b97"
};

// Congela o objeto para impedir alterações via console do navegador
Object.freeze(_CONFIG);
