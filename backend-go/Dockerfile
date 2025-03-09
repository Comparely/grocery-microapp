# Use a lightweight Go image (adjust version as needed)
FROM golang:1.24-alpine

WORKDIR /app

# Copy dependency manifests and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code and build the binary
COPY . .
RUN go build -o server .

# Expose the port where Gin listens
EXPOSE 4500

# Run the server
CMD ["./server"]
