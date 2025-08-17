const fs = require('fs');

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
    </style>
</head>
<body>
    <div class="header">
        <h1>Museo Smart</h1>
        <p>Museum Management System - Official Report</p>
        <p>${report.title || 'AI Generated Report'}</p>
    </div>

    <div class="section">
        <h2>Report Summary</h2>
        <p><strong>Report Type:</strong> ${report.report_type || 'Analysis'}</p>
        <p><strong>Period:</strong> ${formatDate(report.start_date)} to ${formatDate(report.end_date)}</p>
        <p><strong>Generated:</strong> ${new Date(report.created_at).toLocaleString()}</p>
        <p><strong>Total Visitors:</strong> ${reportData.totalVisitors || 0}</p>
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

    ${reportData.visitorDetails && reportData.visitorDetails.length > 0 ? `
    <div class="section">
        <h2>Complete Visitor Information</h2>
        <p>Detailed information for all visitors who entered the museum (based on QR scan check-in time)</p>
        <table class="visitor-table">
            <thead>
                <tr>
                    <th>Visitor ID</th>
                    <th>Name</th>
                    <th>Gender</th>
                    <th>Nationality</th>
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
                        <td>${visitor.nationality}</td>
                        <td>${visitor.email}</td>
                        <td>${visitor.purpose}</td>
                        <td>${formatDate(visitor.visit_date)}</td>
                        <td>${new Date(visitor.scan_time).toLocaleTimeString()}</td>
                        <td>${visitor.time_slot || 'N/A'}</td>
                        <td>${visitor.booking_status || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px; color: #666; font-size: 12px;">
        <p><strong>Museo Smart - AI-Powered Museum Management System</strong></p>
        <p>This report was generated automatically using AI analysis and contains comprehensive visitor data.</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>
  `;

  // Return the HTML content as a buffer
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

  // Add visitor details
  if (reportData.visitorDetails && reportData.visitorDetails.length > 0) {
    csvRows.push(['Complete Visitor Information']);
    csvRows.push([
      'Visitor ID', 'First Name', 'Last Name', 'Gender', 'Nationality', 
      'Email', 'Purpose', 'Entry Date', 'QR Scan Time', 'Time Slot', 'Status'
    ]);
    reportData.visitorDetails.forEach(visitor => {
      csvRows.push([
        visitor.visitor_id,
        visitor.first_name,
        visitor.last_name,
        visitor.gender,
        visitor.nationality,
        visitor.email,
        visitor.purpose,
        formatDate(visitor.visit_date),
        new Date(visitor.scan_time).toLocaleTimeString(),
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