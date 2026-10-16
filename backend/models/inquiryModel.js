import mongoose from 'mongoose';

const inquirySchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    productTitle: { type: String, required: true }, // اسم المنتج اللي العميل مهتم بيه
    message: { type: String, required: true },
    status: { 
      type: String, 
      required: true, 
      default: 'Pending', // الحالات: Pending, Contacted, Closed
      enum: ['Pending', 'Contacted', 'Closed']
    },
  },
  {
    timestamps: true, // عشان يسجل وقت وتاريخ الرسالة تلقائياً
  }
);

const Inquiry = mongoose.model('Inquiry', inquirySchema);

export default Inquiry;