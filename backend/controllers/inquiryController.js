import asyncHandler from '../middleware/asyncHandler.js';
import Inquiry from '../models/inquiryModel.js';
import nodemailer from 'nodemailer';

// Configure mailing engine dependencies components structures
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// @desc    Create new support query inquiry & dispatch background transactional emails
// @route   POST /api/inquiries
// @access  Public
const createInquiry = asyncHandler(async (req, res) => {
  const { name, email, phone, productTitle, message } = req.body;

  // 1. Commit the tracking request data parameters into database storage indices first
  const inquiry = await Inquiry.create({ 
    name, 
    email, 
    phone, 
    productTitle, 
    message 
  });

  if (inquiry) {
    // 2. Draft transactional notifications email messages structural markup layouts
    
    // Professional warning configuration template targeted directly at internal admin channels
    const mailToAdmin = {
      from: `"DKTEC System" <${process.env.EMAIL_USER}>`,
      to: 'manager@dktec.com',
      subject: `🚨 NEW INQUIRY: ${productTitle}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <h2 style="background: #ea580c; color: #fff; padding: 10px;">New Customer Request</h2>
          <p><strong>Customer Name:</strong> ${name}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Product Interested:</strong> <span style="color: #ea580c;">${productTitle}</span></p>
          <hr />
          <p><strong>Message:</strong></p>
          <div style="background: #f4f4f4; padding: 15px; border-left: 4px solid #ea580c;">${message}</div>
        </div>
      `
    };

    // Customer confirmation automated receipt feedback response layout structure (Auto-Reply)
    const mailToCustomer = {
      from: `"DKTEC Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `We received your inquiry regarding ${productTitle}`,
      html: `
        <div style="direction: ltr; font-family: sans-serif; border: 1px solid #eee; padding: 25px; border-radius: 10px;">
          <h2 style="color: #ea580c;">Hello ${name},</h2>
          <p>Thank you for reaching out to <strong>DKTEC</strong>.</p>
          <p>We have successfully received your inquiry about <strong>${productTitle}</strong>.</p>
          <p>Our sales team is currently reviewing your request and will get back to you via phone (<b>${phone}</b>) or email within 24 hours.</p>
          <br/>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #888;">This is an automated response, please do not reply to this email.</p>
          <p>Best Regards,<br/><b>DKTEC Team</b></p>
        </div>
      `
    };

    // 3. Dispatch emails asynchronously inside background loop layers to avoid blocking application response timelines
    // Promise.allSettled guarantees that isolated email failures will never compromise or cascade across adjacent tasks
    Promise.allSettled([
      transporter.sendMail(mailToAdmin),
      transporter.sendMail(mailToCustomer)
    ]).then(results => {
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Email dispatch operation to ${index === 0 ? 'Admin' : 'Customer'} channels failed:`, result.reason);
        }
      });
    });

    res.status(201).json(inquiry);
  } else {
    res.status(400);
    throw new Error('Invalid inquiry documentation details provided.');
  }
});

// @desc    Update query inquiry pipeline status metrics attributes values (Pending -> Contacted -> Closed)
// @route   PUT /api/inquiries/:id
// @access  Private/Admin
const updateInquiryStatus = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);

  if (inquiry) {
    inquiry.status = req.body.status || inquiry.status;
    const updatedInquiry = await inquiry.save();
    res.json(updatedInquiry);
  } else {
    res.status(404);
    throw new Error('Inquiry ticket log parameter reference index not found.');
  }
});

// @desc    Delete a ticket inquiry log entry permanently
// @route   DELETE /api/inquiries/:id
// @access  Private/Admin
const deleteInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);

  if (inquiry) {
    await inquiry.deleteOne();
    res.json({ message: 'Inquiry record file successfully deleted from application tracking indexes.' });
  } else {
    res.status(404);
    throw new Error('Inquiry target tracking index could not be verified.');
  }
});

// @desc    Get all inquiries records dataset arrays for management tracking consoles
// @route   GET /api/inquiries
// @access  Private/Admin
const getInquiries = asyncHandler(async (req, res) => {
  // Sort entries descending from latest configurations down to historic indexes tracking references
  const inquiries = await Inquiry.find({}).sort({ createdAt: -1 });
  res.json(inquiries);
});

export { createInquiry, getInquiries, updateInquiryStatus, deleteInquiry };