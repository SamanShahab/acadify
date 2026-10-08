
import tensorflow as tf
import numpy as np
import cv2
import pickle
import os

class FacialExpressionPredictor:
    def __init__(self, model_keras_path='face_expression_model.keras', metadata_pkl_path='face_expression_model.pkl'):
        self.model = None
        self.metadata = None
        self.model_keras_path = model_keras_path
        self.metadata_pkl_path = metadata_pkl_path
        self._load_model_and_metadata()

    def _load_model_and_metadata(self):
        if not os.path.exists(self.model_keras_path):
            raise FileNotFoundError(f"Model file not found at {self.model_keras_path}")
        if not os.path.exists(self.metadata_pkl_path):
            raise FileNotFoundError(f"Metadata file not found at {self.metadata_pkl_path}")
            
        self.model = tf.keras.models.load_model(self.model_keras_path)
        with open(self.metadata_pkl_path, 'rb') as f:
            self.metadata = pickle.load(f)
        
        print("Model and metadata loaded successfully.")

    def predict_expression(self, image_path):
        if self.model is None or self.metadata is None:
            print("Error: Model or metadata not loaded. Call _load_model_and_metadata() first.")
            return None, None

        img_size = self.metadata['image_size']
        idx_to_class_map = self.metadata['index_to_class']

        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            print(f"Error: Could not read image from {image_path}")
            return None, None

        img_resized = cv2.resize(img, img_size)
        img_normalized = img_resized / 255.0
        img_input = np.expand_dims(np.expand_dims(img_normalized, axis=-1), axis=0)

        predictions_array = self.model.predict(img_input, verbose=0)
        predicted_class_idx = np.argmax(predictions_array)
        confidence = np.max(predictions_array) * 100
        predicted_label = idx_to_class_map[predicted_class_idx]

        return predicted_label, confidence

    def get_class_names(self):
        return self.metadata['classes'] if self.metadata else []

    def get_image_size(self):
        return self.metadata['image_size'] if self.metadata else None

if __name__ == '__main__':
    # Example usage (assuming models are in the current directory)
    predictor = FacialExpressionPredictor()
    
    # Create a dummy image for testing if no real test images are present
    dummy_image_path = "test_image.jpg"
    if not os.path.exists(dummy_image_path):
        # Create a simple black image for demonstration
        dummy_img = np.zeros(predictor.get_image_size(), dtype=np.uint8)
        cv2.imwrite(dummy_image_path, dummy_img)
        print(f"Created a dummy image: {dummy_image_path}")

    test_img_path = dummy_image_path # Replace with a real image path for actual testing
    predicted_emotion, prob = predictor.predict_expression(test_img_path)
    
    if predicted_emotion:
        print(f"
Prediction for {test_img_path}:")
        print(f"  Predicted Emotion: {predicted_emotion}")
        print(f"  Confidence: {prob:.2f}%")
    
    # Clean up dummy image if created
    if dummy_image_path == "test_image.jpg" and os.path.exists(dummy_image_path):
        os.remove(dummy_image_path)
        print(f"Cleaned up dummy image: {dummy_image_path}")
