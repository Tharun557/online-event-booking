// ===== Load events from localStorage or use default =====
let events = JSON.parse(localStorage.getItem("events")) || [
  { id: 1, title: "Music Fest 2025", date: "June 10, 2025", location: "Mumbai", seats: 50, booked: 0, organizerId: null, approved: true },
  { id: 2, title: "Tech Conference", date: "July 5, 2025", location: "Bangalore", seats: 100, booked: 0, organizerId: null, approved: true },
  { id: 3, title: "Art Expo", date: "August 20, 2025", location: "Delhi", seats: 80, booked: 0, organizerId: null, approved: true },
  { id: 4, title: "Food Carnival", date: "September 12, 2025", location: "Pune", seats: 60, booked: 0, organizerId: null, approved: true },
];

// Save updated events to localStorage
function saveEvents() {
  localStorage.setItem("events", JSON.stringify(events));
}

// ===== Save bookings =====
let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
function saveBookings() {
  localStorage.setItem("bookings", JSON.stringify(bookings));
}

// ===== Homepage: Load Events =====
function loadEvents() {
  const container = document.getElementById("event-container");
  if (!container) return;

  container.innerHTML = "";
  events.forEach(event => {
    if (!event.approved) return;

    const card = document.createElement("div");
    card.classList.add("event-card");
    card.innerHTML = `
      <h2>${event.title}</h2>
      <p>Date: ${event.date}</p>
      <p>Location: ${event.location}</p>
      <p>Seats Available: ${event.seats - event.booked}</p>
      <a href="event.html?id=${event.id}">View Details</a>
    `;
    container.appendChild(card);
  });
}

// ===== Event Detail Page =====
function getEventIdFromURL(paramName = "id") {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get(paramName));
}

function loadEventDetail() {
  const container = document.getElementById("event-detail");
  if (!container) return;

  const eventId = getEventIdFromURL();
  const event = events.find(e => e.id === eventId);

  if (!event) {
    container.innerHTML = "<p>Event not found.</p>";
    return;
  }

  let bookButtonHTML = "";
  if (event.seats - event.booked > 0) {
    bookButtonHTML = `<button onclick="goToBooking(${event.id})">Book Now</button>`;
  } else {
    bookButtonHTML = `<p style='color:red;'><strong>Sold Out!</strong></p>`;
  }

  container.innerHTML = `
    <h2>${event.title}</h2>
    <p><strong>Date:</strong> ${event.date}</p>
    <p><strong>Location:</strong> ${event.location}</p>
    <p><strong>Description:</strong> Lorem ipsum dolor sit amet.</p>
    <p><strong>Seats Available:</strong> ${event.seats - event.booked}</p>
    ${bookButtonHTML}
  `;
}

function goToBooking(eventId) {
  window.location.href = `booking.html?eventId=${eventId}`;
}

// ===== Booking Page =====
function handleBookingForm() {
  const form = document.getElementById("booking-form");
  if (!form) return;

  const eventId = getEventIdFromURL("eventId");
  const event = events.find(e => e.id === eventId);
  const container = document.getElementById("selected-event");

  if (container && event) {
    container.innerHTML = `
      <h3>${event.title}</h3>
      <p><strong>Date:</strong> ${event.date}</p>
      <p><strong>Location:</strong> ${event.location}</p>
      <p><strong>Seats Available:</strong> ${event.seats - event.booked}</p>
    `;
  }

  const numTicketsInput = document.getElementById("num-tickets");
  if (numTicketsInput && event) {
    numTicketsInput.max = event.seats - event.booked;
    if (event.seats - event.booked === 0) {
      form.style.display = "none";
      container.innerHTML += "<p style='color:red;'><strong>Sold Out!</strong></p>";
    }
  }

  form.addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("user-name").value.trim();
    const email = document.getElementById("user-email").value.trim();
    const numTickets = parseInt(document.getElementById("num-tickets").value);
    const loggedUser = JSON.parse(localStorage.getItem("loggedInUser"));

    if (!event) { alert("Event not found."); return; }
    if (numTickets < 1) { alert("You must book at least 1 ticket."); return; }
    if (numTickets > event.seats - event.booked) {
      alert(`Only ${event.seats - event.booked} seats are available for this event.`);
      return;
    }

    event.booked += numTickets;
    saveEvents();

    const ticketId = `TKT${eventId}${Date.now()}`;

    // Save booking to bookings array
    bookings.push({
      ticketId: ticketId,
      eventId: event.id,
      eventTitle: event.title,
      name: loggedUser ? loggedUser.name : name,
      email: loggedUser ? loggedUser.email : email,
      tickets: numTickets
    });
    saveBookings();

    document.getElementById("confirmation-message").innerHTML = `
      Thank you, ${name}! <br>
      Your booking is confirmed for <strong>${event.title}</strong>.<br>
      Ticket ID: <strong>${ticketId}</strong><br>
      Number of Tickets: ${numTickets}<br>
      Booked By: <strong>${loggedUser ? loggedUser.name : "Guest"}</strong>
    `;

    form.reset();
  });
}

// ===== Organizer Dashboard =====
function displayMyEvents() {
  const container = document.getElementById("my-events-container");
  if (!container) return;

  const loggedUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedUser || loggedUser.role !== "organizer") return;

  container.innerHTML = "";
  events.forEach(event => {
    if (event.organizerId !== loggedUser.email) return;

    const card = document.createElement("div");
    card.classList.add("my-event-card");
    card.innerHTML = `
      <h3>${event.title}</h3>
      <p><strong>Date:</strong> ${event.date}</p>
      <p><strong>Location:</strong> ${event.location}</p>
      <p><strong>Seats:</strong> ${event.seats}</p>
      <p><strong>Booked:</strong> ${event.booked}</p>
      <p><strong>Description:</strong> ${event.description || "N/A"}</p>
    `;
    container.appendChild(card);
  });
}

function handleAddEvent() {
  const form = document.getElementById("add-event-form");
  if (!form) return;

  form.addEventListener("submit", function(e) {
    e.preventDefault();

    const loggedUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!loggedUser || loggedUser.role !== "organizer") {
      alert("Only organizers can add events.");
      return;
    }

    const seats = parseInt(document.getElementById("event-seats").value);
    if (seats < 1 || seats > 1000) {
      alert("Maximum seats allowed per event: 500.");
      return;
    }

    const newEvent = {
      id: events.length ? Math.max(...events.map(e=>e.id)) + 1 : 1,
      title: document.getElementById("event-title").value.trim(),
      date: document.getElementById("event-date").value,
      location: document.getElementById("event-location").value.trim(),
      description: document.getElementById("event-description").value.trim(),
      seats: seats,
      booked: 0,
      organizerId: loggedUser.email,
      approved: false
    };

    events.push(newEvent);
    saveEvents();
    displayMyEvents();
    form.reset();
    alert("Event added! Waiting for admin approval.");
  });
}

// ===== Admin Panel =====
function loadAdminDashboard() {
  const eventsTable = document.querySelector("#admin-events-table tbody");
  const bookingsTable = document.querySelector("#admin-bookings-table tbody");
  if (!eventsTable || !bookingsTable) return;

  // Events table
  eventsTable.innerHTML = "";
  events.forEach((event, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${event.id}</td>
      <td>${event.title}</td>
      <td>${event.date}</td>
      <td>${event.location}</td>
      <td>${event.seats}</td>
      <td>${event.approved ? "Approved" : "Pending"}</td>
      <td>
        ${event.approved ? "" : `<button onclick="approveEvent(${index})">Approve</button>`}
        <button onclick="deleteEvent(${index})">Delete</button>
      </td>
    `;
    eventsTable.appendChild(row);
  });

  // Bookings table
  bookingsTable.innerHTML = "";
  bookings.forEach(booking => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${booking.ticketId}</td>
      <td>${booking.name}</td>
      <td>${booking.email}</td>
      <td>${booking.eventTitle}</td>
      <td>${booking.tickets}</td>
    `;
    bookingsTable.appendChild(row);
  });
}

function approveEvent(index) {
  events[index].approved = true;
  saveEvents();
  loadAdminDashboard();
}

function deleteEvent(index) {
  if (confirm("Are you sure you want to delete this event?")) {
    events.splice(index, 1);
    saveEvents();
    loadAdminDashboard();
  }
}

// ===== Login/Register =====
function handleRegistration() {
  const form = document.getElementById("register-form");
  if (!form) return;

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    const user = {
      name: document.getElementById("reg-name").value.trim(),
      email: document.getElementById("reg-email").value.trim(),
      password: document.getElementById("reg-password").value.trim(),
      role: document.getElementById("reg-role").value
    };

    const users = JSON.parse(localStorage.getItem("users")) || [];
    users.push(user);
    localStorage.setItem("users", JSON.stringify(users));

    alert("Registration successful! Please login.");
    window.location.href = "login.html";
  });
}

function handleLogin() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const found = users.find(u => u.email === email && u.password === password);

    const message = document.getElementById("login-message");
    if (!found) {
      message.textContent = "Invalid email or password!";
      message.style.color = "red";
    } else {
      localStorage.setItem("loggedInUser", JSON.stringify(found));
      message.textContent = `Welcome ${found.name}!`;
      message.style.color = "green";

      setTimeout(() => {
        if (found.role === "admin") window.location.href = "admin.html";
        else if (found.role === "organizer") window.location.href = "organizer.html";
        else window.location.href = "index.html";
      }, 1000);
    }
  });
}

// ===== Initialize all on DOMContentLoaded =====
document.addEventListener("DOMContentLoaded", () => {
  loadEvents();
  loadEventDetail();
  handleBookingForm();
  handleAddEvent();
  displayMyEvents();
  loadAdminDashboard();
  handleRegistration();
  handleLogin();
});
