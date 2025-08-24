const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const nodemailer = require('nodemailer');
const router = express.Router();
const { logActivity } = require('../utils/activityLogger');

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/donations');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Test nodemailer import
console.log('📧 Nodemailer import test:');
console.log('- Nodemailer object:', typeof nodemailer);
console.log('- Nodemailer version:', nodemailer.version);
console.log('- createTransport function:', typeof nodemailer.createTransport);

// Email configuration - using the same email as QR code system
const createTransporter = () => {
  console.log('🔧 Creating email transporter with Gmail configuration...');
  console.log('📧 Nodemailer version:', nodemailer.version);
  console.log('📧 Nodemailer createTransport function:', typeof nodemailer.createTransport);
  
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'museoweb1@gmail.com',
        pass: 'akrtgds yyprsfxyi'
      }
    });
    
    // Test the transporter configuration
    transporter.verify(function(error, success) {
      if (error) {
        console.error('❌ Email transporter verification failed:', error);
      } else {
        console.log('✅ Email transporter is ready to send emails');
      }
    });
    
    return transporter;
  } catch (error) {
    console.error('❌ Error creating transporter:', error);
    throw error;
  }
};

// Enhanced email function with HTML template
const sendAppreciationLetter = async (donorName, donorEmail, donationDetails) => {
  const {
    type,
    date_received,
    amount,
    item_description,
    estimated_value
  } = donationDetails;

  // Format the donation details for display
  const formatDonationDetails = () => {
    let details = [];
    
    if (type === 'monetary' && amount) {
      details.push(`<strong>Amount:</strong> ₱${parseFloat(amount).toLocaleString()}`);
      details.push(`<strong>Payment Method:</strong> Cash (with proof of payment)`);
    }
    
    if (item_description) {
      details.push(`<strong>Item Description:</strong> ${item_description}`);
    }
    
    if (estimated_value) {
      details.push(`<strong>Estimated Value:</strong> ₱${parseFloat(estimated_value).toLocaleString()}`);
    }

    if (type === 'artifact') {
      details.push(`<strong>Legal Documentation:</strong> Ownership certificates and provenance documents provided`);
    }
    
    return details.map(detail => `<li>${detail}</li>`).join('');
  };

  const donationTypeLabels = {
    monetary: 'Monetary Donation',
    artifact: 'Artifact/Historical Item',
    loan: 'Loan (Temporary)'
  };

  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appreciation Letter - Cagayan de Oro City Museum</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #8B6B21;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #8B6B21;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            font-size: 14px;
        }
        .date {
            text-align: right;
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2e2b41;
        }
        .content {
            margin-bottom: 30px;
            text-align: justify;
        }
        .donation-details {
            background-color: #f8f9fa;
            border-left: 4px solid #8B6B21;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .donation-details h3 {
            color: #8B6B21;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .donation-details ul {
            margin: 0;
            padding-left: 20px;
        }
        .donation-details li {
            margin-bottom: 8px;
        }
        .signature {
            margin-top: 40px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        .signature-name {
            font-weight: bold;
            color: #8B6B21;
        }
        .signature-title {
            color: #666;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
        .contact-info {
            background-color: #8B6B21;
            color: white;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            text-align: center;
        }
        .contact-info h4 {
            margin: 0 0 10px 0;
        }
        .contact-info p {
            margin: 5px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏛️ Cagayan de Oro City Museum</div>
            <div class="subtitle">Preserving Our Cultural Heritage</div>
        </div>
        
        <div class="date">${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}</div>
        
        <div class="greeting">Dear ${donorName},</div>
        
        <div class="content">
            <p>On behalf of the entire team at the Cagayan de Oro City Museum, I am delighted to inform you that your generous donation has been approved and accepted with great appreciation.</p>
            
            <p>Your contribution plays a vital role in our mission to preserve and showcase the rich cultural heritage of Cagayan de Oro. Your support enables us to continue our work in educating the community and future generations about our city's history and cultural significance.</p>
            
            <div class="donation-details">
                <h3>📋 Donation Details</h3>
                <ul>
                    <li><strong>Type:</strong> ${donationTypeLabels[type]}</li>
                    <li><strong>Date Received:</strong> ${new Date(date_received).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</li>
                    ${formatDonationDetails()}
                </ul>
            </div>
            
            <p>We are truly grateful for your generosity and commitment to preserving our cultural heritage. Your donation will be carefully documented and utilized to enhance our museum's collections and educational programs.</p>
            
            <p>Our team will contact you soon to arrange the collection or transfer of your donation, and to discuss any specific requirements or arrangements you may have.</p>
        </div>
        
        <div class="signature">
            <p>Once again, thank you for your invaluable support.</p>
            <p class="signature-name">Dr. Maria Santos</p>
            <p class="signature-title">Museum Director</p>
            <p class="signature-title">Cagayan de Oro City Museum</p>
        </div>
        
        <div class="contact-info">
            <h4>📞 Contact Information</h4>
            <p>📍 Address: City Hall Complex, Cagayan de Oro City</p>
            <p>📧 Email: museum@cagayandeoro.gov.ph</p>
            <p>📱 Phone: (088) 123-4567</p>
            <p>🌐 Website: www.cagayandeoromuseum.gov.ph</p>
        </div>
        
        <div class="footer">
            <p>This is an official communication from the Cagayan de Oro City Museum.</p>
            <p>Thank you for supporting our mission to preserve and celebrate our cultural heritage.</p>
        </div>
    </div>
</body>
</html>
  `;

  const textVersion = `
Dear ${donorName},

On behalf of the entire team at the Cagayan de Oro City Museum, I am delighted to inform you that your generous donation has been approved and accepted with great appreciation.

Your contribution plays a vital role in our mission to preserve and showcase the rich cultural heritage of Cagayan de Oro. Your support enables us to continue our work in educating the community and future generations about our city's history and cultural significance.

DONATION DETAILS:
- Type: ${donationTypeLabels[type]}
- Date Received: ${new Date(date_received).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
})}
${type === 'monetary' && amount ? `- Amount: ₱${parseFloat(amount).toLocaleString()}` : ''}
${method ? `- Payment Method: ${method}` : ''}
${item_description ? `- Item Description: ${item_description}` : ''}
${estimated_value ? `- Estimated Value: ₱${parseFloat(estimated_value).toLocaleString()}` : ''}

We are truly grateful for your generosity and commitment to preserving our cultural heritage. Your donation will be carefully documented and utilized to enhance our museum's collections and educational programs.

Our team will contact you soon to arrange the collection or transfer of your donation, and to discuss any specific requirements or arrangements you may have.

Once again, thank you for your invaluable support.

Best regards,
Dr. Maria Santos
Museum Director
Cagayan de Oro City Museum

Contact Information:
Address: City Hall Complex, Cagayan de Oro City
Email: museum@cagayandeoro.gov.ph
Phone: (088) 123-4567
Website: www.cagayandeoromuseum.gov.ph
  `;

  try {
    console.log('📧 Creating email transporter...');
    // Create transporter
    const transporter = createTransporter();
    console.log('✅ Email transporter created successfully');
    
    // Send email
    const mailOptions = {
      from: 'museoweb1@gmail.com',
      to: donorEmail,
      subject: 'Thank You for Your Generous Donation - Cagayan de Oro City Museum',
      text: textVersion,
      html: htmlTemplate
    };

    console.log('📧 Mail options prepared:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      htmlLength: htmlTemplate.length,
      textLength: textVersion.length
    });

    console.log('📧 Attempting to send email...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('📧 APPRECIATION LETTER SENT SUCCESSFULLY:');
    console.log('To:', donorEmail);
    console.log('Message ID:', info.messageId);
    console.log('Subject: Thank You for Your Generous Donation - Cagayan de Oro City Museum');
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ ERROR SENDING EMAIL:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      command: error.command
    });
    
    // Fallback: Log the email content for manual sending
    console.log('📧 EMAIL CONTENT (for manual sending):');
    console.log('To:', donorEmail);
    console.log('Subject: Thank You for Your Generous Donation - Cagayan de Oro City Museum');
    console.log('HTML Content Length:', htmlTemplate.length);
    console.log('Text Content Length:', textVersion.length);
    
    return { success: false, error: error.message };
  }
};

// Generate appreciation letter HTML for PDF download
const generateAppreciationLetterHTML = (donorName, donationDetails) => {
  const {
    type,
    date_received,
    amount,
    item_description,
    estimated_value,
    method
  } = donationDetails;

  const formatDonationDetails = () => {
    let details = [];
    
    if (type === 'monetary' && amount) {
      details.push(`<strong>Amount:</strong> ₱${parseFloat(amount).toLocaleString()}`);
    }
    
    if (method) {
      details.push(`<strong>Payment Method:</strong> ${method}`);
    }
    
    if (item_description) {
      details.push(`<strong>Item Description:</strong> ${item_description}`);
    }
    
    if (estimated_value) {
      details.push(`<strong>Estimated Value:</strong> ₱${parseFloat(estimated_value).toLocaleString()}`);
    }
    
    return details.map(detail => `<li>${detail}</li>`).join('');
  };

  const donationTypeLabels = {
    monetary: 'Monetary Donation',
    artifact: 'Artifact/Historical Item',
    loan: 'Loan (Temporary)'
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appreciation Letter - ${donorName}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #8B6B21;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #8B6B21;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            font-size: 16px;
        }
        .date {
            text-align: right;
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #2e2b41;
        }
        .content {
            margin-bottom: 30px;
            text-align: justify;
        }
        .donation-details {
            background-color: #f8f9fa;
            border-left: 4px solid #8B6B21;
            padding: 20px;
            margin: 20px 0;
        }
        .donation-details h3 {
            color: #8B6B21;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .donation-details ul {
            margin: 0;
            padding-left: 20px;
        }
        .donation-details li {
            margin-bottom: 8px;
        }
        .signature {
            margin-top: 40px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        .signature-name {
            font-weight: bold;
            color: #8B6B21;
        }
        .signature-title {
            color: #666;
            font-size: 14px;
        }
        .contact-info {
            background-color: #8B6B21;
            color: white;
            padding: 15px;
            margin-top: 20px;
            text-align: center;
        }
        .contact-info h4 {
            margin: 0 0 10px 0;
        }
        .contact-info p {
            margin: 5px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🏛️ Cagayan de Oro City Museum</div>
        <div class="subtitle">Preserving Our Cultural Heritage</div>
    </div>
    
    <div class="date">${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })}</div>
    
    <div class="greeting">Dear ${donorName},</div>
    
    <div class="content">
        <p>On behalf of the entire team at the Cagayan de Oro City Museum, I am delighted to inform you that your generous donation has been approved and accepted with great appreciation.</p>
        
        <p>Your contribution plays a vital role in our mission to preserve and showcase the rich cultural heritage of Cagayan de Oro. Your support enables us to continue our work in educating the community and future generations about our city's history and cultural significance.</p>
        
        <div class="donation-details">
            <h3>📋 Donation Details</h3>
            <ul>
                <li><strong>Type:</strong> ${donationTypeLabels[type]}</li>
                <li><strong>Date Received:</strong> ${new Date(date_received).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</li>
                ${formatDonationDetails()}
            </ul>
        </div>
        
        <p>We are truly grateful for your generosity and commitment to preserving our cultural heritage. Your donation will be carefully documented and utilized to enhance our museum's collections and educational programs.</p>
        
        <p>Our team will contact you soon to arrange the collection or transfer of your donation, and to discuss any specific requirements or arrangements you may have.</p>
    </div>
    
    <div class="signature">
        <p>Once again, thank you for your invaluable support.</p>
        <p class="signature-name">Dr. Maria Santos</p>
        <p class="signature-title">Museum Director</p>
        <p class="signature-title">Cagayan de Oro City Museum</p>
    </div>
    
    <div class="contact-info">
        <h4>📞 Contact Information</h4>
        <p>📍 Address: City Hall Complex, Cagayan de Oro City</p>
        <p>📧 Email: museum@cagayandeoro.gov.ph</p>
        <p>📱 Phone: (088) 123-4567</p>
        <p>🌐 Website: www.cagayandeoromuseum.gov.ph</p>
    </div>
</body>
</html>
  `;
};

// Simple email function (you can replace with nodemailer for production)
const sendEmail = async (to, subject, message) => {
  // For now, we'll just log the email
  // In production, use nodemailer or similar service
  console.log('📧 Email would be sent:');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Message:', message);
  
  // TODO: Implement actual email sending
  // Example with nodemailer:
  // const transporter = nodemailer.createTransporter({
  //   service: 'gmail',
  //   auth: { user: 'your-email@gmail.com', pass: 'your-password' }
  // });
  // await transporter.sendMail({ from: 'museum@example.com', to, subject, text: message });
};

// CREATE donation (POST)
router.post('/', upload.fields([
  { name: 'payment_proof', maxCount: 1 },
  { name: 'legal_documents', maxCount: 1 }
]), async (req, res) => {
  const {
    donor_name, donor_email, donor_contact, type, date_received, notes,
    amount, item_description, estimated_value, condition, loan_start_date, loan_end_date,
    source = 'visitor', visitor_phone, visitor_address
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get visitor IP and user agent
    const visitor_ip = req.ip || req.connection.remoteAddress;
    const visitor_user_agent = req.get('User-Agent');

    // Insert into donations
    const [donationResult] = await conn.query(
      'INSERT INTO donations (donor_name, donor_email, donor_contact, type, date_received, notes, source, visitor_ip, visitor_user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [donor_name, donor_email, donor_contact, type, date_received, notes, source, visitor_ip, visitor_user_agent]
    );
    const donationId = donationResult.insertId;

    // Insert into donation_details
    await conn.query(
      `INSERT INTO donation_details (
        donation_id, amount, item_description, estimated_value, \`condition\`, loan_start_date, loan_end_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        donationId,
        amount || null,
        item_description || null,
        estimated_value || null,
        condition || null,
        loan_start_date || null,
        loan_end_date || null
      ]
    );

    // Handle payment proof file upload for monetary donations
    if (type === 'monetary' && req.files && req.files.payment_proof) {
      const paymentProofFile = req.files.payment_proof[0];
      const paymentProofPath = paymentProofFile.path;
      await conn.query(
        `INSERT INTO donation_documents (
          donation_id, document_type, file_name, file_path, file_size, mime_type, uploaded_by, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          donationId,
          'receipt',
          paymentProofFile.originalname,
          paymentProofPath,
          paymentProofFile.size,
          paymentProofFile.mimetype,
          'admin',
          'Payment proof for monetary donation'
        ]
      );
    }

    // Handle legal documents upload for artifacts
    if (type === 'artifact' && req.files && req.files.legal_documents) {
      const legalDocFile = req.files.legal_documents[0];
      const legalDocPath = legalDocFile.path;
      await conn.query(
        `INSERT INTO donation_documents (
          donation_id, document_type, file_name, file_path, file_size, mime_type, uploaded_by, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          donationId,
          'certificate',
          legalDocFile.originalname,
          legalDocPath,
          legalDocFile.size,
          legalDocFile.mimetype,
          'admin',
          'Legal documents for artifact donation'
        ]
      );
    }

    // If this is a visitor submission, create visitor submission record
    if (source === 'visitor') {
      await conn.query(
        'INSERT INTO donation_visitor_submissions (donation_id, visitor_name, visitor_email, visitor_phone, visitor_address, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [donationId, donor_name, donor_email, visitor_phone, visitor_address, visitor_ip, visitor_user_agent]
      );

      // Create public display record for visitor submissions
      await conn.query(
        `INSERT INTO donation_public_display (
          donation_id, display_name, display_description, display_amount, 
          display_donor_name, display_donor_anonymous, display_date, display_category
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          donationId,
          donor_name,
          notes,
          type === 'monetary' ? true : false,
          true, // Show donor name by default
          false, // Not anonymous by default
          true, // Show date
          type // Use donation type as category
        ]
      );
    }

    await conn.commit();
    try { await logActivity(req, 'donation.create', { donationId, type, donor_name, source }); } catch {}
    res.json({ success: true, donationId });
  } catch (err) {
    await conn.rollback();
    console.error('Error creating donation:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// GET all donations (with details)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, dd.amount, dd.item_description, dd.estimated_value, dd.\`condition\`, dd.loan_start_date, dd.loan_end_date
       FROM donations d
       LEFT JOIN donation_details dd ON d.id = dd.donation_id
       ORDER BY d.created_at DESC`
    );
    res.json({ donations: rows });
  } catch (err) {
    console.error('Error fetching donations:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// GET single donation (with details)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT d.*, dd.amount, dd.item_description, dd.estimated_value, dd.\`condition\`, dd.loan_start_date, dd.loan_end_date
       FROM donations d
       LEFT JOIN donation_details dd ON d.id = dd.donation_id
       WHERE d.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Donation not found' });
    }
    res.json({ donation: rows[0] });
  } catch (err) {
    console.error('Error fetching donation:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// UPDATE donation (PUT)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    donor_name, donor_email, donor_contact, type, date_received, notes,
    amount, method, item_description, estimated_value, condition, loan_start_date, loan_end_date
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Update donations
    await conn.query(
      'UPDATE donations SET donor_name=?, donor_email=?, donor_contact=?, type=?, date_received=?, notes=? WHERE id=?',
      [donor_name, donor_email, donor_contact, type, date_received, notes, id]
    );

    // Update donation_details
    await conn.query(
      `UPDATE donation_details SET
        amount=?, method=?, item_description=?, estimated_value=?, \`condition\`=?, loan_start_date=?, loan_end_date=?
       WHERE donation_id=?`,
      [
        amount || null,
        method || null,
        item_description || null,
        estimated_value || null,
        condition || null,
        loan_start_date || null,
        loan_end_date || null,
        id
      ]
    );

    await conn.commit();
    // Optional: when status is included and set to rejected/approved, log it here too
    if (typeof req.body.status === 'string') {
      const s = req.body.status.toLowerCase();
      if (s === 'rejected') { try { await logActivity(req, 'donation.reject', { donationId: id }); } catch {} }
      if (s === 'approved') { try { await logActivity(req, 'donation.approve', { donationId: id }); } catch {} }
    }
    try { await logActivity(req, 'donation.update', { donationId: id }); } catch {}
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('Error updating donation:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// DELETE donation
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Delete related records first (due to foreign key constraints)
    await conn.query('DELETE FROM donation_documents WHERE donation_id = ?', [id]);
    await conn.query('DELETE FROM donation_workflow_log WHERE donation_id = ?', [id]);
    await conn.query('DELETE FROM donation_acknowledgments WHERE donation_id = ?', [id]);
    await conn.query('DELETE FROM donation_requirements WHERE donation_id = ?', [id]);
    await conn.query('DELETE FROM donation_visitor_submissions WHERE donation_id = ?', [id]);
    await conn.query('DELETE FROM donation_public_display WHERE donation_id = ?', [id]);
    await conn.query('DELETE FROM donation_details WHERE donation_id = ?', [id]);
    
    // Delete from donations
    await conn.query('DELETE FROM donations WHERE id = ?', [id]);

    await conn.commit();
    try { await logActivity(req, 'donation.delete', { donationId: id }); } catch {}
    res.json({ success: true, message: 'Donation deleted successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('Error deleting donation:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// APPROVE donation and send appreciation letter
router.post('/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    console.log('🔄 Starting donation approval process for ID:', id);
    
    // Get donation details
    const [donations] = await pool.query(
      `SELECT d.*, dd.amount, dd.item_description, dd.estimated_value
       FROM donations d
       LEFT JOIN donation_details dd ON d.id = dd.donation_id
       WHERE d.id = ?`,
      [id]
    );
    
    if (donations.length === 0) {
      console.log('❌ Donation not found for ID:', id);
      return res.status(404).json({ success: false, error: 'Donation not found' });
    }
    
    const donation = donations[0];
    console.log('📋 Donation details found:', {
      id: donation.id,
      donor_name: donation.donor_name,
      donor_email: donation.donor_email,
      type: donation.type,
      status: donation.status
    });
    
    // Update status to approved
    await pool.query('UPDATE donations SET status = ? WHERE id = ?', ['approved', id]);
    console.log('✅ Donation status updated to approved');
    
    // Send beautiful appreciation letter
    console.log('📧 Attempting to send appreciation letter to:', donation.donor_email);
    const emailResult = await sendAppreciationLetter(
      donation.donor_name, 
      donation.donor_email, 
      {
        type: donation.type,
        date_received: donation.date_received,
        amount: donation.amount,
        item_description: donation.item_description,
        estimated_value: donation.estimated_value
      }
    );
    
    console.log('📧 Email sending result:', emailResult);
    
    if (emailResult.success) {
      console.log('✅ Email sent successfully!');
      try { await logActivity(req, 'donation.approve.email_ok', { donationId: id }); } catch {}
      res.json({ 
        success: true, 
        message: 'Donation approved and appreciation letter sent successfully to donor' 
      });
    } else {
      console.log('⚠️ Email sending failed:', emailResult.error);
      // Donation is still approved, but email failed
      try { await logActivity(req, 'donation.approve.email_failed', { donationId: id, error: emailResult.error }); } catch {}
      res.json({ 
        success: true, 
        message: 'Donation approved but email sending failed. Please check email configuration.',
        emailError: emailResult.error
      });
    }
  } catch (err) {
    console.error('❌ Error in donation approval process:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// REJECT donation (sets status=rejected)
router.post('/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE donations SET status = ? WHERE id = ?', ['rejected', id]);
    try { await logActivity(req, 'donation.reject', { donationId: id }); } catch {}
    res.json({ success: true, message: 'Donation rejected' });
  } catch (err) {
    console.error('❌ Donation reject error:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// GET appreciation letter HTML for download
router.get('/:id/appreciation-letter', async (req, res) => {
  const { id } = req.params;
  try {
    // Get donation details
    const [donations] = await pool.query(
      `SELECT d.*, dd.amount, dd.item_description, dd.estimated_value
       FROM donations d
       LEFT JOIN donation_details dd ON d.id = dd.donation_id
       WHERE d.id = ?`,
      [id]
    );
    
    if (donations.length === 0) {
      return res.status(404).json({ success: false, error: 'Donation not found' });
    }
    
    const donation = donations[0];
    
    // Generate appreciation letter HTML
    const htmlContent = generateAppreciationLetterHTML(donation.donor_name, {
      type: donation.type,
      date_received: donation.date_received,
      amount: donation.amount,
      item_description: donation.item_description,
      estimated_value: donation.estimated_value,
      method: donation.method
    });
    
    // Set headers for HTML download
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="appreciation-letter-${donation.donor_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html"`);
    
    res.send(htmlContent);
  } catch (err) {
    console.error('Error generating appreciation letter:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Simple test endpoint to verify email system
router.get('/test-email-system', async (req, res) => {
  try {
    console.log('🧪 Testing email system...');
    
    // Test transporter creation
    const transporter = createTransporter();
    
    // Test email sending with minimal content
    const testMailOptions = {
      from: 'museoweb1@gmail.com',
      to: 'museoweb1@gmail.com', // Send to self for testing
      subject: 'Test Email - Museum System',
      text: 'This is a test email from the museum donation system.',
      html: '<h1>Test Email</h1><p>This is a test email from the museum donation system.</p>'
    };

    console.log('🧪 Sending test email...');
    const info = await transporter.sendMail(testMailOptions);
    
    console.log('✅ Test email sent successfully:', info.messageId);
    res.json({ 
      success: true, 
      message: 'Email system test successful!',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('❌ Email system test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Email system test failed',
      details: error.message
    });
  }
});

// Test email endpoint (for debugging)
router.post('/test-email', async (req, res) => {
  const { testEmail } = req.body;
  
  if (!testEmail) {
    return res.status(400).json({ success: false, error: 'Test email address is required' });
  }

  try {
    const testDonationDetails = {
      type: 'monetary',
      date_received: new Date().toISOString().split('T')[0],
      amount: '5000',
      item_description: 'Test donation for email verification',
      estimated_value: '5000'
    };

    const result = await sendAppreciationLetter('Test Donor', testEmail, testDonationDetails);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Test email sent successfully!',
        messageId: result.messageId
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Test email failed to send',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send test email',
      details: error.message
    });
  }
});

// ========================================
// ENHANCED DONATION MANAGEMENT ENDPOINTS
// ========================================

// Upload donation documents
router.post('/:id/documents', upload.array('documents', 10), async (req, res) => {
  const { id } = req.params;
  const { document_type, description } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ success: false, error: 'No files uploaded' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const file of files) {
      await conn.query(
        'INSERT INTO donation_documents (donation_id, document_type, file_name, file_path, file_size, mime_type, description, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          document_type || 'other',
          file.originalname,
          `/uploads/donations/${file.filename}`,
          file.size,
          file.mimetype,
          description || '',
          'admin'
        ]
      );
    }

    // Update donation_details to reflect documents uploaded
    await conn.query(
      'UPDATE donation_details SET documents_uploaded = TRUE, documents_count = documents_count + ? WHERE donation_id = ?',
      [files.length, id]
    );

    // Log the workflow action
    await conn.query(
      'INSERT INTO donation_workflow_log (donation_id, action, performed_by, notes) VALUES (?, ?, ?, ?)',
      [id, 'documents_uploaded', 'admin', `${files.length} document(s) uploaded`]
    );

    await conn.commit();
    try { await logActivity(req, 'donation.documents_uploaded', { donationId: id, fileCount: files.length }); } catch {}
    res.json({ success: true, message: `${files.length} document(s) uploaded successfully` });
  } catch (err) {
    await conn.rollback();
    console.error('Error uploading documents:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// Get donation documents
router.get('/:id/documents', async (req, res) => {
  const { id } = req.params;
  try {
    const [documents] = await pool.query(
      'SELECT * FROM donation_documents WHERE donation_id = ? ORDER BY uploaded_at DESC',
      [id]
    );
    res.json({ success: true, documents });
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Get donation requirements
router.get('/:id/requirements', async (req, res) => {
  const { id } = req.params;
  try {
    const [requirements] = await pool.query(
      'SELECT * FROM donation_requirements WHERE donation_id = ? ORDER BY created_at ASC',
      [id]
    );
    res.json({ success: true, requirements });
  } catch (err) {
    console.error('Error fetching requirements:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Update requirement status
router.put('/:id/requirements/:requirementId', async (req, res) => {
  const { id, requirementId } = req.params;
  const { completed, assigned_to, notes, due_date } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const updateData = {};
    if (completed !== undefined) updateData.completed = completed;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
    if (notes !== undefined) updateData.notes = notes;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (completed) updateData.completed_at = new Date();

    if (Object.keys(updateData).length > 0) {
      const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updateData), requirementId];
      
      await conn.query(
        `UPDATE donation_requirements SET ${setClause} WHERE id = ? AND donation_id = ?`,
        [...values, id]
      );
    }

    // Log the workflow action
    await conn.query(
      'INSERT INTO donation_workflow_log (donation_id, action, performed_by, notes) VALUES (?, ?, ?, ?)',
      [id, 'requirement_updated', 'admin', `Requirement ${requirementId} updated`]
    );

    await conn.commit();
    try { await logActivity(req, 'donation.requirement_updated', { donationId: id, requirementId }); } catch {}
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('Error updating requirement:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// Get donation workflow log
router.get('/:id/workflow', async (req, res) => {
  const { id } = req.params;
  try {
    const [workflow] = await pool.query(
      'SELECT * FROM donation_workflow_log WHERE donation_id = ? ORDER BY performed_at DESC',
      [id]
    );
    res.json({ success: true, workflow });
  } catch (err) {
    console.error('Error fetching workflow:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Update donation processing stage
router.put('/:id/stage', async (req, res) => {
  const { id } = req.params;
  const { processing_stage, assigned_to, priority, notes } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get current stage
    const [current] = await conn.query('SELECT processing_stage FROM donations WHERE id = ?', [id]);
    const currentStage = current[0]?.processing_stage;

    // Update donation
    const updateData = {};
    if (processing_stage !== undefined) updateData.processing_stage = processing_stage;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
    if (priority !== undefined) updateData.priority = priority;

    if (Object.keys(updateData).length > 0) {
      const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updateData), id];
      
      await conn.query(
        `UPDATE donations SET ${setClause} WHERE id = ?`,
        [...values, id]
      );
    }

    // Log the workflow action
    await conn.query(
      'INSERT INTO donation_workflow_log (donation_id, action, stage_from, stage_to, performed_by, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [id, 'stage_updated', currentStage, processing_stage, 'admin', notes || 'Stage updated']
    );

    await conn.commit();
    try { await logActivity(req, 'donation.stage_updated', { donationId: id, stage: processing_stage }); } catch {}
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('Error updating stage:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// Create acknowledgment
router.post('/:id/acknowledgments', async (req, res) => {
  const { id } = req.params;
  const { acknowledgment_type, recipient_name, recipient_email, recipient_address, content } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      'INSERT INTO donation_acknowledgments (donation_id, acknowledgment_type, sent_date, sent_by, recipient_name, recipient_email, recipient_address, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, acknowledgment_type, new Date(), 'admin', recipient_name, recipient_email, recipient_address, content]
    );

    // Update donation acknowledgment status
    await conn.query(
      'UPDATE donations SET acknowledgment_sent = TRUE, acknowledgment_date = ?, acknowledgment_type = ? WHERE id = ?',
      [new Date(), acknowledgment_type, id]
    );

    // Log the workflow action
    await conn.query(
      'INSERT INTO donation_workflow_log (donation_id, action, performed_by, notes) VALUES (?, ?, ?, ?)',
      [id, 'acknowledgment_created', 'admin', `${acknowledgment_type} acknowledgment created`]
    );

    await conn.commit();
    try { await logActivity(req, 'donation.acknowledgment_created', { donationId: id, type: acknowledgment_type }); } catch {}
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('Error creating acknowledgment:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// Get donation acknowledgments
router.get('/:id/acknowledgments', async (req, res) => {
  const { id } = req.params;
  try {
    const [acknowledgments] = await pool.query(
      'SELECT * FROM donation_acknowledgments WHERE donation_id = ? ORDER BY created_at DESC',
      [id]
    );
    res.json({ success: true, acknowledgments });
  } catch (err) {
    console.error('Error fetching acknowledgments:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Enhanced GET all donations with new fields
router.get('/enhanced', async (req, res) => {
  try {
    const [donations] = await pool.query(
      `SELECT d.*, dd.*, 
              COUNT(doc.id) as document_count,
              COUNT(req.id) as requirement_count,
              SUM(CASE WHEN req.completed = TRUE THEN 1 ELSE 0 END) as completed_requirements,
              COUNT(ack.id) as acknowledgment_count
       FROM donations d
       LEFT JOIN donation_details dd ON d.id = dd.donation_id
       LEFT JOIN donation_documents doc ON d.id = doc.donation_id
       LEFT JOIN donation_requirements req ON d.id = req.donation_id
       LEFT JOIN donation_acknowledgments ack ON d.id = ack.donation_id
       GROUP BY d.id
       ORDER BY d.created_at DESC`
    );
    res.json({ success: true, donations });
  } catch (err) {
    console.error('Error fetching enhanced donations:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_donations,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_donations,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_donations,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_donations,
        SUM(CASE WHEN processing_stage = 'received' THEN 1 ELSE 0 END) as received_stage,
        SUM(CASE WHEN processing_stage = 'under_review' THEN 1 ELSE 0 END) as under_review_stage,
        SUM(CASE WHEN processing_stage = 'approved' THEN 1 ELSE 0 END) as approved_stage,
        SUM(CASE WHEN processing_stage = 'completed' THEN 1 ELSE 0 END) as completed_stage,
        SUM(CASE WHEN acknowledgment_sent = FALSE THEN 1 ELSE 0 END) as pending_acknowledgments,
        SUM(CASE WHEN city_acknowledgment_required = TRUE AND city_acknowledgment_sent = FALSE THEN 1 ELSE 0 END) as pending_city_acknowledgments,
        SUM(CASE WHEN source = 'visitor' THEN 1 ELSE 0 END) as visitor_submissions,
        SUM(CASE WHEN source = 'admin' THEN 1 ELSE 0 END) as admin_created,
        SUM(CASE WHEN source = 'staff' THEN 1 ELSE 0 END) as staff_created
      FROM donations
    `);
    
    const [typeStats] = await pool.query(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count
      FROM donations 
      GROUP BY type
    `);

    const [priorityStats] = await pool.query(`
      SELECT 
        priority,
        COUNT(*) as count
      FROM donations 
      WHERE priority IS NOT NULL
      GROUP BY priority
    `);

    const [visitorSubmissionStats] = await pool.query(`
      SELECT 
        submission_status,
        COUNT(*) as count
      FROM donation_visitor_submissions 
      GROUP BY submission_status
    `);

    res.json({ 
      success: true, 
      stats: stats[0], 
      typeStats, 
      priorityStats,
      visitorSubmissionStats
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// ========================================
// VISITOR SUBMISSION MANAGEMENT
// ========================================

// Get visitor submissions
router.get('/visitor-submissions', async (req, res) => {
  try {
    const [submissions] = await pool.query(`
      SELECT 
        dvs.*,
        d.donor_name,
        d.donor_email,
        d.type,
        d.status,
        d.processing_stage,
        d.priority,
        dd.amount,
        dd.item_description,
        dd.estimated_value
      FROM donation_visitor_submissions dvs
      JOIN donations d ON dvs.donation_id = d.id
      LEFT JOIN donation_details dd ON d.id = dd.donation_id
      ORDER BY dvs.submission_date DESC
    `);
    res.json({ success: true, submissions });
  } catch (err) {
    console.error('Error fetching visitor submissions:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Update visitor submission status
router.put('/visitor-submissions/:id', async (req, res) => {
  const { id } = req.params;
  const { submission_status, admin_notes, contact_attempts, last_contact_date, next_followup_date } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const updateData = {};
    if (submission_status !== undefined) updateData.submission_status = submission_status;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    if (contact_attempts !== undefined) updateData.contact_attempts = contact_attempts;
    if (last_contact_date !== undefined) updateData.last_contact_date = last_contact_date;
    if (next_followup_date !== undefined) updateData.next_followup_date = next_followup_date;

    if (Object.keys(updateData).length > 0) {
      const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updateData), id];
      
      await conn.query(
        `UPDATE donation_visitor_submissions SET ${setClause} WHERE id = ?`,
        [...values, id]
      );
    }

    // Log the workflow action
    const [submission] = await conn.query('SELECT donation_id FROM donation_visitor_submissions WHERE id = ?', [id]);
    if (submission.length > 0) {
      await conn.query(
        'INSERT INTO donation_workflow_log (donation_id, action, performed_by, notes) VALUES (?, ?, ?, ?)',
        [submission[0].donation_id, 'visitor_submission_updated', 'admin', `Status updated to: ${submission_status}`]
      );
    }

    await conn.commit();
    try { await logActivity(req, 'donation.visitor_submission_updated', { submissionId: id, status: submission_status }); } catch {}
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('Error updating visitor submission:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// ========================================
// PUBLIC DISPLAY MANAGEMENT
// ========================================

// Get public donations (for visitor display)
router.get('/public', async (req, res) => {
  try {
    const [donations] = await pool.query(`
      SELECT 
        d.id,
        dpd.display_name,
        dpd.display_description,
        dpd.display_amount,
        dpd.display_donor_name,
        dpd.display_donor_anonymous,
        dpd.display_date,
        dpd.display_category,
        dpd.featured,
        dpd.display_order,
        d.type,
        d.date_received,
        d.created_at,
        dd.amount,
        dd.item_description,
        dd.estimated_value,
        CASE 
          WHEN dpd.display_donor_anonymous = TRUE THEN 'Anonymous Donor'
          WHEN dpd.display_donor_name = TRUE THEN d.donor_name
          ELSE 'Anonymous Donor'
        END as display_donor
      FROM donations d
      JOIN donation_public_display dpd ON d.id = dpd.donation_id
      WHERE d.public_visible = TRUE 
      AND d.status = 'approved'
      ORDER BY dpd.featured DESC, dpd.display_order ASC, d.created_at DESC
    `);
    res.json({ success: true, donations });
  } catch (err) {
    console.error('Error fetching public donations:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Update public display settings
router.put('/:id/public-display', async (req, res) => {
  const { id } = req.params;
  const { 
    display_name, 
    display_description, 
    display_amount, 
    display_donor_name, 
    display_donor_anonymous,
    display_date,
    display_category,
    featured,
    display_order,
    public_visible
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Update donation public visibility
    if (public_visible !== undefined) {
      await conn.query('UPDATE donations SET public_visible = ? WHERE id = ?', [public_visible, id]);
    }

    // Update or insert public display settings
    const [existing] = await conn.query('SELECT id FROM donation_public_display WHERE donation_id = ?', [id]);
    
    if (existing.length > 0) {
      // Update existing
      const updateData = {};
      if (display_name !== undefined) updateData.display_name = display_name;
      if (display_description !== undefined) updateData.display_description = display_description;
      if (display_amount !== undefined) updateData.display_amount = display_amount;
      if (display_donor_name !== undefined) updateData.display_donor_name = display_donor_name;
      if (display_donor_anonymous !== undefined) updateData.display_donor_anonymous = display_donor_anonymous;
      if (display_date !== undefined) updateData.display_date = display_date;
      if (display_category !== undefined) updateData.display_category = display_category;
      if (featured !== undefined) updateData.featured = featured;
      if (display_order !== undefined) updateData.display_order = display_order;

      if (Object.keys(updateData).length > 0) {
        const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updateData), id];
        
        await conn.query(
          `UPDATE donation_public_display SET ${setClause} WHERE donation_id = ?`,
          [...values, id]
        );
      }
    } else {
      // Insert new
      await conn.query(
        `INSERT INTO donation_public_display (
          donation_id, display_name, display_description, display_amount, 
          display_donor_name, display_donor_anonymous, display_date, 
          display_category, featured, display_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, 
          display_name || null, 
          display_description || null, 
          display_amount || false,
          display_donor_name || false, 
          display_donor_anonymous || false, 
          display_date || true,
          display_category || null, 
          featured || false, 
          display_order || 0
        ]
      );
    }

    // Log the workflow action
    await conn.query(
      'INSERT INTO donation_workflow_log (donation_id, action, performed_by, notes) VALUES (?, ?, ?, ?)',
      [id, 'public_display_updated', 'admin', 'Public display settings updated']
    );

    await conn.commit();
    try { await logActivity(req, 'donation.public_display_updated', { donationId: id }); } catch {}
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('Error updating public display:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  } finally {
    conn.release();
  }
});

// Get public display settings for a donation
router.get('/:id/public-display', async (req, res) => {
  const { id } = req.params;
  try {
    const [display] = await pool.query(
      'SELECT * FROM donation_public_display WHERE donation_id = ?',
      [id]
    );
    res.json({ success: true, display: display[0] || null });
  } catch (err) {
    console.error('Error fetching public display settings:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

module.exports = router;
