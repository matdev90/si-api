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
  if (user.role === 'kepala_unit' || user.role === 'pelapor') filters.unit = user.unit;
  if (query.status) filters.status = query.status;
  if (query.severity) filters.severity = query.severity;
  if (query.incident_type) filters.incident_type = query.incident_type;
  if (query.start_date) filters.start_date = query.start_date;
  if (query.end_date) filters.end_date = query.end_date;
  if (query.search) filters.search = query.search;
  if (query.location) filters.location = query.location;
  if (query.ruangan_id && ['admin', 'pmkp', 'manajemen'].includes(user.role)) filters.ruangan_id = query.ruangan_id;
  if (query.unit && ['admin', 'pmkp', 'manajemen'].includes(user.role)) filters.unit = query.unit;
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
    const row = { _id: r.id };
    columns.forEach(c => {
      if (c.key === 'location') {
        row[c.label] = r.current_location || r.location || '-';
      } else {
        row[c.label] = r[c.key] || '-';
      }
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

    const Settings = require('../models/Settings');
    const settings = Settings.getAll();
    const rsName = settings.hospital_name || 'RSUD dr. R. Soedjono Selong';

    const pageWidth = doc.page.width - 60;
    const fontSize = 7;
    const headerH = 14;
    const rowH = 18;
    const marginLeft = 30;
    const colLabels = columns.map(c => c.label);
    const colCount = colLabels.length;
    const colWidth = Math.min(pageWidth / colCount, 90);

    function drawHeader() {
      doc.fontSize(16).font('Helvetica-Bold').text('Laporan Insiden Keselamatan Pasien', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(rsName, { align: 'center' });
      doc.moveDown(0.3);
      const filterParts = [];
      if (req.query.start_date) filterParts.push(`Dari: ${req.query.start_date}`);
      if (req.query.end_date) filterParts.push(`Sampai: ${req.query.end_date}`);
      if (req.query.status) filterParts.push(`Status: ${req.query.status}`);
      if (req.query.severity) filterParts.push(`Severity: ${req.query.severity}`);
      if (filterParts.length) {
        doc.fontSize(7).text(`Filter: ${filterParts.join(' | ')}`, { align: 'center' });
      }
      doc.fontSize(7).text(`Dicetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, { align: 'right' });
      doc.moveDown(0.5);
    }

    function drawTable() {
      const startY = doc.y;
      if (startY + 30 > doc.page.height - 30) {
        doc.addPage();
        drawHeader();
      }

      let curY = doc.y;

      // Header row
      doc.rect(marginLeft, curY, colCount * colWidth, headerH).fill('#1e293b');
      doc.fill('#ffffff').font('Helvetica-Bold').fontSize(fontSize);
      colLabels.forEach((label, i) => {
        doc.text(label, marginLeft + i * colWidth + 3, curY + 4, {
          width: colWidth - 4, align: 'left',
        });
      });
      curY += headerH;

      // Data rows
      data.forEach((row, idx) => {
        if (curY + rowH > doc.page.height - 30) {
          doc.addPage();
          drawHeader();
          curY = doc.y;
          doc.rect(marginLeft, curY, colCount * colWidth, headerH).fill('#1e293b');
          doc.fill('#ffffff').font('Helvetica-Bold').fontSize(fontSize);
          colLabels.forEach((label, i) => {
            doc.text(label, marginLeft + i * colWidth + 3, curY + 4, {
              width: colWidth - 4, align: 'left',
            });
          });
          curY += headerH;
        }

        const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
        doc.rect(marginLeft, curY, colCount * colWidth, rowH).fill(bg);
        doc.fill('#1f2937').font('Helvetica').fontSize(fontSize);
        colLabels.forEach((label, i) => {
          const val = String(row[label] || '-');
          doc.text(val.length > 25 ? val.substring(0, 24) + '…' : val,
            marginLeft + i * colWidth + 3, curY + 5, {
            width: colWidth - 4, align: 'left',
          });
        });
        curY += rowH;
      });
      doc.y = curY;
    }

    drawHeader();
    drawTable();
    doc.end();
  } catch (err) { next(err); }
}

module.exports = { list, exportExcel, exportPDF, ALL_COLUMNS };
