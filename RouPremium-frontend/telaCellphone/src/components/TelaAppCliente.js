import React, { useState, useEffect, useCallback } from 'react';
import './TelaAppCliente.css';

/**
 * COMPONENTE PRINCIPAL - TELA APP CLIENTE
 * 
 * Este é o componente principal que simula a tela do app do cliente.
 * Gerencia 3 estados principais:
 * 1. Boas-vindas - Quando cliente entra na loja
 * 2. Carrinho - Exibe itens adicionados e subtotal
 * 3. Recibo - Mostra resultado da compra finalizada
 */

// ========================================================================================
// SISTEMA DE EVENTOS PARA COMUNICAÇÃO EXTERNA
// ========================================================================================

/**
 * EventBus - Sistema para comunicação entre componentes não relacionados
 * Permite que a tela principal "escute" eventos externos como:
 * - cliente-entrou-loja
 * - item-adicionado
 * - cliente-pagou
 */
class EventBus {
  constructor() {
    this.events = {};
  }

  // Inscreve um callback para um evento específico
  subscribe(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);

    // Retorna função para cancelar a inscrição
    return () => {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    };
  }

  // Emite um evento para todos os inscritos
  emit(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => callback(data));
    }
  }
}

// Instância global do EventBus (simula comunicação externa)
const eventBus = new EventBus();

// ========================================================================================
// HOOK CUSTOMIZADO PARA EVENTOS
// ========================================================================================

/**
 * Hook useEvent - Facilita o uso do EventBus em componentes React
 * @param {string} eventName - Nome do evento para escutar
 * @param {function} callback - Função executada quando evento ocorre
 */
const useEvent = (eventName, callback) => {
  useEffect(() => {
    return eventBus.subscribe(eventName, callback);
  }, [eventName, callback]);
};

// ========================================================================================
// HOOK CUSTOMIZADO PARA CHAMADAS DE API
// ========================================================================================

/**
 * Hook useApiCall - Gerencia chamadas para API com estados de loading/erro
 */
const useApiCall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const makeRequest = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      // Se não conseguiu fazer a requisição, retorna dados simulados
      if (!response.ok) {
        throw new Error('API não disponível');
      }
      
      const text = await response.text();
      
      // Se retornou HTML ao invés de JSON, é porque a API não existe
      if (text.includes('<!DOCTYPE')) {
        throw new Error('API não disponível');
      }
      
      const data = JSON.parse(text);
      setLoading(false);
      return data;
      
    } catch (err) {
      setLoading(false);
      // NÃO define erro, apenas lança para ser capturado pela função que chamou
      throw new Error('API não disponível');
    }
  }, []);

  return { makeRequest, loading, error };
};

// ========================================================================================
// COMPONENTES REUTILIZÁVEIS
// ========================================================================================

/**
 * ScreenContainer - Container base para todas as telas
 * Proporciona layout consistente e responsivo
 */
const ScreenContainer = ({ children, className = "" }) => (
  <div className={`screen-container ${className}`}>
    {children}
  </div>
);

/**
 * ScreenHeader - Cabeçalho padrão das telas
 * @param {string} title - Título exibido no cabeçalho
 * @param {boolean} showBackButton - Se deve mostrar botão voltar
 * @param {ReactNode} actions - Elementos extras no cabeçalho
 */
const ScreenHeader = ({ title, showBackButton = false, actions, onBack }) => (
  <header className="screen-header">
    {showBackButton && (
      <button className="back-button" onClick={onBack}>
        ← Voltar
      </button>
    )}
    <h1 className="screen-title">{title}</h1>
    {actions && <div className="header-actions">{actions}</div>}
  </header>
);

/**
 * LoadingState - Componente para mostrar carregamento
 */
const LoadingState = ({ message = "Carregando..." }) => (
  <div className="loading-state">
    <div className="loading-spinner"></div>
    <p>{message}</p>
  </div>
);

/**
 * ErrorState - Componente para mostrar erros
 */
const ErrorState = ({ message, onRetry }) => (
  <div className="error-state">
    <h3>Ops! Algo deu errado</h3>
    <p>{message}</p>
    {onRetry && (
      <button className="retry-button" onClick={onRetry}>
        Tentar Novamente
      </button>
    )}
  </div>
);

/**
 * EmptyState - Componente para estado vazio
 */
const EmptyState = ({ title, message, action }) => (
  <div className="empty-state">
    <h3>{title}</h3>
    <p>{message}</p>
    {action}
  </div>
);

// ========================================================================================
// COMPONENTES DOS ESTADOS ESPECÍFICOS
// ========================================================================================

/**
 * BoasVindas - Primeiro estado, exibe mensagem de boas-vindas
 * @param {object} cliente - Dados do cliente (nome, id, etc)
 * @param {function} onContinuar - Callback para avançar para próximo estado
 */
const BoasVindas = ({ cliente, onContinuar }) => {
  const nomeCliente = cliente?.nome || 'Cliente';
  
  return (
    <ScreenContainer className="boas-vindas">
      <ScreenHeader 
        title="Bem-vindo!" 
        showBackButton={false}
      />
      
      <div className="welcome-content">
        <div className="welcome-icon">👋</div>
        <h2>Olá, {nomeCliente}!</h2>
        <p>Bem-vindo(a) à RouPremium!</p>
        <p>Comece a adicionar produtos ao seu carrinho para fazer suas compras.</p>
        
        {onContinuar && (
          <button 
            className="primary-button"
            onClick={onContinuar}
          >
            Começar Compras
          </button>
        )}
      </div>
    </ScreenContainer>
  );
};

/**
 * CarrinhoCompras - Segundo estado, exibe itens do carrinho
 * @param {object} carrinho - Objeto contendo itens e total
 * @param {boolean} loading - Se está carregando dados do carrinho
 * @param {function} onFinalizarCompra - Callback para finalizar compra
 */
const CarrinhoCompras = ({ carrinho, loading, onFinalizarCompra, onVoltar }) => {
  // Se não há itens, mostra estado vazio
  if (!loading && (!carrinho?.itens || carrinho.itens.length === 0)) {
    return (
      <ScreenContainer className="carrinho-compras">
        <ScreenHeader 
          title="Seu Carrinho" 
          showBackButton={true}
          onBack={onVoltar}
        />
        <EmptyState 
          title="Carrinho Vazio"
          message="Adicione produtos para começar suas compras!"
        />
      </ScreenContainer>
    );
  }

  // Calcula total baseado nos itens
  const calcularTotal = () => {
    if (!carrinho?.itens) return 0;
    return carrinho.itens.reduce((total, item) => {
      const preco = parseFloat(item.produto?.preco || 0);
      const quantidade = item.quantidade || 1;
      return total + (preco * quantidade);
    }, 0);
  };

  const total = calcularTotal();

  return (
    <ScreenContainer className="carrinho-compras">
      <ScreenHeader 
        title="Seu Carrinho" 
        showBackButton={true}
        onBack={onVoltar}
      />
      
      <div className="carrinho-content">
        {loading ? (
          <LoadingState message="Carregando carrinho..." />
        ) : (
          <>
            {/* Lista de itens do carrinho */}
            <div className="itens-carrinho">
              <h3>Itens ({carrinho.itens.length})</h3>
              
              {carrinho.itens.map((item, index) => (
                <div key={`item-${index}-${item.produto?.id || index}`} className="item-carrinho">
                  <div className="item-info">
                    <h4>{item.produto?.nome || 'Produto'}</h4>
                    <p className="item-preco">R$ {item.produto?.preco || '0.00'}</p>
                  </div>
                  <div className="item-quantidade">
                    <span>Qtd: {item.quantidade || 1}</span>
                  </div>
                  <div className="item-subtotal">
                    <strong>R$ {((parseFloat(item.produto?.preco || 0) * (item.quantidade || 1))).toFixed(2)}</strong>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo do pedido */}
            <div className="resumo-carrinho">
              <div className="linha-total">
                <span>Subtotal:</span>
                <strong>R$ {total.toFixed(2)}</strong>
              </div>
              
              <button 
                className="primary-button finalizar-button"
                onClick={onFinalizarCompra}
                disabled={loading}
              >
                {loading ? 'Processando...' : 'Finalizar Compra'}
              </button>
            </div>
          </>
        )}
      </div>
    </ScreenContainer>
  );
};

/**
 * Recibo - Terceiro estado, exibe recibo da compra finalizada
 * @param {object} dadosCompra - Dados da compra (id, data, valor, itens)
 * @param {function} onNovaCompra - Callback para iniciar nova compra
 */
const Recibo = ({ dadosCompra, onNovaCompra }) => {
  // Formata data para exibição
  const formatarData = (dataString) => {
    try {
      const data = new Date(dataString);
      return data.toLocaleString('pt-BR');
    } catch {
      return 'Data não disponível';
    }
  };

  return (
    <ScreenContainer className="recibo">
      <ScreenHeader 
        title="Recibo da Compra"
        showBackButton={false}
      />
      
      <div className="recibo-content">
        <div className="recibo-header">
          <div className="sucesso-icon">✅</div>
          <h2>Compra Realizada!</h2>
          <p>Obrigado por comprar na RouPremium</p>
        </div>

        {/* Detalhes da compra */}
        <div className="detalhes-compra">
          <div className="detalhe-linha">
            <span>Pedido #:</span>
            <strong>{dadosCompra?.id || 'N/A'}</strong>
          </div>
          
          <div className="detalhe-linha">
            <span>Data:</span>
            <strong>{formatarData(dadosCompra?.data)}</strong>
          </div>
          
          <div className="detalhe-linha total-linha">
            <span>Total Pago:</span>
            <strong>R$ {dadosCompra?.valorTotal || '0.00'}</strong>
          </div>
        </div>

        {/* Itens comprados */}
        {dadosCompra?.itensComprados && dadosCompra.itensComprados.length > 0 && (
          <div className="itens-comprados">
            <h3>Itens Comprados</h3>
            {dadosCompra.itensComprados.map((item, index) => (
              <div key={`comprado-${index}`} className="item-comprado">
                <span>{item.produto?.nome || 'Produto'}</span>
                <span>Qtd: {item.quantidade || 1}</span>
                <span>R$ {item.produto?.preco || '0.00'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Botão para nova compra */}
        <div className="recibo-acoes">
          <button 
            className="primary-button"
            onClick={onNovaCompra}
          >
            Fazer Nova Compra
          </button>
        </div>
      </div>
    </ScreenContainer>
  );
};

// ========================================================================================
// COMPONENTE PRINCIPAL
// ========================================================================================

/**
 * TelaAppCliente - Componente principal que gerencia todos os estados
 * 
 * Estados gerenciados:
 * - estadoAtual: 'boas-vindas' | 'carrinho' | 'recibo'
 * - dadosCliente: informações do cliente que entrou na loja
 * - carrinho: itens adicionados e totais
 * - dadosCompra: resultado da compra finalizada
 */
const TelaAppCliente = () => {
  // ========================================================================================
  // ESTADOS DO COMPONENTE
  // ========================================================================================
  
  // Estado principal - controla qual tela é exibida
  const [estadoAtual, setEstadoAtual] = useState('boas-vindas');
  
  // Estados específicos de cada funcionalidade
  const [dadosCliente, setDadosCliente] = useState(null);
  const [carrinho, setCarrinho] = useState({ itens: [] });
  const [dadosCompra, setDadosCompra] = useState(null);
  
  // Estados de interface para controle de loading/erro
  const [interfaceState, setInterfaceState] = useState({
    loading: false,
    error: null
  });

  // Hook para fazer chamadas de API
  const { makeRequest, loading: apiLoading, error: apiError } = useApiCall();

  // ========================================================================================
  // FUNÇÕES DE TRANSIÇÃO ENTRE ESTADOS
  // ========================================================================================

  /**
   * irParaCarrinho - Transiciona para o estado do carrinho
   */
  const irParaCarrinho = useCallback(() => {
    setEstadoAtual('carrinho');
  }, []);

  /**
   * voltarParaBoasVindas - Volta para o estado inicial
   */
  const voltarParaBoasVindas = useCallback(() => {
    setEstadoAtual('boas-vindas');
  }, []);

/**
 * buscarCarrinho - Faz chamada para API para obter itens do carrinho
 */
const buscarCarrinho = useCallback(async (clienteId) => {
  if (!clienteId) return;
  
  try {
    const dadosCarrinho = await makeRequest(`/api/carrinho/${clienteId}`);
    setCarrinho({ itens: dadosCarrinho || [] });
  } catch (error) {
    console.log('🔧 API não existe, usando dados simulados');
    
    // DADOS SIMULADOS (substitui a API que não existe)
    const dadosSimulados = [
      {
        produto: { nome: 'Camisa de Seda', preco: '799.90' },
        quantidade: 1
      },
      {
        produto: { nome: 'Calça Social', preco: '459.90' },
        quantidade: 2
      }
    ];
    
    setCarrinho({ itens: dadosSimulados });
  }
}, [makeRequest]);

const finalizarCompra = useCallback(async () => {
  if (!dadosCliente?.id) return;

  try {
    const resultado = await makeRequest('/api/simulacao/sair', {
      method: 'POST',
      body: JSON.stringify({ clienteId: dadosCliente.id })
    });

    setDadosCompra(resultado);
    setCarrinho({ itens: [] });
    setEstadoAtual('recibo');
  } catch (error) {
    console.log('🔧 API não existe, usando dados simulados');
    
    // DADOS SIMULADOS da compra
    const dadosSimulados = {
      id: 123,
      data: new Date().toISOString(),
      valorTotal: '1259.80',
      itensComprados: [
        {
          produto: { nome: 'Camisa de Seda', preco: '799.90' },
          quantidade: 1
        }
      ]
    };
    
    setDadosCompra(dadosSimulados);
    setCarrinho({ itens: [] });
    setEstadoAtual('recibo');
  }
}, [dadosCliente?.id, makeRequest]);

  /**
   * iniciarNovaCompra - Reinicia o processo para nova compra
   */
  const iniciarNovaCompra = useCallback(() => {
    setCarrinho({ itens: [] });
    setDadosCompra(null);
    setInterfaceState({ loading: false, error: null });
    setEstadoAtual('boas-vindas');
  }, []);

  // ========================================================================================
  // EVENT LISTENERS - ESCUTA EVENTOS EXTERNOS
  // ========================================================================================

  // Escuta evento de cliente entrando na loja
  useEvent('cliente-entrou-loja', useCallback((cliente) => {
    setDadosCliente(cliente);
    setEstadoAtual('boas-vindas');
    setInterfaceState({ loading: false, error: null });
  }, []));

  // Escuta evento de item sendo adicionado ao carrinho
  useEvent('item-adicionado', useCallback((dadosItem) => {
    // Atualiza carrinho local imediatamente para feedback visual
    setCarrinho(prev => ({
      itens: [...prev.itens, dadosItem]
    }));
    
    // Se estiver em boas-vindas, vai para carrinho automaticamente
    if (estadoAtual === 'boas-vindas') {
      setEstadoAtual('carrinho');
    }
    
    // Busca carrinho atualizado do servidor
    if (dadosCliente?.id) {
      buscarCarrinho(dadosCliente.id);
    }
  }, [estadoAtual, dadosCliente?.id, buscarCarrinho]));

  // ========================================================================================
  // EFEITOS DE SINCRONIZAÇÃO
  // ========================================================================================

  // Busca carrinho quando muda para estado carrinho
  useEffect(() => {
    if (estadoAtual === 'carrinho' && dadosCliente?.id) {
      buscarCarrinho(dadosCliente.id);
    }
  }, [estadoAtual, dadosCliente?.id, buscarCarrinho]);

  // ========================================================================================
  // RENDERIZAÇÃO DO COMPONENTE
  // ========================================================================================

  // Se há erro de API, mostra estado de erro
  if (apiError && !apiLoading) {
    return (
      <ScreenContainer>
        <ErrorState 
          message={apiError} 
          onRetry={() => window.location.reload()}
        />
      </ScreenContainer>
    );
  }

  // Renderização condicional baseada no estado atual
  switch (estadoAtual) {
    case 'boas-vindas':
      return (
        <BoasVindas 
          cliente={dadosCliente}
          onContinuar={irParaCarrinho}
        />
      );
      
    case 'carrinho':
      return (
        <CarrinhoCompras 
          carrinho={carrinho}
          loading={apiLoading}
          onFinalizarCompra={finalizarCompra}
          onVoltar={voltarParaBoasVindas}
        />
      );
      
    case 'recibo':
      return (
        <Recibo 
          dadosCompra={dadosCompra}
          onNovaCompra={iniciarNovaCompra}
        />
      );
      
    default:
      return (
        <ScreenContainer>
          <ErrorState 
            message="Estado inválido da aplicação"
            onRetry={() => setEstadoAtual('boas-vindas')}
          />
        </ScreenContainer>
      );
  }
};

// ========================================================================================
// EXPORTAÇÃO E SIMULAÇÃO DE EVENTOS EXTERNOS
// ========================================================================================

// Função para simular eventos externos (para teste)
// IMPORTANTE: Esta função seria chamada pela tela principal da simulação
window.simularEventoExterno = {
  clienteEntrou: (cliente) => eventBus.emit('cliente-entrou-loja', cliente),
  itemAdicionado: (item) => eventBus.emit('item-adicionado', item),
  clientePagou: (dados) => eventBus.emit('cliente-pagou', dados)
};

// Componente de exemplo/teste
const ExemploUso = () => {
  const testarEventos = () => {
    // Simula cliente entrando
    window.simularEventoExterno.clienteEntrou({
      id: 1,
      nome: 'João Silva'
    });
    
    // Simula adição de item após 2 segundos
    setTimeout(() => {
      window.simularEventoExterno.itemAdicionado({
        produto: {
          id: 101,
          nome: 'Camisa de Seda',
          preco: '799.90'
        },
        quantidade: 1
      });
    }, 2000);
  };

  return (
    <div className="app-completo">
      <div className="controles-teste">
        <button onClick={testarEventos}>
          🧪 Testar Eventos
        </button>
      </div>
      
      <div className="simulacao-telefone">
        <TelaAppCliente />
      </div>
    </div>
  );
};

export default ExemploUso;