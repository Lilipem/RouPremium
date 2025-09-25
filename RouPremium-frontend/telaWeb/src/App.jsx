import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const carrinhosPredefinidos = {
  1: [2, 2, 5], // Cliente 1 (Moisés) pega os produtos calça e jaqueta
  2: [3, 5], // Cliente 2 (Gabi) pega os produtos bermuda cargo e jaqueta
  3: [1, 2], // Cliente 3 (Liliana) pega os produtos camisa de seda e calça
  4: [2, 4], // Cliente 4 (Luis) pega os produtos calça e camisa polo
  5: [1, 1, 3], // Cliente 5 (Pedro) pega os produtos camisa de seda e bermuda cargo
};

export default function App() {
  // --- Estados do Componente ---

  const [clientesApi, setClientesApi] = useState([]);
  const [produtosApi, setProdutosApi] = useState([]);
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState('');

  const [logMessages, setLogMessages] = useState([]);
  const [clientPosition, setClientPosition] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Busca clientes e produtos em paralelo para otimizar
        const [clientesResponse, produtosResponse] = await Promise.all([
          axios.get(`${API_URL}/clientes`),
          axios.get(`${API_URL}/produtos`)
        ]);
        
        setClientesApi(clientesResponse.data);
        setProdutosApi(produtosResponse.data);

        if (clientesResponse.data.length > 0) {
          setClienteSelecionadoId(clientesResponse.data[0].id);
        }
      } catch (error) {
        const errorMsg = "Erro ao carregar dados iniciais da API.";
        setLogMessages(prev => [errorMsg, ...prev]);
        console.error(errorMsg, error);
      }
    };

    fetchData();
  }, []);

  // --- Funções de Evento (Handlers) ---

  const handleEnter = async () => {
    if (!clienteSelecionadoId) return;
    try {
      const response = await axios.post(`${API_URL}/simulacao/entrar`, {
        clienteId: parseInt(clienteSelecionadoId),
      });
      setLogMessages(prev => [response.data.mensagem, ...prev]);
      setClientPosition('entry');
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Erro ao entrar na loja.';
      setLogMessages(prev => [errorMsg, ...prev]);
      console.error(errorMsg, error);
    }
  };

  const handlePickup = async () => {
    if (!clienteSelecionadoId) return;
    const produtosParaAdicionar = carrinhosPredefinidos[clienteSelecionadoId];
    if (!produtosParaAdicionar || produtosParaAdicionar.length === 0) {
      setLogMessages(prev => [`Não há produtos predefinidos para este cliente.`, ...prev]);
      return;
    }
    setClientPosition('rack');
    setLogMessages(prev => [`Cliente ${clienteSelecionadoId} está pegando ${produtosParaAdicionar.length} produtos...`, ...prev]);
    try {
      for (const produtoId of produtosParaAdicionar) {
        await axios.post(`${API_URL}/carrinho/adicionar`, {
          clienteId: parseInt(clienteSelecionadoId),
          produtoId: produtoId,
        });
      }
      setLogMessages(prev => [`Produtos adicionados ao carrinho com sucesso!`, ...prev]);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Erro ao adicionar produtos.';
      setLogMessages(prev => [errorMsg, ...prev]);
      console.error(errorMsg, error);
    }
  };

  const handleExit = async () => {
    if (!clienteSelecionadoId) return;
    try {
      const response = await axios.post(`${API_URL}/simulacao/sair`, {
        clienteId: parseInt(clienteSelecionadoId),
      });
      const compra = response.data;
      const mensagem = `Compra finalizada! Valor total: R$ ${compra.valorTotal}. Recibo ID: ${compra.id}.`;
      setLogMessages(prev => [mensagem, ...prev]);
      setClientPosition('exit');
      
      setTimeout(() => {
        setClientPosition(null);
        setTooltip(prev => ({ ...prev, visible: false }));
      }, 1600);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Erro ao sair da loja.';
      setLogMessages(prev => [errorMsg, ...prev]);
      console.error(errorMsg, error);
    }
  };
  
  const handleClienteChange = (event) => {
    setLogMessages([]);
    setClientPosition(null);
    setTooltip(prev => ({ ...prev, visible: false }));
    setClienteSelecionadoId(event.target.value);
  };

  const handleClientMouseEnter = async (event) => {
    if (!clienteSelecionadoId) return;
    try {
      const response = await axios.get(`${API_URL}/carrinho/${clienteSelecionadoId}`);
      const carrinhoItens = response.data;
      let produtoList = 'Nenhum produto pego.';
      if (carrinhoItens.length > 0) {
        produtoList = carrinhoItens.map(item => `${item.produto.nome} (Qtd: ${item.quantidade})`).join('\n');
      }
      
      const clienteAtual = clientesApi.find(c => c.id == clienteSelecionadoId);
      const content = `Cliente: ${clienteAtual?.nome}\n---\nProdutos no Carrinho:\n${produtoList}`;
      
      const element = event.target;
      const rect = element.getBoundingClientRect();
      let tooltipX;
      
      if (clientPosition === 'exit') {
        tooltipX = rect.left + window.scrollX - 170;
      } else {
        tooltipX = rect.right + window.scrollX + 10;
      }
      
      setTooltip({ visible: true, content, x: tooltipX, y: rect.top + window.scrollY });
    } catch (error) {
      console.error("Erro ao buscar carrinho para o tooltip:", error);
    }
  };

  // NOVO: Função para quando o mouse entra na arara de produtos
  const handleRackMouseEnter = (event) => {
    let content = 'Carregando produtos...';
    if (produtosApi.length > 0) {
      // Formata a lista de produtos para exibição
      const productList = produtosApi.map(p => `${p.nome} - R$ ${p.preco}`).join('\n');
      content = `Produtos Disponíveis:\n---\n${productList}`;
    }

    const element = event.target;
    const rect = element.getBoundingClientRect();

    // Posiciona o tooltip acima da arara
    const tooltipX = rect.left + (rect.width / 2) + window.scrollX;
    const tooltipY = rect.top + window.scrollY - 10;

    setTooltip({ visible: true, content, x: tooltipX, y: tooltipY });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const getBallPositionStyle = () => {
    switch (clientPosition) {
      case 'entry': return styles.ballEntry;
      case 'rack': return styles.ballRack;
      case 'exit': return styles.ballExit;
      default: return {};
    }
  };

  // --- Renderização do Componente (JSX) ---
  return (
    <div style={styles.container}>
      <div style={styles.mapArea}>
        <div style={styles.mapContent}>
          <div style={styles.entryExit}>Entrada</div>
          {clientPosition && 
            <div 
              style={{...styles.ball, ...getBallPositionStyle()}}
              onMouseEnter={handleClientMouseEnter}
              onMouseLeave={handleMouseLeave}
            ></div>
          }
          {/* MODIFICADO: Adicionado os eventos de mouse na div da arara */}
          <div 
            style={styles.productRack}
            onMouseEnter={handleRackMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            Arara de produtos
          </div>
          <div style={styles.entryExit}>Saída</div>
          {tooltip.visible && (
            <div style={{ ...styles.tooltip, top: tooltip.y, left: tooltip.x }}>
              {tooltip.content.split('\n').map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={styles.sidebar}>
        <div style={styles.buttonGroup}>
          <button style={styles.buttonPrimary} onClick={handleEnter}>1. Entrar na loja</button>
        </div>
        <div style={styles.buttonGroup}>
          <button style={styles.button} onClick={handlePickup}>2. Pegar produtos (Auto)</button>
        </div>
        <div style={styles.buttonGroup}>
          <button style={styles.buttonPrimary} onClick={handleExit}>3. Sair da loja</button>
        </div>

        <div style={{ margin: "20px 0" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Selecione um cliente</label>
          <select style={styles.select} value={clienteSelecionadoId} onChange={handleClienteChange}>
            {clientesApi.length === 0 && <option>Carregando clientes...</option>}
            {clientesApi.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.infoBox}>
          <h3 style={{ marginBottom: "10px" }}>Log de Eventos</h3>
          {logMessages.map((message, index) => (
            <p key={index}>{message}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// Estilos
const styles = {
  container: {
    display: "flex",
    flexDirection: "row",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#1e1e2f",
    color: "#fff",
    gap: "20px",
    padding: "20px",
    boxSizing: "border-box",
  },
  mapArea: {
    flex: 3,
    backgroundColor: "#fff",
    borderRadius: "10px",
    margin: "25px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  mapContent: {
    position: 'relative',
    display: "flex",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
    padding: "0 50px",
    boxSizing: "border-box",
  },
  entryExit: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#555",
    alignSelf: "flex-start",
  },
  productRack: {
    width: "200px",
    height: "100px",
    backgroundColor: "#ccc",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#000",
    fontWeight: "bold",
    textAlign: "center",
    padding: "10px",
    boxSizing: "border-box",
    cursor: 'pointer'
  },
  sidebar: {
    flex: 1,
    backgroundColor: "#2b2b3d",
    borderRadius: "10px",
    margin: "10px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    marginBottom: "15px",
  },
  button: {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#3a3a4f",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  },
  buttonPrimary: {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#c4362fff",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  },
  select: {
    width: "100%",
    padding: "8px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#3a3a4f",
    color: "#fff",
  },
  infoBox: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "#1e1e2f",
    borderRadius: "8px",
    fontSize: "14px",
    maxHeight: '400px',
    overflowY: 'auto'
  },
  ball: {
    position: 'absolute',
    width: '15px',
    height: '15px',
    backgroundColor: '#ff4d4d',
    borderRadius: '50%',
    top: '75px',
  },
  ballEntry: {
    left: '50px',
  },
  ballRack: {
    top: '190px',
    left: 'calc(50% - 7.5px)',
  },
  ballExit: {
    right: '50px',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#fff',
    padding: '8px',
    borderRadius: '5px',
    zIndex: 1000,
    whiteSpace: 'pre-wrap',
    pointerEvents: 'none',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    fontSize: '12px',
    transform: 'translate(-50%, -100%)',
    maxWidth: '250px',
    overflowY: 'auto'
  },
};
