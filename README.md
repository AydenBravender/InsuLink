# InsuLink

## About the Project

InsuLink is a project designed to act as a health company for Type 1 Diabetics.  
It helps diabetic individuals and their care-teams monitor and manage insulin data more effectively by linking device output, app inputs, and alerts in one unified interface.

---

## Features

Here are some of the key functionality included:

- Provide linking of insulin events with user device data.
- Dashboard to visualise insulin usage, trends, and alerts.
- Integration or import of sensor/device data (e.g., via Python components).
- Web-based front-end using React/TypeScript for ease of use.
- Responsive UI styled with Tailwind CSS and shadcn-ui.

---

## Tech Stack

The project uses the following technologies:

- **Front-end:** TypeScript, React, built with Vite.
- **UI styling:** Tailwind CSS, shadcn-ui.
- **Back-end / scripts:** Python (various utilities) and Node.js environment for the web part.
- **Package management:** npm/yarn for the front-end; Python requirements.txt for back-end.

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- Node.js
- npm
- Python
- fastapi==0.95.2
- uvicorn[standard]==0.22.0
- pydantic<2
- python-multipart==0.0.9
- groq>=0.5.0
- gTTS==2.4.0
- python-dotenv==1.0.1
- tensorflow
- numpy

### Installation

Clone the repository:

```bash
git clone https://github.com/AydenBravender/InsuLink.git
```

Change into the project directory:

```bash
cd InsuLink
```

Install front-end dependencies:

```bash
npm install
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

### Running Locally

To start the development server for the front-end:

```bash
npm run dev
```

This will launch the web app with live reload.

For the back-end / Python scripts:

```bash
uvicorn server:app --reload
```

---

## Usage

- Launch the web interface at `http://localhost:5173`.
- Sign up / log in
- Upload insulin data.
- Use the dashboard to view data, trends, alerts.

---

## Contributing

Contributions are very welcome! Here’s how you can help:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/YourFeature`
3. Make your changes, commit with clear messages.
4. Push to your fork: `git push origin feature/YourFeature`
5. Open a Pull Request against the main branch and describe your changes.

Please ensure your code follows existing style (e.g., TypeScript linting, Python formatting).
Feel free to open issues if you find bugs or have enhancement ideas.

---

## License

This project is licensed under the MIT License. See LICENSE for more details.
