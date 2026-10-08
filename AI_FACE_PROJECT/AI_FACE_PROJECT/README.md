
# AI Facial Expression Recognition Project

This project provides a Convolutional Neural Network (CNN) model for facial expression classification, trained on the FER-2013 dataset.

## Project Structure:
- `face_expression_model.keras`: The trained TensorFlow/Keras model in native Keras format.
- `face_expression_model.h5`: The trained TensorFlow/Keras model in HDF5 format.
- `face_expression_model.pkl`: A Python pickle file containing metadata about the model (e.g., class names, image size, test metrics).
- `predict_emotion.py`: A Python script containing a `FacialExpressionPredictor` class for making predictions on new images.
- `app.py`: A basic Flask application to serve the model as a REST API.
- `README.md`: This file.

## How to use `predict_emotion.py`:
```python
from predict_emotion import FacialExpressionPredictor

# Initialize the predictor (model and metadata files should be in the current directory or specified paths)
predictor = FacialExpressionPredictor()

# Example prediction
image_path = 'path/to/your/image.jpg'
predicted_emotion, confidence = predictor.predict_expression(image_path)

if predicted_emotion:
    print(f"Predicted Emotion: {predicted_emotion}")
    print(f"Confidence: {confidence:.2f}%")
```

## How to use `app.py` (Flask API):
1. Ensure Flask is installed (`pip install Flask`).
2. Make sure `face_expression_model.keras`, `face_expression_model.pkl`, and `predict_emotion.py` are in the same directory as `app.py`.
3. Run the Flask app:
   ```bash
   flask --app app.py run
   ```
   For a production server, consider using Gunicorn or uWSGI.
4. Send a POST request to `/predict` endpoint with an image file (e.g., using `curl` or Postman).
   Example `curl` command:
   ```bash
   curl -X POST -F "image=@/path/to/your/image.jpg" http://127.0.0.1:5000/predict
   ```

## Model Details:
- **Input Image Size**: 48x48 grayscale
- **Classes**: ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
- **Test Accuracy**: 0.5372
- **Test Precision (weighted avg)**: 0.5156
- **Test Recall (weighted avg)**: 0.5379
- **Test F1-Score (weighted avg)**: 0.5197

