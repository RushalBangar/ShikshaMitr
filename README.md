# ShikshaMitr

ShikshaMitr is an educational website that provides useful study material on a single digital platform. The website aims to make learning easier, more accessible, and more effective for students. It bridges the gap between students and faculty by providing a unified platform for study materials, interactive quizzes, and real-time reading resources.

## 🌟 Key Features

- **Student & Faculty Dashboards**: Dedicated interfaces for different user roles.
- **Study Materials Management**: Faculty can upload resources, and students can view or download them.
- **Interactive Quizzes**: Built-in quiz system for students to test their knowledge.
- **Real-time Reading**: Live reading sessions powered by WebSockets.
- **Secure Authentication**: JWT-based login and session management for secure access.

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript.
- **Backend**: Python, FastAPI.
- **Database**: MongoDB (via Motor Asyncio).
- **Authentication**: JWT (JSON Web Tokens) & bcrypt.
- **File Storage**: Cloudinary.
- **Deployment**:
  - Frontend: Vercel
  - Backend: Render

## 🚀 Getting Started

Follow these instructions to set up the project locally for development and testing.

### Prerequisites

- [Python 3.8+](https://www.python.org/downloads/)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local instance or MongoDB Atlas URI)
- Cloudinary Account (for file uploads)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ShikshaMitr.git
cd ShikshaMitr
```

### 2. Backend Setup

```bash
cd backend
```

Create a virtual environment and install the dependencies:

```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Set up your environment variables:
1. Copy the template: `cp .env.example .env`
2. Update the `.env` file with your actual MongoDB URI, Cloudinary credentials, and JWT secret key.

Run the backend server:

```bash
uvicorn main:app --reload --port 8000
```
The FastAPI backend will now be accessible at `http://localhost:8000`. You can explore the API documentation at `http://localhost:8000/docs`.

### 3. Frontend Setup

The frontend uses vanilla web technologies, so no complex build tools are required. You can serve the `frontend/` directory using any static file server.

For example, using Python's built-in HTTP server:
```bash
cd ../frontend
python -m http.server 3000
```
Open your browser and navigate to `http://localhost:3000`.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check out the [issues page](https://github.com/your-username/ShikshaMitr/issues). If you want to contribute, please read our [Contributing Guidelines](CONTRIBUTING.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
