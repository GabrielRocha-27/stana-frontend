<template>
  <div class="admin-wrapper">
    <!-- ── Overlay escuro quando menu aberto no mobile ── -->
    <div v-if="menuAberto" class="overlay" @click="menuAberto = false"></div>

    <!-- ── Menu lateral ── -->
    <aside :class="['sidebar', { aberto: menuAberto }]">
      <div class="sidebar-logo">
        <span>🛒</span>
        <strong>Gestor Local</strong>
        <button class="btn-fechar-menu" @click="menuAberto = false">✕</button>
      </div>

      <nav class="sidebar-nav">
        <router-link
          to="/admin/dashboard"
          class="nav-item"
          @click="menuAberto = false"
        >
          <span class="nav-icon">📊</span>
          <span>Dashboard</span>
        </router-link>
        <router-link
          to="/admin/produtos"
          class="nav-item"
          @click="menuAberto = false"
        >
          <span class="nav-icon">📦</span>
          <span>Produtos</span>
        </router-link>
        <router-link
          to="/admin/usuarios"
          class="nav-item"
          @click="menuAberto = false"
        >
          <span class="nav-icon">👥</span>
          <span>Usuários</span>
        </router-link>
        <router-link
          to="/admin/analise"
          class="nav-item"
          @click="menuAberto = false"
        >
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
      <!-- Header mobile -->
      <header class="header-mobile">
        <span class="header-titulo">🛒 Gestor Local</span>
        <button class="btn-sair-mobile" @click="sair">Sair</button>
      </header>

      <router-view />
    </main>

    <!-- ── Botão flutuante para abrir menu no mobile ── -->
    <button class="btn-menu-flutuante" @click="menuAberto = true">☰</button>
  </div>
</template>

<script>
export default {
  name: "AdminLayout",
  data() {
    return {
      menuAberto: false,
    };
  },
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
  position: relative;
}

/* ── Overlay ── */
.overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 60;
}

/* ── Sidebar ── */
.sidebar {
  width: 220px;
  background: #13151f;
  border-right: 1px solid #2a2d3a;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  z-index: 70;
  transition: transform 0.3s ease;
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

.sidebar-logo span:first-child {
  font-size: 22px;
}

.sidebar-logo strong {
  flex: 1;
}

.btn-fechar-menu {
  display: none;
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
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

/* ── Header mobile ── */
.header-mobile {
  display: none;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-titulo {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
}

.btn-sair-mobile {
  padding: 6px 14px;
  background: transparent;
  border: 1px solid #ef4444;
  border-radius: 8px;
  color: #ef4444;
  font-size: 13px;
  cursor: pointer;
}

/* ── Botão flutuante ── */
.btn-menu-flutuante {
  display: none;
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 50;
  width: 52px;
  height: 52px;
  background: #6366f1;
  color: #ffffff;
  border: none;
  border-radius: 50%;
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.5);
  transition: background 0.2s;
  align-items: center;
  justify-content: center;
}

.btn-menu-flutuante:hover {
  background: #4f46e5;
}

/* ── RESPONSIVO ── */
@media (max-width: 768px) {
  .overlay {
    display: block;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    transform: translateX(-100%);
  }

  .sidebar.aberto {
    transform: translateX(0);
  }

  .btn-fechar-menu {
    display: block;
  }

  .admin-content {
    padding: 16px;
    padding-bottom: 80px;
  }

  .header-mobile {
    display: flex;
  }

  .btn-menu-flutuante {
    display: flex;
  }
}
</style>
