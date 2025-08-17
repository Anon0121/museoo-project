const express = require('express');
const pool = require('../db');
const nodemailer = require('nodemailer');
const router = express.Router();
const { logActivity } = require('../utils/activityLogger');

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
    estimated_value,
    method
  } = donationDetails;

  // Format the donation details for display
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
    document: 'Document/Archive',
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
    document: 'Document/Archive',
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
router.post('/', async (req, res) => {
  const {
    donor_name, donor_email, donor_contact, type, date_received, notes,
    amount, method, item_description, estimated_value, condition, loan_start_date, loan_end_date
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert into donations
    const [donationResult] = await conn.query(
      'INSERT INTO donations (donor_name, donor_email, donor_contact, type, date_received, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [donor_name, donor_email, donor_contact, type, date_received, notes]
    );
    const donationId = donationResult.insertId;

    // Insert into donation_details
    await conn.query(
      `INSERT INTO donation_details (
        donation_id, amount, method, item_description, estimated_value, \`condition\`, loan_start_date, loan_end_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        donationId,
        amount || null,
        method || null,
        item_description || null,
        estimated_value || null,
        condition || null,
        loan_start_date || null,
        loan_end_date || null
      ]
    );

    await conn.commit();
    try { await logActivity(req, 'donation.create', { donationId, type, donor_name }); } catch {}
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
      `SELECT d.*, dd.amount, dd.method, dd.item_description, dd.estimated_value, dd.\`condition\`, dd.loan_start_date, dd.loan_end_date
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
      `SELECT d.*, dd.amount, dd.method, dd.item_description, dd.estimated_value, dd.\`condition\`, dd.loan_start_date, dd.loan_end_date
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
  try {
    await pool.query('DELETE FROM donations WHERE id = ?', [id]);
    try { await logActivity(req, 'donation.delete', { donationId: id }); } catch {}
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting donation:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// APPROVE donation and send appreciation letter
router.post('/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    console.log('🔄 Starting donation approval process for ID:', id);
    
    // Get donation details
    const [donations] = await pool.query(
      `SELECT d.*, dd.amount, dd.method, dd.item_description, dd.estimated_value
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
        estimated_value: donation.estimated_value,
        method: donation.method
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
      `SELECT d.*, dd.amount, dd.method, dd.item_description, dd.estimated_value
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
      method: 'bank_transfer',
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

module.exports = router;
