FROM node:22-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install yarn and dependencies including dotenv
RUN apk add --no-cache yarn
RUN yarn install --production
RUN yarn add dotenv

# Copy application code
COPY . .

# Expose the port the app runs on
EXPOSE 5010

# Command to run the application with dotenv to load environment variables
CMD ["node", "-r", "dotenv/config", "src/mcp-server.js"]