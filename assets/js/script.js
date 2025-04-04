// ================ CONFIGURAÇÃO INICIAL ================
const app = {
    // Elementos da interface
    ui: {
        installButton: document.getElementById('installButton'),
        status: document.getElementById('status'),
        offlineMessage: document.getElementById('offlineMessage'),
        content: document.getElementById('content')
    },

    // Dados do aplicativo
    data: {
        deferredPrompt: null,
        isOnline: navigator.onLine
    },

    // Inicialização do app
    init() {
        this.setupEventListeners();
        this.checkNetworkStatus();
        this.registerServiceWorker();
        this.loadContent();
    },

    // ================ SERVICE WORKER ================
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registrado com sucesso:', registration.scope);
                    this.updateStatus('Service Worker registrado');
                })
                .catch(error => {
                    console.error('Falha ao registrar ServiceWorker:', error);
                    this.updateStatus('Erro no Service Worker');
                });
        } else {
            this.updateStatus('Service Worker não suportado');
        }
    },

    // ================ INSTALAÇÃO DO PWA ================
    setupEventListeners() {
        // Evento para instalação do PWA
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.data.deferredPrompt = e;
            this.ui.installButton.style.display = 'block';
            this.updateStatus('Pronto para instalar');
        });

        // Botão de instalação
        this.ui.installButton.addEventListener('click', () => {
            if (this.data.deferredPrompt) {
                this.data.deferredPrompt.prompt();
                this.data.deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        this.updateStatus('PWA instalado com sucesso!');
                    } else {
                        this.updateStatus('Instalação cancelada');
                    }
                    this.data.deferredPrompt = null;
                    this.ui.installButton.style.display = 'none';
                });
            }
        });

        // Monitoramento de conexão
        window.addEventListener('online', () => this.handleNetworkChange(true));
        window.addEventListener('offline', () => this.handleNetworkChange(false));
    },

    // ================ GERENCIAMENTO DE REDE ================
    checkNetworkStatus() {
        if (!this.data.isOnline) {
            this.showOfflineMessage();
        }
    },

    handleNetworkChange(online) {
        this.data.isOnline = online;
        if (online) {
            this.hideOfflineMessage();
            this.updateStatus('Conectado');
            this.loadContent();
        } else {
            this.showOfflineMessage();
            this.updateStatus('Você está offline');
        }
    },

    showOfflineMessage() {
        this.ui.offlineMessage.style.display = 'block';
    },

    hideOfflineMessage() {
        this.ui.offlineMessage.style.display = 'none';
    },

    // ================ FUNCIONALIDADES DO APP ================
    loadContent() {
        if (this.data.isOnline) {
            // Carrega conteúdo da API
            fetch('https://api.example.com/data')
                .then(response => response.json())
                .then(data => {
                    this.displayContent(data);
                    this.saveForOffline(data);
                })
                .catch(() => {
                    this.loadOfflineContent();
                });
        } else {
            this.loadOfflineContent();
        }
    },

    displayContent(data) {
        // Exemplo: exibe dados na interface
        this.ui.content.innerHTML = data.map(item => 
            `<div class="item">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
            </div>`
        ).join('');
    },

    saveForOffline(data) {
        // Salva no IndexedDB para uso offline
        if ('indexedDB' in window) {
            const request = indexedDB.open('pwaData', 1);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('content')) {
                    db.createObjectStore('content', { keyPath: 'id' });
                }
            };
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction('content', 'readwrite');
                const store = transaction.objectStore('content');
                
                data.forEach(item => {
                    store.put(item);
                });
            };
        }
    },

    loadOfflineContent() {
        // Carrega dados do cache quando offline
        if ('indexedDB' in window) {
            const request = indexedDB.open('pwaData', 1);
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction('content', 'readonly');
                const store = transaction.objectStore('content');
                const getAllRequest = store.getAll();
                
                getAllRequest.onsuccess = () => {
                    if (getAllRequest.result.length > 0) {
                        this.displayContent(getAllRequest.result);
                        this.updateStatus('Dados carregados do cache offline');
                    } else {
                        this.ui.content.innerHTML = '<p>Nenhum dado disponível offline</p>';
                    }
                };
            };
        } else {
            this.ui.content.innerHTML = '<p>Armazenamento offline não disponível</p>';
        }
    },

    // ================ UTILITÁRIOS ================
    updateStatus(message) {
        this.ui.status.textContent = message;
        console.log(message);
    }
};

// Inicia o aplicativo quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => app.init());
