from rest_framework.routers import DefaultRouter
from .views import dolist_view

router = DefaultRouter()
router.register(r'dolist', dolist_view, basename='dolist')

urlpatterns = router.urls
