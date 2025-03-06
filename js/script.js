document.getElementById("fileInput").addEventListener("change", processCSV);

let allSeats = [];

// Load seats from JSON file
fetch("seats.json")
  .then((response) => response.json())
  .then((data) => {
    allSeats = data;
  })
  .catch((error) => console.error("Error loading seat data:", error));

function processCSV() {
  const fileInput = document.getElementById("fileInput");
  const errorMessage = document.getElementById("errorMessage");
  const tableBody = document.querySelector("#outputTable tbody");

  errorMessage.textContent = "";
  tableBody.innerHTML = "";

  if (!fileInput.files.length) {
    errorMessage.textContent = "Please select a CSV file.";
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const csvData = e.target.result;
    let rows = csvData.split("\n").map((row) => row.split(","));

    if (rows.length < 3) {
      errorMessage.textContent = "CSV file is missing required columns.";
      return;
    }

    rows.splice(0, 3); // Remove first three rows (headers)

    let processedData = rows
      .map((row) => {
        if (row.length >= 12) {
          return {
            name: row[3].replace(/['"]/g, ""),
            confirmation: row[8].replace(/['"]/g, ""),
            section: row[9].replace(/['"]/g, ""),
            row: row[10].replace(/['"]/g, ""),
            seat: row[11].replace(/['"]/g, ""),
            isVIP: row[5].toLowerCase().includes("vip"), // VIP check
          };
        }
        return null;
      })
      .filter((row) => row);

    if (processedData.length === 0) {
      errorMessage.textContent = "No valid data found.";
      return;
    }

    processedData.sort((a, b) => a.name.localeCompare(b.name));

    processedData.forEach((dataRow) => {
      const tr = document.createElement("tr");

      if (dataRow.isVIP) {
        tr.classList.add("vip-highlight");
      }

      [
        dataRow.name,
        dataRow.confirmation,
        dataRow.section,
        dataRow.row,
        dataRow.seat,
      ].forEach((cellData) => {
        const td = document.createElement("td");
        td.textContent = cellData;
        tr.appendChild(td);
      });

      tableBody.appendChild(tr);
    });
  };

  reader.readAsText(file);
}

// Print table with VIP highlights but without VIP column
function printTable(sortBy = "name") {
  const table = document.getElementById("outputTable");
  const printWindow = window.open("", "", "width=800,height=600");

  let rows = Array.from(table.getElementsByTagName("tr")).slice(1);
  let sortedRows;

  if (sortBy === "seat") {
    sortedRows = rows.sort((a, b) => {
      let rowA = a.cells[3].textContent;
      let rowB = b.cells[3].textContent;
      let seatA = parseInt(a.cells[4].textContent);
      let seatB = parseInt(b.cells[4].textContent);

      return rowA.localeCompare(rowB) || seatA - seatB;
    });
  } else {
    sortedRows = rows.sort((a, b) =>
      a.cells[0].textContent.localeCompare(b.cells[0].textContent)
    );
  }

  let tableHTML = `<table>${table.querySelector("thead").innerHTML}<tbody>`;
  sortedRows.forEach((row) => {
    const rowHTML = row.outerHTML.replace(
      'class="vip-highlight"',
      'style="background-color: gold;"'
    ); // Preserve VIP highlight
    tableHTML += rowHTML;
  });
  tableHTML += `</tbody></table>`;

  const style = `
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 10px; background: #fff; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { padding: 6px; border: 1px solid #ddd; }
            th { background: #6a0dad; color: white; }
            tr[style*="background-color: gold;"] { font-weight: bold; }
        </style>
    `;

  printWindow.document.write(
    "<html><head><title>Print List</title>" +
      style +
      "</head><body>" +
      tableHTML +
      "</body></html>"
  );
  printWindow.document.close();
  printWindow.print();
}

// Print VIPs only (highlighted)
function printVIPs() {
  const table = document.getElementById("outputTable");
  const printWindow = window.open("", "", "width=800,height=600");

  const vipRows = Array.from(table.getElementsByTagName("tr"))
    .slice(1)
    .filter((row) => row.classList.contains("vip-highlight"));

  let tableHTML = `<table>${table.querySelector("thead").innerHTML}<tbody>`;
  vipRows.forEach((row) => {
    const rowHTML = row.outerHTML.replace(
      'class="vip-highlight"',
      'style="background-color: gold;"'
    ); // Preserve VIP highlight
    tableHTML += rowHTML;
  });
  tableHTML += `</tbody></table>`;

  const style = `
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 10px; background: #fff; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { padding: 6px; border: 1px solid #ddd; }
            th { background: #6a0dad; color: white; }
            tr[style*="background-color: gold;"] { font-weight: bold; }
        </style>
    `;

  printWindow.document.write(
    "<html><head><title>Print VIPs</title>" +
      style +
      "</head><body>" +
      tableHTML +
      "</body></html>"
  );
  printWindow.document.close();
  printWindow.print();
}

// Function to clean the filename and extract event name + formatted date
function getFormattedFileName(originalName) {
  if (!originalName) return "Admission_List"; // Default fallback name

  // Remove "AdmissionList_Detailed_" and split at " - " to get event name & date
  let cleanName = originalName
    .replace("AdmissionList_Detailed_", "")
    .split(" - ");

  if (cleanName.length < 2) return "Admission_List"; // Ensure we have both parts

  let eventName = cleanName[0].trim(); // Get event name
  let datePart = cleanName[1].trim().split(" at ")[0]; // Get date portion before 'at'

  // Convert "Saturday February 1, 2025" → "01/02/25"
  let dateObj = new Date(datePart);
  if (isNaN(dateObj)) return eventName; // If date is invalid, return just the event name

  let formattedDate = dateObj
    .toLocaleDateString("en-GB")
    .replace(/20(\d{2})$/, "$1"); // Convert to DD/MM/YY

  return `${eventName} - ${formattedDate}`;
}

// Updated Download CSV function
function downloadCSV() {
  let filename =
    getFormattedFileName(document.getElementById("fileInput").files[0]?.name) +
    ".csv";

  let csvContent =
    "data:text/csv;charset=utf-8,Name,Confirmation,Section,Row,Seat\n";
  document.querySelectorAll("#outputTable tbody tr").forEach((row) => {
    csvContent +=
      Array.from(row.children)
        .map((cell) => cell.textContent)
        .join(",") + "\n";
  });

  let encodedUri = encodeURI(csvContent);
  let link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
}

// Updated Download PDF function
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let filename =
    getFormattedFileName(document.getElementById("fileInput").files[0]?.name) +
    ".pdf";

  doc.setFont("helvetica", "bold");
  doc.text("Admission List", 14, 10);

  let headers = [["Name", "Confirmation", "Section", "Row", "Seat"]];
  let data = [];
  let vipRows = new Set();

  document.querySelectorAll("#outputTable tbody tr").forEach((row, index) => {
    let rowData = Array.from(row.children).map((cell) => cell.textContent);
    data.push(rowData);
    if (row.classList.contains("vip-highlight")) vipRows.add(index);
  });

  doc.autoTable({
    head: headers,
    body: data,
    startY: 20,
    theme: "grid",
    headStyles: { fillColor: [106, 13, 173] }, // Purple header
    styles: { fontSize: 10, cellPadding: 2 },
    didParseCell: function (data) {
      if (data.section === "body" && vipRows.has(data.row.index)) {
        data.cell.styles.fillColor = [255, 215, 0]; // Gold background for VIPs
      }
    },
  });

  doc.save(filename);
}
function printAll() {
  const table = document.getElementById("outputTable");
  const allRows = Array.from(table.getElementsByTagName("tr")).slice(1);
  const vipRows = allRows.filter((row) =>
    row.classList.contains("vip-highlight")
  );

  let printWindow = window.open("", "", "width=900,height=800");

  // Sorting functions
  function sortByName(rows) {
    return [...rows].sort((a, b) =>
      a.cells[0].textContent.localeCompare(b.cells[0].textContent)
    );
  }

  function sortBySeat(rows) {
    return [...rows].sort((a, b) => {
      let rowA = a.cells[3].textContent;
      let rowB = b.cells[3].textContent;
      let seatA = parseInt(a.cells[4].textContent);
      let seatB = parseInt(b.cells[4].textContent);
      return rowA.localeCompare(rowB) || seatA - seatB;
    });
  }

  // Preserve VIP highlighting
  function generateTableHTML(title, rows) {
    if (rows.length === 0) return ""; // Skip empty sections

    let tableHTML = `<div class="page-break"><h2>${title}</h2><table>${
      table.querySelector("thead").innerHTML
    }<tbody>`;
    rows.forEach((row) => {
      let rowHTML = row.outerHTML.replace(
        'class="vip-highlight"',
        'style="background-color: gold;"'
      ); // Ensure VIPs stay highlighted
      tableHTML += rowHTML;
    });
    tableHTML += `</tbody></table></div>`;

    return tableHTML;
  }

  // Generate all sections
  let alphabeticalHTML = generateTableHTML(
    "Full Admission List (Alphabetical)",
    sortByName(allRows)
  );
  let seatOrderHTML = generateTableHTML(
    "Full Admission List (Seat Order)",
    sortBySeat(allRows)
  );
  let vipHTML = generateTableHTML("VIP Guest List", sortByName(vipRows));

  // CSS Styling
  const style = `
      <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 10px; background: #fff; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
          th, td { padding: 6px; border: 1px solid #ddd; }
          th { background: #6a0dad; color: white; }
          
          /* Ensure VIP guests are highlighted */
          tr[style*="background-color: gold;"] { font-weight: bold; }
          
          /* Page break for each section */
          .page-break {
              page-break-before: always;
              padding-top: 50px; /* Extra space for double-sided printing */
          }
          
          /* Print colors correctly */
          @media print {
              tr[style*="background-color: gold;"] { -webkit-print-color-adjust: exact; }
          }
      </style>
  `;

  // Open print window
  printWindow.document.write(
    `<html><head><title>Print All</title>${style}</head><body>${alphabeticalHTML}${seatOrderHTML}${vipHTML}</body></html>`
  );
  printWindow.document.close();
  printWindow.print();
}
