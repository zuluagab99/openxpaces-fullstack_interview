FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Pass the API key as a build arg so Vite bakes it in
ARG VITE_API_KEY=openxpace-secret-key
ENV VITE_API_KEY=$VITE_API_KEY

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
