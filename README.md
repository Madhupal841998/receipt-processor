```markdown
# Receipt Processor Web App

## 📦 Technologies Used

- **Frontend**: Angular 18
- **Backend**: Node.js 18.19 (Express)
- **Database**: SQLite
- **OCR**: Tesseract.js, PDF-Parse
- **File Handling**: Multer

---

## 📁 Project Structure

receipt-processor/
│
├── backend/               # Node.js backend with OCR and file upload APIs
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   ├── models/
│   ├── uploads/
│   └── server.js
│
├── frontend/              # Angular 18 frontend
│   ├── src/
│   ├── angular.json
│   └── package.json

````

---

## ⚙️ Requirements

- **Node.js**: v18.19.x
- **npm**: v9+
- **Angular CLI**: v18.x
- **SQLite** running locally

---

## 🚀 Setup Instructions

### 🧩 Backend Setup

```bash
cd backend
npm install
npm run dev
````

> The backend server will run on `http://localhost:3000`.

---

### 🌐 Frontend Setup

```bash
cd frontend
npm install
npm run start
```

> The Angular frontend will run on `http://localhost:4200`.

## ⚙️ Execution Instructions

### 🪛 Pre-requisites

1. Ensure **Node.js v18.19.x** is installed:

   ```bash
   node -v
   ```
2. Install Angular CLI globally:

   ```bash
   npm install -g @angular/cli@18
   ```

---

## 📑 Additional Notes

* For OCR, ensure large file sizes are handled with limits in Multer.
* Extracted merchant name may use keyword-based heuristics and may need further refinement for accuracy.
* Uses `Tesseract.js` and `pdf-parse` for hybrid PDF/image text extraction.

---

## 👨‍💻 Author

**Madhupal Poojary**
📧 [madhu841998@gmail.com](mailto:madhu841998@gmail.com)
🔗 [GitHub](https://github.com/Madhupal841998) | [LinkedIn](https://linkedin.com/in/madhupal-poojary-025367210)

