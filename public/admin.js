document.addEventListener("DOMContentLoaded", () => {
  const productTable = document.getElementById("productTable");
  const addProductForm = document.getElementById("addProductForm");

  const API_URL = "/api/produtos";
  const ADMIN_TOKEN = localStorage.getItem("adminToken");

  if (!ADMIN_TOKEN) {
    window.location.href = "/login.html"; // Redirecionar para a página de login se não estiver autenticado
  }

  const fetchWithAuth = async (url, options = {}) => {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    };
    return fetch(url, options);
  };

  const renderAdminTable = (products) => {
    productTable.innerHTML = "";

    if (products.length === 0) {
      productTable.innerHTML = `<p class="text-gray-400 text-sm">Nenhum produto cadastrado ainda.</p>`;
      return;
    }

    products.forEach((product) => {
      const row = document.createElement("div");
      row.className = "flex justify-between items-center border-b border-gray-300 py-2";

      row.innerHTML = `
        <p>${product.name} (${product.model}) - ${product.price}</p>
        <button class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600" data-id="${product.id}">
          Excluir
        </button>
      `;

      const deleteButton = row.querySelector("button");
      deleteButton.addEventListener("click", () => deleteProduct(product.id));

      productTable.appendChild(row);
    });
  };

  const loadProducts = async () => {
    try {
      const response = await fetchWithAuth(API_URL);
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }
      const products = await response.json();
      renderAdminTable(products);
    } catch (error) {
      console.error("Erro ao carregar os produtos:", error);
      productTable.innerHTML = `<p class="text-red-500">Erro ao carregar os produtos. Tente novamente mais tarde.</p>`;
    }
  };

  if (addProductForm) {
    addProductForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(addProductForm);

      try {
        const response = await fetchWithAuth(API_URL, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Erro ao adicionar o produto.");
        }

        addProductForm.reset();
        loadProducts();
      } catch (error) {
        console.error("Erro ao adicionar o produto:", error);
      }
    });
  }

  const deleteProduct = async (id) => {
    try {
      await fetchWithAuth(`${API_URL}/${id}`, { method: "DELETE" });
      loadProducts();
    } catch (error) {
      console.error("Erro ao excluir o produto:", error);
    }
  };

  loadProducts();
});
