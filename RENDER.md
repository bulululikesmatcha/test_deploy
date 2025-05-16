# Deploying Echoes of Today on Render

## Prerequisites

1. A [Render](https://render.com) account
2. A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account for the database

## Setup MongoDB Atlas

1. Create a MongoDB Atlas account or log in
2. Create a new cluster (free tier is sufficient)
3. Set up a database user with read/write permissions
4. Whitelist all IP addresses (0.0.0.0/0) for easier deployment
5. Get your MongoDB connection string from Atlas

## Deploy to Render

1. Log in to Render
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Fill in the following details:
   - **Name**: echoes-of-today (or your preferred name)
   - **Runtime**: Node
   - **Build Command**: `npm run install-all`
   - **Start Command**: `npm start`
   - **Environment Variables**: Set the following variables
     - `MONGO_URI`: Your MongoDB Atlas connection string
     - `SESSION_SECRET`: A random string for session security
     - `NODE_ENV`: `production`
     - `PORT`: `10000` (Render will override this, but it's a good fallback)

5. Click "Create Web Service"

## Post-Deployment

After deployment, you'll want to:

1. Test the application by visiting the URL provided by Render
2. Make sure signup and login work correctly
3. If you have issues with CORS, verify the CORS settings in `backend/server.js`

## Troubleshooting

If you encounter issues:

1. Check the logs in the Render dashboard
2. Verify your MongoDB connection string is correct
3. Ensure your CORS configuration is allowing requests from the correct origin
4. Make sure all your environment variables are set correctly 