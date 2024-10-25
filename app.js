const http = require('http');
const fs = require('fs');
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/expense_tracker')
    .then(() => console.log('Database Connected'))
    .catch(err => console.error('Database connection error:', err));

// Define Schema and Model
const schema = new mongoose.Schema({
    date: Date,
    category: String,
    amount: Number,
    description: String
});
const Expense = mongoose.model('expenses', schema);

const server = http.createServer((req, res) => {
    console.log(`Received ${req.method} request for ${req.url}`); // Log every request

    if (req.url === "/" && req.method === "GET") {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.createReadStream('index.html').pipe(res);
    } else if (req.url === "/" && req.method === "POST") {
        let rawdata = '';
        req.on('data', chunk => rawdata += chunk);
        req.on('end', () => {
            const formdata = new URLSearchParams(rawdata);
            Expense.create({
                date: formdata.get('date'),
                category: formdata.get('category'),
                amount: parseFloat(formdata.get('amount')),
                description: formdata.get('description')
            }).then((expense) => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    message: "Expense added successfully",
                    expense: {
                        date: expense.date.toDateString(),
                        category: expense.category,
                        amount: expense.amount.toFixed(2),
                        description: expense.description
                    }
                }));
            }).catch(err => {
                console.error("Error saving expense:", err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Error saving expense" }));
            });
        });
    } else if (req.url === "/search" && req.method === "POST") {
        let rawdata = '';
        req.on('data', chunk => rawdata += chunk);
        req.on('end', () => {
            const formdata = new URLSearchParams(rawdata);
            Expense.find({ category: formdata.get('category') }).then(expenses => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    expenses: expenses.map(expense => ({
                        id: expense._id,
                        date: expense.date.toDateString(),
                        category: expense.category,
                        amount: expense.amount.toFixed(2),
                        description: expense.description
                    }))
                }));
            }).catch(err => {
                console.error("Error searching expenses:", err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Error searching expenses" }));
            });
        });
    } else if (req.url === "/update" && req.method === "POST") {
        let rawdata = '';
        req.on('data', chunk => rawdata += chunk);
        req.on('end', () => {
            const formdata = new URLSearchParams(rawdata);
            Expense.updateOne(
                { _id: formdata.get('id') },
                { $set: { amount: parseFloat(formdata.get('newamount')) } }
            ).then(() => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "Amount updated successfully" }));
            }).catch(err => {
                console.error("Error updating amount:", err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Error updating amount" }));
            });
        });
    } else if (req.url === "/delete" && req.method === "POST") {
        let rawdata = '';
        req.on('data', chunk => rawdata += chunk);
        req.on('end', () => {
            const formdata = new URLSearchParams(rawdata);
            Expense.deleteOne({ _id: formdata.get('id') })
                .then(() => {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: "Expense deleted successfully" }));
                }).catch(err => {
                    console.error("Error deleting expense:", err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Error deleting expense" }));
                });
        });
    } else if (req.url === "/expenses" && req.method === "GET") {
        Expense.find().then(expenses => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(expenses));
        }).catch(err => {
            console.error("Error fetching expenses:", err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Error fetching expenses" }));
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.write("404 Not Found");
        res.end();
    }
});

server.listen(8000, () => {
    console.log('Server started on port 8000 at localhost');
});
