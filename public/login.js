document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error("Credenciais inválidas");
    }

    const { token } = await response.json();
    localStorage.setItem("adminToken", token);
    window.location.href = "/admin.html"; // Redirecionar para a tela de admin
  } catch (error) {
    document.getElementById("errorMessage").classList.remove("hidden");
    console.error("Erro no login:", error);
  }
});
