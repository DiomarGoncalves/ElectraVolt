document.addEventListener("DOMContentLoaded", () => {
  const vehicleCards = document.getElementById("vehicleCards");
  const filtroInput = document.getElementById("filtroInput");
  const ordenarSelect = document.getElementById("ordenarSelect");
  const vehicleTable = document.getElementById("vehicleTable");
  const addVehicleForm = document.getElementById("addVehicleForm");

  if (!vehicleTable) {
    console.error("Elemento vehicleTable não encontrado no DOM.");
    return;
  }

  let listaVeiculos = [];

  const API_URL = "/api/veiculos"; // Caminho relativo para funcionar na Vercel

  // Função para renderizar os cards
  function renderCards(lista) {
    vehicleCards.innerHTML = "";
    lista.forEach((veiculo, index) => {
      const card = document.createElement("div");
      card.className =
        "bg-white/10 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105 fade-in";
      card.style.animationDelay = `${index * 100}ms`;

      card.innerHTML = `
        <img src="${veiculo.image}" alt="${veiculo.name}" class="w-full h-48 object-cover" />
        <div class="p-4">
          <h3 class="text-xl font-bold text-white">${veiculo.name}</h3>
          <p class="text-gray-300">Ano: ${veiculo.year}</p>
          <p class="text-amber-400 font-semibold m-4">${veiculo.price}</p>
          <a href="https://wa.me/6299362095?text=Olá! Tenho interesse no ${veiculo.name} (${veiculo.year})" 
             target="_blank" 
             class="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-black py-2 rounded-lg transition">
            Fale no WhatsApp
          </a>
        </div>
      `;

      vehicleCards.appendChild(card);
    });
  }

  // Função para renderizar a tabela no painel administrativo
  const renderAdminTable = (vehicles) => {
    vehicleTable.innerHTML = ""; // Certifique-se de que o elemento existe antes de usar
    vehicles.forEach((vehicle) => {
      const row = document.createElement("div");
      row.className = "flex justify-between items-center border-b border-gray-300 py-2";

      row.innerHTML = `
        <p>${vehicle.name} (${vehicle.year}) - ${vehicle.price}</p>
        <button class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600" data-id="${vehicle.id}">
          Excluir
        </button>
      `;

      const deleteButton = row.querySelector("button");
      deleteButton.addEventListener("click", () => deleteVehicle(vehicle.id));

      vehicleTable.appendChild(row);
    });
  };

  // Função para aplicar filtro e ordenação
  function aplicarFiltroEOrdenacao() {
    const termo = filtroInput.value.toLowerCase();
    const tipoOrdenacao = ordenarSelect.value;

    let listaFiltrada = listaVeiculos.filter((veiculo) =>
      veiculo.name.toLowerCase().includes(termo)
    );

    if (tipoOrdenacao === "preco") {
      listaFiltrada.sort((a, b) => parseFloat(a.price.replace(/[^\d]/g, "")) - parseFloat(b.price.replace(/[^\d]/g, "")));
    } else if (tipoOrdenacao === "ano") {
      listaFiltrada.sort((a, b) => b.year - a.year);
    }

    renderCards(listaFiltrada);
  }

  // Função para carregar veículos do JSON
  const loadVehicles = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }
      const vehicles = await response.json();
      listaVeiculos = vehicles;
      renderCards(listaVeiculos);
      renderAdminTable(vehicles);
    } catch (error) {
      console.error("Erro ao carregar os veículos:", error);
      vehicleTable.innerHTML = `<p class="text-red-500">Erro ao carregar os veículos. Tente novamente mais tarde.</p>`;
    }
  };

  // Função para adicionar um novo veículo
  if (addVehicleForm) {
    addVehicleForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newVehicle = {
        name: document.getElementById("name").value,
        year: parseInt(document.getElementById("year").value),
        price: document.getElementById("price").value,
        image: document.getElementById("image").value,
      };

      try {
        await fetch("/api/veiculos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newVehicle),
        });
        addVehicleForm.reset();
        loadVehicles();
      } catch (error) {
        console.error("Erro ao adicionar o veículo:", error);
      }
    });
  }

  // Função para excluir um veículo
  const deleteVehicle = async (id) => {
    try {
      await fetch(`/api/veiculos/${id}`, { method: "DELETE" });
      loadVehicles();
    } catch (error) {
      console.error("Erro ao excluir o veículo:", error);
    }
  };

  // Eventos de filtro e ordenação
  filtroInput.addEventListener("input", aplicarFiltroEOrdenacao);
  ordenarSelect.addEventListener("change", aplicarFiltroEOrdenacao);

  // Inicializar
  loadVehicles();
});
