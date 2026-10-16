import mongoose from 'mongoose';

const walletTransactionSchema = mongoose.Schema(
  {
    // 1. ربط المعاملة بالعميل (صاحب المحفظة)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // 2. نوع العملية (إيداع، خصم، سحب أرباح)
    transactionType: {
      type: String,
      required: true,
      enum: ['Deposit', 'Deduction', 'Withdrawal'],
    },
    // 3. المبلغ الذي تم التعامل عليه
    amount: {
      type: Number,
      required: true,
    },
    // 4. الرصيد المتبقي في المحفظة *بعد* إجراء هذه العملية مباشرة (مهم جداً للمراجعة الحسابية)
    balanceAfter: {
      type: Number,
      required: true,
    },
    // 5. ربط المعاملة بالطلب (اختياري، لأن فيه حركات شحن قد لا تكون مرتبطة بطلب)
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    // 6. توثيق من الذي قام بهذا الإجراء (لو العميل كنسل بنفسه هيكون هو، ولو الأدمن سحب هيكون كود الأدمن)
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // 7. وصف تفصيلي للعملية يظهر للأدمن أو العميل
    description: {
      type: String,
      required: true,
    },
    // 8. حالة معاملة السحب (معلقة، مكتملة، مرفوضة) - فقط للسحوبات
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Rejected'],
    },
  },
  {
    timestamps: true, // عشان يسجل وقت وتاريخ العملية بالملي ثانية تلقائياً (createdAt)
  }
);

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

export default WalletTransaction;