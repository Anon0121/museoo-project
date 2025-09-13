const fs = require('fs');
const path = require('path');

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
}

// Helper function to format time
function formatTime(dateString) {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
}

// Generate comprehensive PDF content from report data
function generateReportPDF(report) {
  // Parse the report data
  let reportData = {};
  if (report.data) {
    try {
      reportData = JSON.parse(report.data);
    } catch (e) {
      console.error('Error parsing report data:', e);
    }
  }

  // Create comprehensive HTML content for PDF
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${report.title || 'Museum Report'}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            background: linear-gradient(135deg, #AB8841, #8B6B21);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .report-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #AB8841;
        }
        .report-info h2 {
            margin: 0 0 15px 0;
            color: #2e2b41;
            font-size: 20px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .info-label {
            font-weight: bold;
            color: #666;
        }
        .info-value {
            color: #333;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #2e2b41;
            font-size: 22px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #AB8841;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-number {
            font-size: 32px;
            font-weight: bold;
            color: #AB8841;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #666;
            font-size: 14px;
        }
        .visitor-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 12px;
        }
        .visitor-table th {
            background: #f8f9fa;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            color: #333;
            border-bottom: 2px solid #ddd;
        }
        .visitor-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #eee;
        }
        .visitor-table tr:nth-child(even) {
            background: #f9f9f9;
        }
        .chart-section {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .chart-title {
            font-size: 18px;
            font-weight: bold;
            color: #2e2b41;
            margin-bottom: 15px;
        }
        .chart-placeholder {
            background: #f8f9fa;
            border: 2px dashed #ddd;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            color: #666;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body { margin: 0; }
            .header { page-break-after: avoid; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Museo Smart</h1>
        <p>Museum Management System - Official Report</p>
        <p>${report.title || 'AI Generated Report'}</p>
    </div>

    <div class="report-info">
        <h2>Report Information</h2>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Report Type:</span>
                <span class="info-value">${report.report_type || 'Analysis'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Period:</span>
                <span class="info-value">${formatDate(report.start_date)} to ${formatDate(report.end_date)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Generated:</span>
                <span class="info-value">${new Date(report.created_at).toLocaleString()}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Total Visitors:</span>
                <span class="info-value">${reportData.totalVisitors || 0}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Key Statistics</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${reportData.totalVisitors || 0}</div>
                <div class="stat-label">Total Visitors</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${reportData.uniqueDays || 0}</div>
                <div class="stat-label">Unique Days</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${reportData.avgVisitorsPerBooking ? reportData.avgVisitorsPerBooking.toFixed(1) : 0}</div>
                <div class="stat-label">Avg Visitors/Booking</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${reportData.visitorDetails ? reportData.visitorDetails.length : 0}</div>
                <div class="stat-label">Individual Records</div>
            </div>
        </div>
    </div>

    ${reportData.demographics && reportData.demographics.length > 0 ? `
    <div class="section">
        <h2>Visitor Demographics</h2>
        <div class="chart-section">
            <div class="chart-title">Visitor Type Distribution</div>
            <table class="visitor-table">
                <thead>
                    <tr>
                        <th>Visitor Type</th>
                        <th>Count</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.demographics.map(demo => {
                        const percentage = reportData.totalVisitors > 0 ? ((demo.count / reportData.totalVisitors) * 100).toFixed(1) : 0;
                        return `
                            <tr>
                                <td>${demo.visitor_type}</td>
                                <td>${demo.count}</td>
                                <td>${percentage}%</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    </div>
    ` : ''}

    ${reportData.timeSlots && reportData.timeSlots.length > 0 ? `
    <div class="section">
        <h2>Popular Time Slots</h2>
        <div class="chart-section">
            <div class="chart-title">Visitor Distribution by Time Slot</div>
            <table class="visitor-table">
                <thead>
                    <tr>
                        <th>Time Slot</th>
                        <th>Visitor Count</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.timeSlots.map(slot => {
                        const percentage = reportData.totalVisitors > 0 ? ((slot.count / reportData.totalVisitors) * 100).toFixed(1) : 0;
                        return `
                            <tr>
                                <td>${slot.timeSlot}</td>
                                <td>${slot.count}</td>
                                <td>${percentage}%</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    </div>
    ` : ''}

    ${reportData.visitorDetails && reportData.visitorDetails.length > 0 ? `
    <div class="section">
        <h2>Complete Visitor Information</h2>
        <p style="color: #666; margin-bottom: 15px; font-style: italic;">
            Detailed information for all visitors who entered the museum (based on QR scan check-in time)
        </p>
        <table class="visitor-table">
            <thead>
                <tr>
                    <th>Visitor ID</th>
                    <th>Name</th>
                    <th>Gender</th>
                    <th>Visitor Type</th>
                    <th>Email</th>
                    <th>Purpose</th>
                    <th>Entry Date</th>
                    <th>QR Scan Time</th>
                    <th>Time Slot</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${reportData.visitorDetails.map(visitor => `
                    <tr>
                        <td>${visitor.visitor_id}</td>
                        <td><strong>${visitor.first_name} ${visitor.last_name}</strong></td>
                        <td>${visitor.gender}</td>
                        <td>${visitor.visitor_type}</td>
                        <td>${visitor.email}</td>
                        <td>${visitor.purpose}</td>
                        <td>${formatDate(visitor.visit_date)}</td>
                        <td>${formatTime(visitor.scan_time)}</td>
                        <td>${visitor.time_slot || 'N/A'}</td>
                        <td>${visitor.booking_status || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="footer">
        <p><strong>Museo Smart - AI-Powered Museum Management System</strong></p>
        <p>This report was generated automatically using AI analysis and contains comprehensive visitor data.</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>
  `;

  // For now, return the HTML content as a buffer
  // In a production environment, you would convert this HTML to PDF using a library like puppeteer
  return Buffer.from(htmlContent, 'utf8');
}

// Generate Excel content with proper formatting
function generateExcelContent(report) {
  // Parse the report data
  let reportData = {};
  if (report.data) {
    try {
      reportData = JSON.parse(report.data);
    } catch (e) {
      console.error('Error parsing report data:', e);
    }
  }

  // Create comprehensive CSV content
  const csvRows = [
    ['Museo Smart - AI Generated Report'],
    [''],
    ['Report Information'],
    ['Title', report.title || 'AI Generated Report'],
    ['Type', report.report_type || 'Analysis'],
    ['Period', `${formatDate(report.start_date)} to ${formatDate(report.end_date)}`],
    ['Generated', new Date(report.created_at).toLocaleString()],
    [''],
    ['Key Statistics'],
    ['Total Visitors', reportData.totalVisitors || 0],
    ['Unique Days', reportData.uniqueDays || 0],
    ['Avg Visitors/Booking', reportData.avgVisitorsPerBooking ? reportData.avgVisitorsPerBooking.toFixed(1) : 0],
    ['Individual Records', reportData.visitorDetails ? reportData.visitorDetails.length : 0],
    ['']
  ];

  // Add demographics data
  if (reportData.demographics && reportData.demographics.length > 0) {
    csvRows.push(['Visitor Demographics']);
            csvRows.push(['Visitor Type', 'Count', 'Percentage']);
        reportData.demographics.forEach(demo => {
            const percentage = reportData.totalVisitors > 0 ? ((demo.count / reportData.totalVisitors) * 100).toFixed(1) : 0;
            csvRows.push([demo.visitor_type, demo.count, `${percentage}%`]);
        });
    csvRows.push(['']);
  }

  // Add time slots data
  if (reportData.timeSlots && reportData.timeSlots.length > 0) {
    csvRows.push(['Popular Time Slots']);
    csvRows.push(['Time Slot', 'Visitor Count', 'Percentage']);
    reportData.timeSlots.forEach(slot => {
      const percentage = reportData.totalVisitors > 0 ? ((slot.count / reportData.totalVisitors) * 100).toFixed(1) : 0;
      csvRows.push([slot.timeSlot, slot.count, `${percentage}%`]);
    });
    csvRows.push(['']);
  }

  // Add visitor details
  if (reportData.visitorDetails && reportData.visitorDetails.length > 0) {
    csvRows.push(['Complete Visitor Information']);
    csvRows.push([
      'Visitor ID', 'First Name', 'Last Name', 'Gender', 'Visitor Type', 
      'Email', 'Purpose', 'Entry Date', 'QR Scan Time', 'Time Slot', 'Status'
    ]);
    reportData.visitorDetails.forEach(visitor => {
      csvRows.push([
        visitor.visitor_id,
        visitor.first_name,
        visitor.last_name,
        visitor.gender,
        visitor.visitor_type,
        visitor.email,
        visitor.purpose,
        formatDate(visitor.visit_date),
        formatTime(visitor.scan_time),
        visitor.time_slot || 'N/A',
        visitor.booking_status || 'N/A'
      ]);
    });
  }

  // Convert to CSV format
  const csvContent = csvRows.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');

  return Buffer.from(csvContent, 'utf8');
}

module.exports = {
  generateReportPDF,
  generateExcelContent
}; 