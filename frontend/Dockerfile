FROM node:18-alpine

WORKDIR /app

# Copy package.json
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port
EXPOSE 5173

# Build the application for production
RUN npm run build

# Install a simple HTTP server
RUN npm install -g serve

# Expose the port
EXPOSE 5173

# Start the production server
CMD ["serve", "-s", "dist", "-l", "5173"]