import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import CaixaView from "../views/CaixaView.vue";
import AdminLayout from "../views/admin/AdminLayout.vue";
import DashboardView from "../views/admin/DashboardView.vue";
import ProdutosView from "../views/admin/ProdutosView.vue";
import UsuariosView from "../views/admin/UsuariosView.vue";
import AnaliseView from "../views/admin/AnaliseView.vue";

const routes = [
  { path: "/", name: "login", component: LoginView },
  {
    path: "/caixa",
    name: "caixa",
    component: CaixaView,
    meta: { requerLogin: true },
  },
  {
    path: "/admin",
    component: AdminLayout,
    meta: { requerLogin: true, apenasAdmin: true },
    children: [
      { path: "", redirect: "/admin/dashboard" },
      { path: "dashboard", name: "dashboard", component: DashboardView },
      { path: "produtos", name: "produtos", component: ProdutosView },
      { path: "usuarios", name: "usuarios", component: UsuariosView },
      { path: "analise", name: "analise", component: AnaliseView },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  if (to.meta.requerLogin && !usuario) {
    next("/");
  } else if (to.meta.apenasAdmin && usuario?.role !== "ADMIN") {
    next("/caixa");
  } else {
    next();
  }
});

export default router;
