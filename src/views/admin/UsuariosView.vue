<template>
  <div class="pagina">
    <div class="pagina-header">
      <h1 class="titulo">Usuários</h1>
      <button class="btn-novo" @click="abrirModal()">+ Novo Usuário</button>
    </div>

    <div class="tabela-wrapper">
      <div v-if="carregando" class="estado-vazio">Carregando...</div>
      <div v-else-if="usuarios.length === 0" class="estado-vazio">
        Nenhum usuário cadastrado.
      </div>
      <table v-else class="tabela">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Perfil</th>
            <th>Status</th>
            <th>Criado em</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="usuario in usuarios" :key="usuario.id">
            <td>{{ usuario.nome }}</td>
            <td>{{ usuario.email }}</td>
            <td>
              <span :class="['badge-role', usuario.role.toLowerCase()]">
                {{ usuario.role === "ADMIN" ? "Admin" : "Caixa" }}
              </span>
            </td>
            <td>
              <span :class="['badge', usuario.ativo ? 'ativo' : 'inativo']">
                {{ usuario.ativo ? "Ativo" : "Inativo" }}
              </span>
            </td>
            <td>{{ formatarData(usuario.criadoEm) }}</td>
            <td class="acoes">
              <button class="btn-editar" @click="abrirModal(usuario)">
                Editar
              </button>
              <button class="btn-excluir" @click="excluir(usuario.id)">
                Excluir
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="modalAberto" class="modal-overlay" @click.self="fecharModal">
      <div class="modal">
        <h2>{{ editando ? "Editar Usuário" : "Novo Usuário" }}</h2>

        <div class="form-grupo">
          <label>Nome *</label>
          <input
            v-model="form.nome"
            placeholder="Nome completo"
            class="input"
          />
        </div>
        <div class="form-grupo">
          <label>Email *</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="email@exemplo.com"
            class="input"
          />
        </div>
        <div v-if="!editando" class="form-grupo">
          <label>Senha *</label>
          <input
            v-model="form.senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            class="input"
          />
        </div>
        <div class="form-grupo">
          <label>Perfil *</label>
          <select v-model="form.role" class="input">
            <option value="">Selecione...</option>
            <option value="USUARIO">Caixa</option>
            <option value="ADMIN">Admin</option>
          </select>
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
  name: "UsuariosView",
  data() {
    return {
      usuarios: [],
      carregando: true,
      modalAberto: false,
      editando: false,
      salvando: false,
      erro: "",
      usuarioId: null,
      form: { nome: "", email: "", senha: "", role: "", ativo: true },
    };
  },
  async mounted() {
    await this.carregar();
  },
  methods: {
    async carregar() {
      this.carregando = true;
      try {
        const { data } = await api.get("/usuarios");
        this.usuarios = data;
      } catch (e) {
        console.error(e);
      } finally {
        this.carregando = false;
      }
    },

    abrirModal(usuario = null) {
      this.erro = "";
      if (usuario) {
        this.editando = true;
        this.usuarioId = usuario.id;
        this.form = {
          nome: usuario.nome,
          email: usuario.email,
          senha: "",
          role: usuario.role,
          ativo: usuario.ativo,
        };
      } else {
        this.editando = false;
        this.usuarioId = null;
        this.form = { nome: "", email: "", senha: "", role: "", ativo: true };
      }
      this.modalAberto = true;
    },

    fecharModal() {
      this.modalAberto = false;
    },

    async salvar() {
      this.erro = "";
      if (!this.form.nome || !this.form.email || !this.form.role) {
        this.erro = "Preencha todos os campos obrigatórios.";
        return;
      }
      if (!this.editando && !this.form.senha) {
        this.erro = "Senha é obrigatória.";
        return;
      }
      this.salvando = true;
      try {
        if (this.editando) {
          await api.put(`/usuarios/${this.usuarioId}`, this.form);
        } else {
          await api.post("/usuarios", this.form);
        }
        this.fecharModal();
        await this.carregar();
      } catch (e) {
        this.erro = e.response?.data?.message || "Erro ao salvar usuário.";
      } finally {
        this.salvando = false;
      }
    },

    async excluir(id) {
      if (!confirm("Deseja excluir este usuário?")) return;
      try {
        await api.delete(`/usuarios/${id}`);
        await this.carregar();
      } catch (e) {
        alert("Erro ao excluir usuário.");
      }
    },

    formatarData(data) {
      if (!data) return "-";
      return new Date(data).toLocaleDateString("pt-BR");
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
.badge-role {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}
.badge-role.admin {
  background: #2e1a5e;
  color: #a78bfa;
}
.badge-role.usuario {
  background: #1e3a5f;
  color: #3b82f6;
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
