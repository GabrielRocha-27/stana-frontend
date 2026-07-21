<template>
  <div class="caixa-layout">
    <!-- ── Header mobile ── -->
    <header class="header-mobile">
      <span class="header-titulo">🛒 Gestor Local</span>
      <button class="btn-sair-header" @click="sair">Sair</button>
    </header>

    <!-- ── Lado esquerdo: produtos ── -->
    <div class="produtos-panel">
      <div class="panel-header">
        <h2>Produtos</h2>
        <div class="filtros">
          <button
            v-for="tipo in tipos"
            :key="tipo.value"
            :class="['filtro-btn', { ativo: filtroAtivo === tipo.value }]"
            @click="filtrarPor(tipo.value)"
          >
            {{ tipo.label }}
          </button>
        </div>
      </div>

      <div v-if="carregando" class="estado-vazio">Carregando produtos...</div>
      <div v-else-if="produtosFiltrados.length === 0" class="estado-vazio">
        Nenhum produto encontrado.
      </div>

      <div class="grade-produtos">
        <div
          v-for="produto in produtosFiltrados"
          :key="produto.id"
          class="card-produto"
          @click="adicionarItem(produto)"
        >
          <div class="card-tipo">{{ traduzirTipo(produto.tipo) }}</div>
          <div class="card-nome">{{ produto.nome }}</div>
          <div class="card-marca">{{ produto.marca || "—" }}</div>
          <div class="card-preco">R$ {{ formatarPreco(produto.preco) }}</div>
          <div class="card-adicionar">+ Adicionar</div>
        </div>
      </div>
    </div>

    <!-- ── Carrinho mobile toggle ── -->
    <button
      class="btn-carrinho-mobile"
      @click="carrinhoAberto = !carrinhoAberto"
    >
      🛒 Ver carrinho ({{ carrinho.length }}) — R$ {{ formatarPreco(total) }}
    </button>

    <!-- ── Lado direito: carrinho ── -->
    <div :class="['carrinho-panel', { aberto: carrinhoAberto }]">
      <div class="panel-header">
        <h2>Venda atual</h2>
        <button class="btn-fechar-carrinho" @click="carrinhoAberto = false">
          ✕
        </button>
      </div>

      <div v-if="carrinho.length === 0" class="estado-vazio">
        Nenhum item adicionado.
      </div>

      <div class="carrinho-itens">
        <div
          v-for="item in carrinho"
          :key="item.produto.id"
          class="carrinho-item"
        >
          <div class="item-info">
            <span class="item-nome">{{ item.produto.nome }}</span>
            <span class="item-preco"
              >R$ {{ formatarPreco(item.produto.preco) }}</span
            >
          </div>
          <div class="item-controles">
            <button @click="diminuir(item)">−</button>
            <span>{{ item.quantidade }}</span>
            <button @click="aumentar(item)">+</button>
          </div>
          <div class="item-subtotal">
            R$ {{ formatarPreco(item.produto.preco * item.quantidade) }}
          </div>
        </div>
      </div>

      <div class="carrinho-rodape">
        <div class="total">
          <span>Total</span>
          <strong>R$ {{ formatarPreco(total) }}</strong>
        </div>

        <div class="campo-obs">
          <input
            v-model="observacao"
            placeholder="Observação (opcional)"
            class="input-obs"
          />
        </div>

        <button
          class="btn-registrar"
          :disabled="carrinho.length === 0 || registrando"
          @click="registrarVenda"
        >
          {{ registrando ? "Registrando..." : "Registrar Venda" }}
        </button>

        <button
          class="btn-limpar"
          :disabled="carrinho.length === 0"
          @click="limparCarrinho"
        >
          Limpar
        </button>

        <button class="btn-historico" @click="abrirHistorico">
          📋 Minhas vendas recentes
        </button>

        <button class="btn-sair-carrinho" @click="sair">Sair</button>
      </div>
    </div>

    <!-- ── Histórico de vendas ── -->
    <div :class="['historico-panel', { aberto: historicoAberto }]">
      <div class="historico-header">
        <span>Últimas vendas</span>
        <button @click="historicoAberto = false">✕</button>
      </div>
      <div v-if="ultimasVendas.length === 0" class="estado-vazio">
        Nenhuma venda recente.
      </div>
      <div
        v-for="venda in ultimasVendas"
        :key="venda.id"
        class="historico-item"
      >
        <div class="historico-info">
          <span>{{ formatarData(venda.criadoEm) }}</span>
          <span>R$ {{ formatarPreco(venda.total) }}</span>
        </div>
        <button class="btn-cancelar-venda" @click="cancelarVenda(venda.id)">
          Cancelar
        </button>
      </div>
    </div>

    <!-- ── Toast ── -->
    <div v-if="toast.visivel" :class="['toast', toast.tipo]">
      {{ toast.mensagem }}
    </div>
  </div>
</template>

<script>
import api from "@/service/api";

export default {
  name: "CaixaView",
  data() {
    return {
      produtos: [],
      carrinho: [],
      observacao: "",
      filtroAtivo: "TODOS",
      carregando: true,
      registrando: false,
      carrinhoAberto: false,
      historicoAberto: false,
      ultimasVendas: [],
      usuarioId: null,
      toast: { visivel: false, mensagem: "", tipo: "sucesso" },
      tipos: [
        { label: "Todos", value: "TODOS" },
        { label: "Salgados", value: "SALGADO" },
        { label: "Doces", value: "DOCE" },
        { label: "Bebidas", value: "BEBIDA" },
        { label: "Outros", value: "OUTRO" },
      ],
    };
  },
  computed: {
    produtosFiltrados() {
      if (this.filtroAtivo === "TODOS") return this.produtos;
      return this.produtos.filter((p) => p.tipo === this.filtroAtivo);
    },
    total() {
      return this.carrinho.reduce(
        (acc, item) => acc + item.produto.preco * item.quantidade,
        0
      );
    },
  },
  async mounted() {
    await this.carregarProdutos();
    await this.carregarUsuario();
  },
  methods: {
    async carregarProdutos() {
      try {
        const { data } = await api.get("/produtos");
        this.produtos = data;
      } catch (e) {
        this.mostrarToast("Erro ao carregar produtos", "erro");
      } finally {
        this.carregando = false;
      }
    },

    async carregarUsuario() {
      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
      if (usuario.id) {
        this.usuarioId = usuario.id;
      }
    },

    adicionarItem(produto) {
      const existente = this.carrinho.find((i) => i.produto.id === produto.id);
      if (existente) {
        existente.quantidade++;
      } else {
        this.carrinho.push({ produto, quantidade: 1 });
      }
    },

    aumentar(item) {
      item.quantidade++;
    },

    diminuir(item) {
      if (item.quantidade > 1) {
        item.quantidade--;
      } else {
        this.carrinho = this.carrinho.filter(
          (i) => i.produto.id !== item.produto.id
        );
      }
    },

    limparCarrinho() {
      this.carrinho = [];
      this.observacao = "";
    },

    filtrarPor(tipo) {
      this.filtroAtivo = tipo;
    },

    async registrarVenda() {
      if (!this.usuarioId) {
        this.mostrarToast("Usuário não identificado", "erro");
        return;
      }
      this.registrando = true;
      try {
        await api.post("/pedidos", {
          usuarioId: this.usuarioId,
          observacao: this.observacao,
          itens: this.carrinho.map((i) => ({
            produtoId: i.produto.id,
            quantidade: i.quantidade,
          })),
        });
        this.mostrarToast("Venda registrada com sucesso!", "sucesso");
        this.limparCarrinho();
        this.carrinhoAberto = false;
      } catch (e) {
        this.mostrarToast("Erro ao registrar venda", "erro");
      } finally {
        this.registrando = false;
      }
    },

    async abrirHistorico() {
      try {
        const { data } = await api.get(`/pedidos/usuario/${this.usuarioId}`);
        this.ultimasVendas = data
          .filter((p) => p.status !== "CANCELADO")
          .slice(-5)
          .reverse();
        this.historicoAberto = true;
        this.carrinhoAberto = false;
      } catch (e) {
        this.mostrarToast("Erro ao carregar vendas", "erro");
      }
    },

    async cancelarVenda(id) {
      if (!confirm("Deseja cancelar esta venda?")) return;
      try {
        await api.patch(`/pedidos/${id}/cancelar`);
        this.mostrarToast("Venda cancelada!", "sucesso");
        await this.abrirHistorico();
      } catch (e) {
        this.mostrarToast("Erro ao cancelar venda", "erro");
      }
    },

    sair() {
      localStorage.removeItem("usuario");
      this.$router.push("/");
    },

    formatarPreco(valor) {
      return Number(valor).toFixed(2).replace(".", ",");
    },

    formatarData(data) {
      if (!data) return "-";
      return new Date(data).toLocaleString("pt-BR");
    },

    traduzirTipo(tipo) {
      const map = {
        SALGADO: "Salgado",
        DOCE: "Doce",
        BEBIDA: "Bebida",
        OUTRO: "Outro",
      };
      return map[tipo] || tipo;
    },

    mostrarToast(mensagem, tipo = "sucesso") {
      this.toast = { visivel: true, mensagem, tipo };
      setTimeout(() => {
        this.toast.visivel = false;
      }, 3000);
    },
  },
};
</script>

<style scoped>
.caixa-layout {
  display: flex;
  height: 100vh;
  background: #0f1117;
  position: relative;
}

/* ── Header mobile ── */
.header-mobile {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: #13151f;
  border-bottom: 1px solid #2a2d3a;
  padding: 14px 16px;
  justify-content: space-between;
  align-items: center;
}

.header-titulo {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
}

.btn-sair-header {
  padding: 6px 14px;
  background: transparent;
  border: 1px solid #ef4444;
  border-radius: 8px;
  color: #ef4444;
  font-size: 13px;
  cursor: pointer;
}

/* ── Produtos ── */
.produtos-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #0f1117;
  border-right: 1px solid #2a2d3a;
  overflow: hidden;
}

.panel-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #2a2d3a;
}

.panel-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 12px;
}

.filtros {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filtro-btn {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid #2a2d3a;
  background: transparent;
  color: #9ca3af;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.filtro-btn:hover,
.filtro-btn.ativo {
  background: #6366f1;
  border-color: #6366f1;
  color: #ffffff;
}

.grade-produtos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 14px;
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.card-produto {
  background: #1a1d2e;
  border: 1px solid #2a2d3a;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-produto:hover {
  border-color: #6366f1;
  transform: translateY(-2px);
}

.card-tipo {
  font-size: 11px;
  color: #6366f1;
  font-weight: 600;
  text-transform: uppercase;
}

.card-nome {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.card-marca {
  font-size: 12px;
  color: #6b7280;
}

.card-preco {
  font-size: 16px;
  font-weight: 700;
  color: #10b981;
  margin-top: 4px;
}

.card-adicionar {
  font-size: 12px;
  color: #6366f1;
  margin-top: 6px;
  font-weight: 500;
}

/* ── Botão carrinho mobile ── */
.btn-carrinho-mobile {
  display: none;
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 40;
  padding: 14px 28px;
  background: #6366f1;
  color: #ffffff;
  border: none;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
  white-space: nowrap;
}

/* ── Carrinho ── */
.carrinho-panel {
  width: 340px;
  display: flex;
  flex-direction: column;
  background: #13151f;
  border-left: 1px solid #2a2d3a;
}

.btn-fechar-carrinho {
  display: none;
}

.carrinho-itens {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.carrinho-item {
  background: #1a1d2e;
  border: 1px solid #2a2d3a;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-nome {
  font-size: 13px;
  font-weight: 500;
  color: #e0e0e0;
}

.item-preco {
  font-size: 12px;
  color: #6b7280;
}

.item-controles {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-controles button {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #2a2d3a;
  background: #0f1117;
  color: #ffffff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.item-controles button:hover {
  background: #6366f1;
  border-color: #6366f1;
}

.item-controles span {
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  min-width: 20px;
  text-align: center;
}

.item-subtotal {
  font-size: 13px;
  font-weight: 600;
  color: #10b981;
  text-align: right;
}

.carrinho-rodape {
  padding: 16px;
  border-top: 1px solid #2a2d3a;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  color: #9ca3af;
}

.total strong {
  font-size: 22px;
  color: #10b981;
  font-weight: 700;
}

.input-obs {
  width: 100%;
  padding: 10px 14px;
  background: #1a1d2e;
  border: 1px solid #2a2d3a;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 13px;
  outline: none;
}

.input-obs:focus {
  border-color: #6366f1;
}

.input-obs::placeholder {
  color: #4b5563;
}

.btn-registrar {
  width: 100%;
  padding: 14px;
  background: #6366f1;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-registrar:hover:not(:disabled) {
  background: #4f46e5;
}

.btn-registrar:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-limpar {
  width: 100%;
  padding: 10px;
  background: transparent;
  color: #6b7280;
  border: 1px solid #2a2d3a;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-limpar:hover:not(:disabled) {
  border-color: #ef4444;
  color: #ef4444;
}

.btn-limpar:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-historico {
  width: 100%;
  padding: 10px;
  background: transparent;
  color: #6b7280;
  border: 1px solid #2a2d3a;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-historico:hover {
  border-color: #6366f1;
  color: #6366f1;
}

.btn-sair-carrinho {
  width: 100%;
  padding: 10px;
  background: transparent;
  color: #6b7280;
  border: 1px solid #2a2d3a;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sair-carrinho:hover {
  border-color: #ef4444;
  color: #ef4444;
}

/* ── Histórico de vendas ── */
.historico-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #13151f;
  border-top: 1px solid #2a2d3a;
  border-radius: 20px 20px 0 0;
  padding: 20px;
  z-index: 46;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 60vh;
  overflow-y: auto;
}

.historico-panel.aberto {
  transform: translateY(0);
}

.historico-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
}

.historico-header button {
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 18px;
  cursor: pointer;
}

.historico-item {
  background: #1a1d2e;
  border: 1px solid #2a2d3a;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.historico-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #9ca3af;
}

.btn-cancelar-venda {
  padding: 6px 14px;
  background: transparent;
  border: 1px solid #ef4444;
  border-radius: 8px;
  color: #ef4444;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancelar-venda:hover {
  background: #ef4444;
  color: #ffffff;
}

/* ── Toast ── */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  z-index: 999;
}

.toast.sucesso {
  background: #10b981;
  color: #ffffff;
}

.toast.erro {
  background: #ef4444;
  color: #ffffff;
}

.estado-vazio {
  padding: 40px 24px;
  text-align: center;
  color: #4b5563;
  font-size: 14px;
}

/* ── RESPONSIVO (celular) ── */
@media (max-width: 768px) {
  .caixa-layout {
    flex-direction: column;
  }

  .header-mobile {
    display: flex;
  }

  .produtos-panel {
    border-right: none;
    padding-top: 56px;
    height: 100vh;
  }

  .grade-produtos {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    padding: 16px;
    padding-bottom: 80px;
  }

  .btn-carrinho-mobile {
    display: block;
  }

  .carrinho-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 85vh;
    border-radius: 20px 20px 0 0;
    border-left: none;
    border-top: 1px solid #2a2d3a;
    transform: translateY(100%);
    transition: transform 0.3s ease;
    z-index: 45;
  }

  .carrinho-panel.aberto {
    transform: translateY(0);
  }

  .btn-fechar-carrinho {
    display: block;
    background: transparent;
    border: none;
    color: #6b7280;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .panel-header h2 {
    margin-bottom: 0;
  }
}
</style>
