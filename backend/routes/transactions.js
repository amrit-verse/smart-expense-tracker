const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

// All routes protected
router.use(protect);

// GET /transactions — Get all transactions (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { type, category, month, year, startDate, endDate } = req.query;
    const filter = { user: req.user._id };

    if (type && ['income', 'expense'].includes(type)) filter.type = type;
    if (category) filter.category = { $regex: category, $options: 'i' };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    } else if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate + 'T23:59:59') };
    }

    const transactions = await Transaction.find(filter).sort({ date: -1 });

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      count: transactions.length,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /add — Add new transaction
router.post('/add', async (req, res) => {
  try {
    const { title, amount, type, category, date, note } = req.body;

    if (!title || !amount || !type || !category || !date) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    const parsedAmount = Number(amount);
    const parsedDate = new Date(date);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be income or expense' });
    }

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid date' });
    }

    const transaction = await Transaction.create({
      title,
      amount: parsedAmount,
      type,
      category,
      date: parsedDate,
      note,
      user: req.user._id
    });

    res.status(201).json({ success: true, message: 'Transaction added', data: transaction });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /delete/:id — Delete transaction
router.delete('/delete/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    await transaction.deleteOne();
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /transactions/summary — Monthly summary
router.get('/summary', async (req, res) => {
  try {
    const summary = await Transaction.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /transactions/categories — Category breakdown
router.get('/categories', async (req, res) => {
  try {
    const { type } = req.query;
    const match = { user: req.user._id };
    if (type) match.type = type;

    const categories = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
