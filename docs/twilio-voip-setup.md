# Twilio VoIP Setup Guide

This guide walks you through setting up browser-based VoIP calling for leads in AgencyBoost.

## Overview

The VoIP feature allows team members to make outbound calls directly from their browser when viewing lead details. Calls are placed using your Twilio phone number as the caller ID.

## Prerequisites

- A Twilio account (https://www.twilio.com)
- A Twilio phone number with voice capabilities
- Your application must be deployed with a public URL (required for webhooks)

## Step 1: Get Your Twilio Account Credentials

1. Log in to the [Twilio Console](https://console.twilio.com)
2. On the dashboard, find your **Account SID** and **Auth Token**
3. Copy these values - you'll need them for configuration

## Step 2: Get or Purchase a Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Active Numbers**
2. If you don't have a number, click **Buy a Number**
3. Select a number with **Voice** capability
4. Copy the phone number in E.164 format (e.g., `+15551234567`)

## Step 3: Create an API Key

API Keys are more secure than using your Auth Token directly:

1. Go to **Account** → **API keys & tokens**
2. Click **Create API Key**
3. Give it a name like "AgencyBoost VoIP"
4. Select **Standard** key type
5. Click **Create API Key**
6. **Important**: Copy both the **SID** and **Secret** immediately - the secret is only shown once

## Step 4: Create a TwiML Application

The TwiML App tells Twilio where to send call requests:

1. Go to **Develop** → **Voice** → **TwiML Apps**
2. Click **Create new TwiML App**
3. Set the **Friendly Name** to "AgencyBoost VoIP"
4. Under **Voice Configuration**:
   - **Request URL**: `https://YOUR-APP-URL/api/integrations/twilio/voice-twiml`
   - **Request Method**: POST
5. Click **Create**
6. Copy the **TwiML App SID** (starts with "AP...")

## Step 5: Configure Environment Variables

Add the following secrets to your application:

| Variable | Description | Example |
|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone number | `+15551234567` |
| `TWILIO_TWIML_APP_SID` | The TwiML App SID | `APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_API_KEY_SID` | API Key SID | `SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_API_KEY_SECRET` | API Key Secret | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |

## Step 6: Test the Integration

1. Navigate to any lead detail page in AgencyBoost
2. Look for the phone icon button next to the phone number field
3. Click the button to initiate a call
4. Grant microphone permission when prompted by your browser
5. The call panel should appear showing:
   - The lead's name and phone number
   - A call timer
   - Mute/unmute button
   - Hang up button

## Troubleshooting

### "VoIP calling is not configured"
- Verify all six environment variables are set correctly
- Check that none of the values have extra spaces or quotes

### Call fails immediately
- Ensure your TwiML App webhook URL is correct and uses HTTPS
- Verify your Twilio phone number has voice capabilities enabled
- Check that your Twilio account has sufficient balance

### No audio
- Check browser microphone permissions
- Ensure you're using a supported browser (Chrome, Firefox, Edge)
- Try using headphones to prevent echo

### "Device registration timed out"
- Check your internet connection
- Verify the API Key credentials are correct
- Ensure the TwiML App SID matches your configuration

## How It Works

1. When a user clicks the call button, the browser requests a voice token from your server
2. The Twilio Voice SDK uses this token to register a "device" in the browser
3. When making a call, the SDK connects to Twilio
4. Twilio sends a request to your TwiML webhook to get call instructions
5. The webhook returns TwiML that dials the lead's phone number
6. The call is connected and audio flows between the browser and the recipient

## Security Notes

- Voice tokens expire after 1 hour and are automatically refreshed
- API Keys can be revoked at any time from the Twilio Console
- Call logs are stored in your database for audit purposes
- Your Twilio Auth Token should never be exposed to the frontend

## Cost Information

Twilio charges for:
- Monthly phone number rental
- Per-minute outbound call charges (varies by destination)
- No charge for browser-to-Twilio connection

Check [Twilio's pricing page](https://www.twilio.com/voice/pricing) for current rates.
