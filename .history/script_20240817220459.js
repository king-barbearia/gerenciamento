document.addEventListener("DOMContentLoaded", function () {
  const agendaSection = document.getElementById("agendaSection");
  const caixaSection = document.getElementById("caixaSection");
  const usuariosSection = document.getElementById("usuariosSection");

  const agendamentosLink = document.querySelector('a[href="#agenda"]');
  const caixaLink = document.querySelector('a[href="#caixa"]');
  const usuariosLink = document.querySelector('a[href="#usuarios"]');

  function hideAllSections() {
    agendaSection.style.display = "none";
    caixaSection.style.display = "none";
    usuariosSection.style.display = "none";
  }

  // Mostrar a seção de agendamentos e ocultar as outras
  agendamentosLink.addEventListener("click", function (event) {
    event.preventDefault();
    hideAllSections();
    agendaSection.style.display = "block";
  });

  // Mostrar a seção de caixa e ocultar as outras
  caixaLink.addEventListener("click", function (event) {
    event.preventDefault();
    hideAllSections();
    caixaSection.style.display = "block";
  });

  // Mostrar a seção de usuários e ocultar as outras
  usuariosLink.addEventListener("click", function (event) {
    event.preventDefault();
    hideAllSections();
    usuariosSection.style.display = "block";
    fetchUsers(); // Chama a função para buscar e exibir os usuários
  });
  // Exibir nome do usuário (se disponível)
  const userName = localStorage.getItem("userName");
  userNameDisplay.innerText = userName ? `Bem-vindo, ${userName}!` : "";

  let allAppointments = [];

  fetchAppointmentsBtn.addEventListener("click", function () {
    fetchAppointments("Wallace");
    fetchAppointments("Mateus");
  });

  function fetchAppointments(barber) {
    fetch(
      `https://KinkBarbearia.pythonanywhere.com/appointments?barber=${encodeURIComponent(
        barber
      )}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.appointments) {
          // Filtra apenas os agendamentos do barbeiro específico
          const barberAppointments = data.appointments.map((appointment) => ({
            ...appointment,
            barber: barber,
          }));
          allAppointments = allAppointments.concat(barberAppointments);
          filterAppointments();
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar agendamentos:", error);
      });
  }
  function filterAppointments() {
    const selectedBarber = barberSelect.value;
    const filteredAppointments = allAppointments.filter(
      (appointment) => appointment.barber === selectedBarber
    );

    appointmentsList.innerHTML = ""; // Limpa a lista de agendamentos
    if (filteredAppointments.length > 0) {
      filteredAppointments.forEach((appointment) => {
        const appointmentElement = document.createElement("div");
        appointmentElement.innerHTML = `
        <h3>${appointment.service}</h3>
        <p>Barbeiro: ${appointment.barber}</p>
        <p>Data: ${formatDate(appointment.date)}</p>
        <p>Horário: ${appointment.time}</p>
        <p>Duração: ${appointment.duration} minutos</p>
        <p>Valor: ${appointment.value}</p>
        <div id="ico-atl">
          <img id="confirm" src="./img/verifica.png" alt="Confirmar" onclick="confirmAppointment(${
            appointment.id
          }, this)">
          <img id="exclude" src="./img/excluir.png" alt="Excluir" onclick="deleteAppointment(${
            appointment.id
          }, this)">
        </div>
        <hr/>
      `;
        appointmentsList.appendChild(appointmentElement);
      });
    } else {
      appointmentsList.innerHTML =
        "<p>Não há agendamentos para este barbeiro.</p>";
    }
  }

  function formatDate(dateString) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  }

  // Atualiza a lista de agendamentos ao mudar a seleção do barbeiro
  barberSelect.addEventListener("change", filterAppointments);

  // Função para confirmar o atendimento e postar na rota /caixa
  window.confirmAppointment = function (appointmentId, element) {
    const selectedBarber = barberSelect.value;

    const appointment = allAppointments.find(
      (app) => app.id === appointmentId && app.barber === selectedBarber
    );

    if (!appointment) {
      console.error("Agendamento não encontrado ou barbeiro incorreto.");
      return;
    }

    const confirmedElement = document.createElement("p");
    confirmedElement.innerText = "Atendimento realizado";
    confirmedElement.style.color = "green";

    const appointmentElement = element.closest("div").parentElement;
    appointmentElement.appendChild(confirmedElement);

    // Post para a rota /caixa
    fetch("https://KinkBarbearia.pythonanywhere.com/caixa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        barber_name: appointment.barber,
        service: appointment.service,
        value: appointment.value,
        date: appointment.date,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Transação registrada:", data);

        // DELETE do agendamento
        return fetch(
          `https://KinkBarbearia.pythonanywhere.com/appointments/${appointmentId}?barber=${encodeURIComponent(
            selectedBarber
          )}`,
          {
            method: "DELETE",
          }
        );
      })
      .then((response) => response.json())
      .then((data) => {
        console.log("Agendamento deletado:", data);

        // Remove o agendamento da lista e atualiza a interface
        allAppointments = allAppointments.filter(
          (app) => app.id !== appointmentId
        );
        filterAppointments();
      })
      .catch((error) => console.error("Erro ao registrar ou deletar:", error));

    element.removeEventListener("click", confirmAppointment);
    element.style.pointerEvents = "none";
  };
});
document.addEventListener("DOMContentLoaded", function () {
  const caixaSection = document.getElementById("caixaSection");
  const caixaLink = document.querySelector('a[href="#caixa"]');

  // Mostrar a div do caixa quando o link "Caixa" for clicado
  caixaLink.addEventListener("click", function (event) {
    event.preventDefault();
    caixaSection.style.display = "block";
  });

  // Formatação de data para exibição no resultado
  function formatDateForUser(dateString) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  }

  // Manipulação do envio do formulário de consulta ao caixa
  document
    .getElementById("caixaForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const selectedDate = document.getElementById("caixaDate").value;
      const selectedBarber = document.getElementById("barberCaixaSelect").value;

      // Formatação da data para exibição
      const formattedDateForUser = formatDateForUser(selectedDate);

      // Fetch para a rota /caixa passando a data como parâmetro
      fetch(
        `https://KinkBarbearia.pythonanywhere.com/caixa?date=${encodeURIComponent(
          selectedDate
        )}`
      )
        .then((response) => response.json())
        .then((data) => {
          // Filtra os dados para o barbeiro selecionado
          const barberData = data.find(
            (item) => item.barber_name === selectedBarber
          );

          // Exibe o resultado no elemento apropriado
          const caixaResult = document.getElementById("caixaResult");
          if (barberData) {
            caixaResult.innerHTML = `
              <p>Caixa de ${selectedBarber} em ${formattedDateForUser}:</p>
              <p>Valor Total: ${barberData.total_cash}</p>
            `;
          } else {
            caixaResult.innerHTML = `
              <p>Não foram encontrados registros para ${selectedBarber} em ${formattedDateForUser}.</p>
            `;
          }
        })
        .catch((error) => {
          console.error("Error fetching caixa data:", error);
        });
    });
});

//excluir
function deleteAppointment(appointmentId, element) {
  const selectedBarber = barberSelect.value;

  fetch(
    `https://KinkBarbearia.pythonanywhere.com/appointments/${appointmentId}?barber=${encodeURIComponent(
      selectedBarber
    )}`,
    {
      method: "DELETE",
    }
  )
    .then((response) => {
      if (response.ok) {
        // Remove o elemento da tela se a exclusão for bem-sucedida
        const appointmentElement = element.closest("div").parentElement;
        appointmentElement.remove();
        console.log("Agendamento excluído com sucesso.");
      } else {
        return response.json().then((data) => {
          throw new Error(data.error || "Erro ao excluir o agendamento.");
        });
      }
    })
    .catch((error) => {
      console.error("Erro ao excluir o agendamento:", error);
    });
}
//consultar usuarios
// Exibir seção de usuários e ocultar as outras
document.getElementById("usuariosLink").addEventListener("click", function () {
  document.getElementById("agendaSection").style.display = "none";
  document.getElementById("caixaSection").style.display = "none";
  document.getElementById("usuariosSection").style.display = "block";
  fetchUsers(); // Chama a função para buscar e exibir os usuários
});

function fetchUsers() {
  fetch("https://kinkbarbearia.pythonanywhere.com/users")
    .then((response) => response.json())
    .then((data) => {
      const usuariosList = document.getElementById("usuariosList");
      usuariosList.innerHTML = "";

      data.forEach((user) => {
        const li = document.createElement("li");
        li.className = "list-group-item";

        const nameSpan = document.createElement("span");
        cont
        nameSpan.className = "user-name";
        nameSpan.textContent = user.name;

        const phoneSpan = document.createElement("span");
        phoneSpan.className = "user-phone";
        phoneSpan.textContent = `  ${user.phone}`;

        const emailSpan = document.createElement("span");
        emailSpan.className = "user-email";
        emailSpan.textContent = `  ${user.email}`;

        li.appendChild(nameSpan);
        li.appendChild(phoneSpan);
        li.appendChild(emailSpan);

        usuariosList.appendChild(li);
      });
    })
    .catch((error) => console.error("Erro ao buscar usuários:", error));
}

function filterUsers() {
  const input = document.getElementById("nomeCliente").value.toUpperCase();
  const users = document.querySelectorAll("#usuariosList li");

  users.forEach((user) => {
    if (user.textContent.toUpperCase().includes(input)) {
      user.style.display = "";
    } else {
      user.style.display = "none";
    }
  });
}
