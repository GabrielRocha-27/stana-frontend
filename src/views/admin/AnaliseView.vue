<template>
  <div class="pagina">
    <h1 class="titulo">Análise de Vendas</h1>

    <!-- ── Filtros globais ── -->
    <div class="filtros-card">
      <div class="filtro-grupo">
        <label>Data início</label>
        <input
          v-model="filtroInicio"
          type="date"
          class="input-filtro"
          @change="carregar"
        />
      </div>
      <div class="filtro-grupo">
        <label>Data fim</label>
        <input
          v-model="filtroFim"
          type="date"
          class="input-filtro"
          @change="carregar"
        />
      </div>
      <div class="filtro-grupo">
        <label>Tipo de produto</label>
        <select v-model="filtroTipo" class="input-filtro" @change="carregar">
          <option value="">Todos</option>
          <option value="SALGADO">Salgado</option>
          <option value="DOCE">Doce</option>
          <option value="BEBIDA">Bebida</option>
          <option value="OUTRO">Outro</option>
        </select>
      </div>
      <button class="btn-limpar" @click="limparFiltros">Limpar</button>
    </div>

    <!-- ── Gráfico de barras ── -->
    <div class="section-card">
      <div class="section-header">
        <h2>Comparativo de Produtos</h2>
        <div class="produtos-selector">
          <label>Selecionar produtos:</label>
          <div class="chips">
            <span
              v-for="produto in rankingProdutos"
              :key="produto.nome"
              :class="[
                'chip',
                produtosSelecionados.includes(produto.nome) ? 'ativo' : '',
              ]"
              @click="toggleProduto(produto.nome)"
            >
              {{ produto.nome }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="carregando" class="estado-vazio">Carregando...</div>
      <div v-else-if="dadosGrafico.labels.length === 0" class="estado-vazio">
        Nenhum dado para exibir.
      </div>
      <div v-else class="grafico-wrapper">
        <Bar :data="dadosGrafico" :options="opcoesGrafico" />
      </div>
    </div>

    <!-- ── Tabela ranking ── -->
    <div class="section-card">
      <div class="section-header">
        <h2>Ranking de Produtos</h2>
        <button class="btn-exportar" @click="exportarCSV">
          ⬇ Exportar CSV
        </button>
      </div>

      <div v-if="carregando" class="estado-vazio">Carregando...</div>
      <div v-else-if="rankingFiltrado.length === 0" class="estado-vazio">
        Nenhum produto encontrado.
      </div>
      <table v-else class="tabela">
        <thead>
          <tr>
            <th>#</th>
            <th>Produto</th>
            <th>Tipo</th>
            <th>Qtd Vendida</th>
            <th>Preço Unit.</th>
            <th>Valor Total</th>
            <th>% do Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in rankingFiltrado" :key="item.nome">
            <td class="pos">{{ index + 1 }}º</td>
            <td class="nome-produto">{{ item.nome }}</td>
            <td>
              <span :class="['badge-tipo', item.tipo?.toLowerCase()]">{{
                traduzirTipo(item.tipo)
              }}</span>
            </td>
            <td class="quantidade">{{ item.quantidade }}</td>
            <td>R$ {{ formatarPreco(item.precoUnitario) }}</td>
            <td class="valor-total">R$ {{ formatarPreco(item.total) }}</td>
            <td>
              <div class="barra-pct">
                <div
                  class="barra-fill"
                  :style="{ width: calcularPct(item.total) + '%' }"
                ></div>
                <span>{{ calcularPct(item.total) }}%</span>
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3"><strong>Total geral</strong></td>
            <td>
              <strong>{{ totalQuantidade }}</strong>
            </td>
            <td></td>
            <td>
              <strong>R$ {{ formatarPreco(totalValor) }}</strong>
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script>
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import api from "@/service/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default {
  name: "AnaliseView",
  components: { Bar },
  data() {
    return {
      pedidos: [],
      carregando: true,
      filtroInicio: "",
      filtroFim: "",
      filtroTipo: "",
      produtosSelecionados: [],
    };
  },
  computed: {
    rankingProdutos() {
      const mapa = {};
      this.pedidos
        .filter((p) => p.status !== "CANCELADO")
        .forEach((pedido) => {
          if (pedido.itens) {
            pedido.itens.forEach((item) => {
              if (this.filtroTipo && item.tipoProduto !== this.filtroTipo)
                return;
              if (!mapa[item.nomeProduto]) {
                mapa[item.nomeProduto] = {
                  nome: item.nomeProduto,
                  tipo: item.tipoProduto,
                  quantidade: 0,
                  total: 0,
                  precoUnitario: item.precoUnitario,
                };
              }
              mapa[item.nomeProduto].quantidade += item.quantidade;
              mapa[item.nomeProduto].total += Number(item.subtotal);
            });
          }
        });
      return Object.values(mapa).sort((a, b) => b.quantidade - a.quantidade);
    },

    rankingFiltrado() {
      return this.rankingProdutos;
    },

    produtosSelecionadosFiltrados() {
      if (this.produtosSelecionados.length === 0) return this.rankingProdutos;
      return this.rankingProdutos.filter((p) =>
        this.produtosSelecionados.includes(p.nome)
      );
    },

    dadosGrafico() {
      const dados = this.produtosSelecionadosFiltrados;
      return {
        labels: dados.map((p) => p.nome),
        datasets: [
          {
            label: "Quantidade Vendida",
            data: dados.map((p) => p.quantidade),
            backgroundColor: dados.map((_, i) => {
              const cores = [
                "#6366f1",
                "#10b981",
                "#f59e0b",
                "#ef4444",
                "#3b82f6",
                "#8b5cf6",
                "#ec4899",
                "#14b8a6",
              ];
              return cores[i % cores.length] + "cc";
            }),
            borderColor: dados.map((_, i) => {
              const cores = [
                "#6366f1",
                "#10b981",
                "#f59e0b",
                "#ef4444",
                "#3b82f6",
                "#8b5cf6",
                "#ec4899",
                "#14b8a6",
              ];
              return cores[i % cores.length];
            }),
            borderWidth: 2,
            borderRadius: 6,
          },
        ],
      };
    },

    opcoesGrafico() {
      const dadosValor = this.produtosSelecionadosFiltrados;
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => {
                const item = dadosValor[ctx.dataIndex];
                return `Valor total: R$ ${this.formatarPreco(item?.total)}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: "#9ca3af" },
            grid: { color: "#1e2130" },
          },
          y: {
            ticks: { color: "#9ca3af" },
            grid: { color: "#1e2130" },
            title: {
              display: true,
              text: "Quantidade Vendida",
              color: "#6b7280",
            },
          },
        },
      };
    },

    totalQuantidade() {
      return this.rankingFiltrado.reduce((acc, i) => acc + i.quantidade, 0);
    },

    totalValor() {
      return this.rankingFiltrado.reduce((acc, i) => acc + i.total, 0);
    },
  },
  async mounted() {
    await this.carregar();
  },
  methods: {
    async carregar() {
      this.carregando = true;
      try {
        let url = "/pedidos";
        if (this.filtroInicio && this.filtroFim) {
          const { data } = await api.get("/pedidos/periodo", {
            params: {
              inicio: this.filtroInicio + "T00:00:00",
              fim: this.filtroFim + "T23:59:59",
            },
          });
          // busca detalhes completos de cada pedido
          const detalhes = await Promise.all(
            data.map((p) => api.get(`/pedidos/${p.id}`))
          );
          this.pedidos = detalhes.map((r) => r.data);
        } else {
          const resumos = await api.get(url);
          const detalhes = await Promise.all(
            resumos.data.map((p) => api.get(`/pedidos/${p.id}`))
          );
          this.pedidos = detalhes.map((r) => r.data);
        }
        this.produtosSelecionados = [];
      } catch (e) {
        console.error("Erro ao carregar pedidos", e);
      } finally {
        this.carregando = false;
      }
    },

    limparFiltros() {
      this.filtroInicio = "";
      this.filtroFim = "";
      this.filtroTipo = "";
      this.produtosSelecionados = [];
      this.carregar();
    },

    toggleProduto(nome) {
      const idx = this.produtosSelecionados.indexOf(nome);
      if (idx >= 0) {
        this.produtosSelecionados.splice(idx, 1);
      } else {
        this.produtosSelecionados.push(nome);
      }
    },

    calcularPct(valor) {
      if (this.totalValor === 0) return 0;
      return Math.round((valor / this.totalValor) * 100);
    },

    formatarPreco(valor) {
      return Number(valor || 0)
        .toFixed(2)
        .replace(".", ",");
    },

    traduzirTipo(tipo) {
      const map = {
        SALGADO: "Salgado",
        DOCE: "Doce",
        BEBIDA: "Bebida",
        OUTRO: "Outro",
      };
      return map[tipo] || tipo || "—";
    },

    exportarCSV() {
      const linhas = [
        [
          "#",
          "Produto",
          "Tipo",
          "Qtd Vendida",
          "Preco Unit.",
          "Valor Total",
          "% do Total",
        ],
        ...this.rankingFiltrado.map((item, i) => [
          i + 1,
          item.nome,
          this.traduzirTipo(item.tipo),
          item.quantidade,
          this.formatarPreco(item.precoUnitario),
          this.formatarPreco(item.total),
          this.calcularPct(item.total) + "%",
        ]),
        [
          "",
          "TOTAL",
          "",
          this.totalQuantidade,
          "",
          this.formatarPreco(this.totalValor),
          "100%",
        ],
      ];

      const csv = linhas.map((l) => l.join(";")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-vendas-${new Date()
        .toLocaleDateString("pt-BR")
        .replace(/\//g, "-")}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    },
  },
};
</script>

<style scoped>
.pagina {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.titulo {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
}

.filtros-card {
  background: #1a1d2e;
  border: 1px solid #2a2d3a;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filtro-grupo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.filtro-grupo label {
  font-size: 12px;
  color: #6b7280;
}
.input-filtro {
  padding: 9px 14px;
  background: #0f1117;
  border: 1px solid #2a2d3a;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 13px;
  outline: none;
}
.input-filtro:focus {
  border-color: #6366f1;
}

.btn-limpar {
  padding: 9px 16px;
  background: transparent;
  border: 1px solid #2a2d3a;
  border-radius: 8px;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-limpar:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.section-card {
  background: #1a1d2e;
  border: 1px solid #2a2d3a;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
}
.section-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.btn-exportar {
  padding: 8px 16px;
  background: #10b981;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-exportar:hover {
  background: #059669;
}

.produtos-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.produtos-selector label {
  font-size: 12px;
  color: #6b7280;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  padding: 5px 12px;
  border-radius: 20px;
  border: 1px solid #2a2d3a;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.chip:hover {
  border-color: #6366f1;
  color: #6366f1;
}
.chip.ativo {
  background: #6366f1;
  border-color: #6366f1;
  color: #ffffff;
}

.grafico-wrapper {
  height: 320px;
}

/* Tabela */
.tabela {
  width: 100%;
  border-collapse: collapse;
}
.tabela th {
  padding: 10px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #2a2d3a;
}
.tabela td {
  padding: 10px 14px;
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
.tabela tfoot td {
  border-top: 1px solid #2a2d3a;
  color: #ffffff;
  padding-top: 14px;
}

.pos {
  color: #6366f1;
  font-weight: 700;
  font-size: 14px;
}
.nome-produto {
  font-weight: 500;
  color: #ffffff;
}
.quantidade {
  font-weight: 600;
  color: #f59e0b;
}
.valor-total {
  font-weight: 600;
  color: #10b981;
}

.badge-tipo {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}
.badge-tipo.salgado {
  background: #2d1b0a;
  color: #f59e0b;
}
.badge-tipo.doce {
  background: #2d1428;
  color: #ec4899;
}
.badge-tipo.bebida {
  background: #0a1f2d;
  color: #3b82f6;
}
.badge-tipo.outro {
  background: #1a1d2e;
  color: #6b7280;
}

.barra-pct {
  display: flex;
  align-items: center;
  gap: 8px;
}
.barra-fill {
  height: 6px;
  background: #6366f1;
  border-radius: 3px;
  min-width: 4px;
  transition: width 0.3s;
}
.barra-pct span {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

.estado-vazio {
  padding: 40px;
  text-align: center;
  color: #4b5563;
  font-size: 14px;
}
</style>
