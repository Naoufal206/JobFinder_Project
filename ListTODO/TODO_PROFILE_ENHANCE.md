o# Complete Profile Enhancement

## Status: Planning

**Backend:**

1. Migration: add profile_image to users table (nullable string)
2. User.php: add 'profile_image' to $fillable
3. AuthController: add profile_image=null to register
4. New ProfileController: updateUser (PUT /api/user) with image upload (storage/app/public/profiles), return updated user
5. Route: PUT /api/user (auth:sanctum)

**Frontend:**

1. Profile.js: Large avatar, file upload/preview, edit form (name/email), save
2. NavBar.js: Already has user.profile_image stub - will work
3. Update localStorage.user after save

**Followup:** Run migration (php artisan migrate), npm start test upload/edit.

Approve plan?
