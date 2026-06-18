const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const Incident = require('../models/Incident');

async function exportExcel(req, res, next) {
  try {
    const filters = {};
    if (req.user.role === 'kepala_unit') filters.unit = req.user.unit;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.start_date) filters.start_date = req.query.start_date;
    if (req.query.end_date) filters.end_date = req.query.end_date;

    const { rows: incidents } = await Incident.findAll(filters);

    const data = incidents.map(inc => ({
      ID: inc.id,
      Tipe: inc.incident_type,
      Tanggal: inc.incident_date,
      Waktu: inc.incident_time,
      Lokasi: inc.current_location || inc.location,
      Severity: inc.severity || '-',
      Status: inc.status,
      Pelapor: inc.is_anonymous ? 'Anonim' : inc.reporter_name || '-',
      Unit: inc.is_anonymous ? '-' : inc.reporter_unit || '-',
      Kronologis: inc.description,
      Akibat: inc.consequence,
      Tindakan: inc.immediate_action || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Insiden');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=insiden_export_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

async function exportPDF(req, res, next) {
  try {
    const filters = {};
    if (req.user.role === 'kepala_unit') filters.unit = req.user.unit;
    if (req.query.status) filters.status = req.query.status;

    const { rows: incidents } = await Incident.findAll(filters);
    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=insiden_report_${Date.now()}.pdf`);
    doc.pipe(res);

    doc.fontSize(16).text('Laporan Insiden Keselamatan Pasien', { align: 'center' });
    doc.fontSize(10).text(`RSUD dr. R. Soedjono Selong`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(8).text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, { align: 'right' });
    doc.moveDown();

    incidents.forEach((inc, i) => {
      if (i > 0) { doc.moveDown(0.3); doc.text('─'.repeat(80), { align: 'center' }); doc.moveDown(0.3); }

      doc.fontSize(9);
      doc.text(`${i + 1}. [${inc.incident_type}] ${inc.incident_date} ${inc.incident_time}`);
      doc.text(`   Lokasi: ${inc.current_location || inc.location} | Severity: ${inc.severity || '-'} | Status: ${inc.status}`);
      doc.text(`   Pelapor: ${inc.is_anonymous ? 'Anonim' : inc.reporter_name || '-'}`);
      doc.text(`   Kronologis: ${inc.description?.substring(0, 200)}`);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { exportExcel, exportPDF };
