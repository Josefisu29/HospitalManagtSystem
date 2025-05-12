// Show loading overlay
function showLoading() {
  const overlay = document.createElement("div");
  overlay.className = "loading-overlay";
  overlay.innerHTML = '<div class="loading-spinner"></div>';
  document.body.appendChild(overlay);
}

// Hide loading overlay
function hideLoading() {
  const overlay = document.querySelector(".loading-overlay");
  if (overlay) {
    overlay.remove();
  }
}

// Show error message
function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.innerHTML = `
    <span>${message}</span>
    <button class="close-btn">&times;</button>
  `;

  const container = document.querySelector("main");
  container.insertBefore(errorDiv, container.firstChild);

  errorDiv.querySelector(".close-btn").addEventListener("click", () => {
    errorDiv.remove();
  });

  // Auto-remove after 5 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

// Show success message
function showSuccess(message) {
  const successDiv = document.createElement("div");
  successDiv.className = "success-message";
  successDiv.innerHTML = `
    <span>${message}</span>
    <button class="close-btn">&times;</button>
  `;

  const container = document.querySelector("main");
  container.insertBefore(successDiv, container.firstChild);

  successDiv.querySelector(".close-btn").addEventListener("click", () => {
    successDiv.remove();
  });

  // Auto-remove after 5 seconds
  setTimeout(() => {
    successDiv.remove();
  }, 5000);
}

// Table sorting functionality
function setupTableSorting(tableId, columns) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const headers = table.querySelectorAll("th");
  headers.forEach((header, index) => {
    if (columns.includes(index)) {
      header.style.cursor = "pointer";
      header.addEventListener("click", () => {
        sortTable(table, index);
      });
    }
  });
}

function sortTable(table, column) {
  const tbody = table.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));
  const header = table.querySelectorAll("th")[column];
  const isAsc = header.classList.contains("asc");

  // Remove sort classes from all headers
  table.querySelectorAll("th").forEach((th) => {
    th.classList.remove("asc", "desc");
  });

  // Add sort class to current header
  header.classList.add(isAsc ? "desc" : "asc");

  // Sort rows
  rows.sort((a, b) => {
    const aValue = a.cells[column].textContent.trim();
    const bValue = b.cells[column].textContent.trim();

    if (isAsc) {
      return bValue.localeCompare(aValue);
    } else {
      return aValue.localeCompare(bValue);
    }
  });

  // Reorder rows
  rows.forEach((row) => tbody.appendChild(row));
}

// Table filtering functionality
function setupTableFiltering(tableId, columns) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const controls = document.createElement("div");
  controls.className = "table-controls";

  // Add search box
  const searchBox = document.createElement("input");
  searchBox.type = "text";
  searchBox.className = "search-box";
  searchBox.placeholder = "Search...";
  controls.appendChild(searchBox);

  // Add filter dropdowns for each column
  columns.forEach((column) => {
    const header = table.querySelectorAll("th")[column];
    const filterDropdown = document.createElement("select");
    filterDropdown.className = "filter-dropdown";
    filterDropdown.innerHTML = `
      <option value="">All ${header.textContent}</option>
      ${getUniqueValues(table, column)
        .map((value) => `<option value="${value}">${value}</option>`)
        .join("")}
    `;
    controls.appendChild(filterDropdown);
  });

  // Insert controls before table
  table.parentNode.insertBefore(controls, table);

  // Add event listeners
  searchBox.addEventListener("input", () =>
    filterTable(table, columns, searchBox, controls)
  );
  controls.querySelectorAll(".filter-dropdown").forEach((dropdown, index) => {
    dropdown.addEventListener("change", () =>
      filterTable(table, columns, searchBox, controls)
    );
  });
}

function getUniqueValues(table, column) {
  const values = new Set();
  table.querySelectorAll("tbody tr").forEach((row) => {
    values.add(row.cells[column].textContent.trim());
  });
  return Array.from(values).sort();
}

function filterTable(table, columns, searchBox, controls) {
  const searchValue = searchBox.value.toLowerCase();
  const filters = Array.from(controls.querySelectorAll(".filter-dropdown")).map(
    (dropdown) => dropdown.value
  );

  table.querySelectorAll("tbody tr").forEach((row) => {
    const matchesSearch =
      searchValue === "" ||
      Array.from(row.cells).some((cell) =>
        cell.textContent.toLowerCase().includes(searchValue)
      );

    const matchesFilters = filters.every(
      (filter, index) =>
        filter === "" || row.cells[columns[index]].textContent.trim() === filter
    );

    row.style.display = matchesSearch && matchesFilters ? "" : "none";
  });
}

// Export functions
export {
  showLoading,
  hideLoading,
  showError,
  showSuccess,
  setupTableSorting,
  setupTableFiltering,
};
// status.js

/**
 * Initializes the online/offline status indicator.
 *
 * @param {string} indicatorId - The ID of the status indicator element.
 */
export function initStatusIndicator(indicatorId = "statusIndicator") {
  const indicator = document.getElementById(indicatorId);
  if (!indicator) {
    console.warn(`Status indicator element "#${indicatorId}" not found.`);
    return;
  }

  function update() {
    if (navigator.onLine) {
      indicator.classList.remove("offline");
      indicator.classList.add("online");
      indicator.title = "Online";
    } else {
      indicator.classList.remove("online");
      indicator.classList.add("offline");
      indicator.title = "Offline";
    }
  }

  // Listen for browser events
  window.addEventListener("online", update); // :contentReference[oaicite:0]{index=0}
  window.addEventListener("offline", update); // :contentReference[oaicite:1]{index=1}

  // Set initial state
  update(); // :contentReference[oaicite:2]{index=2}
}
