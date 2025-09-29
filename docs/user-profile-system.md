# User Profile System - Single User Platform

**Version:** 1.3.0
**Created:** September 29, 2025
**Status:** Backend Complete, Frontend In Progress

## Overview

The Stock-taking System has been converted to a **single-user platform** with comprehensive user profile management. This eliminates the need for user input during session creation and provides a centralized settings system.

## Database Schema: `user_profiles`

### Table Structure (44 columns)

**Personal Information:**
- `first_name`, `last_name`, `preferred_name` (VARCHAR)
- `date_of_birth` (DATE)

**Address Information:**
- `address_line_1`, `address_line_2` (VARCHAR)
- `city`, `county`, `postcode` (VARCHAR)
- `country` (VARCHAR, default: 'United Kingdom')

**Contact Numbers:**
- `mobile_phone`, `home_phone`, `work_phone` (VARCHAR)
- `whatsapp_number` (VARCHAR - may differ from mobile)

**Email Addresses:**
- `primary_email`, `work_email`, `personal_email` (VARCHAR)

**Social Media Handles:**
- `facebook_handle`, `instagram_handle`, `twitter_handle` (VARCHAR)
- `linkedin_handle`, `tiktok_handle`, `snapchat_handle` (VARCHAR)

**Professional Information:**
- `company_name`, `job_title`, `industry` (VARCHAR)

**Emergency Contact:**
- `emergency_contact_name`, `emergency_contact_phone` (VARCHAR)
- `emergency_contact_relationship` (VARCHAR)

**System Preferences:**
- `preferred_language` (default: 'en')
- `timezone` (default: 'Europe/London')
- `date_format` (default: 'DD/MM/YYYY')
- `currency` (default: 'GBP')

**Status & Privacy:**
- `active` (BOOLEAN, default: true)
- `profile_complete` (BOOLEAN, default: false)
- `share_phone`, `share_email`, `share_social_media` (BOOLEAN)

**System Fields:**
- `id` (UUID, primary key)
- `created_at`, `updated_at`, `last_login` (TIMESTAMP)
- `notes` (TEXT)
- `profile_picture_url` (VARCHAR)

## API Endpoints

### 1. Get Current User Profile
```http
GET /api/user/profile
```
**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "uuid",
    "first_name": "Stock",
    "last_name": "Taker",
    "preferred_name": "Stock Taker",
    "profile_complete": false,
    // ... all 44 fields
  }
}
```

### 2. Update User Profile
```http
PUT /api/user/profile
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Smith",
  "primary_email": "john@example.com",
  "mobile_phone": "07123456789"
}
```
**Response:**
```json
{
  "success": true,
  "message": "User profile updated successfully",
  "profile": { /* updated profile data */ }
}
```

**Features:**
- Dynamic field updates (only provided fields are updated)
- Automatic `profile_complete` flag when essential fields are filled
- Automatic timestamp updates
- Field validation against allowed fields

### 3. Get User Summary (Lightweight)
```http
GET /api/user/summary
```
**Response:**
```json
{
  "success": true,
  "summary": {
    "id": "uuid",
    "first_name": "Stock",
    "last_name": "Taker",
    "preferred_name": "Stock Taker",
    "primary_email": null,
    "mobile_phone": null,
    "city": null,
    "county": null,
    "profile_complete": false,
    "active": true,
    "created_at": "2025-09-29T18:39:58.000Z"
  }
}
```

### 4. Reset User Profile
```http
POST /api/user/profile/reset
```
**Response:**
```json
{
  "success": true,
  "message": "User profile reset successfully",
  "profile": { /* new default profile */ }
}
```

## Implementation Status

### ✅ Completed
- **Database Table**: 44-field comprehensive user profile table
- **Migration Script**: `migrate-user-profile.js`
- **Default User**: Created with basic defaults
- **API Endpoints**: 4 complete endpoints for profile management
- **Field Validation**: Comprehensive allowed fields list
- **Auto-completion**: Profile completion detection

### 🔄 In Progress
- **Frontend Settings UI**: Settings tab/button on Dashboard
- **Profile Form**: Comprehensive form for all user fields
- **Dashboard Integration**: Auto-populate user from database

### 📋 Next Steps
1. Add Settings tab to Dashboard UI
2. Create Settings component with comprehensive form
3. Update session creation to use stored user profile
4. Remove manual user input from Dashboard
5. Test complete workflow
6. Deploy and verify

## Database Files

- **`backend/create-user-profile-table.sql`** - Complete table schema
- **`backend/migrate-user-profile.js`** - Migration script with testing
- **`backend/server.js`** - Updated with user profile endpoints

## Single-User System Benefits

1. **Simplified Workflow**: No need to enter stocktaker name each time
2. **Consistent Data**: Same user information across all sessions
3. **Professional Reports**: Complete contact details for export/reporting
4. **Future Scalability**: Easy to expand to multi-user later
5. **Settings Management**: Centralized user preferences and contact info

---

*System Version: 1.3.0-user-profile*
*Next Update: Frontend UI Implementation*