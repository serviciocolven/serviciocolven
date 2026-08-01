import jsPDF from "jspdf";

function fmt(n) {
  return (Number(n) || 0).toLocaleString("es-CO", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

export function generateClosurePdf(closure) {
  const doc = new jsPDF();
  const marginX = 14;
  let y = 20;

  doc.setFontSize(16);
  doc.text("Serviciocolven — Cierre de mes", marginX, y);
  y += 10;

  doc.setFontSize(10);
  doc.text(`Fecha de cierre: ${new Date(closure.date).toLocaleString("es-CO")}`, marginX, y);
  y += 8;

  doc.setFontSize(12);
  doc.text(`Base de caja inicial: ${fmt(closure.base)}`, marginX, y); y += 7;
  doc.text(`Ventas del periodo: ${fmt(closure.ventas)}`, marginX, y); y += 7;
  doc.text(`Gastos del periodo: ${fmt(closure.gastos)}`, marginX, y); y += 7;
  doc.setFontSize(13);
  doc.text(`Ganancia neta: ${fmt(closure.ganancia)}`, marginX, y); y += 7;
  doc.text(`Caja final: ${fmt(closure.cajaFinal)}`, marginX, y); y += 12;

  doc.setFontSize(12);
  doc.text("Movimientos del periodo:", marginX, y);
  y += 8;

  doc.setFontSize(9);
  (closure.entries || []).forEach((e) => {
    if (y > 280) { doc.addPage(); y = 20; }
    const date = new Date(e.timestamp).toLocaleDateString("es-CO");
    const sign = e.amount >= 0 ? "+" : "-";
    doc.text(`${date}  ${e.label}  ${sign}${fmt(Math.abs(e.amount))}`, marginX, y);
    y += 6;
  });

  doc.save(`cierre-${closure.date.slice(0, 10)}.pdf`);
}
