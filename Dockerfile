FROM node:20-slim AS frontend
WORKDIR /app/Dashboard/frontend
COPY Dashboard/frontend/package.json .
RUN npm install
COPY Dashboard/frontend/ .
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY Dashboard/ Dashboard/
COPY --from=frontend /app/Dashboard/dist Dashboard/dist
EXPOSE 8080
CMD ["python3", "Dashboard/app.py"]
