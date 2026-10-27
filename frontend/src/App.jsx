import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  Plus,
  Pencil,
  Trash2,
  X,
  ReceiptText,
  TrendingUp,
  Search,
  CalendarDays,
  CalendarRange,
  Tag,
  CircleDollarSign,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./App.css";

const API_URL = "http://localhost:5000/api/expenses";
const CATEGORIES = ["Food", "Travel", "Bills", "Shopping", "Other"];

const today = () => {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const dateKey = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (value, options = {}) => {
  if (!value) return "No date";
  const [year, month, day] = dateKey(value).split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(
    "en-IN",
    options
  );
};

const formatDateLabel = (value) => {
  if (value === today()) return "Today";

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (value === dateKey(yesterday)) return "Yesterday";

  return formatDate(value, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getInitialForm = () => ({
  title: "",
  amount: "",
  category: "Food",
  date: today(),
});

const getCategoryClass = (category) =>
  (category || "Other").toLowerCase().replace(/\s+/g, "-");

function App() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(getInitialForm);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState(today());
  const [activePage, setActivePage] = useState("Expenses");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Could not load expenses.");
      }

      const data = await response.json();
      setExpenses(Array.isArray(data) ? data : data.expenses || []);
    } catch {
      setError(
        "Unable to connect to the backend. Make sure your server is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const totalSpent = useMemo(
    () =>
      expenses.reduce(
        (sum, expense) => sum + (Number(expense.amount) || 0),
        0
      ),
    [expenses]
  );

  const todayTotal = useMemo(
    () =>
      expenses
        .filter((expense) => dateKey(expense.date) === today())
        .reduce(
          (sum, expense) => sum + (Number(expense.amount) || 0),
          0
        ),
    [expenses]
  );

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((expense) => {
        const searchText = `${expense.title || ""} ${
          expense.category || ""
        }`.toLowerCase();

        const matchesSearch = searchText.includes(search.toLowerCase());
        const matchesCategory =
          categoryFilter === "All" ||
          expense.category === categoryFilter;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) =>
        dateKey(b.date).localeCompare(dateKey(a.date))
      );
  }, [expenses, search, categoryFilter]);

  const dateStrip = useMemo(() => {
    const selected = new Date(`${selectedDate}T12:00:00`);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(selected);
      date.setDate(selected.getDate() + index - 3);
      return dateKey(date);
    });
  }, [selectedDate]);

  const dailyExpenses = useMemo(() => {
    return expenses
      .filter((expense) => {
        const matchesDate = dateKey(expense.date) === selectedDate;

        const searchText = `${expense.title || ""} ${
          expense.category || ""
        }`.toLowerCase();

        const matchesSearch = searchText.includes(search.toLowerCase());
        const matchesCategory =
          categoryFilter === "All" ||
          expense.category === categoryFilter;

        return matchesDate && matchesSearch && matchesCategory;
      })
      .sort((a, b) =>
        dateKey(b.date).localeCompare(dateKey(a.date))
      );
  }, [expenses, selectedDate, search, categoryFilter]);

  const dailyTotal = useMemo(
    () =>
      dailyExpenses.reduce(
        (sum, expense) => sum + (Number(expense.amount) || 0),
        0
      ),
    [dailyExpenses]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const resetForm = () => {
    setForm(getInitialForm());
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.title.trim()) {
      setError("Please enter an expense name.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Please enter an amount greater than zero.");
      return;
    }

    if (!form.date) {
      setError("Please select an expense date.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
    };

    try {
      setSaving(true);

      const response = await fetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Unable to save the expense.");
      }

      await fetchExpenses();

      setSelectedDate(dateKey(result.date || payload.date));
      setActivePage("Calendar");
      setSearch("");
      setCategoryFilter("All");

      setNotice(
        editingId
          ? "Expense updated successfully."
          : "Expense added successfully."
      );

      resetForm();
    } catch (err) {
      setError(err.message || "Unable to save the expense.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (expense) => {
    setForm({
      title: expense.title || "",
      amount: String(expense.amount ?? ""),
      category: expense.category || "Other",
      date: dateKey(expense.date) || today(),
    });

    setEditingId(expense._id);
    setActivePage("Expenses");
    setError("");
    setNotice("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (expense) => {
    if (!window.confirm(`Delete "${expense.title}"?`)) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_URL}/${expense._id}`, {
        method: "DELETE",
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Unable to delete the expense.");
      }

      setExpenses((previous) =>
        previous.filter((item) => item._id !== expense._id)
      );

      if (editingId === expense._id) resetForm();

      setNotice("Expense deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete the expense.");
    }
  };

  const changeSelectedDate = (amount) => {
    const date = new Date(`${selectedDate}T12:00:00`);
    date.setDate(date.getDate() + amount);
    setSelectedDate(dateKey(date));
  };

  const renderExpense = (expense) => (
    <article className="expense-row" key={expense._id}>
      <div
        className={`expense-category-icon ${getCategoryClass(
          expense.category
        )}`}
      >
        {expense.category === "Food" ? (
          <CircleDollarSign size={19} />
        ) : expense.category === "Travel" ? (
          <TrendingUp size={19} />
        ) : expense.category === "Bills" ? (
          <ReceiptText size={19} />
        ) : (
          <Tag size={19} />
        )}
      </div>

      <div className="expense-details">
        <h3>{expense.title}</h3>
        <div className="expense-meta">
          <span
            className={`category-badge ${getCategoryClass(
              expense.category
            )}`}
          >
            {expense.category}
          </span>
          <span>
            {formatDate(expense.date, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      <div className="expense-amount-actions">
        <strong>{formatCurrency(expense.amount)}</strong>
        <div className="row-actions">
          <button
            type="button"
            className="icon-button"
            title="Edit expense"
            aria-label={`Edit ${expense.title}`}
            onClick={() => handleEdit(expense)}
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            className="icon-button delete-button"
            title="Delete expense"
            aria-label={`Delete ${expense.title}`}
            onClick={() => handleDelete(expense)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </article>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Wallet size={25} />
          </div>
          <div>
            <h2>SpendWise</h2>
            <p>PERSONAL FINANCE</p>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <button
          type="button"
          className={`nav-item ${
            activePage === "Expenses" ? "active" : ""
          }`}
          onClick={() => setActivePage("Expenses")}
        >
          <ReceiptText size={19} />
          <span>Expenses</span>
        </button>

        <button
          type="button"
          className={`nav-item ${
            activePage === "Calendar" ? "active" : ""
          }`}
          onClick={() => setActivePage("Calendar")}
        >
          <CalendarRange size={19} />
          <span>Calendar</span>
        </button>

        <div className="sidebar-bottom">
          <div className="sidebar-wallet">
            <div className="wallet-card-top">
              <div className="sidebar-wallet-icon">
                <Wallet size={22} />
              </div>
              <span className="wallet-card-label">TOTAL EXPENSES</span>
            </div>

            <h3>{formatCurrency(totalSpent)}</h3>

            <div className="wallet-card-bottom">
              <span>All recorded expenses</span>
              <TrendingUp size={17} />
            </div>
          </div>

          <p className="sidebar-footer">Spend thoughtfully.</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">PERSONAL EXPENSE TRACKER</p>
            <h1>
              {activePage === "Expenses"
                ? "Manage Expenses"
                : "Expense Calendar"}
            </h1>
            <p className="page-subtitle">
              {activePage === "Expenses"
                ? "Keep track of where your money goes."
                : "Explore your daily spending, one day at a time."}
            </p>
          </div>

          <div className="topbar-date">
            <CalendarDays size={17} />
            <span>
              {formatDate(today(), {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        {error && (
          <div className="message error-message" role="alert">
            {error}
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {notice && (
          <div className="message success-message" role="status">
            {notice}
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon wine-icon">
              <Wallet size={21} />
            </div>
            <div>
              <p>Total expenses</p>
              <h2>{formatCurrency(totalSpent)}</h2>
              <span>All recorded transactions</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon gold-icon">
              <TrendingUp size={21} />
            </div>
            <div>
              <p>Today's spending</p>
              <h2>{formatCurrency(todayTotal)}</h2>
              <span>{formatDateLabel(today())}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon cream-icon">
              <ReceiptText size={21} />
            </div>
            <div>
              <p>Total transactions</p>
              <h2>{expenses.length}</h2>
              <span>Expenses recorded</span>
            </div>
          </div>
        </section>

        <div
          className={`workspace-grid ${
            activePage === "Calendar" ? "calendar-workspace" : ""
          }`}
        >
          {activePage === "Expenses" && (
            <section className="panel form-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">
                    {editingId ? "UPDATE RECORD" : "NEW RECORD"}
                  </span>
                  <h2>{editingId ? "Edit expense" : "Add an expense"}</h2>
                </div>

                {editingId && (
                  <button
                    type="button"
                    className="icon-button"
                    onClick={resetForm}
                    title="Cancel editing"
                    aria-label="Cancel editing"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="expense-form">
                <label htmlFor="title">Expense name</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g. Lunch, bus fare"
                  value={form.title}
                  onChange={handleChange}
                  required
                />

                <label htmlFor="amount">Amount (₹)</label>
                <div className="amount-input-wrap">
                  <span>₹</span>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={handleChange}
                    required
                  />
                </div>

                <label htmlFor="category">Category</label>
                <div className="select-wrap">
                  <Tag size={17} />
                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <label htmlFor="date">Expense date</label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                />

                <button
                  className="primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? (
                    <LoaderCircle className="spin" size={18} />
                  ) : editingId ? (
                    <Pencil size={17} />
                  ) : (
                    <Plus size={19} />
                  )}
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update expense"
                      : "Add expense"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}
              </form>
            </section>
          )}

          {activePage === "Expenses" ? (
            <section className="panel list-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">YOUR RECORDS</span>
                  <h2>Recent expenses</h2>
                </div>
                <div className="record-count">
                  {filteredExpenses.length}
                </div>
              </div>

              <div className="filter-row">
                <div className="search-box">
                  <Search size={17} />
                  <input
                    type="search"
                    placeholder="Search expenses..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                <select
                  className="category-filter"
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(event.target.value)
                  }
                  aria-label="Filter by category"
                >
                  <option value="All">All categories</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="empty-state">
                  <LoaderCircle className="spin" size={25} />
                  <p>Loading expenses...</p>
                </div>
              ) : filteredExpenses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <ReceiptText size={26} />
                  </div>
                  <h3>No expenses found</h3>
                  <p>Add an expense or change your search filters.</p>
                </div>
              ) : (
                <div className="expense-list">
                  {filteredExpenses.map(renderExpense)}
                </div>
              )}
            </section>
          ) : (
            <section className="panel list-panel calendar-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">DAILY OVERVIEW</span>
                  <h2>Spending timeline</h2>
                </div>
                <div className="calendar-heading-icon">
                  <CalendarRange size={22} />
                </div>
              </div>

              <div className="timeline-toolbar">
                <button
                  type="button"
                  className="timeline-arrow"
                  aria-label="Previous day"
                  onClick={() => changeSelectedDate(-1)}
                >
                  <ChevronLeft size={19} />
                </button>

                <input
                  className="timeline-date-picker"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => {
                    if (event.target.value) {
                      setSelectedDate(event.target.value);
                    }
                  }}
                  aria-label="Choose calendar date"
                />

                <button
                  type="button"
                  className="timeline-arrow"
                  aria-label="Next day"
                  onClick={() => changeSelectedDate(1)}
                >
                  <ChevronRight size={19} />
                </button>

                <button
                  type="button"
                  className="today-button"
                  onClick={() => setSelectedDate(today())}
                >
                  Today
                </button>
              </div>

              <div className="date-strip">
                {dateStrip.map((date) => {
                  const isSelected = date === selectedDate;
                  const hasExpenses = expenses.some(
                    (expense) => dateKey(expense.date) === date
                  );

                  const [year, month, day] = date.split("-").map(Number);
                  const dateObject = new Date(year, month - 1, day);

                  return (
                    <button
                      type="button"
                      key={date}
                      className={`date-pill ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={() => setSelectedDate(date)}
                    >
                      <span className="date-weekday">
                        {dateObject.toLocaleDateString("en-IN", {
                          weekday: "short",
                        })}
                      </span>
                      <strong>{day}</strong>
                      <span className="date-month">
                        {dateObject.toLocaleDateString("en-IN", {
                          month: "short",
                        })}
                      </span>
                      <span
                        className={`date-indicator ${
                          hasExpenses ? "has-expenses" : ""
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="daily-summary">
                <div>
                  <span className="section-kicker">
                    {formatDateLabel(selectedDate)}
                  </span>
                  <h2>{formatCurrency(dailyTotal)}</h2>
                  <p>
                    {dailyExpenses.length}{" "}
                    {dailyExpenses.length === 1
                      ? "transaction"
                      : "transactions"}{" "}
                    on this day
                  </p>
                </div>
                <div className="daily-summary-icon">
                  <TrendingUp size={23} />
                </div>
              </div>

              <div className="filter-row calendar-filter-row">
                <div className="search-box">
                  <Search size={17} />
                  <input
                    type="search"
                    placeholder="Search this day..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                <select
                  className="category-filter"
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(event.target.value)
                  }
                  aria-label="Filter calendar expenses by category"
                >
                  <option value="All">All categories</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="empty-state">
                  <LoaderCircle className="spin" size={25} />
                  <p>Loading expenses...</p>
                </div>
              ) : dailyExpenses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <CalendarDays size={26} />
                  </div>
                  <h3>No expenses for this day</h3>
                  <p>
                    Choose another date or add an expense using the
                    Expenses tab.
                  </p>
                </div>
              ) : (
                <div className="expense-list">
                  {dailyExpenses.map(renderExpense)}
                </div>
              )}
            </section>
          )}
        </div>

        <footer className="app-footer">
          <span>SpendWise</span>
          <span>Small steps toward smarter spending.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;