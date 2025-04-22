document.addEventListener("DOMContentLoaded", () => {
  const productCards = document.getElementById("productCards");
  const filtroInput = document.getElementById("filtroInput");
  const ordenarSelect = document.getElementById("ordenarSelect");
  const productTable = document.getElementById("productTable");
  const addProductForm = document.getElementById("addProductForm");

  if (!productTable) {
    console.error("Elemento productTable não encontrado no DOM.");
    return;
  }

  let listaProdutos = [];

  const API_URL = "/api/produtos"; // Certifique-se de que a URL está correta

  // Função para renderizar os cards
  function renderCards(lista) {
    productCards.innerHTML = "";
    lista.forEach((produto, index) => {
      const card = document.createElement("div");
      card.className =
        "bg-red-900/10 backdrop-blur-md border border-red-700 rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105 fade-in";
      card.style.animationDelay = `${index * 100}ms`;

      card.innerHTML = `
        <img src="${produto.image}" alt="${produto.name}" class="w-full h-48 object-cover" />
        <div class="p-4">
          <h3 class="text-xl font-bold text-white">${produto.name}</h3>
          <p class="text-gray-300">Modelo: ${produto.model}</p>
          <p class="text-red-400 font-semibold m-4">${produto.price}</p>
          <a href="https://wa.me/6299362095?text=Olá! Tenho interesse no ${produto.name} (${produto.model})" 
             target="_blank" 
             class="mt-4 w-full bg-red-500 hover:bg-red-600 text-black py-2 rounded-lg transition">
            Fale no WhatsApp
          </a>
        </div>
      `;

      productCards.appendChild(card);
    });
  }

  // Função para renderizar a tabela no painel administrativo
  const renderAdminTable = (products) => {
    productTable.innerHTML = ""; // Certifique-se de que o elemento existe antes de usar
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

  // Função para aplicar filtro e ordenação
  function aplicarFiltroEOrdenacao() {
    const termo = filtroInput.value.toLowerCase();
    const tipoOrdenacao = ordenarSelect.value;

    let listaFiltrada = listaProdutos.filter((produto) =>
      produto.name.toLowerCase().includes(termo)
    );

    if (tipoOrdenacao === "preco") {
      listaFiltrada.sort((a, b) => parseFloat(a.price.replace(/[^\d]/g, "")) - parseFloat(b.price.replace(/[^\d]/g, "")));
    } else if (tipoOrdenacao === "modelo") {
      listaFiltrada.sort((a, b) => a.model.localeCompare(b.model));
    }

    renderCards(listaFiltrada);
  }

  // Função para carregar produtos do JSON
  const loadProducts = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }
      const products = await response.json();
      listaProdutos = products;
      renderCards(listaProdutos);
      renderAdminTable(products);
    } catch (error) {
      console.error("Erro ao carregar os produtos:", error);
      productTable.innerHTML = `<p class="text-red-500">Erro ao carregar os produtos. Tente novamente mais tarde.</p>`;
    }
  };

  // Função para adicionar um novo produto
  if (addProductForm) {
    addProductForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newProduct = {
        name: document.getElementById("name").value,
        model: document.getElementById("model").value,
        price: document.getElementById("price").value,
        image: document.getElementById("image").value,
      };

      try {
        await fetch("/api/produtos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newProduct),
        });
        addProductForm.reset();
        loadProducts();
      } catch (error) {
        console.error("Erro ao adicionar o produto:", error);
      }
    });
  }

  // Função para excluir um produto
  const deleteProduct = async (id) => {
    try {
      await fetch(`/api/produtos/${id}`, { method: "DELETE" });
      loadProducts();
    } catch (error) {
      console.error("Erro ao excluir o produto:", error);
    }
  };

  // Eventos de filtro e ordenação
  filtroInput.addEventListener("input", aplicarFiltroEOrdenacao);
  ordenarSelect.addEventListener("change", aplicarFiltroEOrdenacao);

  // Inicializar
  loadProducts();
});
