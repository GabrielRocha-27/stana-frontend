<template>
  <div class="pagina">
    <div class="pagina-header">
      <h1 class="titulo">Produtos</h1>
      <button class="btn-novo" @click="abrirModal()">+ Novo Produto</button>
    </div>

    <!-- ── Tabela ── -->
    <div class="tabela-wrapper">
      <div v-if="carregando" class="estado-vazio">Carregando...</div>
      <div v-else-if="produtos.length === 0" class="estado-vazio">
        Nenhum produto cadastrado.
      </div>
      <table v-else class="tabela">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Marca</th>
            <th>Tipo</th>
            <th>Preço</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="produto in produtos" :key="produto.id">
            <td>{{ produto.nome }}</td>
            <td>{{ produto.marca || "—" }}</td>
            <td>
              <span class="badge-tipo">{{ produto.tipo }}</span>
            </td>
            <td>R$ {{ formatarPreco(produto.preco) }}</td>
            <td>
              <span :class="['badge', produto.ativo ? 'ativo' : 'inativo']">
                {{ produto.ativo ? "Ativo" : "Inativo" }}
              </span>
            </td>
            <td class="acoes">
              <button class="btn-editar" @click="abrirModal(produto)">
                Editar
              </button>
              <button class="btn-excluir" @click="excluir(produto.id)">
                {{ produto.ativo ? "Desativar" : "Ativar" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Modal ── -->
    <div v-if="modalAberto" class="modal-overlay" @click.self="fecharModal">
      <div class="modal">
        <h2>{{ editando ? "Editar Produto" : "Novo Produto" }}</h2>

        <div class="form-grupo">
          <label>Nome *</label>
          <input v-model="form.nome" placeholder="Ex: Coxinha" class="input" />
        </div>
        <div class="form-grupo">
          <label>Marca</label>
          <input v-model="form.marca" placeholder="Ex: Caseira" class="input" />
        </div>
        <div class="form-grupo">
          <label>Tipo *</label>
          <select v-model="form.tipo" class="input">
            <option value="">Selecione...</option>
            <option value="SALGADO">Salgado</option>
            <option value="DOCE">Doce</option>
            <option value="BEBIDA">Bebida</option>
            <option value="OUTRO">Outro</option>
          </select>
        </div>
        <div class="form-grupo">
          <label>Preço *</label>
          <input
            v-model="form.preco"
            type="number"
            step="0.01"
            placeholder="0,00"
            class="input"
          />
        </div>
        <div v-if="editando" class="form-grupo">
          <label>Status</label>
          <select v-model="form.ativo" class="input">
            <option :value="true">Ativo</option>
            <option :value="false">Inativo</option>
          </select>
        </div>

        <div v-if="erro" class="erro-msg">{{ erro }}</div>

        <div class="modal-acoes">
          <button class="btn-cancelar-modal" @click="fecharModal">
            Cancelar
          </button>
          <button class="btn-salvar" :disabled="salvando" @click="salvar">
            {{ salvando ? "Salvando..." : "Salvar" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from "@/service/api";

export default {
  name: "ProdutosView",
  data() {
    return {
      produtos: [],
      carregando: true,
      modalAberto: false,
      editando: false,
      salvando: false,
      erro: "",
      produtoId: null,
      form: { nome: "", marca: "", tipo: "", preco: "", ativo: true },
    };
  },
  async mounted() {
    await this.carregar();
  },
  methods: {
    async carregar() {
      this.carregando = true;
      try {
        const { data } = await api.get("/produtos");
        this.produtos = data;
      } catch (e) {
        console.error(e);
      } finally {
        this.carregando = false;
      }
    },

    abrirModal(produto = null) {
      this.erro = "";
      if (produto) {
        this.editando = true;
        this.produtoId = produto.id;
        this.form = {
          nome: produto.nome,
          marca: produto.marca || "",
          tipo: produto.tipo,
          preco: produto.preco,
          ativo: produto.ativo,
        };
      } else {
        this.editando = false;
        this.produtoId = null;
        this.form = { nome: "", marca: "", tipo: "", preco: "", ativo: true };
      }
      this.modalAberto = true;
    },

    fecharModal() {
      this.modalAberto = false;
    },

    async salvar() {
      this.erro = "";
      if (!this.form.nome || !this.form.tipo || !this.form.preco) {
        this.erro = "Preencha todos os campos obrigatórios.";
        return;
      }
      this.salvando = true;
      try {
        if (this.editando) {
          await api.put(`/produtos/${this.produtoId}`, this.form);
        } else {
          await api.post("/produtos", this.form);
        }
        this.fecharModal();
        await this.carregar();
      } catch (e) {
        this.erro = "Erro ao salvar produto.";
      } finally {
        this.salvando = false;
      }
    },

    async excluir(id) {
      if (
        !confirm(
          "Deseja desativar este produto? Ele não aparecerá mais no caixa."
        )
      )
        return;
      try {
        await api.put(`/produtos/${id}`, { ativo: false });
        await this.carregar();
      } catch (e) {
        alert("Erro ao desativar produto.");
      }
    },

    formatarPreco(valor) {
      return Number(valor).toFixed(2).replace(".", ",");
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
.pagina-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.titulo {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
}

.btn-novo {
  padding: 10px 20px;
  background: #6366f1;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-novo:hover {
  background: #4f46e5;
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

.badge-tipo {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  background: #1e2a4a;
  color: #6366f1;
}
.badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}
.badge.ativo {
  background: #064e3b;
  color: #10b981;
}
.badge.inativo {
  background: #450a0a;
  color: #ef4444;
}

.acoes {
  display: flex;
  gap: 8px;
}
.btn-editar {
  padding: 4px 12px;
  background: transparent;
  border: 1px solid #6366f1;
  border-radius: 6px;
  color: #6366f1;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-editar:hover {
  background: #6366f1;
  color: #ffffff;
}
.btn-excluir {
  padding: 4px 12px;
  background: transparent;
  border: 1px solid #ef4444;
  border-radius: 6px;
  color: #ef4444;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-excluir:hover {
  background: #ef4444;
  color: #ffffff;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal {
  background: #1a1d2e;
  border: 1px solid #2a2d3a;
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.modal h2 {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}
.form-grupo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-grupo label {
  font-size: 13px;
  color: #9ca3af;
}
.input {
  padding: 10px 14px;
  background: #0f1117;
  border: 1px solid #2a2d3a;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.input:focus {
  border-color: #6366f1;
}
.erro-msg {
  background: #2d1b1b;
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #ef4444;
}
.modal-acoes {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 8px;
}
.btn-cancelar-modal {
  padding: 10px 20px;
  background: transparent;
  border: 1px solid #2a2d3a;
  border-radius: 8px;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
}
.btn-cancelar-modal:hover {
  border-color: #ef4444;
  color: #ef4444;
}
.btn-salvar {
  padding: 10px 24px;
  background: #6366f1;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.btn-salvar:hover:not(:disabled) {
  background: #4f46e5;
}
.btn-salvar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.estado-vazio {
  padding: 40px;
  text-align: center;
  color: #4b5563;
  font-size: 14px;
}
</style>
