# ULINKUP

A modern hyperlocal professional network and advertisement platform.

## Project Structure

This project is set up as a decoupled application with a frontend and backend directory.

*   **/frontend**: React + Vite SPA using modern component-based architecture.
*   **/backend**: Django REST Framework API with PostgreSQL.

## Prerequisites

- **Python 3.14+**
- **Node.js v22.11+**
- **Git**

## Getting Started

### Local Development Setup

To run the tools downloaded portably in this workspace (if you are using the sandbox setup):
We've added Git and Node.js portable versions to `C:\Users\akhil\ULINKUP_tools`.

#### Backend Setup

1. Navigate to `/backend`:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file based on `.env.example` and set your variables (including `DATABASE_URL` for PostgreSQL).
5. Run migrations:
   ```bash
   python manage.py migrate
   ```
6. Start the server:
   ```bash
   python manage.py runserver
   ```

#### Frontend Setup

1. Navigate to `/frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and configure frontend variables.
4. Start the development server:
   ```bash
   npm run dev
   ```
