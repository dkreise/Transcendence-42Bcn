from django.contrib import admin
from .models import Profile

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'online_status')
    filter_horizontal = ('friends',)  # Better widget for many-to-many fields
    
    def formfield_for_manytomany(self, db_field, request, **kwargs):
        if db_field.name == "friends":
            # Show only profiles that are already friends
            if request.resolver_match.kwargs.get('object_id'):
                current_profile_id = request.resolver_match.kwargs['object_id']
                kwargs["queryset"] = Profile.objects.exclude(pk=current_profile_id)
        return super().formfield_for_manytomany(db_field, request, **kwargs)