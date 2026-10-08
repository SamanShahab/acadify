"""Lazy access to the face-analysis services used by the API routes."""


class _LazyService:
	def __init__(self, service_class):
		self._service_class = service_class
		self._instance = None

	def _get(self):
		if self._instance is None:
			self._instance = self._service_class()
		return self._instance

	def __getattr__(self, name):
		return getattr(self._get(), name)


def _emotion_model_class():
	from ai_service.emotion_model import EmotionModel
	return EmotionModel


def _face_recognizer_class():
	from ai_service.face_recognition import FaceRecognizer
	return FaceRecognizer


class _LazyFactoryService(_LazyService):
	def _get(self):
		if self._instance is None:
			self._instance = self._service_class()()
		return self._instance


emotion_predictor = _LazyFactoryService(_emotion_model_class)
face_recognizer = _LazyFactoryService(_face_recognizer_class)
