<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
        <span class="logo-icon">🛒</span>
        <h1>Santa Ana</h1>
        <p>Gerenciador de Mercadoria</p>
      </div>

      <div class="login-form">
        <div class="campo">
          <label>Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="seu@email.com"
            @keyup.enter="login"
          />
        </div>

        <div class="campo">
          <label>Senha</label>
          <input
            v-model="senha"
            type="password"
            placeholder="••••••"
            @keyup.enter="login"
          />
        </div>

        <div v-if="erro" class="erro-msg">{{ erro }}</div>

        <button class="btn-login" :disabled="carregando" @click="login">
          {{ carregando ? "Entrando..." : "Entrar" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import api from "@/service/api";

export default {
  name: "LoginView",
  data() {
    return {
      email: "",
      senha: "",
      erro: "",
      carregando: false,
    };
  },
  methods: {
    async login() {
      this.erro = "";

      if (!this.email || !this.senha) {
        this.erro = "Preencha o email e a senha.";
        return;
      }

      this.carregando = true;
      try {
        const { data } = await api.post("/auth/login", {
          email: this.email,
          senha: this.senha,
        });

        // Salva o usuário no localStorage
        localStorage.setItem("usuario", JSON.stringify(data));

        // Redireciona baseado no role
        if (data.role === "ADMIN") {
          this.$router.push("/admin");
        } else {
          this.$router.push("/caixa");
        }
      } catch (e) {
        this.erro = "Email ou senha inválidos.";
      } finally {
        this.carregando = false;
      }
    },
  },
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f1117;
}

.login-card {
  background: #1a1d2e;
  border: 1px solid #2a2d3a;
  border-radius: 16px;
  padding: 48px 40px;
  width: 100%;
  max-width: 400px;
}

.login-logo {
  text-align: center;
  margin-bottom: 36px;
}

.logo-icon {
  font-size: 40px;
}

.login-logo h1 {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin: 8px 0 4px;
}

.login-logo p {
  font-size: 13px;
  color: #6b7280;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.campo label {
  font-size: 13px;
  font-weight: 500;
  color: #9ca3af;
}

.campo input {
  padding: 12px 16px;
  background: #0f1117;
  border: 1px solid #2a2d3a;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.campo input:focus {
  border-color: #6366f1;
}

.campo input::placeholder {
  color: #4b5563;
}

.erro-msg {
  background: #2d1b1b;
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #ef4444;
}

.btn-login {
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
  margin-top: 4px;
}

.btn-login:hover:not(:disabled) {
  background: #4f46e5;
}

.btn-login:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
