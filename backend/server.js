
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Expense = require("./models/expense");

const app = express();

app.use(cors());
app.use(express.json());

const categories = ["Food", "Travel", "Bills", "Shopping", "Other"];

// Validate expense details
function validateExpense(data) {
  const { title, amount, category, date } = data;

  return (
    typeof title === "string" &&
    title.trim().length > 0 &&
    amount !== "" &&
    amount !== null &&
    amount !== undefined &&
    Number.isFinite(Number(amount)) &&
    Number(amount) > 0 &&
    categories.includes(category) &&
    date &&
    !Number.isNaN(Date.parse(date))
  );
}

// Home route
app.get("/", (req, res) => {
  res.send("Personal Expense Tracker API is running");
});

// READ: Get all expenses
app.get("/api/expenses", async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
});

// CREATE: Add an expense
app.post("/api/expenses", async (req, res) => {
  try {
    if (!validateExpense(req.body)) {
      return res.status(400).json({
        message: "Enter a title, positive amount, valid category and date"
      });
    }

    const expense = await Expense.create({
      title: req.body.title.trim(),
      amount: Number(req.body.amount),
      category: req.body.category,
      date: req.body.date
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE: Edit an expense
app.put("/api/expenses/:id", async (req, res) => {
  try {
    if (!validateExpense(req.body)) {
      return res.status(400).json({
        message: "Enter valid expense details and a positive amount"
      });
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title.trim(),
        amount: Number(req.body.amount),
        category: req.body.category,
        date: req.body.date
      },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE: Remove an expense
app.delete("/api/expenses/:id", async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Invalid expense ID" });
  }
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
