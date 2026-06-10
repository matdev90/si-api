const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const Incident = require('../models/Incident');

const ALL_COLUMNS = [
  { key: 'incident_date', label: 'Tanggal' },
  { key: 'incident_time', label: 'Waktu' },
  { key: 'incident_type', label: 'Tipe' },
  { key: 'severity', label: 'Severity' },
  { key: 'status', label: 'Status' },
  { key: 'location', label: 'Lokasi' },
  { key: 'reporter_name', label: 'Pelapor' },
  { key: 'reporter_unit', label: 'Unit' },
  { key: 'description', label: 'Kronologis' },
  { key: 'consequence', label: 'Akibat' },
  { key: 'immediate_action', label: 'Tindakan' },
];

function buildFilters(query, user) {
  const filters = {};
  if (user.role === 'kepala_unit') filters.unit = user.unit;
  if (query.status) filters.status = query.status;
  if (query.severity) filters.severity = query.severity;
  if (query.incident_type) filters.incident_type = query.incident_type;
  if (query.start_date) filters.start_date = query.start_date;
  if (query.end_date) filters.end_date = query.end_date;
  if (query.search) filters.search = query.search;
  if (query.unit) filters.unit = query.unit;
  return filters;
}

function parseColumns(cols) {
  if (!cols) return ALL_COLUMNS;
  const selected = cols.split(',').map(c => c.trim());
  return ALL_COLUMNS.filter(c => selected.includes(c.key));
}

async function getReportData(req) {
  const filters = buildFilters(req.query, req.user);
  const columns = parseColumns(req.query.columns);
  const { rows } = await Incident.findAll(filters);
  const data = rows.map(r => {
    const row = {};
    columns.forEach(c => {
      row[c.label] = r[c.key] || '-';
    });
    return row;
  });
  return { data, columns, filters };
}

async function list(req, res, next) {
  try {
    const { data, columns } = await getReportData(req);
    res.json({ data, columns, total: data.length });
  } catch (err) { next(err); }
}

async function exportExcel(req, res, next) {
  try {
    const { data } = await getReportData(req);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=laporan_insiden_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (err) { next(err); }
}

async function exportPDF(req, res, next) {
  try {
    const { data, columns } = await getReportData(req);
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=laporan_insiden_${Date.now()}.pdf`);
    doc.pipe(res);

    doc.fontSize(16).font('Helvetica-Bold').text('Laporan Insiden Keselamatan Pasien', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('RSUD dr. R. Soedjono Selong', { align: 'center' });
    doc.moveDown(0.5);
    const filterParts = [];
    if (req.query.start_date) filterParts.push(`Dari: ${req.query.start_date}`);
    if (req.query.end_date) filterParts.push(`Sampai: ${req.query.end_date}`);
    if (req.query.status) filterParts.push(`Status: ${req.query.status}`);
    if (req.query.severity) filterParts.push(`Severity: ${req.query.severity}`);
    if (filterParts.length) {
      doc.fontSize(8).text(`Filter: ${filterParts.join(' | ')}`, { align: 'center' });
    }
    doc.fontSize(8).text(`Dicetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, { align: 'right' });
    doc.moveDown();

    const colKeys = columns.map(c => c.key);
    const colLabels = columns.map(c => c.label);

    data.forEach((item, i) => {
      if (i > 0) doc.moveDown(0.4);
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text(`${i + 1}. ${item.Tanggal || item['Tanggal'] || ''} - ${item.Tipe || item['Tipe'] || ''}`);
      doc.fontSize(8).font('Helvetica');
      colLabels.forEach((label, j) => {
        if (j < 2) return;
        const val = item[label];
        if (val && val !== '-') {
          doc.text(`   ${label}: ${String(val).substring(0, 150)}`, { indent: 10 });
        }
      });
    });

    doc.end();
  } catch (err) { next(err); }
}

module.exports = { list, exportExcel, exportPDF, ALL_COLUMNS };
