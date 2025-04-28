FROM golang:1.24-alpine

WORKDIR /app

# Copy dependency manifests and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code and build the binary
COPY . .
RUN go build -o server .

FROM chromedp/headless-shell:latest
RUN apt-get update; apt install dumb-init -y
ENTRYPOINT ["dumb-init", "--"]

# Expose the port where Gin listens
EXPOSE 4500

# Run the server
CMD ["./server"]
