const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Initialize Express App
const app = express();
const port = 2090;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public')); // Serve static files from 'public' directory

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/financial_management', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.log('Failed to connect to MongoDB', err));

// Define Transaction Schema and Model
const transactionSchema = new mongoose.Schema({
    name: String,
    amount: Number,
    type: String,  // 'income' or 'expense'
    date: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Endpoint to fetch all transactions from MongoDB
app.get('/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find();
        res.json(transactions);
    } catch (error) {
        res.status(500).send('Error fetching transactions: ' + error.message);
    }
});

// Endpoint to add a new transaction to MongoDB
app.post('/transactions', async (req, res) => {
    const { name, amount, type } = req.body;

    if (!name || !amount || !type) {
        return res.status(400).send('All fields are required');
    }

    const transaction = new Transaction({
        name,
        amount,
        type
    });

    try {
        const savedTransaction = await transaction.save();
        res.status(201).json(savedTransaction);
    } catch (error) {
        res.status(500).send('Error saving transaction: ' + error.message);
    }
});

// Endpoint to download the report as CSV
app.get('/download-report', async (req, res) => {
    try {
        const transactions = await Transaction.find();
        let csv = 'Name,Amount,Type,Date\n'; // CSV header

        // Format each transaction as CSV
        transactions.forEach(transaction => {
            csv += `${transaction.name},${transaction.amount},${transaction.type},${transaction.date.toISOString()}\n`; // Corrected template literal
        });

        // Set the file headers for CSV download
        res.header('Content-Type', 'text/csv');
        res.attachment('financial_report.csv');
        res.send(csv);  // Send CSV file
    } catch (error) {
        res.status(500).send('Error generating report: ' + error.message);
    }
});

// Endpoint to serve the reports.html file
app.get('/reports.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reports.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`); // Corrected template literal
});