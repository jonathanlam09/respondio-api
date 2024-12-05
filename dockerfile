# Use official Node.js image
FROM node:18-alpine

# Set working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on (adjust if necessary)
EXPOSE 3000

# Command to start the app
CMD ["npm", "start"]
