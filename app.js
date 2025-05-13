// Funções de utilidade
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    const container = document.getElementById('toastContainer');
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Sistema de Banco de Dados Local
const DB = {
    save: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Erro ao salvar dados:', e);
            return false;
        }
    },
    
    get: function(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Erro ao recuperar dados:', e);
            return null;
        }
    },
    
    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Erro ao remover dados:', e);
            return false;
        }
    },
    
    clear: function() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('Erro ao limpar dados:', e);
            return false;
        }
    }
};

// Sistema de notificações
const Toast = {
    container: null,
    
    init: function() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    
    show: function(message, type = 'success') {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Ícone baseado no tipo
        const icon = document.createElement('i');
        icon.className = 'fas ' + (type === 'success' ? 'fa-check-circle' : 
                                 type === 'error' ? 'fa-exclamation-circle' : 
                                 'fa-exclamation-triangle');
        
        const text = document.createElement('span');
        text.textContent = message;
        
        toast.appendChild(icon);
        toast.appendChild(text);
        this.container.appendChild(toast);
        
        // Remove o toast após 3 segundos
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Inicialização da página
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = DB.get('currentUser');
    
    // Atualizar elementos da interface baseado no usuário logado
    if (currentUser) {
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(element => {
            if (element) {
                element.textContent = currentUser.nome;
            }
        });
    }
});

// Sistema de Triagem via Chatbot
const ChatBot = {
    initialized: false,
    currentQuestion: 0,
    respostas: {},
    sintomasAdicionais: [],
    perguntas: [
        {
            texto: "ATENÇÃO! Este sistema é apenas para triagem inicial e não substitui a avaliação médica presencial. Você está ciente e deseja continuar?",
            tipo: "confirmacao"
        },
        {
            texto: "Por favor, confirme seu nome completo.",
            tipo: "texto"
        },
        {
            texto: "Qual sua idade?",
            tipo: "numero"
        },
        {
            texto: "Você apresenta algum destes sintomas graves? (Selecione todos que se aplicam)",
            opcoes: [
                "Dor intensa no peito",
                "Falta de ar grave",
                "Perda de consciência",
                "Convulsão",
                "Sangramento intenso",
                "Trauma grave",
                "Queimadura extensa",
                "Nenhum dos acima"
            ]
        },
        {
            texto: "Como está sua respiração?",
            opcoes: [
                "Normal",
                "Levemente ofegante",
                "Muito ofegante",
                "Não consegue respirar"
            ]
        },
        {
            texto: "Como está seu nível de consciência?",
            opcoes: [
                "Alerta",
                "Sonolento",
                "Confuso",
                "Inconsciente"
            ]
        },
        {
            texto: "Você está sentindo dor?",
            opcoes: [
                "Sem dor",
                "Dor leve",
                "Dor moderada",
                "Dor intensa"
            ]
        },
        {
            texto: "Você apresenta algum destes sintomas? (Selecione todos que se aplicam)",
            opcoes: [
                "Febre",
                "Tosse",
                "Náusea ou vômito",
                "Diarreia",
                "Tontura",
                "Dor de cabeça",
                "Outro"
            ]
        }
    ],
    iniciar: function() {
        if (!this.initialized) {
            this.initialized = true;
            this.mostrarPergunta();
        }
    },
    mostrarPergunta: function() {
        const pergunta = this.perguntas[this.currentQuestion];
        const chatMessages = document.getElementById('chatMessages');
        const mensagem = document.createElement('div');
        mensagem.className = 'message bot-message';
        mensagem.innerHTML = pergunta.texto.replace(/\n/g, '<br>');
        chatMessages.appendChild(mensagem);
        if (pergunta.opcoes) {
            const opcoes = document.createElement('div');
            opcoes.className = 'opcoes';
            pergunta.opcoes.forEach(opcao => {
                const botao = document.createElement('button');
                botao.textContent = opcao;
                botao.onclick = () => this.processarResposta(opcao);
                opcoes.appendChild(botao);
            });
            chatMessages.appendChild(opcoes);
        }
    },
    processarResposta: function(resposta) {
        const pergunta = this.perguntas[this.currentQuestion];
        this.respostas[this.currentQuestion] = resposta;
        const chatMessages = document.getElementById('chatMessages');
        const mensagem = document.createElement('div');
        mensagem.className = 'message user-message';
        mensagem.textContent = resposta;
        chatMessages.appendChild(mensagem);
        this.currentQuestion++;
        if (this.currentQuestion < this.perguntas.length) {
            this.mostrarPergunta();
        } else {
            this.classificarRisco();
        }
    },
    classificarRisco: function() {
        const chatMessages = document.getElementById('chatMessages');
        const mensagem = document.createElement('div');
        mensagem.className = 'message bot-message';
        const nivel = this.calcularNivelRisco();
        mensagem.innerHTML = `Com base nas suas respostas, seu nível de risco é: <strong>${nivel}</strong>`;
        chatMessages.appendChild(mensagem);
    },
    calcularNivelRisco: function() {
        const respostas = this.respostas;
        // Critérios para Vermelho (Emergência)
        if (
            respostas[3] && (
                respostas[3].includes("Dor intensa no peito") ||
                respostas[3].includes("Falta de ar grave") ||
                respostas[3].includes("Perda de consciência") ||
                respostas[3].includes("Convulsão") ||
                respostas[3].includes("Sangramento intenso") ||
                respostas[3].includes("Trauma grave") ||
                respostas[3].includes("Queimadura extensa")
            ) ||
            respostas[4] === "Não consegue respirar" ||
            respostas[5] === "Inconsciente"
        ) {
            return "Vermelho";
        }
        // Critérios para Laranja (Muito Urgente)
        if (
            respostas[4] === "Muito ofegante" ||
            respostas[5] === "Confuso" ||
            respostas[6] === "Dor intensa" ||
            (respostas[7] && respostas[7].includes("Febre") && respostas[7].includes("Tosse"))
        ) {
            return "Laranja";
        }
        // Critérios para Amarelo (Urgente)
        if (
            respostas[4] === "Levemente ofegante" ||
            respostas[5] === "Sonolento" ||
            respostas[6] === "Dor moderada" ||
            (respostas[7] && (
                respostas[7].includes("Febre") ||
                respostas[7].includes("Náusea ou vômito") ||
                respostas[7].includes("Diarreia")
            ))
        ) {
            return "Amarelo";
        }
        // Critérios para Verde (Pouco Urgente)
        if (
            respostas[6] === "Dor leve" ||
            (respostas[7] && (
                respostas[7].includes("Tontura") ||
                respostas[7].includes("Dor de cabeça")
            ))
        ) {
            return "Verde";
        }
        // Critérios para Azul (Não Urgente)
        return "Azul";
    }
};

// Inicializar chatbot quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.endsWith('triagem.html')) {
        ChatBot.iniciar();
    }
});

// Funções de Validação
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Validação do CPF
    let soma = 0;
    let resto;
    
    if (cpf === '00000000000') return false;
    
    for (let i = 1; i <= 9; i++) {
        soma = soma + parseInt(cpf.substring(i-1, i)) * (11 - i);
    }
    
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    
    soma = 0;
    for (let i = 1; i <= 10; i++) {
        soma = soma + parseInt(cpf.substring(i-1, i)) * (12 - i);
    }
    
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Funções de UI
function showResetPassword() {
    showToast('Funcionalidade em desenvolvimento', 'info');
}

function showTerms() {
    showToast('Termos de uso em desenvolvimento', 'info');
}

// Verificar se usuário está logado
function checkLogin() {
    const currentUser = DB.get('currentUser');
    const currentPath = window.location.pathname;
    
    // Se não houver usuário logado e não estiver na página de login ou inicio, redireciona para login
    if (!currentUser && !currentPath.endsWith('index.html') && !currentPath.endsWith('inicio.html')) {
        window.location.replace('index.html');
        return false;
    }
    
    // Se houver usuário logado e estiver na página de login, redireciona para início
    if (currentUser && currentPath.endsWith('index.html')) {
        window.location.replace('inicio.html');
        return false;
    }
    
    return true;
}

// Função para navegação segura
function navigateTo(page) {
    const currentUser = DB.get('currentUser');
    const currentPath = window.location.pathname;

    // Permitir acesso livre à ajuda e à página inicial
    const publicPages = ['inicio', 'ajuda'];
    if (!currentUser && !publicPages.includes(page)) {
        window.location.replace('index.html');
        return;
    }

    // Se já estiver na página atual, não faz nada
    if (currentPath.endsWith(`${page}.html`)) {
        return;
    }

    // Navega para a página solicitada
    window.location.replace(`${page}.html`);
}

// Funções de utilidade e validação
const SecurityUtils = {
    // Contador de tentativas de login
    loginAttempts: {},
    
    // Validação de senha forte
    validatePassword: function(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const errors = [];
        if (password.length < minLength) errors.push('Mínimo de 8 caracteres');
        if (!hasUpperCase) errors.push('Uma letra maiúscula');
        if (!hasNumber) errors.push('Um número');
        if (!hasSpecialChar) errors.push('Um caractere especial');
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },
    
    // Validação de email
    validateEmail: function(email) {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return emailRegex.test(email);
    },
    
    // Hash da senha (simulado - em produção usar bcrypt ou similar)
    hashPassword: function(password) {
        // AVISO: Esta é uma implementação simplificada para demonstração
        // Em produção, use bcrypt ou outro algoritmo seguro
        return btoa(password + "salt_secreto");
    },
    
    // Verificar tentativas de login
    checkLoginAttempts: function(username) {
        if (!this.loginAttempts[username]) {
            this.loginAttempts[username] = {
                count: 0,
                lastAttempt: new Date()
            };
        }
        
        const attempts = this.loginAttempts[username];
        const now = new Date();
        const timeDiff = now - new Date(attempts.lastAttempt);
        
        // Reset após 30 minutos
        if (timeDiff > 30 * 60 * 1000) {
            attempts.count = 0;
        }
        
        // Bloquear após 5 tentativas
        if (attempts.count >= 5) {
            const waitTime = Math.ceil((30 * 60 * 1000 - timeDiff) / 60000);
            return {
                blocked: true,
                waitTime: waitTime
            };
        }
        
        return { blocked: false };
    },
    
    // Registrar tentativa de login
    recordLoginAttempt: function(username, success) {
        if (!this.loginAttempts[username]) {
            this.loginAttempts[username] = {
                count: 0,
                lastAttempt: new Date()
            };
        }
        
        if (success) {
            delete this.loginAttempts[username];
        } else {
            this.loginAttempts[username].count++;
            this.loginAttempts[username].lastAttempt = new Date();
        }
    },

    // Validação e formatação de CPF
    validateCPF: function(cpf) {
        cpf = cpf.replace(/[^\d]/g, '');
        
        if (cpf.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(cpf)) return false;
        
        let sum = 0;
        let remainder;
        
        for (let i = 1; i <= 9; i++) {
            sum = sum + parseInt(cpf.substring(i-1, i)) * (11 - i);
        }
        
        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cpf.substring(9, 10))) return false;
        
        sum = 0;
        for (let i = 1; i <= 10; i++) {
            sum = sum + parseInt(cpf.substring(i-1, i)) * (12 - i);
        }
        
        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cpf.substring(10, 11))) return false;
        
        return true;
    },

    formatCPF: function(cpf) {
        cpf = cpf.replace(/[^\d]/g, '');
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    },

    // Validação de data de nascimento
    validateBirthDate: function(date) {
        const birthDate = new Date(date);
        const today = new Date();
        const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
        
        // Verifica se é uma data válida
        if (isNaN(birthDate.getTime())) return false;
        
        // Verifica se está no intervalo permitido (entre hoje e 120 anos atrás)
        if (birthDate > today || birthDate < minDate) return false;
        
        return true;
    },

    // Calcula idade a partir da data de nascimento
    calculateAge: function(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }
};

// Validação em tempo real dos campos
document.addEventListener('DOMContentLoaded', function() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    const emailInputs = document.querySelectorAll('input[type="email"]');
    
    // Validação de senha em tempo real
    passwordInputs.forEach(input => {
        if (input.id === 'cadastroSenha') {
            const requirements = document.querySelector('.requirements-field');
            const reqItems = requirements.querySelectorAll('li');
            
            input.addEventListener('input', function() {
                const value = this.value;
                
                // Validar cada requisito
                const checks = {
                    length: value.length >= 8,
                    uppercase: /[A-Z]/.test(value),
                    number: /[0-9]/.test(value),
                    special: /[!@#$%^&*(),.?":{}|<>]/.test(value)
                };
                
                // Atualizar status dos requisitos
                reqItems.forEach((item, index) => {
                    const isValid = Object.values(checks)[index];
                    item.className = isValid ? 'valid' : '';
                    const icon = item.querySelector('i');
                    icon.className = isValid ? 'fas fa-check' : 'fas fa-circle';
                });
            });
        } else if (input.id === 'confirmSenha') {
            input.addEventListener('input', function() {
                const senha = document.getElementById('cadastroSenha').value;
                const confirmacao = this.value;
                const errorDiv = this.nextElementSibling.nextElementSibling;
                
                if (confirmacao && senha !== confirmacao) {
                    errorDiv.style.display = 'block';
                    errorDiv.textContent = 'As senhas não coincidem';
                } else {
                    errorDiv.style.display = 'none';
                }
            });
        }
    });
    
    // Validação de email em tempo real
    emailInputs.forEach(input => {
        input.addEventListener('input', function() {
            const isValid = SecurityUtils.validateEmail(this.value);
            const errorDiv = this.nextElementSibling.nextElementSibling;
            
            if (!isValid) {
                errorDiv.style.display = 'block';
                errorDiv.textContent = 'Email inválido';
                this.classList.add('invalid');
            } else {
                errorDiv.style.display = 'none';
                this.classList.remove('invalid');
            }
        });
    });

    // Formatação de CPF em tempo real
    const cpfInput = document.getElementById('cadastroCPF');
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = SecurityUtils.formatCPF(value);
                e.target.value = value;
            }
            
            const errorDiv = this.nextElementSibling.nextElementSibling;
            if (value.length === 14) { // Comprimento do CPF formatado
                if (!SecurityUtils.validateCPF(value)) {
                    errorDiv.style.display = 'block';
                    errorDiv.textContent = 'CPF inválido';
                    this.classList.add('invalid');
                } else {
                    errorDiv.style.display = 'none';
                    this.classList.remove('invalid');
                }
            }
        });
    }

    // Validação de data de nascimento
    const birthDateInput = document.getElementById('cadastroNascimento');
    if (birthDateInput) {
        birthDateInput.addEventListener('change', function() {
            const errorDiv = this.nextElementSibling.nextElementSibling;
            if (!SecurityUtils.validateBirthDate(this.value)) {
                errorDiv.style.display = 'block';
                errorDiv.textContent = 'Data de nascimento inválida';
                this.classList.add('invalid');
            } else {
                errorDiv.style.display = 'none';
                this.classList.remove('invalid');
            }
        });
    }
});

// Login com segurança aprimorada
function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Verificar campos vazios
    if (!username || !password) {
        showToast('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    // Verificar bloqueio por tentativas
    const loginStatus = SecurityUtils.checkLoginAttempts(username);
    if (loginStatus.blocked) {
        showToast(`Conta temporariamente bloqueada. Tente novamente em ${loginStatus.waitTime} minutos.`, 'error');
        return;
    }
    
    // Verificar dados salvos
    const userData = JSON.parse(localStorage.getItem('userData'));
    const hashedPassword = SecurityUtils.hashPassword(password);
    
    if (userData) {
        if ((username === userData.email || username === userData.cpf) && hashedPassword === userData.senha) {
            SecurityUtils.recordLoginAttempt(username, true);
            showToast('Login realizado com sucesso!', 'success');
            
            // Salvar todos os dados do usuário no currentUser
            DB.save('currentUser', {
                nome: userData.nome,
                email: userData.email,
                cpf: userData.cpf,
                dataNascimento: userData.nascimento,
                telefone: userData.telefone,
                idade: userData.idade
            });
            
            setTimeout(() => {
                window.location.replace('inicio.html');
            }, 1000);
            return;
        }
    }

    SecurityUtils.recordLoginAttempt(username, false);
    showToast('Usuário ou senha incorretos', 'error');
}

// Cadastro com validações aprimoradas
function handleCadastro() {
    const nome = document.getElementById('cadastroNome').value;
    const email = document.getElementById('cadastroEmail').value;
    const cpf = document.getElementById('cadastroCPF').value;
    const nascimento = document.getElementById('cadastroNascimento').value;
    const senha = document.getElementById('cadastroSenha').value;
    const confirmSenha = document.getElementById('confirmSenha').value;
    const termos = document.getElementById('termos').checked;
    const telefone = document.getElementById('cadastroTelefone').value;
    
    // Validação de campos obrigatórios
    if (!nome || !email || !cpf || !nascimento || !senha || !confirmSenha || !telefone) {
        showToast('Por favor, preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    // Validação de email
    if (!SecurityUtils.validateEmail(email)) {
        showToast('Email inválido', 'error');
        return;
    }
    
    // Validação de CPF
    if (!SecurityUtils.validateCPF(cpf)) {
        showToast('CPF inválido', 'error');
        return;
}

    // Validação de data de nascimento
    if (!SecurityUtils.validateBirthDate(nascimento)) {
        showToast('Data de nascimento inválida', 'error');
        return;
    }
    
    // Validação de senha forte
    const passwordValidation = SecurityUtils.validatePassword(senha);
    if (!passwordValidation.isValid) {
        showToast('A senha não atende aos requisitos mínimos de segurança', 'error');
        return;
    }
    
    // Confirmação de senha
    if (senha !== confirmSenha) {
        showToast('As senhas não coincidem', 'error');
        return;
    }
    
    // Verificação de termos
    if (!termos) {
        showToast('Você precisa aceitar os termos de uso', 'error');
        return;
    }
    
    // Verificar email e CPF duplicados
    const existingUser = JSON.parse(localStorage.getItem('userData'));
    if (existingUser) {
        if (existingUser.email === email) {
            showToast('Este email já está cadastrado', 'error');
            return;
        }
        if (existingUser.cpf === cpf) {
            showToast('Este CPF já está cadastrado', 'error');
            return;
        }
    }
    
    // Salvar dados do usuário
    const userData = {
        nome,
        email,
        cpf,
        nascimento,
        telefone,
        idade: SecurityUtils.calculateAge(nascimento),
        senha: SecurityUtils.hashPassword(senha),
        dataCadastro: new Date().toISOString()
    };
    
    // Salvar no localStorage
    localStorage.setItem('userData', JSON.stringify(userData));
    
        showToast('Conta criada com sucesso!', 'success');
    
    setTimeout(() => {
        switchTab('login');
    }, 1500);
}

// Função para limpar dados do login
function clearLoginData() {
    DB.remove('currentUser');
    DB.remove('userData');
}

// Função para converter tempo em minutos para milissegundos
function getWaitingTimeInMs(tempo) {
    const tempos = {
        'Atendimento Imediato': 0,
        'Até 10 minutos': 10 * 60 * 1000,
        'Até 60 minutos': 60 * 60 * 1000,
        'Até 120 minutos': 120 * 60 * 1000,
        'Até 240 minutos': 240 * 60 * 1000
    };
    return tempos[tempo] || 0;
}

// Função para formatar o tempo restante
function formatTimeRemaining(ms) {
    if (ms < 0) return '00:00:00';
    
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Função para iniciar o contador regressivo
function startCountdown(endTime) {
    const countdownElement = document.getElementById('countdown');
    if (!countdownElement) return;

    function updateCountdown() {
        const now = new Date().getTime();
        const timeLeft = endTime - now;

        if (timeLeft <= 0) {
            countdownElement.textContent = '00:00:00';
            countdownElement.classList.add('ending');
            return;
        }

        countdownElement.textContent = formatTimeRemaining(timeLeft);

        // Adiciona classe especial quando faltam 5 minutos
        if (timeLeft <= 5 * 60 * 1000) {
            countdownElement.classList.add('ending');
        }
    }

    // Atualiza a cada segundo
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    // Limpa o intervalo quando a página é fechada
    window.addEventListener('beforeunload', () => clearInterval(interval));
}

// Inicialização da página de resultado
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se estamos na página de resultado
    if (!window.location.pathname.endsWith('resultado.html')) return;

    const triagem = DB.get('ultimaTriagem');
    // Redirecionamento removido: agora a página resultado.html mostra mensagem amigável se não houver triagem.

    try {
        // Atualiza informações do paciente
        document.getElementById('nomePaciente').textContent = triagem.nome || 'Nome não informado';
        document.getElementById('dataTriagem').textContent = new Date(triagem.dataTriagem).toLocaleString();
        document.getElementById('idadePaciente').textContent = `${triagem.idade || 'N/A'} anos`;

        // Atualiza status e prioridade
        const statusSection = document.getElementById('statusBox');
        statusSection.className = `status-section ${triagem.resultado.nivel}`;
        
        const statusIcon = document.getElementById('statusIcon');
        statusIcon.className = `fas ${triagem.resultado.icon}`;
        
        document.getElementById('statusText').textContent = triagem.resultado.texto;
        document.getElementById('tempoEspera').textContent = triagem.resultado.tempo;

        // Iniciar contador regressivo
        const waitTime = getWaitingTimeInMs(triagem.resultado.tempo);
        const endTime = new Date(triagem.dataTriagem).getTime() + waitTime;
        startCountdown(endTime);

        // Atualiza lista de sintomas
        const sintomasLista = document.getElementById('sintomasLista');
        if (triagem.sintomas && triagem.sintomas.length > 0) {
            sintomasLista.innerHTML = triagem.sintomas
                .map(sintoma => `<div class="symptom-tag">${sintoma}</div>`)
                .join('');
        } else {
            sintomasLista.innerHTML = '<div class="symptom-tag">Nenhum sintoma relatado</div>';
        }

    } catch (error) {
        console.error('Erro ao carregar dados da triagem:', error);
        showToast('Erro ao carregar os dados. Tente novamente.', 'error');
    }
});

// Função para converter tempo de espera em milissegundos
function getWaitingTimeInMs(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
}

// Função para atualizar o contador regressivo
function startCountdown(endTime) {
    const countdownElement = document.getElementById('countdown');
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = endTime - now;

        if (distance <= 0) {
            countdownElement.textContent = '00:00';
            return;
        }

        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        
        countdownElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        
        setTimeout(updateCountdown, 1000);
    }

    updateCountdown();
}

// Função para alternar entre as abas
function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const cadastroForm = document.getElementById('cadastroForm');
    const loginTab = document.querySelector('.auth-tab:nth-child(1)');
    const cadastroTab = document.querySelector('.auth-tab:nth-child(2)');
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        cadastroForm.classList.remove('active');
        loginTab.classList.add('active');
        cadastroTab.classList.remove('active');
    } else {
        cadastroForm.classList.add('active');
        loginForm.classList.remove('active');
        cadastroTab.classList.add('active');
        loginTab.classList.remove('active');
    }
}

function loginWithGovBr() {
    window.location.href = 'https://www.gov.br/pt-br/';
}

function acceptDisclaimer() {
    document.getElementById('disclaimerModal').style.display = 'none';
    showToast('Aviso aceito', 'success');
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Mostrar a tela de login após 2 segundos
    setTimeout(() => {
        const splashScreen = document.getElementById('splashScreen');
        const mainContainer = document.getElementById('mainContainer');
        
        if (splashScreen) splashScreen.style.display = 'none';
        if (mainContainer) mainContainer.style.display = 'block';
    }, 2000);
    
    // Adicionar animações de entrada
    const authContainer = document.querySelector('.auth-container');
    if (authContainer) {
        authContainer.style.opacity = '0';
        authContainer.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            authContainer.style.transition = 'all 0.5s ease-out';
            authContainer.style.opacity = '1';
            authContainer.style.transform = 'translateY(0)';
        }, 100);
    }
});

// Gerenciamento de Tema
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Atualizar estado do toggle se existir na página
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'dark';
    }
}

function toggleTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = themeToggle ? (themeToggle.checked ? 'dark' : 'light') : 
        (document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    
    // Atualizar estado do toggle se existir
    if (themeToggle) {
        themeToggle.checked = currentTheme === 'dark';
    }
    
    // Mostrar feedback visual
    showToast(currentTheme === 'dark' ? 'Tema escuro ativado' : 'Tema claro ativado', 'success');
}

// Inicializar tema ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
});

function calculatePriority(userResponses) {
    // Determinar nível baseado nas respostas
    let level = 'verde'; // Default
    let text = 'Pouco Urgente';
    let icon = 'fa-check-circle';
    let time = '2-4 horas';

    // Verificar condições de emergência (Vermelho)
    if (
        userResponses.some(resp => [
            'Dor intensa no peito',
            'Falta de ar grave',
            'Perda de consciência',
            'Convulsão',
            'Sangramento intenso',
            'Trauma grave',
            'Queimadura extensa',
            'Não consigo respirar',
            'Grave - não consigo falar',
            'Grave - já desmaiei',
            'Grave - sangramento intenso'
        ].includes(resp))
    ) {
        level = 'vermelho';
        text = 'Emergência';
        icon = 'fa-radiation';
        time = 'Atendimento Imediato';
    }
    // Muito Urgente (Laranja)
    else if (
        userResponses.some(resp => [
            'Muito ofegante',
            'Confuso',
            'Dor intensa',
            'Moderada - falo com dificuldade',
            'Moderada - preciso sentar',
            'Moderado - sangramento contínuo',
            'Acima de 39.5°C'
        ].includes(resp))
    ) {
        level = 'laranja';
        text = 'Muito Urgente';
        icon = 'fa-exclamation-triangle';
        time = '30-60 minutos';
    }
    // Urgente (Amarelo)
    else if (
        userResponses.some(resp => [
            'Levemente ofegante',
            'Sonolento',
            'Dor moderada',
            '38.6°C - 39.5°C',
            'Vômito',
            'Alteração consciência'
        ].includes(resp))
    ) {
        level = 'amarelo';
        text = 'Urgente';
        icon = 'fa-exclamation-circle';
        time = '1-2 horas';
    }
    // Pouco Urgente (Verde)
    else if (
        userResponses.some(resp => [
            'Dor leve',
            'Leve - consigo falar normalmente',
            'Leve - consigo ficar em pé',
            'Leve - pequena quantidade',
            '37.6°C - 38.5°C',
            'Tontura',
            'Dor de cabeça'
        ].includes(resp))
    ) {
        level = 'verde';
        text = 'Pouco Urgente';
        icon = 'fa-check-circle';
        time = '2-4 horas';
    }
    // Não Urgente (Azul)
    else {
        level = 'azul';
        text = 'Não Urgente';
        icon = 'fa-info-circle';
        time = '4-6 horas';
    }

    // Ajustar tempo baseado em horário de pico
    const hora = new Date().getHours();
    const ehHorarioPico = (hora >= 8 && hora <= 11) || (hora >= 13 && hora <= 16);
    
    if (ehHorarioPico && level !== 'vermelho') {
        // Aumentar tempo de espera em horários de pico
        switch (level) {
            case 'laranja':
                time = '1-2 horas';
                break;
            case 'amarelo':
                time = '2-3 horas';
                break;
            case 'verde':
                time = '3-5 horas';
                break;
            case 'azul':
                time = '5-7 horas';
                break;
        }
    }

    // Gerar ID único para a triagem
    const triagemId = `TR${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    return {
        level,
        text,
        icon,
        time,
        triagemId
    };
}

function saveTriageResult(responses, priority) {
    const triageResult = {
        id: priority.triagemId,
        nome: responses[0],
        idade: responses[1],
        dataTriagem: new Date().toISOString(),
        sintomas: responses.slice(2),
        resultado: {
            nivel: priority.level,
            texto: priority.text,
            tempo: priority.time,
            icon: priority.icon
        },
        horarioPico: (new Date().getHours() >= 8 && new Date().getHours() <= 11) || 
                    (new Date().getHours() >= 13 && new Date().getHours() <= 16)
    };
    localStorage.setItem('ultimaTriagem', JSON.stringify(triageResult));
}