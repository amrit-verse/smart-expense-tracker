const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be positive']
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Type is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  note: {
    type: String,
    trim: true,
    maxlength: [300, 'Note cannot exceed 300 characters']
  }
}, {
  timestamps: true
});

TransactionSchema.index({ user: 1, date: -1 });
TransactionSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
