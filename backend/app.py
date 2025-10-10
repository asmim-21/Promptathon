from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow requests from the React dev server

@app.get("/api/health")
def health():
    return jsonify({"ok": True})

@app.get("/api/categories")
def categories():
    return jsonify({"categories": ["Wealth Management", "Investment Bank", "Asset Management", "Group Functions", "Technology"]})

@app.post("/api/echo")
def echo():
    data = request.json or {}
    return jsonify({"you_sent": data})

if __name__ == "__main__":
    app.run(port=5000, debug=True)
