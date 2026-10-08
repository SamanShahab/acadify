
from flask import Flask, request, jsonify
import os
from predict_emotion import FacialExpressionPredictor

app = Flask(__name__)

# Initialize the predictor globally
try:
    predictor = FacialExpressionPredictor()
except Exception as e:
    print(f"Failed to load model for Flask app: {e}")
    predictor = None # Handle case where model loading fails

@app.route('/')
def home():
    return "Facial Expression Prediction API. Use /predict endpoint."

@app.route('/predict', methods=['POST'])
def predict():
    if predictor is None:
        return jsonify({"error": "Model not loaded. Server issue."}), 500

    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        filepath = os.path.join('/tmp', file.filename) # Save to a temporary location
        file.save(filepath)
        
        predicted_emotion, confidence = predictor.predict_expression(filepath)
        
        os.remove(filepath) # Clean up the temporary file

        if predicted_emotion:
            return jsonify({"emotion": predicted_emotion, "confidence": f"{confidence:.2f}%"})
        else:
            return jsonify({"error": "Prediction failed"}), 500

if __name__ == '__main__':
    # For deployment, use a production-ready WSGI server like Gunicorn
    # For local testing, you can run:
    # app.run(debug=True, host='0.0.0.0', port=5000)
    print("Flask app is ready. To run: flask --app app.py run")
    print("Remember to install flask: pip install Flask")
    print("The model and metadata files must be in the same directory as this app.py or specified paths.")
