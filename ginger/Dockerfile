FROM python:3.10-slim
WORKDIR /ginger

# Copy and install dependencies
COPY requirements.txt .
# Allow configuring Redis via env
ENV REDIS_HOST=127.0.0.1
ENV REDIS_PORT=6379
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY app ./app
COPY searchintelligence ./searchintelligence

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]