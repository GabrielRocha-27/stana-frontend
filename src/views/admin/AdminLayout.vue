<template>
  <div class="admin-wrapper">
    <!-- ── Menu lateral ── -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span>🛒</span>
        <strong>Stana</strong>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/admin/dashboard" class="nav-item">
          <span class="nav-icon">📊</span>
          <span>Dashboard</span>
        </router-link>
        <router-link to="/admin/produtos" class="nav-item">
          <span class="nav-icon">📦</span>
          <span>Produtos</span>
        </router-link>
        <router-link to="/admin/usuarios" class="nav-item">
          <span class="nav-icon">👥</span>
          <span>Usuários</span>
        </router-link>
        <router-link to="/admin/analise" class="nav-item">
          <span class="nav-icon">📈</span>
          <span>Análise</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="usuario-info">
          <span class="usuario-nome">{{ nomeUsuario }}</span>
          <span class="usuario-role">Admin</span>
        </div>
        <button class="btn-sair" @click="sair">Sair</button>
      </div>
    </aside>

    <!-- ── Conteúdo principal ── -->
    <main class="admin-content">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: "AdminLayout",
  computed: {
    nomeUsuario() {
      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
      return usuario.nome || "Admin";
    },
  },
  methods: {
    sair() {
      localStorage.removeItem("usuario");
      this.$router.push("/");
    },
  },
};
</script>

<style scoped>
.admin-wrapper {
  display: flex;
  height: 100vh;
  background: #0f1117;
}

/* ── Sidebar ── */
.sidebar {
  width: 220px;
  background: #13151f;
  border-right: 1px solid #2a2d3a;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-logo {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  border-bottom: 1px solid #2a2d3a;
}

.sidebar-logo span {
  font-size: 22px;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #9ca3af;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #1a1d2e;
  color: #ffffff;
}

.nav-item.router-link-active {
  background: #6366f1;
  color: #ffffff;
}

.nav-icon {
  font-size: 16px;
}

/* ── Footer sidebar ── */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #2a2d3a;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.usuario-info {
  display: flex;
  flex-direction: column;
}

.usuario-nome {
  font-size: 13px;
  font-weight: 500;
  color: #ffffff;
}

.usuario-role {
  font-size: 11px;
  color: #6366f1;
}

.btn-sair {
  padding: 8px;
  background: transparent;
  border: 1px solid #2a2d3a;
  border-radius: 8px;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sair:hover {
  border-color: #ef4444;
  color: #ef4444;
}

/* ── Conteúdo ── */
.admin-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}
</style>
