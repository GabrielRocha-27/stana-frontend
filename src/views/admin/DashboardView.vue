<template>
  <div class="dashboard">
    <h1 class="titulo">Dashboard</h1>

    <!-- ── Cards de resumo ── -->
    <div class="cards-resumo">
      <div class="card">
        <div class="card-label">Total de Vendas</div>
        <div class="card-valor">{{ totalVendas }}</div>
      </div>
      <div class="card">
        <div class="card-label">Receita Total</div>
        <div class="card-valor">R$ {{ formatarPreco(receitaTotal) }}</div>
      </div>
      <div class="card">
        <div class="card-label">Produtos Ativos</div>
        <div class="card-valor">{{ totalProdutos }}</div>
      </div>
      <div class="card">
        <div class="card-label">Usuários Caixa</div>
        <div class="card-valor">{{ totalUsuariosCaixa }}</div>
      </div>
    </div>

    <!-- ── Filtros ── -->
    <div class="filtros-section">
      <h2>Vendas Registradas</h2>
      <div class="filtros">
        <input
          v-model="filtroInicio"
          type="date"
          class="input-filtro"
          @change="filtrar"
        />
        <input
          v-model="filtroFim"
          type="date"
          class="input-filtro"
          @change="filtrar"
        />
        <button class="btn-limpar-filtro" @click="limparFiltros">
          Limpar filtros
        </button>
      </div>
    </div>

    <!-- ── Tabela de vendas ── -->
    <div class="tabela-wrapper">
      <div v-if="carregando" class="estado-vazio">Carregando...</div>
      <div v-else-if="pedidos.length === 0" class="estado-vazio">
        Nenhuma venda encontrada.
      </div>
      <table v-else class="tabela">
        <thead>
          <tr>
            <th>Data</th>
            <th>Usuário</th>
            <th>Itens</th>
            <th>Total</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pedido in pedidos" :key="pedido.id">
            <td>{{ formatarData(pedido.criadoEm) }}</td>
            <td>{{ pedido.nomeUsuario }}</td>
            <td>{{ pedido.quantidadeItens }} item(s)</td>
            <td>R$ {{ formatarPreco(pedido.total) }}</td>
            <td>
              <span :class="['badge', pedido.status.toLowerCase()]">
                {{ pedido.status }}
              </span>
            </td>
            <td>
              <button
                v-if="pedido.status !== 'CANCELADO'"
                class="btn-cancelar"
                @click="cancelar(pedido.id)"
              >
                Cancelar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import api from "@/service/api";

export default {
  name: "DashboardView",
  data() {
    return {
      pedidos: [],
      produtos: [],
      usuarios: [],
      carregando: true,
      filtroInicio: "",
      filtroFim: "",
    };
  },
  computed: {
    totalVendas() {
      return this.pedidos.filter((p) => p.status !== "CANCELADO").length;
    },
    receitaTotal() {
      return this.pedidos
        .filter((p) => p.status !== "CANCELADO")
        .reduce((acc, p) => acc + Number(p.total), 0);
    },
    totalProdutos() {
      return this.produtos.filter((p) => p.ativo).length;
    },
    // ← corrigido: filtra só quem tem role USUARIO
    totalUsuariosCaixa() {
      return this.usuarios.filter((u) => u.role === "USUARIO").length;
    },
  },
  async mounted() {
    await this.carregarDados();
  },
  methods: {
    async carregarDados() {
      this.carregando = true;
      try {
        const [pedidosRes, produtosRes, usuariosRes] = await Promise.all([
          api.get("/pedidos"),
          api.get("/produtos"),
          api.get("/usuarios"),
        ]);
        this.pedidos = pedidosRes.data;
        this.produtos = produtosRes.data;
        this.usuarios = usuariosRes.data;
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      } finally {
        this.carregando = false;
      }
    },

    async filtrar() {
      if (!this.filtroInicio || !this.filtroFim) return;
      this.carregando = true;
      try {
        const { data } = await api.get("/pedidos/periodo", {
          params: {
            inicio: this.filtroInicio + "T00:00:00",
            fim: this.filtroFim + "T23:59:59",
          },
        });
        this.pedidos = data;
      } catch (e) {
        console.error("Erro ao filtrar", e);
      } finally {
        this.carregando = false;
      }
    },

    async limparFiltros() {
      this.filtroInicio = "";
      this.filtroFim = "";
      await this.carregarDados();
    },

    async cancelar(id) {
      if (!confirm("Deseja cancelar esta venda?")) return;
      try {
        await api.patch(`/pedidos/${id}/cancelar`);
        await this.carregarDados();
      } catch (e) {
        console.error("Erro ao cancelar", e);
      }
    },

    formatarPreco(valor) {
      return Number(valor || 0)
        .toFixed(2)
        .replace(".", ",");
    },

    formatarData(data) {
      if (!data) return "-";
      return new Date(data).toLocaleString("pt-BR");
    },
  },
};
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.titulo {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
}

.cards-resumo {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.card {
  background: #1a1d2e;
  border: 1px solid #2a2d3a;
  border-radius: 12px;
  padding: 20px;
}

.card-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}
.card-valor {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
}

.filtros-section h2 {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 14px;
}
.filtros {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.input-filtro {
  padding: 9px 14px;
  background: #1a1d2e;
  border: 1px solid #2a2d3a;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 13px;
  outline: none;
}
.input-filtro:focus {
  border-color: #6366f1;
}

.btn-limpar-filtro {
  padding: 9px 16px;
  background: transparent;
  border: 1px solid #2a2d3a;
  border-radius: 8px;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-limpar-filtro:hover {
  border-color: #6366f1;
  color: #6366f1;
}

.tabela-wrapper {
  background: #1a1d2e;
  border: 1px solid #2a2d3a;
  border-radius: 12px;
  overflow: hidden;
}

.tabela {
  width: 100%;
  border-collapse: collapse;
}
.tabela th {
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #2a2d3a;
  background: #13151f;
}
.tabela td {
  padding: 12px 16px;
  font-size: 13px;
  color: #e0e0e0;
  border-bottom: 1px solid #1e2130;
}
.tabela tr:last-child td {
  border-bottom: none;
}
.tabela tbody tr:hover {
  background: #1e2130;
}

.badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}
.badge.finalizado {
  background: #064e3b;
  color: #10b981;
}
.badge.cancelado {
  background: #450a0a;
  color: #ef4444;
}
.badge.aberto {
  background: #1e3a5f;
  color: #3b82f6;
}

.btn-cancelar {
  padding: 4px 12px;
  background: transparent;
  border: 1px solid #ef4444;
  border-radius: 6px;
  color: #ef4444;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cancelar:hover {
  background: #ef4444;
  color: #ffffff;
}

.estado-vazio {
  padding: 40px;
  text-align: center;
  color: #4b5563;
  font-size: 14px;
}
</style>
