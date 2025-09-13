const express = require('express');
const router = express.Router();
const db = require('../db');
const aiService = require('../services/aiService');
const { logActivity } = require('../utils/activityLogger');
const { generateReportPDF, generateExcelContent } = require('../utils/pdfGenerator');
const { htmlToPdfBuffer } = require('../utils/htmlToPdf');

// Session-based authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    console.log('🔐 User authenticated:', { id: req.user.id, username: req.user.username });
    return next();
  }
  console.log('❌ Authentication failed - no session user');
  return res.status(401).json({ 
    success: false, 
    message: 'Not authenticated' 
  });
};

// Get all reports
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const [reports] = await db.query(`
      SELECT * FROM reports 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [req.user.id]);

    res.json({
      success: true,
      reports: reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports'
    });
  }
});

// Generate AI-powered report
router.post('/generate', isAuthenticated, async (req, res) => {
  try {
    const { reportType, startDate, endDate, includeCharts, includeRecommendations, includePredictions, includeComparisons } = req.body;

    // Validate required fields
    if (!reportType || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Report type, start date, and end date are required'
      });
    }

    // Generate report based on type
    let reportData = {};
    let reportTitle = '';
    let reportDescription = '';

    switch (reportType) {
      case 'visitor_analytics':
        reportData = await generateVisitorAnalytics(startDate, endDate);
        reportTitle = 'Complete Museum Entry Analytics Report';
        reportDescription = `Comprehensive analysis with complete visitor information for those who actually entered the museum (based on QR scan check-in time) from ${startDate} to ${endDate}`;
        break;
      
      case 'monthly_summary':
        reportData = await generateMonthlySummary(startDate, endDate);
        reportTitle = 'Monthly Summary Report';
        reportDescription = `Monthly overview of all museum activities from ${startDate} to ${endDate}`;
        break;
      
      case 'event_performance':
        reportData = await generateEventPerformance(startDate, endDate);
        reportTitle = 'Event Performance Report';
        reportDescription = `Analysis of events and their success metrics from ${startDate} to ${endDate}`;
        break;
      
      case 'financial_report':
        reportData = await generateFinancialReport(startDate, endDate);
        reportTitle = 'Financial Report';
        reportDescription = `Revenue, donations, and financial insights from ${startDate} to ${endDate}`;
        break;
      
      case 'exhibit_analytics':
        reportData = await generateExhibitAnalytics(startDate, endDate);
        reportTitle = 'Exhibit Analytics Report';
        reportDescription = `Popular exhibits and visitor engagement from ${startDate} to ${endDate}`;
        break;
      
      case 'cultural_objects':
        reportData = await generateCulturalObjectsReport(startDate, endDate);
        reportTitle = 'Cultural Objects Report';
        reportDescription = `Newly added artifacts and collection breakdown from ${startDate} to ${endDate}`;
        break;
      
      case 'archive_analytics':
        reportData = await generateArchiveAnalytics(startDate, endDate);
        reportTitle = 'Archive Analytics Report';
        reportDescription = `Digital archive items and trends from ${startDate} to ${endDate}`;
        break;
      
      case 'staff_performance':
        reportData = await generateStaffPerformance(startDate, endDate);
        reportTitle = 'Staff Performance Report';
        reportDescription = `Staff activities and productivity metrics from ${startDate} to ${endDate}`;
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    // Generate AI insights and recommendations using real AI service
    const aiInsights = await aiService.generateInsights(reportData, reportType, includeRecommendations, includePredictions, includeComparisons);

    // Create report content
    const reportContent = generateReportContent(reportData, aiInsights, includeCharts, includePredictions, includeComparisons);

    // Save report to database
    console.log('💾 Saving report for user:', req.user.id);
    const [result] = await db.query(`
      INSERT INTO reports (user_id, title, description, report_type, start_date, end_date, content, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      req.user.id,
      reportTitle,
      reportDescription,
      reportType,
      startDate,
      endDate,
      reportContent,
      JSON.stringify(reportData)
    ]);

    const reportId = result.insertId;
    try { await logActivity(req, 'report.generate', { reportId, reportType, startDate, endDate }); } catch {}

    // Fetch the created report
    const [reports] = await db.query('SELECT * FROM reports WHERE id = ?', [reportId]);
    const report = reports[0];

    res.json({
      success: true,
      message: 'Report generated successfully',
      report: report
    });

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report'
    });
  }
});

// Check AI service status
router.get('/ai-status', isAuthenticated, async (req, res) => {
  try {
    const status = aiService.getStatus();
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('Error checking AI status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check AI status'
    });
  }
});

// Get real-time AI insights
router.get('/real-time-insights', isAuthenticated, async (req, res) => {
  try {
    const insights = await generateRealTimeInsights();
    res.json({
      success: true,
      insights: insights
    });
  } catch (error) {
    console.error('Error generating real-time insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate real-time insights'
    });
  }
});

// AI Chat endpoint
router.post('/ai-chat', isAuthenticated, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get current museum data for context
    const currentData = await getCurrentMuseumData();
    
    // Generate AI response
    const aiResponse = await aiService.generateChatResponse(message, conversationHistory, currentData);

    res.json({
      success: true,
      response: aiResponse.response,
      actions: aiResponse.actions || []
    });

  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message'
    });
  }
});

// Download report
router.get('/:id/download', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'pdf' } = req.query;

    // Fetch report
    const [reports] = await db.query(`
      SELECT * FROM reports 
      WHERE id = ? AND user_id = ?
    `, [id, req.user.id]);

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const report = reports[0];

    // Generate file based on format
    if (format === 'pdf') {
      // Generate polished HTML then render real PDF via Puppeteer
      const htmlContent = generateHTMLReport(report);
      try {
        const pdfBuffer = await htmlToPdfBuffer(htmlContent);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="report-${id}.pdf"`);
        try { await logActivity(req, 'report.download.pdf', { reportId: id }); } catch {}
        return res.send(pdfBuffer);
      } catch (err) {
        console.error('Puppeteer PDF generation failed, falling back to HTML:', err.message);
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="report-${id}.html"`);
        try { await logActivity(req, 'report.download.html', { reportId: id }); } catch {}
        return res.send(htmlContent);
      }
    } else if (format === 'excel') {
      // Generate Excel content
      const excelContent = generateExcelContent(report);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="report-${id}.csv"`);
      try { await logActivity(req, 'report.download.csv', { reportId: id }); } catch {}
      res.send(excelContent);
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported format'
      });
    }

  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download report'
    });
  }
});

// Helper function to generate HTML report
function generateHTMLReport(report) {
  // Parse the report data
  let reportData = {};
  if (report.data) {
    try {
      reportData = JSON.parse(report.data);
    } catch (e) {
      console.error('Error parsing report data:', e);
    }
  }

  // Create comprehensive HTML content
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

    <div class="section">
        <h2>Report Summary</h2>
        <p><strong>Report Type:</strong> ${report.report_type || 'Analysis'}</p>
        <p><strong>Period:</strong> ${report.start_date} to ${report.end_date}</p>
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
                        <td>${new Date(visitor.visit_date).toLocaleDateString()}</td>
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

  return htmlContent;
}

// Helper functions for generating different types of reports
async function generateVisitorAnalytics(startDate, endDate) {
  console.log(`🔍 Generating visitor analytics from ${startDate} to ${endDate}`);
  
  // Get daily visitor statistics based on ACTUAL CHECK-IN TIME
  let [visitors] = await db.query(`
    SELECT 
      COUNT(*) as total_visitors,
      COUNT(DISTINCT DATE(b.checkin_time)) as unique_days,
      AVG(b.total_visitors) as avg_visitors_per_booking,
      DATE(b.checkin_time) as date,
      COUNT(*) as daily_visitors
    FROM visitors v
    LEFT JOIN bookings b ON v.booking_id = b.booking_id
    WHERE b.checkin_time BETWEEN ? AND ? 
    AND b.status = 'checked-in'
    GROUP BY DATE(b.checkin_time)
    ORDER BY date
  `, [startDate, endDate]);

  console.log(`📊 Found ${visitors.length} days with visitor data in specified range`);

  // If no data found in the specified range, get all available data
  if (visitors.length === 0) {
    console.log('⚠️ No data found in specified date range, fetching all available data');
    [visitors] = await db.query(`
      SELECT 
        COUNT(*) as total_visitors,
        COUNT(DISTINCT DATE(b.checkin_time)) as unique_days,
        AVG(b.total_visitors) as avg_visitors_per_booking,
        DATE(b.checkin_time) as date,
        COUNT(*) as daily_visitors
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE b.status = 'checked-in'
      GROUP BY DATE(b.checkin_time)
      ORDER BY date
    `);
    console.log(`📊 Found ${visitors.length} days with visitor data in all available data`);
  }

  // Get actual visitor details based on ACTUAL CHECK-IN TIME
  let [visitorDetails] = await db.query(`
    SELECT 
      v.visitor_id,
      v.first_name,
      v.last_name,
      v.gender,
      v.visitor_type,
      v.email,
      v.address,
      v.purpose,
      v.is_main_visitor,
      v.created_at as registration_date,
      b.checkin_time as scan_time,
      b.checkin_time as visit_date,
      b.time_slot,
      b.date as booking_date,
      b.status as booking_status,
      b.booking_id
    FROM visitors v
    LEFT JOIN bookings b ON v.booking_id = b.booking_id
    WHERE b.checkin_time BETWEEN ? AND ? 
    AND b.status = 'checked-in'
    ORDER BY b.checkin_time DESC
  `, [startDate, endDate]);

  // If no data found in the specified range, get all available data
  if (visitorDetails.length === 0) {
    [visitorDetails] = await db.query(`
      SELECT 
        v.visitor_id,
        v.first_name,
        v.last_name,
        v.gender,
        v.visitor_type,
        v.email,
        v.address,
        v.purpose,
        v.is_main_visitor,
        v.created_at as registration_date,
        b.checkin_time as scan_time,
        b.checkin_time as visit_date,
        b.time_slot,
        b.date as booking_date,
        b.status as booking_status,
        b.booking_id
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE b.status = 'checked-in'
      ORDER BY b.checkin_time DESC
    `);
  }

  // Get demographics based on ACTUAL CHECK-IN TIME
  let [demographics] = await db.query(`
    SELECT 
      v.visitor_type,
      COUNT(*) as count
    FROM visitors v
    LEFT JOIN bookings b ON v.booking_id = b.booking_id
    WHERE b.checkin_time BETWEEN ? AND ? 
    AND b.status = 'checked-in'
    GROUP BY v.visitor_type
    ORDER BY count DESC
    LIMIT 10
  `, [startDate, endDate]);

  // If no data found in the specified range, get all available data
  if (demographics.length === 0) {
    [demographics] = await db.query(`
      SELECT 
        v.visitor_type,
        COUNT(*) as count
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE b.status = 'checked-in'
      GROUP BY v.visitor_type
      ORDER BY count DESC
      LIMIT 10
    `);
  }

  // Get time slots based on ACTUAL CHECK-IN TIME
  let [timeSlots] = await db.query(`
    SELECT 
      b.time_slot,
      COUNT(*) as count
    FROM visitors v
    LEFT JOIN bookings b ON v.booking_id = b.booking_id
    WHERE b.checkin_time BETWEEN ? AND ? 
    AND b.status = 'checked-in'
    GROUP BY b.time_slot
    ORDER BY count DESC
  `, [startDate, endDate]);

  // If no data found in the specified range, get all available data
  if (timeSlots.length === 0) {
    [timeSlots] = await db.query(`
      SELECT 
        b.time_slot,
        COUNT(*) as count
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE b.status = 'checked-in'
      GROUP BY b.time_slot
      ORDER BY count DESC
    `);
  }

  // Get gender distribution based on ACTUAL CHECK-IN TIME
  let [genderDistribution] = await db.query(`
    SELECT 
      v.gender,
      COUNT(*) as count
    FROM visitors v
    LEFT JOIN bookings b ON v.booking_id = b.booking_id
    WHERE b.checkin_time BETWEEN ? AND ?
    AND b.status = 'checked-in'
    GROUP BY v.gender
    ORDER BY count DESC
  `, [startDate, endDate]);

  // If no data found in the specified range, get all available data
  if (genderDistribution.length === 0) {
    [genderDistribution] = await db.query(`
      SELECT 
        v.gender,
        COUNT(*) as count
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE b.status = 'checked-in'
      GROUP BY v.gender
      ORDER BY count DESC
    `);
  }

  // Prepare chart data
  const chartData = {
    dailyVisitors: visitors.map(v => ({
      date: v.date,
      visitors: v.daily_visitors
    })),
    demographics: demographics.map(d => ({
              visitor_type: d.visitor_type,
      count: d.count
    })),
    timeSlots: timeSlots.map(t => ({
      timeSlot: t.time_slot,
      count: t.count
    })),
    genderDistribution: genderDistribution.map(g => ({
      gender: g.gender,
      count: g.count
    }))
  };

  return {
    totalVisitors: visitors.reduce((sum, v) => sum + (v.daily_visitors || 0), 0),
    uniqueDays: visitors.length,
    avgVisitorsPerBooking: visitors.length > 0 ? visitors.reduce((sum, v) => sum + (v.avg_visitors_per_booking || 0), 0) / visitors.length : 0,
    dailyData: visitors,
    demographics: demographics,
    timeSlots: timeSlots,
    visitorDetails: visitorDetails,
    chartData: chartData
  };
}

async function generateMonthlySummary(startDate, endDate) {
  const [visitors] = await db.query(`
    SELECT COUNT(*) as total_visitors
    FROM visitors v
    LEFT JOIN bookings b ON v.booking_id = b.booking_id
    WHERE b.date BETWEEN ? AND ?
  `, [startDate, endDate]);

  const [events] = await db.query(`
    SELECT COUNT(*) as total_events
    FROM activities a
    LEFT JOIN event_details ed ON a.id = ed.activity_id
    WHERE a.type = 'event' 
    AND ed.start_date BETWEEN ? AND ?
  `, [startDate, endDate]);

  const [donations] = await db.query(`
    SELECT COUNT(*) as total_donations, SUM(amount) as total_amount
    FROM donations 
    WHERE created_at BETWEEN ? AND ?
  `, [startDate, endDate]);

  const [exhibits] = await db.query(`
    SELECT COUNT(*) as total_exhibits
    FROM activities a
    LEFT JOIN exhibit_details ed ON a.id = ed.activity_id
    WHERE a.type = 'exhibit' 
    AND ed.start_date BETWEEN ? AND ?
  `, [startDate, endDate]);

  return {
    visitors: visitors[0].total_visitors,
    events: events[0].total_events,
    donations: {
      count: donations[0].total_donations,
      amount: donations[0].total_amount || 0
    },
    exhibits: exhibits[0].total_exhibits
  };
}

async function generateEventPerformance(startDate, endDate) {
  const [events] = await db.query(`
    SELECT 
      a.*,
      ed.start_date,
      ed.time,
      ed.location,
      ed.organizer,
      0 as visitor_count
    FROM activities a
    LEFT JOIN event_details ed ON a.id = ed.activity_id
    WHERE a.type = 'event' 
    AND ed.start_date BETWEEN ? AND ?
    ORDER BY ed.start_date DESC
  `, [startDate, endDate]);
  let resultEvents = events;
  if (resultEvents.length === 0) {
    const [allEvents] = await db.query(`
      SELECT 
        a.*,
        ed.start_date,
        ed.time,
        ed.location,
        ed.organizer,
        0 as visitor_count
      FROM activities a
      LEFT JOIN event_details ed ON a.id = ed.activity_id
      WHERE a.type = 'event'
      ORDER BY ed.start_date DESC
    `);
    resultEvents = allEvents;
  }

  return {
    totalEvents: resultEvents.length,
    events: resultEvents,
    avgVisitorsPerEvent: 0
  };
}

async function generateFinancialReport(startDate, endDate) {
  // Use date_received if available; fallback to created_at
  const [donations] = await db.query(`
    SELECT 
      type,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      AVG(amount) as avg_amount
    FROM donations 
    WHERE (COALESCE(date_received, created_at) BETWEEN ? AND ?)
    GROUP BY type
  `, [startDate, endDate]);

  const [monthlyDonations] = await db.query(`
    SELECT 
      DATE_FORMAT(COALESCE(date_received, created_at), '%Y-%m') as month,
      SUM(amount) as total_amount
    FROM donations 
    WHERE (COALESCE(date_received, created_at) BETWEEN ? AND ?)
    GROUP BY DATE_FORMAT(COALESCE(date_received, created_at), '%Y-%m')
    ORDER BY month
  `, [startDate, endDate]);

  return {
    totalDonations: donations.reduce((sum, d) => sum + d.total_amount, 0),
    donationTypes: donations,
    monthlyData: monthlyDonations
  };
}

async function generateExhibitAnalytics(startDate, endDate) {
  const [exhibits] = await db.query(`
    SELECT 
      a.*,
      ed.start_date,
      ed.end_date,
      ed.location,
      ed.curator,
      ed.category,
      0 as visitor_count
    FROM activities a
    LEFT JOIN exhibit_details ed ON a.id = ed.activity_id
    WHERE a.type = 'exhibit' 
    AND ed.start_date BETWEEN ? AND ?
    ORDER BY ed.start_date DESC
  `, [startDate, endDate]);
  let resultExhibits = exhibits;
  if (resultExhibits.length === 0) {
    const [allExhibits] = await db.query(`
      SELECT 
        a.*,
        ed.start_date,
        ed.end_date,
        ed.location,
        ed.curator,
        ed.category,
        0 as visitor_count
      FROM activities a
      LEFT JOIN exhibit_details ed ON a.id = ed.activity_id
      WHERE a.type = 'exhibit'
      ORDER BY ed.start_date DESC
    `);
    resultExhibits = allExhibits;
  }

  return {
    totalExhibits: resultExhibits.length,
    exhibits: resultExhibits,
    avgVisitorsPerExhibit: 0
  };
}

async function generateCulturalObjectsReport(startDate, endDate) {
  // Newly added artifacts and breakdown by category/period
  const [newObjects] = await db.query(`
    SELECT co.id, co.name, co.category, co.created_at
    FROM cultural_objects co
    WHERE co.created_at BETWEEN ? AND ?
    ORDER BY co.created_at DESC
  `, [startDate, endDate]);

  // Category breakdown
  const [byCategory] = await db.query(`
    SELECT co.category, COUNT(*) as count
    FROM cultural_objects co
    GROUP BY co.category
    ORDER BY count DESC
  `);

  // Period breakdown (if present)
  const [byPeriod] = await db.query(`
    SELECT od.period, COUNT(*) as count
    FROM object_details od
    GROUP BY od.period
    ORDER BY count DESC
  `);

  return {
    totalNewObjects: newObjects.length,
    newObjects,
    byCategory,
    byPeriod
  };
}

async function generateArchiveAnalytics(startDate, endDate) {
  const [archives] = await db.query(`
    SELECT id, title, type, date, created_at
    FROM archives
    WHERE (date BETWEEN ? AND ?) OR (created_at BETWEEN ? AND ?)
    ORDER BY COALESCE(date, created_at) DESC
  `, [startDate, endDate, startDate, endDate]);

  const [byType] = await db.query(`
    SELECT type, COUNT(*) as count
    FROM archives
    GROUP BY type
    ORDER BY count DESC
  `);

  return {
    totalArchives: archives.length,
    archives,
    byType
  };
}

async function generateStaffPerformance(startDate, endDate) {
  const [staffActivities] = await db.query(`
    SELECT 
      u.firstname,
      u.lastname,
      COUNT(v.visitor_id) as visitors_processed,
      COUNT(DISTINCT DATE(b.date)) as days_worked
    FROM system_user u
    LEFT JOIN visitors v ON u.user_ID = v.checked_in_by
    LEFT JOIN bookings b ON v.booking_id = b.booking_id
    WHERE b.date BETWEEN ? AND ? AND u.role = 'staff'
    GROUP BY u.user_ID
    ORDER BY visitors_processed DESC
  `, [startDate, endDate]);

  return {
    totalStaff: staffActivities.length,
    staffActivities: staffActivities,
    avgVisitorsPerStaff: staffActivities.reduce((sum, s) => sum + s.visitors_processed, 0) / staffActivities.length || 0
  };
}



// Generate real-time AI insights
async function generateRealTimeInsights() {
  try {
    const currentData = await getCurrentMuseumData();
    const insights = [];

    // Visitor trend insights
    if (currentData.recentVisitors > 0) {
      const [lastWeekVisitors] = await db.query(`
        SELECT COUNT(*) as count
        FROM visitors v
        LEFT JOIN bookings b ON v.booking_id = b.booking_id
        WHERE b.date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);
      
      const weeklyGrowth = ((currentData.recentVisitors - lastWeekVisitors[0].count) / lastWeekVisitors[0].count * 100).toFixed(1);
      
      if (weeklyGrowth > 10) {
        insights.push({
          type: 'positive',
          icon: 'fa-arrow-up',
          title: 'Visitor Growth',
          description: `Visitor numbers increased by ${weeklyGrowth}% this week compared to last week.`,
          action: {
            label: 'View Analytics',
            reportType: 'visitor_analytics'
          }
        });
      } else if (weeklyGrowth < -10) {
        insights.push({
          type: 'warning',
          icon: 'fa-arrow-down',
          title: 'Visitor Decline',
          description: `Visitor numbers decreased by ${Math.abs(weeklyGrowth)}% this week. Consider promotional activities.`,
          action: {
            label: 'Analyze Trends',
            reportType: 'visitor_analytics'
          }
        });
      }
    }

    // Financial insights
    if (currentData.recentDonations.amount > 0) {
      const [lastMonthDonations] = await db.query(`
        SELECT SUM(amount) as total
        FROM donations 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) 
        AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);
      
      const monthlyGrowth = ((currentData.recentDonations.amount - lastMonthDonations[0].total) / lastMonthDonations[0].total * 100).toFixed(1);
      
      if (monthlyGrowth > 20) {
        insights.push({
          type: 'positive',
          icon: 'fa-dollar-sign',
          title: 'Strong Donations',
          description: `Donations increased by ${monthlyGrowth}% this month. Excellent donor engagement!`,
          action: {
            label: 'Financial Report',
            reportType: 'financial_report'
          }
        });
      }
    }

    // Event insights
    if (currentData.recentEvents > 0) {
      insights.push({
        type: 'info',
        icon: 'fa-calendar',
        title: 'Active Events',
        description: `${currentData.recentEvents} events scheduled this month. Monitor their performance.`,
        action: {
          label: 'Event Analysis',
          reportType: 'event_performance'
        }
      });
    }

    // Staff productivity insights
    const [staffProductivity] = await db.query(`
      SELECT COUNT(DISTINCT u.user_ID) as active_staff
      FROM system_user u
      WHERE u.role = 'staff' AND u.status = 'active'
    `);
    
    if (staffProductivity[0].active_staff > 0) {
      insights.push({
        type: 'info',
        icon: 'fa-users',
        title: 'Staff Activity',
        description: `${staffProductivity[0].active_staff} active staff members. Track their performance.`,
        action: {
          label: 'Staff Report',
          reportType: 'staff_performance'
        }
      });
    }

    return insights.slice(0, 3); // Return top 3 insights
  } catch (error) {
    console.error('Error generating real-time insights:', error);
    return [];
  }
}

// Get current museum data for AI chat context
async function getCurrentMuseumData() {
  try {
    const [visitors] = await db.query(`
      SELECT COUNT(*) as total_visitors
      FROM visitors v
      LEFT JOIN bookings b ON v.booking_id = b.booking_id
      WHERE b.date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    const [events] = await db.query(`
      SELECT COUNT(*) as total_events
      FROM activities a
      LEFT JOIN event_details ed ON a.id = ed.activity_id
      WHERE a.type = 'event' 
      AND ed.start_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    const [donations] = await db.query(`
      SELECT COUNT(*) as total_donations, SUM(amount) as total_amount
      FROM donations 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    return {
      recentVisitors: visitors[0].total_visitors,
      recentEvents: events[0].total_events,
      recentDonations: {
        count: donations[0].total_donations,
        amount: donations[0].total_amount || 0
      }
    };
  } catch (error) {
    console.error('Error getting current museum data:', error);
    return {
      recentVisitors: 0,
      recentEvents: 0,
      recentDonations: { count: 0, amount: 0 }
    };
  }
}

// Generate HTML report content
function generateReportContent(data, insights, includeCharts, includePredictions = false, includeComparisons = false) {
  let content = `
    <div class="report-content">
      <!-- Museum Header with Logo -->
      <div class="museum-header" style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #AB8841, #8B6B21); color: white; border-radius: 10px;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 15px;">
          <div style="width: 80px; height: 80px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
            <div style="width: 60px; height: 60px; background: #AB8841; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 24px; font-weight: bold; color: white;">M</span>
            </div>
          </div>
          <div>
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Museo Smart</h1>
            <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Museum Management System</p>
          </div>
        </div>
        <div style="border-top: 1px solid rgba(255,255,255,0.3); padding-top: 15px;">
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">Official Museum Report</p>
        </div>
      </div>

      <div class="ai-source-info" style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #AB8841;">
        <p style="margin: 0; font-size: 14px; color: #666;">
          <strong>AI Analysis Source:</strong> ${insights.source || 'AI Service'}
        </p>
      </div>
      
      <div class="executive-summary">
        <h2>Executive Summary</h2>
        <p>${insights.summary}</p>
      </div>
      
      <div class="key-insights">
        <h2>Key Insights</h2>
        <ul>
          ${insights.trends.map(trend => `<li>${trend}</li>`).join('')}
        </ul>
      </div>
      
      ${includePredictions && insights.predictions && insights.predictions.length > 0 ? `
      <div class="predictions">
        <h2>AI Predictions</h2>
        <ul>
          ${insights.predictions.map(prediction => `<li>${prediction}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      ${includeComparisons && insights.comparisons && insights.comparisons.length > 0 ? `
      <div class="comparisons">
        <h2>Period Comparisons</h2>
        <ul>
          ${insights.comparisons.map(comparison => `<li>${comparison}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
  `;

  if (insights.recommendations.length > 0) {
    content += `
      <div class="recommendations">
        <h2>AI Recommendations</h2>
        <ul>
          ${insights.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Add visitor list if available
  if (data.visitorDetails && data.visitorDetails.length > 0) {
    content += `
      <div class="visitor-list" style="margin: 20px 0;">
        <h2>Complete Visitor Information</h2>
        <p style="color: #666; margin-bottom: 15px; font-style: italic;">Showing all visitor information recorded in the visitor section for those who actually entered the museum (based on QR scan check-in time)</p>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; font-size: 12px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Visitor ID</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Name</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Gender</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Visitor Type</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Email</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Address</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Purpose</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Main Visitor</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Registration Date</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Booking ID</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Entry Date</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">QR Scan Time</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Time Slot</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.visitorDetails.map(visitor => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.visitor_id}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${visitor.first_name} ${visitor.last_name}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.gender}</td>
                                          <td style="padding: 8px; border: 1px solid #ddd;">${visitor.visitor_type}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.email}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.address}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.purpose}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.is_main_visitor ? 'Yes' : 'No'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.registration_date ? new Date(visitor.registration_date).toLocaleDateString() : 'N/A'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.booking_id}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${new Date(visitor.visit_date).toLocaleDateString()}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.scan_time ? new Date(visitor.scan_time).toLocaleString() : 'N/A'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.time_slot || 'N/A'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${visitor.booking_status || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  if (includeCharts && data.chartData) {
    content += `
      <div class="charts-section">
        <h2>Data Visualization</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
          <!-- Daily Visitors Chart -->
          <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
            <h3 style="margin-top: 0; color: #333;">Daily Visitors Trend</h3>
            <div style="height: 200px; display: flex; align-items: end; justify-content: space-around; gap: 4px;">
              ${data.chartData.dailyVisitors.map(day => {
                const maxVisitors = Math.max(...data.chartData.dailyVisitors.map(d => d.visitors));
                const height = maxVisitors > 0 ? (day.visitors / maxVisitors) * 100 : 0;
                return `
                  <div style="display: flex; flex-direction: column; align-items: center;">
                    <div style="width: 20px; height: ${height}px; background: linear-gradient(to top, #AB8841, #8B6B21); border-radius: 2px;"></div>
                    <span style="font-size: 10px; margin-top: 5px;">${day.visitors}</span>
                  </div>
                `;
              }).join('')}
            </div>
            <p style="text-align: center; margin-top: 10px; font-size: 12px; color: #666;">Daily Visitor Count</p>
          </div>

          <!-- Demographics Chart -->
          <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
                                <h3 style="margin-top: 0; color: #333;">Visitor Type Distribution</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${data.chartData.demographics.map(demo => {
                const total = data.chartData.demographics.reduce((sum, d) => sum + d.count, 0);
                const percentage = total > 0 ? (demo.count / total) * 100 : 0;
                return `
                  <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="font-size: 12px;">${demo.visitor_type}</span>
                      <span style="font-size: 12px;">${demo.count} (${percentage.toFixed(1)}%)</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden;">
                      <div style="width: ${percentage}%; height: 100%; background: linear-gradient(to right, #AB8841, #8B6B21);"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
          <!-- Time Slots Chart -->
          <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
            <h3 style="margin-top: 0; color: #333;">Popular Time Slots</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${data.chartData.timeSlots.map(slot => {
                const maxCount = Math.max(...data.chartData.timeSlots.map(s => s.count));
                const width = maxCount > 0 ? (slot.count / maxCount) * 100 : 0;
                return `
                  <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="font-size: 12px;">${slot.timeSlot}</span>
                      <span style="font-size: 12px;">${slot.count}</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden;">
                      <div style="width: ${width}%; height: 100%; background: linear-gradient(to right, #4CAF50, #45a049);"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Gender Distribution Chart -->
          <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
            <h3 style="margin-top: 0; color: #333;">Gender Distribution</h3>
            <div style="display: flex; justify-content: center; align-items: center; height: 150px;">
              <div style="display: flex; gap: 20px; align-items: center;">
                ${data.chartData.genderDistribution.map(gender => {
                  const total = data.chartData.genderDistribution.reduce((sum, g) => sum + g.count, 0);
                  const percentage = total > 0 ? (gender.count / total) * 100 : 0;
                  const color = gender.gender === 'male' ? '#2196F3' : gender.gender === 'female' ? '#E91E63' : '#9C27B0';
                  return `
                    <div style="text-align: center;">
                      <div style="width: 60px; height: 60px; border-radius: 50%; background: ${color}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin: 0 auto 10px;">
                        ${percentage.toFixed(0)}%
                      </div>
                      <div style="font-size: 12px; font-weight: bold;">${gender.gender}</div>
                      <div style="font-size: 10px; color: #666;">${gender.count} visitors</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  content += `
      <div class="detailed-data">
        <h2>Report Summary</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Key Statistics</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            ${data.totalVisitors ? `<div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #ddd;">
              <div style="font-size: 24px; font-weight: bold; color: #AB8841;">${data.totalVisitors}</div>
              <div style="font-size: 12px; color: #666;">Total Visitors</div>
            </div>` : ''}
            ${data.uniqueDays ? `<div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #ddd;">
              <div style="font-size: 24px; font-weight: bold; color: #AB8841;">${data.uniqueDays}</div>
              <div style="font-size: 12px; color: #666;">Unique Days</div>
            </div>` : ''}
            ${data.avgVisitorsPerBooking ? `<div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #ddd;">
              <div style="font-size: 24px; font-weight: bold; color: #AB8841;">${data.avgVisitorsPerBooking.toFixed(1)}</div>
              <div style="font-size: 12px; color: #666;">Avg Visitors/Booking</div>
            </div>` : ''}
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 8px; border-left: 4px solid #4CAF50;">
          <h3 style="margin-top: 0; color: #2e7d32;">Report Generated Successfully</h3>
          <p style="margin: 0; color: #2e7d32; font-size: 14px;">
            This report was generated using AI-powered analysis and contains comprehensive insights about your museum's visitor data.
          </p>
        </div>
      </div>
    </div>
  `;

  return content;
}





module.exports = router; 