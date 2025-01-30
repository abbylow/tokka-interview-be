# Dockerfile for Express app with TypeScript

FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Run the build step
RUN npm run build

# Expose the port your app runs on
EXPOSE 4242

# Start the application
CMD ["npm", "run", "start"]
